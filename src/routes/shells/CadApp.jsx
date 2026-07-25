import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import CADLayout from "../../dashboard/cad/layout/CADLayout.jsx";
import RouteFallback from "../RouteFallback.jsx";

const CADHomePage = lazy(() => import("../../dashboard/cad/CADHomePage.jsx"));
const ViewCurrentOrders = lazy(
  () => import("../../dashboard/cad/orders/ViewCurrentOrders.jsx"),
);
const ViewAllOrders = lazy(
  () => import("../../dashboard/cad/orders/ViewAllOrders.jsx"),
);
const CadWalletPage = lazy(() => import("../../pages/cad/Wallet.jsx"));

function LazyPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

/**
 * CAD operator dashboard shell — separate chunk from login / public pages (M-05).
 * Mounted under `/dashboard/cad/*`.
 */
export default function CadApp() {
  return (
    <Routes>
      <Route element={<CADLayout />}>
        <Route
          index
          element={
            <LazyPage>
              <CADHomePage />
            </LazyPage>
          }
        />
        <Route
          path="current-orders"
          element={
            <LazyPage>
              <ViewCurrentOrders />
            </LazyPage>
          }
        />
        <Route
          path="order-history"
          element={
            <LazyPage>
              <ViewAllOrders />
            </LazyPage>
          }
        />
        <Route
          path="wallet"
          element={
            <LazyPage>
              <CadWalletPage />
            </LazyPage>
          }
        />
      </Route>
    </Routes>
  );
}
