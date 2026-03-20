import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Homepage from "../pages/Homepage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import HomePage from "../dashboard/user/HomePage";
import UserUploadForm from "../dashboard/user/UserUploadForm";
import TrackCurrentOrder from "../dashboard/user/TrackCurrentOrder";
import OrderHistoryTable from "../dashboard/user/OrderHistoryTable";
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
import CADLayout from "../dashboard/cad/layout/CADLayout";
import CADHomePage from "../dashboard/cad/CADHomePage";
import ViewCurrentOrders from "../dashboard/cad/orders/ViewCurrentOrders";
import ViewAllOrders from "../dashboard/cad/orders/ViewAllOrders";
import Wallet from "../dashboard/cad/wallet/Wallet";
import AdminAssignmentsPage from "../pages/AdminAssignmentsPage.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/surveyor/home" element={<Navigate to="/dashboard/user" replace />} />
      <Route path="/dashboard/user" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

      <Route path="/dashboard/cad" element={<ProtectedRoute><CADLayout /></ProtectedRoute>}>
        <Route index element={<CADHomePage />} />
        <Route path="current-orders" element={<ViewCurrentOrders />} />
        <Route path="order-history" element={<ViewAllOrders />} />
        <Route path="wallet" element={<Wallet />} />
      </Route>
      <Route path="/dashboard/user/upload" element={<ProtectedRoute><UserUploadForm /></ProtectedRoute>} />
      <Route path="/dashboard/user/track-order" element={<ProtectedRoute><TrackCurrentOrder /></ProtectedRoute>} />
      <Route path="/dashboard/user/order-history" element={<ProtectedRoute><OrderHistoryTable /></ProtectedRoute>} />

      <Route path="/superadmin" element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>}>
        <Route index element={<SuperAdminHome />} />
        <Route path="home" element={<SuperAdminHome />} />
        <Route path="admin-users" element={<ViewAdminUsers />} />
        <Route path="cad-centers" element={<ViewCadCenters />} />
        <Route path="cad-users" element={<ViewCadUsers />} />
        <Route path="assignments" element={<AdminAssignmentsPage />} />
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
