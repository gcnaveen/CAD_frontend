import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import authReducer from "../features/auth/authSlice";
import languageReducer from "../features/i18n/languageSlice";
import { setAxiosStore } from "../config/axiosInstance";

// Async localStorage adapter (redux-persist expects getItem to return a Promise)
const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

// M-02: do NOT persist auth (token/user/role). Access token is memory-only;
// session renewal uses HttpOnly refresh cookies.
const languagePersistConfig = {
  key: "language",
  storage,
  whitelist: ["lang"],
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    language: persistReducer(languagePersistConfig, languageReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

setAxiosStore(store);

export const persistor = persistStore(store);
