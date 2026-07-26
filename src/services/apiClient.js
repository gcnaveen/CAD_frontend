import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  getCorrelationId,
  newCorrelationId,
} from "../utils/correlationId.js";
import {
  TOKEN_KEY,
  USER_KEY,
  getStoredAccessToken,
} from "../utils/authToken.js";

// Prefer VITE_API_BASE_URL when set; otherwise config.js stage API Gateway URL.
// The baseURL should NOT include /api - endpoints already have /api prefix
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

// Request interceptor: auth + optional correlation id on mutating calls (M-07)
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      setRequestHeader(config.headers, "Authorization", `Bearer ${token}`);
    }

    const method = String(config.method || "get").toLowerCase();
    if (MUTATING_METHODS.has(method)) {
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
  "/api/auth/surveyor/verify-otp",
  "/api/auth/surveyor/forgot-password/reset",
];

function isAuth401Exempt(url = "") {
  return AUTH_401_EXEMPT_PATHS.some((path) => String(url).includes(path));
}

// Response interceptor: Handle 401 unauthorized; preserve correlation id on errors
// Do NOT redirect for login/OTP flows — let the page show the error and keep form values
apiClient.interceptors.response.use(
  (response) => {
    const cid = getCorrelationId(response);
    if (cid) {
      response.correlationId = cid;
    }
    return response;
  },
  (error) => {
    attachCorrelationId(error);

    if (error.response?.status === 401) {
      if (!isAuth401Exempt(error.config?.url)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (storeRef?.dispatch) {
          storeRef.dispatch({ type: "auth/logout" });
        }
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
