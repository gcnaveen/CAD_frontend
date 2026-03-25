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
import AddVillages from "./AddVillages";
import EditVillages from "./EditVillages";
import { getDistricts } from "../../../services/masters/districtService.js";
import { getTalukasByDistrict } from "../../../services/masters/talukaService.js";
import { getHoblisByTaluka } from "../../../services/masters/hobliService.js";
import {
  getVillages,
  createVillage,
  updateVillage,
} from "../../../services/masters/villageService.js";
import { parsePagedListResponse } from "../../../utils/paginationUtils.js";

const { Title } = Typography;

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const ViewVillages = () => {
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [hoblis, setHoblis] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(undefined);
  const [selectedTalukaId, setSelectedTalukaId] = useState(undefined);
  const [selectedHobliId, setSelectedHobliId] = useState(undefined);
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
      setSelectedHobliId(undefined);
      return;
    }
    getTalukasByDistrict(selectedDistrictId)
      .then((res) => {
        const items = normalizeList(res);
        setTalukas(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      })
      .catch(() => setTalukas([]));
    setSelectedTalukaId(undefined);
    setSelectedHobliId(undefined);
  }, [selectedDistrictId]);

  useEffect(() => {
    if (!selectedTalukaId) {
      setHoblis([]);
      setSelectedHobliId(undefined);
      return;
    }
    getHoblisByTaluka(selectedTalukaId)
      .then((res) => {
        const items = normalizeList(res);
        setHoblis(items.map((r) => ({ ...r, id: r.id ?? r._id })));
      })
      .catch(() => setHoblis([]));
    setSelectedHobliId(undefined);
  }, [selectedTalukaId]);

  const fetchVillages = useCallback(async () => {
    if (!selectedHobliId) {
      setList([]);
      setPagination((p) => ({ ...p, total: 0 }));
      return;
    }
    setLoading(true);
    try {
      const res = await getVillages({
        districtId: selectedDistrictId,
        talukaId: selectedTalukaId,
        hobliId: selectedHobliId,
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
      message.error(err.message || "Failed to load villages.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDistrictId, selectedTalukaId, selectedHobliId, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchVillages();
  }, [fetchVillages]);

  const handleTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      page: pag.current ?? 1,
      limit: pag.pageSize ?? prev.limit,
    }));
  };

  const handleHobliChange = (v) => {
    setSelectedHobliId(v);
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
      await createVillage({
        code: values.code,
        name: values.name,
        district: values.district,
        taluka: values.taluka,
        hobli: values.hobli,
        status: "ACTIVE",
      });
      message.success("Village added successfully.");
      handleDrawerClose();
      if (selectedHobliId) fetchVillages();
    } catch (err) {
      message.error(err.message || "Failed to add village.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (values) => {
    const id = editingRecord?.id ?? editingRecord?._id;
    if (!id) return;
    setSubmitLoading(true);
    try {
      await updateVillage(id, {
        code: values.code,
        name: values.name,
        districtId: values.district,
        talukaId: values.taluka,
        hobliId: values.hobli,
        status: editingRecord?.status ?? "ACTIVE",
      });
      message.success("Village updated successfully.");
      handleDrawerClose();
      if (selectedHobliId) fetchVillages();
    } catch (err) {
      message.error(err.message || "Failed to update village.");
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
      title: "Village Name",
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
            aria-label="Edit village"
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
          Villages
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
            onChange={setSelectedTalukaId}
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
          <Select
            placeholder="Select hobli"
            allowClear
            size="large"
            style={{ minWidth: 180 }}
            value={selectedHobliId}
            onChange={handleHobliChange}
            disabled={!selectedTalukaId}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={hoblis.map((h) => ({
              value: h.id ?? h._id,
              label: h.code ? `${h.name} (${h.code})` : h.name,
            }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Village
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
            showTotal: (total) => `Total ${total} villages`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 600 }}
          locale={
            !selectedHobliId
              ? { emptyText: "Select district, taluka and hobli to view villages" }
              : undefined
          }
        />
      </Spin>

      <Drawer
        title={drawerMode === "add" ? "Add Village" : "Edit Village"}
        placement="right"
        size="large"
        onClose={handleDrawerClose}
        open={drawerOpen}
        destroyOnClose
        footer={null}
      >
        {drawerMode === "add" ? (
          <AddVillages
            onCancel={handleDrawerClose}
            onSubmit={handleAddSubmit}
            loading={submitLoading}
            districtId={selectedDistrictId}
            talukaId={selectedTalukaId}
            hobliId={selectedHobliId}
          />
        ) : (
          <EditVillages
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

export default ViewVillages;
