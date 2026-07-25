import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  getCorrelationId,
  newCorrelationId,
} from "../utils/correlationId.js";

// For serverless Lambda backend: Set VITE_API_BASE_URL to your API Gateway URL
// Example: https://abc123.execute-api.us-east-1.amazonaws.com
// The baseURL should NOT include /api - endpoints already have /api prefix
const baseURL = API_BASE_URL || "";

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const TOKEN_KEY = "token";
export const USER_KEY = "user";

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

// Request interceptor: auth + optional correlation id on mutating calls (M-07)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = String(config.method || "get").toLowerCase();
    if (MUTATING_METHODS.has(method)) {
      const existing =
        config.headers?.["X-Correlation-Id"] ||
        config.headers?.["x-correlation-id"];
      const cid = existing ? String(existing) : newCorrelationId();
      config.headers["X-Correlation-Id"] = cid;
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
