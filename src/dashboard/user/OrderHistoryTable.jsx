import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Empty, Spin, Tag, message } from "antd";
import { ArrowLeft, Lock, FileCheck, Eye } from "lucide-react";
import TableComponent from "./component/TableComponent";
import SurveyOrderDetailDrawer from "./component/SurveyOrderDetailDrawer.jsx";
import { getSurveyorOrders } from "../../services/surveyor/sketchUploadService.js";
import { getSurveyorOrderStatusQuery } from "../../utils/surveyorOrderStatus.js";
import { isCadDownloadEntitled } from "../../utils/cadDownloadEntitlement.js";

function getEntityName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.name || value?.label || value?.code || "";
}

function buildProjectDetails(order) {
  const parts = [
    order.surveyNo ? `Survey No. ${order.surveyNo}` : null,
    getEntityName(order.village),
    getEntityName(order.taluka),
    getEntityName(order.district),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

const OrderHistoryTable = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchOrders = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const response = await getSurveyorOrders({
        status: getSurveyorOrderStatusQuery("completed"),
        page,
        limit,
      });
      const list = Array.isArray(response?.data) ? response.data : [];
      const meta = response?.meta ?? {};
      const pager =
        meta?.pagination && typeof meta.pagination === "object" ? meta.pagination : meta;

      setOrders(list);
      setPagination({
        page: pager.page ?? page,
        limit: pager.limit ?? limit,
        total: pager.total ?? list.length,
      });
    } catch (error) {
      message.error(error.message || "Failed to load order history");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1, pagination.limit);
  }, [fetchOrders, pagination.limit]);

  const handleBack = () => {
    navigate(-1);
  };

  const openDetails = (record) => {
    const id = record?._id ?? record?.id;
    if (!id) {
      message.warning("Order details unavailable");
      return;
    }
    setSelectedUploadId(id);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: "Sl No",
      key: "slNo",
      width: 72,
      align: "center",
      render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      title: "Project ID",
      dataIndex: "applicationId",
      key: "applicationId",
      width: 140,
      ellipsis: true,
      render: (value) => value || "—",
    },
    {
      title: "Project Details",
      key: "projectDetails",
      width: 240,
      ellipsis: true,
      render: (_, record) => buildProjectDetails(record),
    },
    {
      title: "CAD File Status",
      key: "cadFileStatus",
      width: 140,
      align: "center",
      render: (_, record) => {
        const entitled = isCadDownloadEntitled(record);
        return (
          <span className="inline-flex items-center gap-2 text-fg-muted">
            {entitled ? (
              <>
                <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Available</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Locked</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      title: "Payment Status",
      key: "paymentStatus",
      width: 130,
      align: "center",
      render: (_, record) =>
        isCadDownloadEntitled(record) ? (
          <Tag color="success">Paid</Tag>
        ) : (
          <Tag color="warning">Pending</Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      align: "center",
      fixed: "right",
      render: (_col, record) => (
        <Button
          type="link"
          size="small"
          icon={<Eye className="h-4 w-4" />}
          onClick={() => openDetails(record)}
          className="p-0 font-medium text-[var(--cyan-accent)] hover:opacity-90"
        >
          View
        </Button>
      ),
    },
  ];

  const dataSource = orders.map((order, index) => ({
    ...order,
    key: order._id ?? order.id ?? `order-${index}`,
  }));

  return (
    <div className="min-h-screen bg-surface-2/50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mb-4 sm:mb-6">
          <Button
            type="text"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={handleBack}
            className="-ml-1 flex items-center gap-1.5 pl-0 text-fg-muted hover:bg-transparent hover:text-fg"
            size="large"
          >
            Back
          </Button>
        </div>

        <h1 className="mb-6 text-xl font-semibold text-fg sm:mb-8 sm:text-2xl md:text-3xl">
          Order history
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : dataSource.length === 0 ? (
          <Empty description="No completed orders yet" className="py-16" />
        ) : (
          <TableComponent
            columns={columns}
            dataSource={dataSource}
            scroll={{ x: 600 }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                setPagination((prev) => ({ ...prev, page, limit: pageSize || prev.limit }));
                fetchOrders(page, pageSize || pagination.limit);
              },
            }}
          />
        )}
      </div>

      <SurveyOrderDetailDrawer
        open={drawerOpen}
        uploadId={selectedUploadId}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUploadId(null);
        }}
      />
    </div>
  );
};

export default OrderHistoryTable;
