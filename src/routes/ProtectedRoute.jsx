import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";
import useProfileGuard from "../hooks/useProfileGuard";
import { resolveStoredUserRole } from "../constants/roles";
import { resolveSessionToken } from "../utils/authRedirect";
import { isRoleAllowedForPath, rolesForPath } from "./routeRoleMap";
import RouteFallback from "./RouteFallback.jsx";

// Lazy so antd stays out of the public homepage chunk (M-05).
const AntdShellProvider = lazy(() => import("../theme/AntdShellProvider.jsx"));

/**
 * Waits for session bootstrap and loads Ant Design, but does not require a token.
 * Used for PhonePe return URLs so success/cancel is not bounced to /login.
 */
export function OptionalAuthRoute({ children }) {
  const bootstrapped = useSelector((state) => state.auth?.bootstrapped);

  if (!bootstrapped) {
    return <RouteFallback />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <AntdShellProvider>{children}</AntdShellProvider>
    </Suspense>
  );
}

/**
 * Protects routes by token + role (M-03).
 * Wrong role → /403 before any role shell mounts.
 * Ant Design loads only here (M-05) — not on public homepage/login.
 */
export default function ProtectedRoute({ children }) {
  const reduxToken = useSelector((state) => state.auth?.token);
  const token = resolveSessionToken(reduxToken);
  const bootstrapped = useSelector((state) => state.auth?.bootstrapped);
  const role = useSelector((state) =>
    resolveStoredUserRole(state.auth?.role, state.auth?.user?.role)
  );
  const location = useLocation();
  const profileRedirectPath = useProfileGuard();

  // Wait for M-02 refresh bootstrap before treating missing token as logged-out.
  if (!bootstrapped) {
    return <RouteFallback />;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Bootstrap finished with a token but no verified role (/me and the login
  // snapshot both failed). Send to /login rather than /403 or an endless
  // fallback — a session with no role must never enter a role shell.
  if (!role && rolesForPath(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isRoleAllowedForPath(location.pathname, role)) {
    return (
      <Navigate
        to="/403"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (profileRedirectPath) {
    return <Navigate to={profileRedirectPath} state={{ from: location }} replace />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <AntdShellProvider>{children}</AntdShellProvider>
    </Suspense>
  );
}
