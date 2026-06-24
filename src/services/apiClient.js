import axios from "axios";
import { API_BASE_URL } from "../../config";

// For serverless Lambda backend: Set VITE_API_BASE_URL to your API Gateway URL
// Example: https://abc123.execute-api.us-east-1.amazonaws.com
// The baseURL should NOT include /api - endpoints already have /api prefix
const baseURL = API_BASE_URL || "";

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

// Request interceptor: Add auth token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

// Response interceptor: Handle 401 unauthorized
// Do NOT redirect for login/OTP flows — let the page show the error and keep form values
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
