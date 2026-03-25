import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Table,
  Button,
  Space,
  Drawer,
  Modal,
  message,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import AddCadCenters from "./AddCadCenters";
import EditCadCenters from "./EditCadCenters";
import {
  getCadCenters,
  getCadCenterById,
  createCadCenter,
  updateCadCenter,
  deleteCadCenter,
} from "../../../services/masters/cadcenterservice.js";
import { parsePagedListResponse } from "../../../utils/paginationUtils.js";

const { Title } = Typography;

const ViewCadCenters = () => {
  const [centers, setCenters] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add");
  const [editingCenter, setEditingCenter] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCadCenters({ page: pagination.page, limit: pagination.limit });
      const { items, total, page, limit } = parsePagedListResponse(res, {
        page: pagination.page,
        limit: pagination.limit,
      });
      setCenters(items);
      setPagination({ page, limit, total });
    } catch (err) {
      message.error(err.message || "Failed to load CAD centers.");
      setCenters([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const handleTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      page: pag.current ?? 1,
      limit: pag.pageSize ?? prev.limit,
    }));
  };

  const handleAddCenter = () => {
    setDrawerMode("add");
    setEditingCenter(null);
    setDrawerOpen(true);
  };

  const handleEditCenter = async (record) => {
    setDrawerMode("edit");
    setEditLoading(true);
    setDrawerOpen(true);
    try {
      const res = await getCadCenterById(record._id ?? record.id);
      const center = res?.data ?? res;
      setEditingCenter(center);
    } catch (err) {
      message.error(err.message || "Failed to load CAD center.");
      setDrawerOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCenter = (record) => {
    Modal.confirm({
      title: "Delete CAD Center",
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteCadCenter(record._id ?? record.id);
          message.success("CAD center deleted successfully.");
          fetchCenters();
        } catch (err) {
          message.error(err.message || "Failed to delete CAD center.");
        }
      },
    });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingCenter(null);
  };

  const handleAddSubmit = async (payload) => {
    setSubmitLoading(true);
    try {
      await createCadCenter(payload);
      message.success("CAD center added successfully.");
      handleDrawerClose();
      fetchCenters();
    } catch (err) {
      message.error(err.message || "Failed to add CAD center.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (payload) => {
    const centerId = editingCenter?._id ?? editingCenter?.id;
    if (!centerId) return;
    setSubmitLoading(true);
    try {
      await updateCadCenter(centerId, payload);
      message.success("CAD center updated successfully.");
      handleDrawerClose();
      fetchCenters();
    } catch (err) {
      message.error(err.message || "Failed to update CAD center.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: "SL No",
      key: "slNo",
      width: 70,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 120,
      sorter: (a, b) => (a.code || "").localeCompare(b.code || ""),
    },
    {
      title: "City",
      key: "city",
      width: 120,
      render: (_, record) => record.address?.city ?? "-",
    },
    {
      title: "Pincode",
      key: "pincode",
      width: 90,
      render: (_, record) => record.address?.pincode ?? "-",
    },
    {
      title: "Email",
      key: "email",
      width: 180,
      render: (_, record) => record.contact?.email ?? "-",
    },
    {
      title: "Phone",
      key: "phone",
      width: 130,
      render: (_, record) => record.contact?.phone ?? "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
    },
    {
      title: "Action",
      key: "action",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditCenter(record)}
            aria-label="Edit CAD center"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCenter(record)}
            aria-label="Delete CAD center"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 24 }}
        wrap
      >
        <Title level={3} style={{ margin: 0 }}>
          View CAD Centers
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCenter}>
          Add CAD Center
        </Button>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={centers}
          rowKey={(r) => r._id ?? r.id}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `Total ${total} centers`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
        />
      </Spin>

      <Drawer
        title={drawerMode === "add" ? "Add CAD Center" : "Edit CAD Center"}
        placement="right"
        size="large"
        onClose={handleDrawerClose}
        open={drawerOpen}
        destroyOnClose
        footer={null}
      >
        {editLoading && drawerMode === "edit" ? (
          <Spin size="large" style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 8 }}>Loading...</div>
            </div>
          </Spin>
        ) : drawerMode === "add" ? (
          <AddCadCenters
            onCancel={handleDrawerClose}
            onSubmit={handleAddSubmit}
            loading={submitLoading}
          />
        ) : (
          <EditCadCenters
            initialValues={editingCenter}
            onCancel={handleDrawerClose}
            onSubmit={handleEditSubmit}
            loading={submitLoading}
          />
        )}
      </Drawer>
    </div>
  );
};

export default ViewCadCenters;
