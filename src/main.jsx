import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./app/store.js";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import AuthSessionBootstrap from "./components/AuthSessionBootstrap.jsx";
import RouteFallback from "./routes/RouteFallback.jsx";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <Provider store={store}>
        <PersistGate loading={<RouteFallback />} persistor={persistor}>
          <AuthSessionBootstrap>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthSessionBootstrap>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  </StrictMode>,
);
