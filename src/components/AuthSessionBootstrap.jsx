import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCredentials,
  setBootstrapped,
  logout,
} from "../features/auth/authSlice.js";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  clearLegacyAuthStorage,
} from "../utils/authToken.js";
import { refreshAccessToken, getCurrentUser } from "../services/auth/authService.js";

/**
 * Local preview/dev origins often are not on the API CORS allow-list.
 * Calling refresh there only produces console CORS errors (Lighthouse Best Practices)
 * and cannot succeed without backend allowlisting. Production SPA origins still refresh.
 * Opt back in with VITE_FORCE_LOCAL_AUTH_REFRESH=true when local CORS is configured.
 */
function shouldSkipLocalRefresh() {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_FORCE_LOCAL_AUTH_REFRESH === "true") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function clearSession(dispatch) {
  clearAccessToken();
  clearLegacyAuthStorage();
  dispatch(logout());
}

/**
 * M-02 session bootstrap: after reload, renew access token via HttpOnly refresh cookie
 * then load /api/auth/me. Never reads JWT from localStorage.
 */
export default function AuthSessionBootstrap({ children }) {
  const dispatch = useDispatch();
  const bootstrapped = useSelector((s) => s.auth?.bootstrapped);
  const token = useSelector((s) => s.auth?.token);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      clearLegacyAuthStorage();

      // E2E / already logged-in this tab: memory token present
      const existing = getAccessToken() || token;
      if (existing) {
        setAccessToken(existing);
        if (!cancelled) {
          try {
            const me = await getCurrentUser();
            const user = me?.user;
            if (user && typeof user === "object" && (user.role || user.id || user._id)) {
              dispatch(
                setCredentials({
                  token: existing,
                  user: me.role ? { ...user, role: user.role ?? me.role } : user,
                }),
              );
            } else {
              // Token without a usable identity → treat as guest
              clearSession(dispatch);
            }
          } catch {
            // Keep same-tab session if /me is briefly unavailable (offline / 5xx).
            dispatch(setBootstrapped(true));
          }
        }
        return;
      }

      // Guest on local origin: skip remote refresh to avoid CORS console noise.
      if (shouldSkipLocalRefresh()) {
        if (!cancelled) dispatch(setBootstrapped(true));
        return;
      }

      try {
        const next = await refreshAccessToken();
        if (cancelled) return;
        setAccessToken(next);
        try {
          const me = await getCurrentUser();
          const user = me?.user;
          if (user && typeof user === "object" && (user.role || user.id || user._id)) {
            dispatch(
              setCredentials({
                token: next,
                user: me.role ? { ...user, role: user.role ?? me.role } : user,
              }),
            );
          } else {
            // Bare token without role would land on /403 — clear instead.
            clearSession(dispatch);
          }
        } catch {
          clearSession(dispatch);
        }
      } catch {
        if (!cancelled) dispatch(setBootstrapped(true));
      }
    }

    if (!bootstrapped) {
      void bootstrap();
    }

    return () => {
      cancelled = true;
    };
  }, [bootstrapped, dispatch, token]);

  return children;
}
