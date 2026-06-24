import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Result, Spin, Typography, message } from "antd";
import SketchPaymentRetryButton from "../components/payments/SketchPaymentRetryButton.jsx";
import { getSketchUploadById } from "../services/surveyor/sketchUploadService.js";
import {
  normalizeSketchPaymentPageState,
  readSketchPaymentContext,
} from "../utils/sketchPaymentUtils.js";

const { Paragraph, Text } = Typography;

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [upload, setUpload] = useState(null);

  const lastPayment = useMemo(() => readSketchPaymentContext(), []);

  const uploadId = useMemo(() => {
    const fromQuery = searchParams.get("uploadId");
    if (fromQuery && String(fromQuery).trim()) return String(fromQuery).trim();
    return lastPayment?.uploadId || null;
  }, [searchParams, lastPayment?.uploadId]);

  const refresh = useCallback(async () => {
    if (!uploadId) {
      setUpload(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getSketchUploadById(uploadId);
      if (!res?.success) throw new Error(res?.message || "Failed to fetch order status");
      setUpload(res.data);
    } catch (e) {
      message.error(e?.message || "Failed to load order status");
      setUpload(null);
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const paymentState = upload ? normalizeSketchPaymentPageState(upload) : null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spin tip="Loading order status..." />
      </div>
    );
  }

  if (paymentState === "success") {
    return (
      <Result
        status="success"
        title="Payment already completed"
        subTitle={
          <Paragraph className="mb-0">
            <Text strong>Application ID:</Text> {upload?.applicationId || "—"}
          </Paragraph>
        }
        extra={[
          <Button key="requests" type="primary" onClick={() => navigate("/dashboard/user/requests")}>
            Go to Requests
          </Button>,
        ]}
      />
    );
  }

  return (
    <Result
      status="error"
      title="Payment failed or cancelled"
      subTitle={
        <div>
          <Paragraph className="mb-0">
            {upload?.applicationId ? (
              <>
                Your order <Text strong>{upload.applicationId}</Text> is saved, but payment is not
                completed.
              </>
            ) : (
              "Your order may be created, but payment is not completed."
            )}
          </Paragraph>
          <Paragraph className="mb-0">
            <Text type="secondary">If you believe this is wrong, wait a moment and refresh.</Text>
          </Paragraph>
        </div>
      }
      extra={[
        <div key="actions" className="flex flex-col items-center gap-3 w-full">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button type="primary" onClick={() => navigate("/dashboard/user")}>
              Go Home
            </Button>
            <Button onClick={() => navigate("/dashboard/user/requests")}>Go to Requests</Button>
            {uploadId && (
              <Button onClick={refresh} disabled={loading}>
                Refresh
              </Button>
            )}
          </div>
          {uploadId && upload && (
            <SketchPaymentRetryButton
              uploadId={uploadId}
              upload={upload}
              block
              className="max-w-xs"
            />
          )}
        </div>,
      ]}
    />
  );
}
