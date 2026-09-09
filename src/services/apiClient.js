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
import { CSRF_HEADER_NAME, resolveCsrfToken } from "../utils/csrf.js";
import {
  captureAuthSideChannel,
  isAuthSideChannelUrl,
  buildRefreshRequestBody,
  clearAuthSideChannel,
} from "../utils/authSideChannel.js";

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

/** While > 0, 401 + failed refresh must not wipe a restoring tab session. */
let authBootstrapLock = 0;
export function beginAuthBootstrap() {
  authBootstrapLock += 1;
}
export function endAuthBootstrap() {
  authBootstrapLock = Math.max(0, authBootstrapLock - 1);
}

function resolveClientAccessToken() {
  return (
    getAccessToken() ||
    storeRef?.getState?.()?.auth?.token ||
    null
  );
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
  const csrf = resolveCsrfToken();
  if (csrf) {
    setRequestHeader(headers, CSRF_HEADER_NAME, csrf);
  }
}

// Request interceptor: auth + CSRF (cookie auth) + correlation id on mutating calls
apiClient.interceptors.request.use(
  (config) => {
    const token = resolveClientAccessToken();
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

function extractAccessTokenFromRefresh(data) {
  const nested = data?.data ?? data;
  const token =
    (typeof nested?.accessToken === "string" && nested.accessToken.trim()) ||
    (typeof nested?.access_token === "string" && nested.access_token.trim()) ||
    (typeof nested?.token === "string" && nested.token.trim()) ||
    (typeof data?.accessToken === "string" && data.accessToken.trim()) ||
    "";
  return token;
}

async function performTokenRefresh() {
  const headers = {
    "Content-Type": "application/json",
  };
  attachCsrfHeader(headers);

  const { data } = await axios.post(
    `${baseURL}/api/auth/refresh`,
    buildRefreshRequestBody(),
    {
      withCredentials: true,
      headers,
    }
  );
  captureAuthSideChannel(data);
  const token = extractAccessTokenFromRefresh(data);
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

/** Used by session bootstrap — same single-flight as the 401 interceptor. */
export function refreshSession() {
  return refreshAccessTokenSingleFlight();
}

function isPaymentReturnPath(path = "") {
  return path.startsWith("/payment");
}

function forceClientLogout() {
  const path = window.location?.pathname || "";
  // PhonePe return / session restore: keep the tab session.
  if (isPaymentReturnPath(path) || authBootstrapLock > 0) {
    return;
  }
  clearAccessToken();
  clearLegacyAuthStorage();
  clearAuthSideChannel();
  if (storeRef?.dispatch) {
    storeRef.dispatch({ type: "auth/logout" });
  }
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
    if (isAuthSideChannelUrl(response.config?.url)) {
      captureAuthSideChannel(response.data);
    }
    return response;
  },
  async (error) => {
    attachCorrelationId(error);

    const status = error.response?.status;
    const config = error.config || {};

    if (status === 401 && !isAuth401Exempt(config.url) && !config.skipAuthRefresh) {
      const stored = resolveClientAccessToken();
      if (stored && !config._retryWithStoredToken) {
        const sent = String(
          config.headers?.Authorization ||
            config.headers?.authorization ||
            (typeof config.headers?.get === "function"
              ? config.headers.get("Authorization") ||
                config.headers.get("authorization")
              : "") ||
            ""
        );
        if (!sent.includes(stored)) {
          config._retryWithStoredToken = true;
          setAccessToken(stored);
          setRequestHeader(
            config.headers || (config.headers = {}),
            "Authorization",
            `Bearer ${stored}`
          );
          return apiClient.request(config);
        }
      }
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
