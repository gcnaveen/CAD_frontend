// // src/routes/AppRoutes.jsx  — full replacement
import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ProtectedRoute from "./ProtectedRoute";
import {
  getRedirectForRole,
  isAuthOnlyPath,
  resolveSessionToken,
} from "../utils/authRedirect";

// Public
import Homepage from "../pages/Homepage";
import LoginPage from "../pages/LoginPage";
import LoginPageEmail from "../pages/LoginPageEmail.jsx";
import RegisterPage from "../pages/RegisterPage";
import Cadregisterform from "../pages/form/Cadregisterform.jsx";
import PaymentReturnPage from "../pages/PaymentReturnPage.jsx";
import PaymentSuccessPage from "../pages/PaymentSuccessPage.jsx";
import PaymentFailurePage from "../pages/PaymentFailurePage.jsx";
import PrivacyPolicy from "../pages/PrivacyPolicy.jsx";
import TermsandCondition from "../pages/TermsandCondition.jsx";

// ─── User dashboard (nested via Outlet) ───
import Home from "../dashboard/user/component/Home"; // your existing Home
import UserUploadForm from "../dashboard/user/UserUploadForm";
import TrackCurrentOrder from "../dashboard/user/TrackCurrentOrder";
import OrderHistoryTable from "../dashboard/user/OrderHistoryTable";

// Super-admin
import SuperAdminLayout from "../dashboard/superadmin/layout/SuperAdminLayout";
import SuperAdminHome from "../dashboard/superadmin/SuperAdminHome";
import ViewAdminUsers from "../dashboard/superadmin/admin/ViewAdminUsers";
import ViewCadCenters from "../dashboard/superadmin/cadcenters/ViewCadCenters";
import ViewCurrentProject from "../dashboard/superadmin/projects/ViewCurrentProject";
import ViewProjectHistory from "../dashboard/superadmin/projects/ViewProjectHistory";
import ViewUserDetails from "../dashboard/superadmin/user/ViewUserDetails";
import ViewCadUsers from "../dashboard/superadmin/cadusers/ViewCadUsers";
import ViewDistricts from "../dashboard/superadmin/districts/ViewDistricts";
import ViewTalukas from "../dashboard/superadmin/talukas/ViewTalukas";
import ViewHoblis from "../dashboard/superadmin/hoblis/ViewHoblis";
import ViewVillages from "../dashboard/superadmin/villages/ViewVillages";
import ViewCadInterests from "../dashboard/superadmin/cadinterest/ViewCadInterests";
import ViewSurveyDraftReports from "../dashboard/superadmin/drafts/ViewSurveyDraftReports.jsx";
import AdminAssignmentsPage from "../pages/AdminAssignmentsPage.jsx";
import SketchPricing from "../pages/admin/SketchPricing.jsx";
import PayCadUser from "../dashboard/superadmin/cadwallet/PayCadUser.jsx";

// CAD
import CADLayout from "../dashboard/cad/layout/CADLayout";
import CADHomePage from "../dashboard/cad/CADHomePage";
import ViewCurrentOrders from "../dashboard/cad/orders/ViewCurrentOrders";
import ViewAllOrders from "../dashboard/cad/orders/ViewAllOrders";
import CadWalletPage from "../pages/cad/Wallet.jsx";
import CompleteProfile from "../dashboard/cad/CompleteProfile";
import EditProfile from "../pages/Profile/EditProfile";
import DashboardLayout from "../dashboard/user/component/Dashboardlayout.jsx";
import RequestsPage from "../dashboard/user/component/RequestsPage.jsx";
import ProfilePage from "../dashboard/user/component/ProfilePage.jsx";
import DraftsPage from "../dashboard/user/component/DraftsPage.jsx";

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

  // Browser Back can restore a cached login document; re-check immediately.
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
    (state) => state.auth?.role ?? state.auth?.user?.role
  );
  const token = resolveSessionToken(reduxToken);
  const loggedInHome = getRedirectForRole(role);

  useBlockAuthPagesWhenLoggedIn(token, role);

  // While logged in, auth routes never mount login UI — only a replace redirect.
  const guestOrRedirect = (Page) =>
    token ? <Navigate to={loggedInHome} replace /> : <Page />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Homepage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsandCondition />} />
      <Route path="/login" element={guestOrRedirect(LoginPage)} />
      <Route path="/login-email" element={guestOrRedirect(LoginPageEmail)} />
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
      <Route path="/register" element={guestOrRedirect(RegisterPage)} />
      <Route
        path="/register/cad-operator"
        element={guestOrRedirect(Cadregisterform)}
      />
      <Route
        path="/payment/return"
        element={
          <ProtectedRoute>
            <PaymentReturnPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <PaymentSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-failure"
        element={
          <ProtectedRoute>
            <PaymentFailurePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* Redirect legacy surveyor path */}
      <Route
        path="/surveyor/home"
        element={<Navigate to="/dashboard/user" replace />}
      />

      {/* ─── User dashboard — all children render inside <Outlet /> ─── */}
      <Route
        path="/dashboard/user"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* /dashboard/user  → Home */}
        <Route index element={<Home />} />

        {/* /dashboard/user/requests */}
        <Route path="requests" element={<RequestsPage />} />

        {/* /dashboard/user/profile */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="drafts" element={<DraftsPage />} />

        {/* existing sub-pages — still reachable, still inside the layout */}
        <Route path="upload" element={<UserUploadForm />} />
        <Route path="track-order" element={<TrackCurrentOrder />} />
        <Route path="order-history" element={<OrderHistoryTable />} />
      </Route>

      {/* CAD */}
      <Route
        path="/dashboard/cad"
        element={
          <ProtectedRoute>
            <CADLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CADHomePage />} />
        <Route path="current-orders" element={<ViewCurrentOrders />} />
        <Route path="order-history" element={<ViewAllOrders />} />
        <Route path="wallet" element={<CadWalletPage />} />
      </Route>

      <Route
        path="/cad/wallet"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard/cad/wallet" replace />
          </ProtectedRoute>
        }
      />

      {/* Super-admin */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminHome />} />
        <Route path="home" element={<SuperAdminHome />} />
        <Route path="admin-users" element={<ViewAdminUsers />} />
        <Route path="cad-centers" element={<ViewCadCenters />} />
        <Route path="cad-users" element={<ViewCadUsers />} />
        <Route path="cad-interest" element={<ViewCadInterests />} />
        <Route path="survey-draft-reports" element={<ViewSurveyDraftReports />} />
        <Route path="assignments" element={<AdminAssignmentsPage />} />
        <Route path="sketch-pricing" element={<SketchPricing />} />
        <Route path="pay-cad-user" element={<PayCadUser />} />
        <Route path="districts" element={<ViewDistricts />} />
        <Route path="talukas" element={<ViewTalukas />} />
        <Route path="hoblis" element={<ViewHoblis />} />
        <Route path="villages" element={<ViewVillages />} />
        <Route path="projects" element={<ViewCurrentProject />} />
        <Route path="projects-history" element={<ViewProjectHistory />} />
        <Route path="user-surveyor-details" element={<ViewUserDetails />} />
      </Route>
    </Routes>
  );
}
