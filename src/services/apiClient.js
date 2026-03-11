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

// Response interceptor: Handle 401 unauthorized
// Do NOT redirect when 401 is from the login endpoint (invalid credentials) — let LoginPage show the error and keep form values
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = String(error.config?.url || "").includes("/api/auth/login");
      if (!isLoginRequest) {
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
