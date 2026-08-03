import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import ProtectedRoute from "./ProtectedRoute";
import RouteFallback from "./RouteFallback";
import {
  getRedirectForRole,
  isAuthOnlyPath,
  resolveSessionToken,
} from "../utils/authRedirect";
import { resolveStoredUserRole } from "../constants/roles";

// Public critical path — homepage eager for LCP; login is lazy (not needed on "/").
import Homepage from "../pages/Homepage";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const LoginPageEmail = lazy(() => import("../pages/LoginPageEmail.jsx"));
const EnrollmentPage = lazy(() => import("../pages/EnrollmentPage.jsx"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const Cadregisterform = lazy(() => import("../pages/form/Cadregisterform.jsx"));
const PaymentReturnPage = lazy(() => import("../pages/PaymentReturnPage.jsx"));
const PaymentSuccessPage = lazy(() => import("../pages/PaymentSuccessPage.jsx"));
const PaymentFailurePage = lazy(() => import("../pages/PaymentFailurePage.jsx"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy.jsx"));
const TermsandCondition = lazy(() => import("../pages/TermsandCondition.jsx"));
const ForbiddenPage = lazy(() => import("../pages/ForbiddenPage.jsx"));
const CompleteProfile = lazy(() => import("../dashboard/cad/CompleteProfile"));
const EditProfile = lazy(() => import("../pages/Profile/EditProfile"));

// Role shells — separate chunks; not loaded on login / public homepage (M-05).
const SurveyorApp = lazy(() => import("./shells/SurveyorApp"));
const CadApp = lazy(() => import("./shells/CadApp"));
const AdminApp = lazy(() => import("./shells/AdminApp"));

function Lazy({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

/** Bare `/dashboard` → role home (avoids blank outlet). */
function DashboardRootRedirect() {
  const role = useSelector((state) =>
    resolveStoredUserRole(state.auth?.role, state.auth?.user?.role),
  );
  return <Navigate to={getRedirectForRole(role)} replace />;
}

/**
 * If token exists → never stay on login/register (covers browser Back + bfcache).
 * If token is gone (logout) → login/register are allowed.
 */
function useBlockAuthPagesWhenLoggedIn(token, role) {
  const location = useLocation();
  const navigate = useNavigate();
  const home = getRedirectForRole(role);

  useEffect(() => {
    if (!token) return;
    if (!isAuthOnlyPath(location.pathname)) return;
    navigate(home, { replace: true });
  }, [token, home, location.pathname, navigate]);

  useEffect(() => {
    const kickOffAuthPage = () => {
      if (!resolveSessionToken(token)) return;
      if (!isAuthOnlyPath(window.location.pathname)) return;
      navigate(home, { replace: true });
    };

    window.addEventListener("popstate", kickOffAuthPage);
    window.addEventListener("pageshow", kickOffAuthPage);
    return () => {
      window.removeEventListener("popstate", kickOffAuthPage);
      window.removeEventListener("pageshow", kickOffAuthPage);
    };
  }, [token, home, navigate]);
}

export default function AppRoutes() {
  const reduxToken = useSelector((state) => state.auth?.token);
  const role = useSelector(
    (state) => state.auth?.role ?? state.auth?.user?.role,
  );
  const token = resolveSessionToken(reduxToken);
  const loggedInHome = getRedirectForRole(role);

  useBlockAuthPagesWhenLoggedIn(token, role);

  const guestOrRedirect = (Page) =>
    token ? (
      <Navigate to={loggedInHome} replace />
    ) : (
      <Lazy>
        <Page />
      </Lazy>
    );

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route
        path="/privacy-policy"
        element={
          <Lazy>
            <PrivacyPolicy />
          </Lazy>
        }
      />
      <Route
        path="/terms-and-conditions"
        element={
          <Lazy>
            <TermsandCondition />
          </Lazy>
        }
      />
      <Route
        path="/403"
        element={
          <Lazy>
            <ForbiddenPage />
          </Lazy>
        }
      />
      <Route path="/login" element={guestOrRedirect(LoginPage)} />
      <Route
        path="/login-email"
        element={
          token ? (
            <Navigate to={loggedInHome} replace />
          ) : (
            <Lazy>
              <LoginPageEmail />
            </Lazy>
          )
        }
      />
      <Route
        path="/enroll"
        element={
          token ? (
            <Navigate to={loggedInHome} replace />
          ) : (
            <Lazy>
              <EnrollmentPage />
            </Lazy>
          )
        }
      />
      <Route
        path="/login/email"
        element={
          token ? (
            <Navigate to={loggedInHome} replace />
          ) : (
            <Navigate to="/login-email" replace />
          )
        }
      />
      <Route
        path="/register"
        element={
          token ? (
            <Navigate to={loggedInHome} replace />
          ) : (
            <Lazy>
              <RegisterPage />
            </Lazy>
          )
        }
      />
      <Route
        path="/register/cad-operator"
        element={
          token ? (
            <Navigate to={loggedInHome} replace />
          ) : (
            <Lazy>
              <Cadregisterform />
            </Lazy>
          )
        }
      />
      <Route
        path="/payment/return"
        element={
          <ProtectedRoute>
            <Lazy>
              <PaymentReturnPage />
            </Lazy>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <Lazy>
              <PaymentSuccessPage />
            </Lazy>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-failure"
        element={
          <ProtectedRoute>
            <Lazy>
              <PaymentFailurePage />
            </Lazy>
          </ProtectedRoute>
        }
      />
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <Lazy>
              <CompleteProfile />
            </Lazy>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Lazy>
              <EditProfile />
            </Lazy>
          </ProtectedRoute>
        }
      />

      <Route
        path="/surveyor/home"
        element={<Navigate to="/dashboard/user" replace />}
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Navigate to="/superadmin" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <Navigate to="/superadmin" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/user/*"
        element={
          <ProtectedRoute>
            <Lazy>
              <SurveyorApp />
            </Lazy>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/cad/*"
        element={
          <ProtectedRoute>
            <Lazy>
              <CadApp />
            </Lazy>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cad/wallet"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard/cad/wallet" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin/*"
        element={
          <ProtectedRoute>
            <Lazy>
              <AdminApp />
            </Lazy>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRootRedirect />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
