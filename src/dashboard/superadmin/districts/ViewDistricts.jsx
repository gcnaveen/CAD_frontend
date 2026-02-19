import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Table,
  Button,
  Space,
  Drawer,
  message,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import AddDistricts from "./AddDistricts";
import EditDistricts from "./EditDistricts";
import {
  getDistricts,
  createDistrict,
  updateDistrict,
} from "../../../services/masters/districtService.js";

const { Title } = Typography;

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const ViewDistricts = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add");
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDistricts();
      const items = normalizeList(res);
      setList(items.map((r) => ({ ...r, id: r.id ?? r._id })));
    } catch (err) {
      message.error(err.message || "Failed to load districts.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAdd = () => {
    setDrawerMode("add");
    setEditingRecord(null);
    setDrawerOpen(true);
  };

  const handleEdit = (record) => {
    setDrawerMode("edit");
    setEditingRecord(record);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingRecord(null);
  };

  const handleAddSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      await createDistrict({
        code: values.code,
        name: values.name,
        status: "ACTIVE",
      });
      message.success("District added successfully.");
      handleDrawerClose();
      fetchList();
    } catch (err) {
      message.error(err.message || "Failed to add district.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (values) => {
    const id = editingRecord?.id ?? editingRecord?._id;
    if (!id) return;
    setSubmitLoading(true);
    try {
      await updateDistrict(id, {
        code: values.code,
        name: values.name,
        status: editingRecord?.status ?? "ACTIVE",
      });
      message.success("District updated successfully.");
      handleDrawerClose();
      fetchList();
    } catch (err) {
      message.error(err.message || "Failed to update district.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: "SL No",
      key: "slNo",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      sorter: (a, b) => (a.code || "").localeCompare(b.code || ""),
    },
    {
      title: "District Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
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
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            aria-label="Edit district"
          >
            Edit
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
          Districts
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add District
        </Button>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={list}
          rowKey={(r) => r.id ?? r._id}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} districts`,
          }}
          scroll={{ x: 600 }}
        />
      </Spin>

      <Drawer
        title={drawerMode === "add" ? "Add District" : "Edit District"}
        placement="right"
        size="large"
        onClose={handleDrawerClose}
        open={drawerOpen}
        destroyOnClose
        footer={null}
      >
        {drawerMode === "add" ? (
          <AddDistricts
            onCancel={handleDrawerClose}
            onSubmit={handleAddSubmit}
            loading={submitLoading}
          />
        ) : (
          <EditDistricts
            initialValues={editingRecord}
            onCancel={handleDrawerClose}
            onSubmit={handleEditSubmit}
            loading={submitLoading}
          />
        )}
      </Drawer>
    </div>
  );
};

export default ViewDistricts;
