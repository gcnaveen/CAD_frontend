import { createSlice } from "@reduxjs/toolkit";
import { TOKEN_KEY, USER_KEY } from "../../config/axiosInstance";

const loadUser = () => {
  try {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

const loadToken = () => localStorage.getItem(TOKEN_KEY) || null;

const initialState = {
  token: loadToken(),
  user: loadUser(),
  role: loadUser()?.role ?? null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token ?? state.token;
      if (user) {
        state.user = user;
        state.role = user.role ?? null;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      if (state.token) {
        localStorage.setItem(TOKEN_KEY, state.token);
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.role = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
