import React, { useState, useEffect, useCallback } from "react";
import { Typography, Table, Button, Space, Spin, Empty, message, Tag, Select, Drawer, Input, Form, Switch } from "antd";
import { EyeOutlined, EditOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProjectOrderDetailDrawer from "./ProjectOrderDetailDrawer";
import { getSketchUploadById } from "../../../services/surveyor/sketchUploadService.js";
import apiClient from "../../../services/apiClient.js";
import {
  getAssignmentFlow,
  getCadUsers,
  updateAssignmentFlow,
  formatUserDisplayLabel,
} from "../../../services/assignmentApi.js";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ASSIGNMENT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "CANCELLED", label: "Cancelled" },
];

const EDIT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "CANCELLED", label: "Cancelled" },
];

const ViewCurrentProject = () => {
  const navigate = useNavigate();
  const userRole = useSelector((state) => state.auth?.role);
  const currentRole =
    userRole ||
    (() => {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored)?.role : null;
      } catch {
        return null;
      }
    })();
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [cadUserFilter, setCadUserFilter] = useState("");
  const [cadUsers, setCadUsers] = useState([]);
  const [cadUsersLoading, setCadUsersLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  // Edit assignment drawer
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);
  const [editSaveLoading, setEditSaveLoading] = useState(false);
  const [autoAssign, setAutoAssign] = useState(false);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);

  // Check role access - only ADMIN and SUPER_ADMIN
  useEffect(() => {
    if (currentRole !== "ADMIN" && currentRole !== "SUPER_ADMIN") {
      message.error("Access denied. Admin or Super Admin access required.");
      navigate("/superadmin/home");
    }
  }, [currentRole, navigate]);

  useEffect(() => {
    let cancelled = false;
    const loadAutoAssign = async () => {
      try {
        const flow = await getAssignmentFlow();
        const enabled =
          flow?.autoAssignEnabled ??
          flow?.data?.autoAssignEnabled ??
          flow?.value?.autoAssignEnabled;
        if (!cancelled) setAutoAssign(Boolean(enabled));
      } catch (err) {
        if (cancelled) return;
        message.error(err?.message || "Failed to load auto assign setting");
      }
    };
    loadAutoAssign();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAutoAssignChange = async (checked) => {
    const prev = autoAssign;
    setAutoAssign(checked);
    setAutoAssignLoading(true);
    try {
      await updateAssignmentFlow({ autoAssignEnabled: checked });
      message.success("Auto assign setting updated");
    } catch (err) {
      setAutoAssign(prev);
      message.error(err?.message || "Failed to update auto assign setting");
    } finally {
      setAutoAssignLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setCadUsersLoading(true);
      try {
        const filteredCadUsers = await getCadUsers();
        if (!cancelled) setCadUsers(filteredCadUsers);
      } catch (err) {
        if (!cancelled) message.error(err.response?.data?.message || "Failed to load CAD users");
      } finally {
        if (!cancelled) setCadUsersLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetchAssignments(1, pagination.limit);
  }, [statusFilter, cadUserFilter]);

  const fetchAssignments = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (cadUserFilter) params.assignedToUserId = cadUserFilter;
      const { data: body } = await apiClient.get("/api/surveyor/sketch-uploads", {
        params,
      });

      const list = body?.data ?? [];
      const meta = body?.meta ?? body?.pagination ?? {};
      const pager = meta?.pagination && typeof meta.pagination === "object" ? meta.pagination : meta;
      setAssignments(Array.isArray(list) ? list : []);
      setPagination({
        page: pager.page ?? meta.page ?? page,
        limit: pager.limit ?? meta.limit ?? limit,
        total: pager.total ?? meta.total ?? list?.length ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch sketch uploads:", error);
      message.error(error.response?.data?.message || error.message || "Failed to load sketch uploads");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (record) => {
    setDrawerOpen(true);
    setLoadingDetails(true);
    setOrderDetails(null);

    // Upload ID: list row is sketch upload (record._id) or assignment (record.surveyorSketchUpload)
    const uploadId = record._id ?? (typeof record.surveyorSketchUpload === "object"
      ? record.surveyorSketchUpload?._id
      : record.surveyorSketchUpload);
    if (!uploadId) {
      message.error("No survey sketch upload linked");
      setLoadingDetails(false);
      return;
    }
    try {
      const response = await getSketchUploadById(uploadId);
      if (response?.success && response?.data) {
        setOrderDetails(response.data);
      } else {
        message.error("Failed to load order details");
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      message.error(error?.message || "Failed to load order details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedAssignment(null);
    setOrderDetails(null);
  };

  const handleSaveOrder = () => {
    setSelectedAssignment(null);
    fetchAssignments(pagination.page, pagination.limit);
  };

  const refreshOrderDetails = useCallback(async () => {
    const id = orderDetails?._id;
    if (!id) return;
    try {
      const response = await getSketchUploadById(id);
      if (response?.success && response?.data) setOrderDetails(response.data);
    } catch (error) {
      message.error(error?.message || "Failed to refresh order");
    }
  }, [orderDetails?._id]);

  const handleEdit = (record) => {
    setEditingAssignmentId(record._id);
    setEditDrawerOpen(true);
    editForm.resetFields();
  };

  useEffect(() => {
    if (!editDrawerOpen || !editingAssignmentId) return;
    let cancelled = false;
    setEditLoading(true);
    apiClient
      .get(`/api/admin/survey-sketch-assignments/${editingAssignmentId}`)
      .then(({ data: body }) => {
        if (cancelled) return;
        const d = body?.data ?? body;
        if (!d) return;
        editForm.setFieldsValue({
          status: d.status ?? undefined,
          assignedToUserId: d.assignedTo ?? undefined,
          dueDate: d.dueDate ? d.dueDate.slice(0, 16) : undefined,
          notes: d.notes ?? "",
        });
      })
      .catch((err) => {
        if (!cancelled) {
          message.error(err.response?.data?.message || "Failed to load assignment");
        }
      })
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });
    return () => { cancelled = true; };
  }, [editDrawerOpen, editingAssignmentId]);

  const handleEditDrawerClose = () => {
    setEditDrawerOpen(false);
    setEditingAssignmentId(null);
    editForm.resetFields();
  };

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields();
      setEditSaveLoading(true);
      const payload = {
        ...(values.status != null && values.status !== "" && { status: values.status }),
        ...(values.assignedToUserId != null && values.assignedToUserId !== "" && { assignedToUserId: values.assignedToUserId }),
        ...(values.dueDate && { dueDate: new Date(values.dueDate).toISOString() }),
        ...(values.notes != null && { notes: typeof values.notes === "string" ? values.notes : String(values.notes ?? "") }),
      };
      await apiClient.patch(
        `/api/admin/survey-sketch-assignments/${editingAssignmentId}`,
        payload
      );
      message.success("Assignment updated.");
      handleEditDrawerClose();
      fetchAssignments(pagination.page, pagination.limit);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || err.message || "Failed to update assignment");
    } finally {
      setEditSaveLoading(false);
    }
  };

  // Assignment status display and color
  const getAssignmentStatusDisplay = (status) => {
    const statusMap = {
      PENDING: "Pending",
      ASSIGNED: "Assigned",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      ON_HOLD: "On Hold",
      CANCELLED: "Cancelled",
    };
    return statusMap[status] || status || "-";
  };

  const getAssignmentStatusColor = (status) => {
    const colorMap = {
      PENDING: "default",
      ASSIGNED: "processing",
      IN_PROGRESS: "warning",
      COMPLETED: "success",
      ON_HOLD: "default",
      CANCELLED: "error",
    };
    return colorMap[status] || "default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
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

  const getLocationDisplay = (location) => {
    if (!location) return "-";
    if (typeof location === "string") return location;
    const name = location.name || "-";
    const code = location.code ? ` (${location.code})` : "";
    return `${name}${code}`;
  };

  const getCadCenterDisplay = (cadCenter) => {
    if (!cadCenter) return "-";
    if (typeof cadCenter === "string") return cadCenter;
    return cadCenter.name || cadCenter._id || "-";
  };

  const columns = [
    {
      title: "Sl. No",
      key: "slNo",
      width: 70,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Application ID",
      dataIndex: "applicationId",
      key: "applicationId",
      width: 180,
      render: (text) => text || "-",
    },
    {
      title: "Survey Type",
      dataIndex: "surveyType",
      key: "surveyType",
      width: 120,
      render: (type) => (
        <Tag>
          {type === "joint_flat" ? "Joint Flat" : type === "single_flat" ? "Single Flat" : type || "-"}
        </Tag>
      ),
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: 140,
      render: (loc) => getLocationDisplay(loc),
    },
    {
      title: "Taluka",
      dataIndex: "taluka",
      key: "taluka",
      width: 140,
      render: (loc) => getLocationDisplay(loc),
    },
    {
      title: "Village",
      dataIndex: "village",
      key: "village",
      width: 140,
      render: (loc) => getLocationDisplay(loc),
    },
    {
      title: "Survey No",
      dataIndex: "surveyNo",
      key: "surveyNo",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getAssignmentStatusColor(status)}>
          {getAssignmentStatusDisplay(status)}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 155,
      render: (date) => formatDateTime(date),
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View Details
          </Button>
          {record.assignedAt != null && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleTableChange = (paginationConfig) => {
    fetchAssignments(paginationConfig.current, paginationConfig.pageSize);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value ?? "");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCadUserFilterChange = (value) => {
    setCadUserFilter(value ?? "");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Survey Sketch Assignments
        </Title>
        <Space wrap>
          <Space>
            <span>Status:</span>
            <Select
              value={statusFilter || undefined}
              onChange={handleStatusFilterChange}
              options={ASSIGNMENT_STATUS_OPTIONS}
              style={{ minWidth: 160 }}
              placeholder="All statuses"
            />
          </Space>
          {isSuperAdmin && (
            <Space align="center" style={{ marginLeft: 4 }}>
              <Text type="secondary">Auto assign</Text>
              <Switch
                checked={autoAssign}
                onChange={handleAutoAssignChange}
                disabled={autoAssignLoading}
              />
            </Space>
          )}
          <Space>
            <span>CAD User:</span>
            <Select
              value={cadUserFilter || undefined}
              onChange={handleCadUserFilterChange}
              loading={cadUsersLoading}
              placeholder="All CAD users"
              allowClear
              style={{ minWidth: 200 }}
              options={[
                { value: "", label: "All CAD users" },
                ...cadUsers.map((u) => ({
                  value: u.id || u._id,
                  label: formatUserDisplayLabel(u) || String(u.id || u._id),
                })),
              ]}
            />
          </Space>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : assignments.length === 0 ? (
        <Empty description="No assignments found" />
      ) : (
        <Table
          columns={columns}
          dataSource={assignments}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} assignments`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      )}

      <ProjectOrderDetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        order={orderDetails}
        onSave={handleSaveOrder}
        onOrderRefresh={refreshOrderDetails}
        readOnly={false}
        loading={loadingDetails}
      />

      <Drawer
        title="Edit Assignment"
        placement="right"
        width={400}
        open={editDrawerOpen}
        onClose={handleEditDrawerClose}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={handleEditDrawerClose}>Cancel</Button>
            <Button type="primary" onClick={handleEditSave} loading={editSaveLoading}>
              Save
            </Button>
          </Space>
        }
      >
        {editLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
            <Form.Item name="status" label="Status">
              <Select
                placeholder="Select status"
                options={EDIT_STATUS_OPTIONS}
                allowClear
              />
            </Form.Item>
            <Form.Item name="assignedToUserId" label="Assigned To (CAD User)">
              <Select
                placeholder="Select CAD user (optional)"
                allowClear
                showSearch
                optionFilterProp="label"
                loading={cadUsersLoading}
                options={cadUsers.map((u) => ({
                  value: u.id || u._id,
                  label: formatUserDisplayLabel(u) || String(u.id || u._id),
                }))}
              />
            </Form.Item>
            <Form.Item name="dueDate" label="Due Date">
              <Input type="datetime-local" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <TextArea rows={4} placeholder="Notes (optional)" />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
};

export default ViewCurrentProject;
