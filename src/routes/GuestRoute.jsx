import { useSelector } from "react-redux";
import { Navigate } from "react-router";
import {
  getRedirectForRole,
  resolveSessionToken,
} from "../utils/authRedirect";

/**
 * Guest-only pages (login/register). If a token exists, bounce to the role home.
 */
export default function GuestRoute({ children }) {
  const reduxToken = useSelector((state) => state.auth?.token);
  const role = useSelector(
    (state) => state.auth?.role ?? state.auth?.user?.role
  );
  const token = resolveSessionToken(reduxToken);

  if (token) {
    return <Navigate to={getRedirectForRole(role)} replace />;
  }

  return children;
}
