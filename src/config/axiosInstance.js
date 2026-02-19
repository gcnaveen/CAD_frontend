// Backward compatibility: Re-export from apiClient
// All service files should use apiClient directly, but this file remains for components that import TOKEN_KEY, USER_KEY, setAxiosStore
import apiClient, { TOKEN_KEY, USER_KEY, setAxiosStore } from "../services/apiClient.js";

export { TOKEN_KEY, USER_KEY, setAxiosStore };
export default apiClient;
