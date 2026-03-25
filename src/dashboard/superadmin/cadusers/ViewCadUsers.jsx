import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  message,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import UserFormDrawer from "../../../components/users/UserFormDrawer.jsx";
import { getUsersByRole, deleteUser } from "../../../services/user/userService.js";
import { mapUserToRow } from "../../../utils/userListUtils.js";
import { parsePagedListResponse } from "../../../utils/paginationUtils.js";

const { Title } = Typography;

const ROLE_CAD = "CAD";

const ViewCadUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add");
  const [editingUserId, setEditingUserId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersByRole({
        role: ROLE_CAD,
        page: pagination.page,
        limit: pagination.limit,
      });
      const { items, total, page, limit } = parsePagedListResponse(res, {
        page: pagination.page,
        limit: pagination.limit,
      });
      setUsers(items.map(mapUserToRow));
      setPagination({ page, limit, total });
    } catch (err) {
      message.error(err.message || "Failed to load CAD users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      page: pag.current ?? 1,
      limit: pag.pageSize ?? prev.limit,
    }));
  };

  const handleAddUser = () => {
    setDrawerMode("add");
    setEditingUserId(null);
    setDrawerOpen(true);
  };

  const handleEditUser = (record) => {
    setDrawerMode("edit");
    setEditingUserId(record.id ?? record._id);
    setDrawerOpen(true);
  };

  const handleDeleteUser = (record) => {
    Modal.confirm({
      title: "Delete CAD User",
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteUser(record.id ?? record._id);
          message.success("CAD user deleted successfully.");
          fetchUsers();
        } catch (err) {
          message.error(err.message || "Failed to delete user.");
        }
      },
    });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingUserId(null);
  };

  const handleSuccess = () => {
    fetchUsers();
  };

  const columns = [
    {
      title: "SL No",
      key: "slNo",
      width: 80,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            aria-label="Edit user"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record)}
            aria-label="Delete user"
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
          View CAD Users
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
          Add CAD User
        </Button>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey={(r) => r.id ?? r._id}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `Total ${total} users`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 600 }}
        />
      </Spin>

      <UserFormDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode={drawerMode}
        role={ROLE_CAD}
        userId={editingUserId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default ViewCadUsers;
