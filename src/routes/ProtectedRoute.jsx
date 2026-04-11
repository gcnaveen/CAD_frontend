import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import useProfileGuard from "../hooks/useProfileGuard";

/**
 * Protects routes by redirecting to /login when there is no auth token in Redux.
 * Use for all dashboard/superadmin routes so that after logout, browser back
 * cannot show protected pages (user will be redirected to login).
 */
export default function ProtectedRoute({ children }) {
  const token = useSelector((state) => state.auth?.token);
  const location = useLocation();
  const profileRedirectPath = useProfileGuard();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profileRedirectPath) {
    return <Navigate to={profileRedirectPath} state={{ from: location }} replace />;
  }

  return children;
}
