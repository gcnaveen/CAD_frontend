import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Table,
  Button,
  Space,
  Drawer,
  Select,
  message,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import AddHoblis from "./AddHoblis";
import EditHoblis from "./EditHoblis";
import { getDistricts } from "../../../services/masters/districtService.js";
import { getTalukasByDistrict } from "../../../services/masters/talukaService.js";
import {
  getHoblisByTaluka,
  createHobli,
  updateHobli,
} from "../../../services/masters/hobliService.js";
import { parsePagedListResponse } from "../../../utils/paginationUtils.js";

const { Title } = Typography;

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const ViewHoblis = () => {
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(undefined);
  const [selectedTalukaId, setSelectedTalukaId] = useState(undefined);
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add");
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    getDistricts()
      .then((res) => {
        const items = normalizeList(res);
        setDistricts(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      })
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    if (!selectedDistrictId) {
      setTalukas([]);
      setSelectedTalukaId(undefined);
      return;
    }
    getTalukasByDistrict(selectedDistrictId)
      .then((res) => {
        const items = normalizeList(res);
        setTalukas(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      })
      .catch(() => setTalukas([]));
    setSelectedTalukaId(undefined);
  }, [selectedDistrictId]);

  const fetchHoblis = useCallback(async () => {
    if (!selectedTalukaId) {
      setList([]);
      setPagination((p) => ({ ...p, total: 0 }));
      return;
    }
    setLoading(true);
    try {
      const res = await getHoblisByTaluka(selectedTalukaId, {
        page: pagination.page,
        limit: pagination.limit,
      });
      const { items, total, page, limit } = parsePagedListResponse(res, {
        page: pagination.page,
        limit: pagination.limit,
      });
      setList(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      setPagination({ page, limit, total });
    } catch (err) {
      message.error(err.message || "Failed to load hoblis.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTalukaId, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchHoblis();
  }, [fetchHoblis]);

  const handleTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      page: pag.current ?? 1,
      limit: pag.pageSize ?? prev.limit,
    }));
  };

  const handleTalukaChange = (v) => {
    setSelectedTalukaId(v);
    setPagination((p) => ({ ...p, page: 1 }));
  };

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
      const districtId = values.district;
      const talukaId = values.taluka;
      await createHobli({
        code: values.code,
        name: values.name,
        districtId,
        talukaId,
        status: "ACTIVE",
      });
      message.success("Hobli added successfully.");
      handleDrawerClose();
      if (selectedTalukaId) fetchHoblis();
    } catch (err) {
      message.error(err.message || "Failed to add hobli.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (values) => {
    const id = editingRecord?.id ?? editingRecord?._id;
    if (!id) return;
    setSubmitLoading(true);
    try {
      await updateHobli(id, {
        code: values.code,
        name: values.name,
        districtId: values.district,
        talukaId: values.taluka,
        status: editingRecord?.status ?? "ACTIVE",
      });
      message.success("Hobli updated successfully.");
      handleDrawerClose();
      if (selectedTalukaId) fetchHoblis();
    } catch (err) {
      message.error(err.message || "Failed to update hobli.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: "SL No",
      key: "slNo",
      width: 80,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      sorter: (a, b) => (a.code || "").localeCompare(b.code || ""),
    },
    {
      title: "Hobli Name",
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
            aria-label="Edit hobli"
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
          Hoblis
        </Title>
        <Space wrap>
          <Select
            placeholder="Select district"
            allowClear
            size="large"
            style={{ minWidth: 180 }}
            value={selectedDistrictId}
            onChange={setSelectedDistrictId}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={districts.map((d) => ({
              value: d.id ?? d._id,
              label: d.code ? `${d.name} (${d.code})` : d.name,
            }))}
          />
          <Select
            placeholder="Select taluka"
            allowClear
            size="large"
            style={{ minWidth: 180 }}
            value={selectedTalukaId}
            onChange={handleTalukaChange}
            disabled={!selectedDistrictId}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={talukas.map((t) => ({
              value: t.id ?? t._id,
              label: t.code ? `${t.name} (${t.code})` : t.name,
            }))}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Hobli
          </Button>
        </Space>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={list}
          rowKey={(r) => r.id ?? r._id}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `Total ${total} hoblis`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 600 }}
          locale={
            !selectedTalukaId
              ? { emptyText: "Select district and taluka to view hoblis" }
              : undefined
          }
        />
      </Spin>

      <Drawer
        title={drawerMode === "add" ? "Add Hobli" : "Edit Hobli"}
        placement="right"
        size="large"
        onClose={handleDrawerClose}
        open={drawerOpen}
        destroyOnClose
        footer={null}
      >
        {drawerMode === "add" ? (
          <AddHoblis
            onCancel={handleDrawerClose}
            onSubmit={handleAddSubmit}
            loading={submitLoading}
            districtId={selectedDistrictId}
            talukaId={selectedTalukaId}
          />
        ) : (
          <EditHoblis
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

export default ViewHoblis;
