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

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "user", "role"],
};

const languagePersistConfig = {
  key: "language",
  storage,
  whitelist: ["lang"],
};

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
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
