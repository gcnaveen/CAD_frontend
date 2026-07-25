import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import SuperAdminLayout from "../../dashboard/superadmin/layout/SuperAdminLayout.jsx";
import RouteFallback from "../RouteFallback.jsx";

const SuperAdminHome = lazy(
  () => import("../../dashboard/superadmin/SuperAdminHome.jsx"),
);
const ViewAdminUsers = lazy(
  () => import("../../dashboard/superadmin/admin/ViewAdminUsers.jsx"),
);
const ViewCadCenters = lazy(
  () => import("../../dashboard/superadmin/cadcenters/ViewCadCenters.jsx"),
);
const ViewCadUsers = lazy(
  () => import("../../dashboard/superadmin/cadusers/ViewCadUsers.jsx"),
);
const ViewCadInterests = lazy(
  () => import("../../dashboard/superadmin/cadinterest/ViewCadInterests.jsx"),
);
const ViewSurveyDraftReports = lazy(
  () => import("../../dashboard/superadmin/drafts/ViewSurveyDraftReports.jsx"),
);
const AdminAssignmentsPage = lazy(
  () => import("../../pages/AdminAssignmentsPage.jsx"),
);
const AutoAssignExceptions = lazy(
  () => import("../../pages/admin/AutoAssignExceptions.jsx"),
);
const SketchPricing = lazy(() => import("../../pages/admin/SketchPricing.jsx"));
const PaymentReconciliation = lazy(
  () => import("../../pages/admin/PaymentReconciliation.jsx"),
);
const OpsObservability = lazy(
  () => import("../../pages/admin/OpsObservability.jsx"),
);
const PayCadUser = lazy(
  () => import("../../dashboard/superadmin/cadwallet/PayCadUser.jsx"),
);
const ViewDistricts = lazy(
  () => import("../../dashboard/superadmin/districts/ViewDistricts.jsx"),
);
const ViewTalukas = lazy(
  () => import("../../dashboard/superadmin/talukas/ViewTalukas.jsx"),
);
const ViewHoblis = lazy(
  () => import("../../dashboard/superadmin/hoblis/ViewHoblis.jsx"),
);
const ViewVillages = lazy(
  () => import("../../dashboard/superadmin/villages/ViewVillages.jsx"),
);
const ViewCurrentProject = lazy(
  () => import("../../dashboard/superadmin/projects/ViewCurrentProject.jsx"),
);
const ViewProjectHistory = lazy(
  () => import("../../dashboard/superadmin/projects/ViewProjectHistory.jsx"),
);
const ViewUserDetails = lazy(
  () => import("../../dashboard/superadmin/user/ViewUserDetails.jsx"),
);

function LazyPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

/**
 * Super-admin shell — separate chunk from login / public pages (M-05).
 * Mounted under `/superadmin/*`.
 */
export default function AdminApp() {
  return (
    <Routes>
      <Route element={<SuperAdminLayout />}>
        <Route
          index
          element={
            <LazyPage>
              <SuperAdminHome />
            </LazyPage>
          }
        />
        <Route
          path="home"
          element={
            <LazyPage>
              <SuperAdminHome />
            </LazyPage>
          }
        />
        <Route
          path="admin-users"
          element={
            <LazyPage>
              <ViewAdminUsers />
            </LazyPage>
          }
        />
        <Route
          path="cad-centers"
          element={
            <LazyPage>
              <ViewCadCenters />
            </LazyPage>
          }
        />
        <Route
          path="cad-users"
          element={
            <LazyPage>
              <ViewCadUsers />
            </LazyPage>
          }
        />
        <Route
          path="cad-interest"
          element={
            <LazyPage>
              <ViewCadInterests />
            </LazyPage>
          }
        />
        <Route
          path="survey-draft-reports"
          element={
            <LazyPage>
              <ViewSurveyDraftReports />
            </LazyPage>
          }
        />
        <Route
          path="assignments"
          element={
            <LazyPage>
              <AdminAssignmentsPage />
            </LazyPage>
          }
        />
        <Route
          path="auto-assign/exceptions"
          element={
            <LazyPage>
              <AutoAssignExceptions />
            </LazyPage>
          }
        />
        <Route
          path="sketch-pricing"
          element={
            <LazyPage>
              <SketchPricing />
            </LazyPage>
          }
        />
        <Route
          path="payments/reconciliation"
          element={
            <LazyPage>
              <PaymentReconciliation />
            </LazyPage>
          }
        />
        <Route
          path="ops"
          element={
            <LazyPage>
              <OpsObservability />
            </LazyPage>
          }
        />
        <Route
          path="pay-cad-user"
          element={
            <LazyPage>
              <PayCadUser />
            </LazyPage>
          }
        />
        <Route
          path="districts"
          element={
            <LazyPage>
              <ViewDistricts />
            </LazyPage>
          }
        />
        <Route
          path="talukas"
          element={
            <LazyPage>
              <ViewTalukas />
            </LazyPage>
          }
        />
        <Route
          path="hoblis"
          element={
            <LazyPage>
              <ViewHoblis />
            </LazyPage>
          }
        />
        <Route
          path="villages"
          element={
            <LazyPage>
              <ViewVillages />
            </LazyPage>
          }
        />
        <Route
          path="projects"
          element={
            <LazyPage>
              <ViewCurrentProject />
            </LazyPage>
          }
        />
        <Route
          path="projects-history"
          element={
            <LazyPage>
              <ViewProjectHistory />
            </LazyPage>
          }
        />
        <Route
          path="user-surveyor-details"
          element={
            <LazyPage>
              <ViewUserDetails />
            </LazyPage>
          }
        />
      </Route>
    </Routes>
  );
}
