import { createSlice } from "@reduxjs/toolkit";
import {
  extractAccessToken,
  setAccessToken,
  clearAccessToken,
  clearLegacyAuthStorage,
  consumeE2EUserSeed,
  getAccessToken,
} from "../../utils/authToken.js";
import { normalizeRoleKey } from "../../constants/roles.js";

function initialAuthState() {
  // E2E: memory token + optional user seeded before first paint (never from localStorage).
  const e2eUser = consumeE2EUserSeed();
  const token = getAccessToken();
  if (e2eUser) {
    return {
      token,
      user: e2eUser,
      role: normalizeRoleKey(e2eUser.role) ?? e2eUser.role ?? null,
      bootstrapped: Boolean(token),
    };
  }
  return {
    token: null,
    user: null,
    role: null,
    bootstrapped: false,
  };
}

const initialState = initialAuthState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, accessToken, user } = action.payload || {};
      const nextToken =
        extractAccessToken({ token, accessToken }) ||
        extractAccessToken(action.payload) ||
        null;
      if (nextToken) {
        state.token = nextToken;
        setAccessToken(nextToken);
      }
      if (user) {
        state.user = user;
        state.role = normalizeRoleKey(user.role) ?? user.role ?? null;
      }
      state.bootstrapped = true;
    },
    setAccessTokenOnly: (state, action) => {
      const nextToken = extractAccessToken(action.payload) || null;
      if (nextToken) {
        state.token = nextToken;
        setAccessToken(nextToken);
      }
      state.bootstrapped = true;
    },
    setBootstrapped: (state, action) => {
      state.bootstrapped = Boolean(action.payload);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.role = null;
      state.bootstrapped = true;
      clearAccessToken();
      clearLegacyAuthStorage();
    },
  },
});

export const { setCredentials, setAccessTokenOnly, setBootstrapped, logout } =
  authSlice.actions;
export default authSlice.reducer;
