import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import DashboardLayout from "../../dashboard/user/component/Dashboardlayout.jsx";
import RouteFallback from "../RouteFallback.jsx";

const Home = lazy(() => import("../../dashboard/user/component/Home.jsx"));
const RequestsPage = lazy(
  () => import("../../dashboard/user/component/RequestsPage.jsx"),
);
const ProfilePage = lazy(
  () => import("../../dashboard/user/component/ProfilePage.jsx"),
);
const DraftsPage = lazy(
  () => import("../../dashboard/user/component/DraftsPage.jsx"),
);
const UserUploadForm = lazy(
  () => import("../../dashboard/user/UserUploadForm.jsx"),
);
const TrackCurrentOrder = lazy(
  () => import("../../dashboard/user/TrackCurrentOrder.jsx"),
);
const OrderHistoryTable = lazy(
  () => import("../../dashboard/user/OrderHistoryTable.jsx"),
);

function LazyPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

/**
 * Surveyor dashboard shell — separate chunk from login / public pages (M-05).
 * Mounted under `/dashboard/user/*`.
 */
export default function SurveyorApp() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route
          index
          element={
            <LazyPage>
              <Home />
            </LazyPage>
          }
        />
        <Route
          path="requests"
          element={
            <LazyPage>
              <RequestsPage />
            </LazyPage>
          }
        />
        <Route
          path="profile"
          element={
            <LazyPage>
              <ProfilePage />
            </LazyPage>
          }
        />
        <Route
          path="drafts"
          element={
            <LazyPage>
              <DraftsPage />
            </LazyPage>
          }
        />
        <Route
          path="upload"
          element={
            <LazyPage>
              <UserUploadForm />
            </LazyPage>
          }
        />
        <Route
          path="track-order"
          element={
            <LazyPage>
              <TrackCurrentOrder />
            </LazyPage>
          }
        />
        <Route
          path="order-history"
          element={
            <LazyPage>
              <OrderHistoryTable />
            </LazyPage>
          }
        />
      </Route>
    </Routes>
  );
}
