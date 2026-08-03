import React, { useCallback, useEffect, useState } from "react";
import { Typography, Table, Button, Tag, Spin, Empty, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import ProjectOrderDetailDrawer from "./ProjectOrderDetailDrawer";
import apiClient from "../../../services/apiClient.js";
import { loadSketchUploadWithAssignment } from "../../../services/assignmentApi.js";
import { getSketchStatusLabel } from "../../../utils/lifecycleQc.js";
import {
  ROLES,
  normalizeRoleKey,
  resolveStoredUserRole,
} from "../../../constants/roles.js";

const { Title, Text } = Typography;

/** Terminal / history statuses for admin project history (no dummy fixtures). */
const HISTORY_STATUS_OPTIONS = [
  { value: "", label: "All history statuses" },
  { value: "CAD_DELIVERED", label: getSketchStatusLabel("CAD_DELIVERED") },
  { value: "APPROVED", label: getSketchStatusLabel("APPROVED") },
  { value: "REJECTED", label: getSketchStatusLabel("REJECTED") },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

const DEFAULT_HISTORY_STATUSES = "CAD_DELIVERED,APPROVED,REJECTED,CANCELLED,COMPLETED";

const STATUS_COLOR = {
  CAD_DELIVERED: "purple",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "default",
  COMPLETED: "green",
  UNDER_REVISION: "orange",
};

const ViewProjectHistory = () => {
  const navigate = useNavigate();
  const roleFromStore = useSelector((state) => state.auth?.role);
  const userRoleFromStore = useSelector((state) => state.auth?.user?.role);
  const currentRole = normalizeRoleKey(
    resolveStoredUserRole(roleFromStore, userRoleFromStore)
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (currentRole !== ROLES.ADMIN && currentRole !== ROLES.SUPER_ADMIN) {
      message.error("Access denied. Admin or Super Admin access required.");
      navigate("/superadmin/home");
    }
  }, [currentRole, navigate]);

  const fetchHistory = useCallback(
    async (page = 1, limit = 10) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit,
          status: statusFilter || DEFAULT_HISTORY_STATUSES,
        };
        const { data: body } = await apiClient.get("/api/surveyor/sketch-uploads", { params });
        const list = body?.data ?? [];
        const meta = body?.meta ?? body?.pagination ?? {};
        const pager =
          meta?.pagination && typeof meta.pagination === "object" ? meta.pagination : meta;

        setOrders(Array.isArray(list) ? list : []);
        setPagination({
          page: pager.page ?? meta.page ?? page,
          limit: pager.limit ?? meta.limit ?? limit,
          total: pager.total ?? meta.total ?? list?.length ?? 0,
        });
      } catch (error) {
        message.error(
          error.response?.data?.message || error.message || "Failed to load project history"
        );
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchHistory(1, pagination.limit);
  }, [fetchHistory, pagination.limit]);

  const getLocationDisplay = (location) => {
    if (!location) return "-";
    if (typeof location === "string") return location;
    const name = location.name || "-";
    const code = location.code ? ` (${location.code})` : "";
    return `${name}${code}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleViewDetails = async (record) => {
    setDrawerOpen(true);
    setLoadingDetails(true);
    setOrderDetails(null);

    const uploadId =
      record._id ??
      (typeof record.surveyorSketchUpload === "object"
        ? record.surveyorSketchUpload?._id
        : record.surveyorSketchUpload);

    if (!uploadId) {
      message.error("No survey sketch upload linked");
      setLoadingDetails(false);
      return;
    }

    try {
      const detail = await loadSketchUploadWithAssignment(uploadId, record);
      setOrderDetails(detail);
    } catch (error) {
      message.error(error?.message || "Failed to load order details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setOrderDetails(null);
  };

  const handleSaveOrder = () => {
    fetchHistory(pagination.page, pagination.limit);
  };

  const columns = [
    {
      title: "Sl. No",
      key: "slNo",
      width: 80,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Ordered Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (value) => formatDate(value),
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    },
    {
      title: "Application ID",
      dataIndex: "applicationId",
      key: "applicationId",
      width: 160,
      render: (value) => value || "-",
    },
    {
      title: "Survey No",
      dataIndex: "surveyNo",
      key: "surveyNo",
      width: 110,
      render: (value) => value || "-",
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: 140,
      render: (loc) => getLocationDisplay(loc),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => (
        <Tag color={STATUS_COLOR[status] || "default"}>
          {getSketchStatusLabel(status) || status || "-"}
        </Tag>
      ),
      filters: HISTORY_STATUS_OPTIONS.filter((o) => o.value).map((o) => ({
        text: o.label,
        value: o.value,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 8 }}>
        View Project History
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Completed, delivered, rejected, and cancelled projects from live sketch uploads.
      </Text>

      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          style={{
            minWidth: 220,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--border-color, #d9d9d9)",
          }}
          aria-label="Filter by status"
        >
          {HISTORY_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : orders.length === 0 ? (
        <Empty description="No project history found" />
      ) : (
        <Table
          columns={columns}
          dataSource={orders}
          rowKey={(record) => record._id ?? record.id}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, page, limit: pageSize || prev.limit }));
              fetchHistory(page, pageSize || pagination.limit);
            },
          }}
          scroll={{ x: 900 }}
        />
      )}

      <ProjectOrderDetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        order={orderDetails}
        onSave={handleSaveOrder}
        readOnly
        loading={loadingDetails}
      />
    </div>
  );
};

export default ViewProjectHistory;
