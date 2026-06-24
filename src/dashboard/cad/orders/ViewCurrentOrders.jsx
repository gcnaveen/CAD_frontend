import React, { useCallback, useEffect, useState } from "react";
import { Typography, Table, Button, Tag, Space, message, Tooltip } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import OrderDetailDrawer from "./OrderDetailDrawer";
import {
  deliverCadAssignment,
  formatUserDisplayLabel,
  getCadAssignments,
  getCadSketchUpload,
  isCadAssignmentAccepted,
  rejectCadAssignment,
  resolveCadAssignmentId,
  resolveCadAssignmentStatus,
  respondCadAssignment,
} from "../../../services/assignmentApi";
import { uploadImageToS3 } from "../../../services/upload/upload.service";
import {
  flattenDocumentEntries,
  hasUploadedFiles,
  normalizeFileList,
} from "../../../utils/sketchFileUtils";
import { cadBi, cadBiFmt } from "../cadBilingual";

const { Title, Text } = Typography;

const splitBilingual = (label) => {
  const text = String(label || "");
  const slash = text.indexOf(" / ");
  if (slash === -1) return { en: text, kn: null };
  return { en: text.slice(0, slash), kn: text.slice(slash + 3) };
};

const BilingualTableTitle = ({ label }) => {
  const { en, kn } = splitBilingual(label);
  if (!kn) return en;
  return (
    <div className="cad-bilingual-th">
      <span className="cad-bilingual-th-en">{en}</span>
      <span className="cad-bilingual-th-kn">{kn}</span>
    </div>
  );
};

const BilingualStatusTag = ({ label, color }) => {
  const { en, kn } = splitBilingual(label);
  if (!kn) return <Tag color={color}>{en}</Tag>;
  return (
    <Tag color={color} className="cad-bilingual-tag">
      <span className="cad-bilingual-tag-en">{en}</span>
      <span className="cad-bilingual-tag-kn">{kn}</span>
    </Tag>
  );
};

const BilingualButtonLabel = ({ label }) => {
  const { en, kn } = splitBilingual(label);
  if (!kn) return en;
  return (
    <span className="cad-bilingual-btn-label">
      <span>{en}</span>
      <span className="cad-bilingual-btn-label-kn">{kn}</span>
    </span>
  );
};

const STATUS_TAG = {
  ASSIGNED: { color: "blue", text: cadBi.orders.assignmentStatus.ASSIGNED },
  IN_PROGRESS: { color: "orange", text: cadBi.orders.assignmentStatus.IN_PROGRESS },
  COMPLETED: { color: "green", text: cadBi.orders.assignmentStatus.COMPLETED },
  ON_HOLD: { color: "gold", text: cadBi.orders.assignmentStatus.ON_HOLD },
  CANCELLED: { color: "red", text: cadBi.orders.assignmentStatus.CANCELLED },
};
const ACCEPT_WINDOW_MS = 2 * 60 * 60 * 1000;

const canViewOrderDetails = (record) => Boolean(record?.isAccepted);

const ViewCurrentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const setActionLoading = (assignmentId, value) => {
    setActionLoadingById((prev) => ({ ...prev, [assignmentId]: value }));
  };

  const mapUploadedFiles = (documents = {}) =>
    flattenDocumentEntries(documents).map(({ key, file, label }) => ({
      id: key,
      name: file.fileName || label || "Document",
      url: file.url,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt,
    }));

  const mapCadDeliverables = (cadDeliverable) =>
    normalizeFileList(cadDeliverable).map((file, index) => ({
      id: `${file.fileName || "cad"}-${index}`,
      name: file.fileName || `CAD Deliverable ${index + 1}`,
      url: file.url,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt,
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
    const uploadedFromSingle = normalizeFileList(sketchData?.singleUpload).map((file, index) => ({
      id: `single-upload-${index}`,
      name: file.fileName || "Uploaded document",
      url: file.url,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt,
    }));

    const assignmentId = resolveCadAssignmentId(assignment);
    const assignmentStatus = resolveCadAssignmentStatus(assignment);
    const isAccepted = isCadAssignmentAccepted(assignment);

    return {
      id: assignmentId || assignment._id || assignment.id,
      assignmentId,
      isAccepted,
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
      status: assignmentStatus,
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
        isSingleMode: hasUploadedFiles(sketchData?.singleUpload),
      },
      audio: sketchData?.audio || null,
      cadFiles: mapCadDeliverables(sketchData?.cadDeliverable),
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
    if (!canViewOrderDetails(record)) {
      message.warning(cadBi.orders.viewDetailsAcceptFirst);
      return;
    }
    const uploadId = record?.uploadId;
    if (!uploadId) {
      setSelectedOrder(record);
      setDrawerOpen(true);
      return;
    }
    setDetailLoadingId(record.assignmentId);
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
      setDetailLoadingId(null);
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
    setActionLoading(target.assignmentId, true);
    try {
      const entityId = target.uploadId || target.assignmentId;
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { fileUrl } = await uploadImageToS3(file, entityId);
          return {
            url: fileUrl,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size || 0,
            uploadedAt: new Date().toISOString(),
          };
        })
      );
      await deliverCadAssignment(target.assignmentId, { files: uploadedFiles });
      message.success(cadBi.orders.cadDelivered);
      await fetchAssignments({ page: pagination.page, limit: pagination.limit });
      setDrawerOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      message.error(error?.message || cadBi.orders.deliverFail);
      throw error;
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
      title: <BilingualTableTitle label={cadBi.orders.slNo} />,
      key: "slNo",
      width: 72,
      align: "center",
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: <BilingualTableTitle label={cadBi.orders.assignedAt} />,
      dataIndex: "orderDate",
      key: "orderDate",
      width: 168,
      render: (value) => (
        <span className="cad-table-date">{value ? new Date(value).toLocaleString("en-IN") : "—"}</span>
      ),
      sorter: (a, b) => new Date(a.orderDate || 0) - new Date(b.orderDate || 0),
    },
    {
      title: <BilingualTableTitle label={cadBi.orders.applicationId} />,
      dataIndex: "applicationId",
      key: "applicationId",
      width: 196,
      ellipsis: { showTitle: false },
      render: (value) => (
        <Tooltip title={value || "—"}>
          <span className="cad-table-ellipsis">{value || "—"}</span>
        </Tooltip>
      ),
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
      title: <BilingualTableTitle label={cadBi.orders.dueDate} />,
      dataIndex: "dueDate",
      key: "dueDate",
      width: 148,
      render: (value) => (
        <span className="cad-table-date">{value ? new Date(value).toLocaleString("en-IN") : "—"}</span>
      ),
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
      title: <BilingualTableTitle label={cadBi.orders.status} />,
      key: "status",
      width: 152,
      render: (_, record) => {
        const config = STATUS_TAG[record.status] || STATUS_TAG.ASSIGNED;
        return <BilingualStatusTag label={config.text} color={config.color} />;
      },
    },
    {
      title: <BilingualTableTitle label={cadBi.orders.details} />,
      key: "details",
      width: 88,
      align: "center",
      render: (_, record) => {
        if (!canViewOrderDetails(record)) {
          return (
            <Tooltip title={cadBi.orders.viewDetailsAcceptFirst}>
              <Text type="secondary">—</Text>
            </Tooltip>
          );
        }
        return (
          <Tooltip title={cadBi.orders.viewDetails}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              aria-label={cadBi.orders.viewDetails}
              className="cad-details-btn"
              onClick={() => handleViewDetails(record)}
              loading={detailLoadingId === record.assignmentId}
            />
          </Tooltip>
        );
      },
    },
    {
      title: <BilingualTableTitle label={cadBi.orders.action} />,
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        const status = String(record?.status || "").toUpperCase();
        const expired = status === "ASSIGNED" && !isWithinAcceptWindow(record);

        return (
          <Space size={[6, 6]} wrap className="cad-action-cell">
            {expired && (
              <BilingualStatusTag label={cadBi.orders.expired} color="default" />
            )}
            {status === "ASSIGNED" && !expired && (
              <>
                <Button
                  size="small"
                  type="primary"
                  className="cad-action-btn"
                  onClick={() => handleAccept(record)}
                  loading={!!actionLoadingById[record.assignmentId]}
                >
                  <BilingualButtonLabel label={cadBi.orders.accept} />
                </Button>
                <Button
                  size="small"
                  danger
                  className="cad-action-btn"
                  onClick={() => handleReject(record)}
                  loading={!!actionLoadingById[record.assignmentId]}
                >
                  <BilingualButtonLabel label={cadBi.orders.reject} />
                </Button>
              </>
            )}

            {status === "IN_PROGRESS" && (
              <Button
                size="small"
                type="primary"
                className="cad-action-btn cad-action-btn-wide"
                onClick={() => handleViewDetails(record)}
                loading={detailLoadingId === record.assignmentId}
              >
                <BilingualButtonLabel label={cadBi.orders.uploadDrawing} />
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

      <div className="cad-current-orders-table-wrap">
        <Table
          className="cad-current-orders-table"
          columns={columns}
          dataSource={orders}
          rowKey={(record) => record.assignmentId || record.id}
          loading={tableLoading}
          onChange={handleTableChange}
          tableLayout="fixed"
          size="middle"
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => cadBiFmt(cadBi.orders.totalOrders, { n: total }),
          }}
          scroll={{ x: 1100 }}
        />
      </div>

      <OrderDetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        order={selectedOrder}
        onUploadCad={handleUploadCad}
        uploadLoading={Boolean(
          selectedOrder?.assignmentId && actionLoadingById[selectedOrder.assignmentId]
        )}
        onSave
      />
    </div>
  );
};

export default ViewCurrentOrders;
