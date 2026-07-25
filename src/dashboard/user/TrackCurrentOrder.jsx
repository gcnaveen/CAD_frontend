import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button, Spin, Empty, message } from "antd";
import { ArrowLeft } from "lucide-react";
import TrackOrderCard from "./component/TrackOrderCard";
import { getSketchUploads } from "../../services/surveyor/sketchUploadService.js";
import { getSketchStatusLabel } from "../../utils/lifecycleQc.js";

const TrackCurrentOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const response = await getSketchUploads({
        page,
        limit,
      });

      if (response?.success && response?.data) {
        setOrders(response.data);
        if (response.meta) {
          setPagination({
            page: response.meta.page || page,
            limit: response.meta.limit || limit,
            total: response.meta.total || 0,
          });
        }
      } else {
        setOrders([]);
        message.warning("No orders found");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      message.error(error.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // M-08 lifecycleMachine labels (legacy UNDER_REVIEW → UNDER_REVISION)
  const getStatusDisplay = (status) => getSketchStatusLabel(status);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <Empty
          description="No orders found"
          className="py-12"
        />
      );
    }

    return (
      <div className="space-y-4 sm:space-y-5">
        {orders.map((order) => {
          return (
            <TrackOrderCard
              key={order._id}
              projectNo={order.applicationId || "—"}
              status={getStatusDisplay(order.status)}
              statusType={order.status}
              uploadId={order._id}
              sla={order.sla || order.assignment?.sla}
              orderData={{
                surveyType: order.surveyType,
                district: order.district,
                taluka: order.taluka,
                hobli: order.hobli,
                village: order.village,
                surveyNo: order.surveyNo,
                others: order.others,
                documents: order.documents,
                status: order.status,
                statusNote: order.statusNote,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
              }}
              onViewDetails={() => {
                // View details for project (e.g. navigate or open drawer)
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-2/50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Back button – top left */}
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

        {/* Page heading */}
        <h1 className="mb-6 text-xl font-semibold text-fg sm:mb-8 sm:text-2xl md:text-3xl">
          Track your current order
        </h1>

        {/* Loading state */}
        {renderContent()}
      </div>
    </div>
  );
};

export default TrackCurrentOrder;
