import React, { useCallback, useEffect, useState } from "react";
import { Typography, Table, Button, Tag, Space, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import OrderDetailDrawer from "./OrderDetailDrawer";
import {
  deliverCadAssignment,
  formatUserDisplayLabel,
  getCadAssignments,
  getCadSketchUpload,
  rejectCadAssignment,
  respondCadAssignment,
} from "../../../services/assignmentApi";
import { uploadImageToS3 } from "../../../services/upload/upload.service";
import { cadBi, cadBiFmt } from "../cadBilingual";

const { Title } = Typography;

const STATUS_TAG = {
  ASSIGNED: { color: "blue", text: cadBi.orders.assignmentStatus.ASSIGNED },
  IN_PROGRESS: { color: "orange", text: cadBi.orders.assignmentStatus.IN_PROGRESS },
  COMPLETED: { color: "green", text: cadBi.orders.assignmentStatus.COMPLETED },
  ON_HOLD: { color: "gold", text: cadBi.orders.assignmentStatus.ON_HOLD },
  CANCELLED: { color: "red", text: cadBi.orders.assignmentStatus.CANCELLED },
};
const ACCEPT_WINDOW_MS = 2 * 60 * 60 * 1000;

const ViewCurrentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const setActionLoading = (assignmentId, value) => {
    setActionLoadingById((prev) => ({ ...prev, [assignmentId]: value }));
  };

  const mapUploadedFiles = (documents = {}) =>
    Object.values(documents || {})
      .filter((file) => file?.url)
      .map((file, index) => ({
        id: `${file.fileName || "file"}-${index}`,
        name: file.fileName || `Document ${index + 1}`,
        url: file.url,
      }));

  const mapAssignmentToOrder = useCallback((assignment, sketch) => {
    if (!assignment) return null;
    const upload =
      typeof assignment.surveyorSketchUpload === "object" && assignment.surveyorSketchUpload
        ? assignment.surveyorSketchUpload
        : {};
    const sketchFromApi =
      sketch && typeof sketch === "object" && Object.keys(sketch).length > 0 ? sketch : {};
    const sketchData = { ...upload, ...sketchFromApi };

    const locationLine = [sketchData.district, sketchData.taluka, sketchData.village]
      .map((loc) => {
        if (loc == null) return null;
        if (typeof loc === "string") return loc;
        if (typeof loc === "object") {
          return loc.name || loc.code || loc._id || loc.id || null;
        }
        return null;
      })
      .filter(Boolean)
      .join(" · ");

    const summaryBits = [
      sketchData.surveyNo && `Survey No: ${sketchData.surveyNo}`,
      sketchData.applicationId && `Application: ${sketchData.applicationId}`,
    ].filter(Boolean);

    const uploadedFromDocuments = mapUploadedFiles(sketchData?.documents);
    const uploadedFromSingle =
      sketchData?.singleUpload?.url
        ? [
            {
              id: "single-upload",
              name: sketchData.singleUpload.fileName || "Uploaded document",
              url: sketchData.singleUpload.url,
              mimeType: sketchData.singleUpload.mimeType,
              size: sketchData.singleUpload.size,
              uploadedAt: sketchData.singleUpload.uploadedAt,
            },
          ]
        : [];

    return {
      id: assignment._id,
      assignmentId: assignment._id,
      rawAssignment: assignment,
      uploadId:
        typeof assignment.surveyorSketchUpload === "string"
          ? assignment.surveyorSketchUpload
          : upload._id,
      orderId: sketchData.applicationId || upload.applicationId || assignment._id || "-",
      applicationId: sketchData.applicationId || upload.applicationId || "—",
      surveyNo: sketchData.surveyNo || upload.surveyNo || "—",
      locationSummary: locationLine || "—",
      dueDate: assignment.dueDate || "",
      assignedByLabel: formatUserDisplayLabel(assignment.assignedBy) || "—",
      orderDate: assignment.assignedAt || assignment.createdAt || "",
      customerName:
        sketchData.surveyorName ||
        formatUserDisplayLabel(sketchData.surveyor) ||
        "—",
      phoneNumber:
        sketchData.phoneNumber ||
        sketchData.surveyorPhone ||
        sketchData.surveyor?.auth?.phone ||
        "—",
      status: assignment.status || "ASSIGNED",
      note: assignment.notes ?? "",
      sketchStatusNote: sketchData.statusNote ?? null,
      sketchUpload: sketchData,
      sketchDetails: {
        description:
          sketchData?.others ||
          (summaryBits.length ? summaryBits.join(" · ") : null) ||
          locationLine ||
          "Survey sketch details",
        uploadedFiles: uploadedFromSingle.length ? uploadedFromSingle : uploadedFromDocuments,
        isSingleMode: Boolean(sketchData?.singleUpload?.url),
      },
      audio: sketchData?.audio || null,
      cadFiles: sketchData?.cadDeliverable?.url
        ? [{ name: sketchData.cadDeliverable.fileName || "CAD Deliverable", url: sketchData.cadDeliverable.url }]
        : [],
    };
  }, []);

  const fetchAssignments = useCallback(async ({ page = 1, limit = 10 } = {}) => {
    setTableLoading(true);
    try {
      const response = await getCadAssignments({ page, limit });
      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
      const meta = response?.meta || response?.pagination || {};
      const pager =
        meta?.pagination && typeof meta.pagination === "object"
          ? meta.pagination
          : meta;
      const total = Number(pager.total ?? meta.total ?? rows.length) || 0;
      const resolvedPage = Number(pager.page ?? meta.page ?? page) || page;
      const resolvedLimit = Number(pager.limit ?? meta.limit ?? limit) || limit;
      setOrders(
        rows
          .map((assignment) => mapAssignmentToOrder(assignment))
          .filter(Boolean)
      );
      setPagination({ page: resolvedPage, limit: resolvedLimit, total });
    } catch (error) {
      message.error(error?.message || cadBi.orders.loadCurrentFail);
    } finally {
      setTableLoading(false);
    }
  }, [mapAssignmentToOrder]);

  useEffect(() => {
    fetchAssignments({ page: 1, limit: 10 });
  }, [fetchAssignments]);

  const handleViewDetails = async (record) => {
    const uploadId = record?.uploadId;
    if (!uploadId) {
      setSelectedOrder(record);
      setDrawerOpen(true);
      return;
    }
    setActionLoading(record.assignmentId, true);
    try {
      const sketch = await getCadSketchUpload(uploadId);
      const raw = record.rawAssignment;
      setSelectedOrder(
        mapAssignmentToOrder(
          raw || {
            _id: record.assignmentId,
            surveyorSketchUpload: { _id: uploadId, applicationId: record.orderId },
            status: record.status,
            notes: record.note,
            assignedAt: record.orderDate,
          },
          sketch
        )
      );
      setDrawerOpen(true);
    } catch (error) {
      message.error(error?.message || cadBi.orders.loadDetailFail);
      setSelectedOrder(record);
      setDrawerOpen(true);
    } finally {
      setActionLoading(record.assignmentId, false);
    }
  };

  const handleAssignmentAction = async (assignmentId, action) => {
    setActionLoading(assignmentId, true);
    try {
      await respondCadAssignment(assignmentId, action);
      message.success(action === "accept" ? cadBi.orders.orderAccepted : cadBi.orders.orderRejected);
      await fetchAssignments({ page: pagination.page, limit: pagination.limit });
      if (selectedOrder?.assignmentId === assignmentId) {
        setDrawerOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      message.error(error?.message || cadBi.orders.updateStatusFail);
    } finally {
      setActionLoading(assignmentId, false);
    }
  };

  const isWithinAcceptWindow = (record) => {
    const assignedAt = record?.orderDate;
    if (!assignedAt) return true;
    const assignedTime = new Date(assignedAt).getTime();
    if (Number.isNaN(assignedTime)) return true;
    return Date.now() - assignedTime <= ACCEPT_WINDOW_MS;
  };

  const handleAccept = (record) => {
    if (!isWithinAcceptWindow(record)) {
      message.warning(cadBi.orders.acceptWindowWarn);
      fetchAssignments({ page: pagination.page, limit: pagination.limit });
      return;
    }
    handleAssignmentAction(record.assignmentId, "accept");
  };

  const handleReject = async (record) => {
    if (!isWithinAcceptWindow(record)) {
      message.warning(cadBi.orders.acceptWindowWarn);
      await fetchAssignments({ page: pagination.page, limit: pagination.limit });
      return;
    }
    setActionLoading(record.assignmentId, true);
    try {
      await rejectCadAssignment(record.assignmentId);
      message.success(cadBi.orders.orderRejected);
      await fetchAssignments({ page: pagination.page, limit: pagination.limit });
      if (selectedOrder?.assignmentId === record.assignmentId) {
        setDrawerOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      message.error(error?.message || cadBi.orders.updateStatusFail);
    } finally {
      setActionLoading(record.assignmentId, false);
    }
  };

  const handleUploadCad = async (orderId, files) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target?.assignmentId) return;
    if (!files?.length) {
      message.warning(cadBi.orders.selectCadFile);
      return;
    }
    const file = files[0];
    setActionLoading(target.assignmentId, true);
    try {
      const { fileUrl } = await uploadImageToS3(file, target.uploadId || target.assignmentId);
      await deliverCadAssignment(target.assignmentId, {
        url: fileUrl,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size || 0,
      });
      message.success(cadBi.orders.cadDelivered);
      await fetchAssignments({ page: pagination.page, limit: pagination.limit });
      setDrawerOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      message.error(error?.message || cadBi.orders.deliverFail);
    } finally {
      setActionLoading(target.assignmentId, false);
    }
  };

  const handleTableChange = (nextPagination) => {
    fetchAssignments({
      page: nextPagination.current,
      limit: nextPagination.pageSize,
    });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  const columns = [
    {
      title: cadBi.orders.slNo,
      key: "slNo",
      width: 80,
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: cadBi.orders.assignedAt,
      dataIndex: "orderDate",
      key: "orderDate",
      width: 180,
      render: (value) => (value ? new Date(value).toLocaleString("en-IN") : "—"),
      sorter: (a, b) => new Date(a.orderDate || 0) - new Date(b.orderDate || 0),
    },
    {
      title: cadBi.orders.applicationId,
      dataIndex: "applicationId",
      key: "applicationId",
      width: 200,
      ellipsis: true,
    },
    // {
    //   title: "Survey No",
    //   dataIndex: "surveyNo",
    //   key: "surveyNo",
    //   width: 110,
    // },
    // {
    //   title: "Location (refs)",
    //   dataIndex: "locationSummary",
    //   key: "locationSummary",
    //   ellipsis: true,
    //   width: 220,
    // },
    {
      title: cadBi.orders.dueDate,
      dataIndex: "dueDate",
      key: "dueDate",
      width: 170,
      render: (value) => (value ? new Date(value).toLocaleString("en-IN") : "—"),
      sorter: (a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0),
    },
    // {
    //   title: "Assigned by",
    //   dataIndex: "assignedByLabel",
    //   key: "assignedByLabel",
    //   ellipsis: true,
    //   width: 160,
    // },
    {
      title: cadBi.orders.status,
      key: "status",
      width: 140,
      render: (_, record) => {
        const config = STATUS_TAG[record.status] || STATUS_TAG.ASSIGNED;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: cadBi.orders.details,
      key: "details",
      width: 160,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
          loading={!!actionLoadingById[record.assignmentId]}
        >
          {cadBi.orders.viewDetails}
        </Button>
      ),
    },
    {
      title: cadBi.orders.action,
      key: "action",
      width: 260,
      render: (_, record) => {
        const status = String(record?.status || "").toUpperCase();
        const expired = status === "ASSIGNED" && !isWithinAcceptWindow(record);

        return (
          <Space>
            {expired && <Tag color="default">{cadBi.orders.expired}</Tag>}
            {status === "ASSIGNED" && !expired && (
              <>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleAccept(record)}
                  loading={!!actionLoadingById[record.assignmentId]}
                >
                  {cadBi.orders.accept}
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => handleReject(record)}
                  loading={!!actionLoadingById[record.assignmentId]}
                >
                  {cadBi.orders.reject}
                </Button>
              </>
            )}

            {status === "IN_PROGRESS" && (
              <Button
                size="small"
                type="primary"
                onClick={() => handleViewDetails(record)}
                loading={!!actionLoadingById[record.assignmentId]}
              >
                {cadBi.orders.uploadDrawing}
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        {cadBi.orders.currentTitle}
      </Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {cadBi.orders.currentIntro}
      </Typography.Paragraph>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={tableLoading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => cadBiFmt(cadBi.orders.totalOrders, { n: total }),
        }}
        scroll={{ x: 1200 }}
      />

      <OrderDetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        order={selectedOrder}
        onUploadCad={handleUploadCad}
        onSave
      />
    </div>
  );
};

export default ViewCurrentOrders;
