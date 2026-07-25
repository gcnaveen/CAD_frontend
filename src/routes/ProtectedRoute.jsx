import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";
import useProfileGuard from "../hooks/useProfileGuard";
import { resolveStoredUserRole } from "../constants/roles";
import { isRoleAllowedForPath } from "./routeRoleMap";
import AntdShellProvider from "../theme/AntdShellProvider.jsx";

/**
 * Protects routes by token + role (M-03).
 * Wrong role → /403 before any role shell mounts.
 * Ant Design loads only here (M-05) — not on public homepage/login.
 */
export default function ProtectedRoute({ children }) {
  const token = useSelector((state) => state.auth?.token);
  const role = useSelector((state) =>
    resolveStoredUserRole(state.auth?.role, state.auth?.user?.role)
  );
  const location = useLocation();
  const profileRedirectPath = useProfileGuard();

  if (!token) {
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

  return <AntdShellProvider>{children}</AntdShellProvider>;
}
