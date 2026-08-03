import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  getCorrelationId,
  newCorrelationId,
} from "../utils/correlationId.js";
import {
  TOKEN_KEY,
  USER_KEY,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  clearLegacyAuthStorage,
} from "../utils/authToken.js";
import { CSRF_HEADER_NAME, readCsrfTokenFromCookie } from "../utils/csrf.js";

// Prefer VITE_API_BASE_URL when set; otherwise config.js stage API Gateway URL.
const baseURL =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "") ||
  API_BASE_URL ||
  "";

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

const apiClient = axios.create({
  baseURL,
  // Required for HttpOnly refresh cookies (M-02); backend CORS must allow-list origin (no *)
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export { TOKEN_KEY, USER_KEY };

let storeRef = null;
export function setAxiosStore(store) {
  storeRef = store;
}

export { getCorrelationId, newCorrelationId };

function attachCorrelationId(error) {
  const cid = getCorrelationId(error);
  if (cid) {
    error.correlationId = cid;
  }
  return error;
}

function setRequestHeader(headers, name, value) {
  if (!headers) return;
  if (typeof headers.set === "function") {
    headers.set(name, value);
    return;
  }
  headers[name] = value;
}

function attachCsrfHeader(headers) {
  const csrf = readCsrfTokenFromCookie();
  if (csrf) {
    setRequestHeader(headers, CSRF_HEADER_NAME, csrf);
  }
}

// Request interceptor: auth + CSRF (cookie auth) + correlation id on mutating calls
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      setRequestHeader(config.headers, "Authorization", `Bearer ${token}`);
    }

    const method = String(config.method || "get").toLowerCase();
    if (MUTATING_METHODS.has(method)) {
      attachCsrfHeader(config.headers);

      const existing =
        config.headers?.["X-Correlation-Id"] ||
        config.headers?.["x-correlation-id"] ||
        (typeof config.headers?.get === "function"
          ? config.headers.get("X-Correlation-Id") ||
            config.headers.get("x-correlation-id")
          : null);
      const cid = existing ? String(existing) : newCorrelationId();
      setRequestHeader(config.headers, "X-Correlation-Id", cid);
      config.correlationId = cid;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const AUTH_401_EXEMPT_PATHS = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/surveyor/verify-otp",
  "/api/auth/surveyor/forgot-password/start",
  "/api/auth/surveyor/forgot-password/reset",
  "/api/auth/surveyor/start",
  "/api/auth/surveyor/complete",
  "/api/auth/enrollment/complete",
  "/api/auth/signup",
];

function isAuth401Exempt(url = "") {
  return AUTH_401_EXEMPT_PATHS.some((path) => String(url).includes(path));
}

/** Single-flight refresh so parallel 401s share one cookie renewal. */
let refreshPromise = null;

async function performTokenRefresh() {
  const headers = {
    "Content-Type": "application/json",
  };
  attachCsrfHeader(headers);

  const { data } = await axios.post(`${baseURL}/api/auth/refresh`, {}, {
    withCredentials: true,
    headers,
  });
  const nested = data?.data ?? data;
  const token =
    (typeof nested?.accessToken === "string" && nested.accessToken.trim()) ||
    (typeof nested?.access_token === "string" && nested.access_token.trim()) ||
    (typeof nested?.token === "string" && nested.token.trim()) ||
    (typeof data?.accessToken === "string" && data.accessToken.trim()) ||
    "";
  if (!token) {
    throw new Error("No access token in refresh response");
  }
  setAccessToken(token);
  if (storeRef?.dispatch) {
    storeRef.dispatch({
      type: "auth/setAccessTokenOnly",
      payload: token,
    });
  }
  return token;
}

function refreshAccessTokenSingleFlight() {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function forceClientLogout() {
  clearAccessToken();
  clearLegacyAuthStorage();
  if (storeRef?.dispatch) {
    storeRef.dispatch({ type: "auth/logout" });
  }
  const path = window.location?.pathname || "";
  if (!path.startsWith("/login")) {
    window.location.assign("/login");
  }
}

// Response interceptor: 401 → refresh once + retry; else logout
apiClient.interceptors.response.use(
  (response) => {
    const cid = getCorrelationId(response);
    if (cid) {
      response.correlationId = cid;
    }
    return response;
  },
  async (error) => {
    attachCorrelationId(error);

    const status = error.response?.status;
    const config = error.config || {};

    if (status === 401 && !isAuth401Exempt(config.url) && !config.skipAuthRefresh) {
      if (config._retryAfterRefresh) {
        forceClientLogout();
        return Promise.reject(error);
      }
      try {
        const newToken = await refreshAccessTokenSingleFlight();
        config._retryAfterRefresh = true;
        setRequestHeader(
          config.headers || (config.headers = {}),
          "Authorization",
          `Bearer ${newToken}`
        );
        attachCsrfHeader(config.headers);
        return apiClient.request(config);
      } catch {
        forceClientLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
