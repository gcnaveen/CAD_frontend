import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { Button, Result, Spin, Typography, message } from "antd";
import SketchPaymentRetryButton from "../components/payments/SketchPaymentRetryButton.jsx";
import { getSketchUploadById } from "../services/surveyor/sketchUploadService.js";
import {
  isCadBalancePaymentPurpose,
  normalizeSketchPaymentPageState,
  readSketchPaymentContext,
  resolveSketchPaymentUploadId,
} from "../utils/sketchPaymentUtils.js";

const { Paragraph, Text } = Typography;

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [upload, setUpload] = useState(null);

  const uploadId = useMemo(
    () => resolveSketchPaymentUploadId(searchParams, location.state),
    [searchParams, location.state]
  );

  const paymentPurpose = useMemo(
    () =>
      searchParams.get("purpose") ||
      location.state?.purpose ||
      readSketchPaymentContext()?.purpose ||
      null,
    [searchParams, location.state]
  );

  const isBalanceCheckout = isCadBalancePaymentPurpose(paymentPurpose);

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

  const paymentState = upload ? normalizeSketchPaymentPageState(upload, paymentPurpose) : null;

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
        title={isBalanceCheckout ? "Balance payment already completed" : "Payment already completed"}
        subTitle={
          <Paragraph className="mb-0">
            <Text strong>Application ID:</Text> {upload?.applicationId || "—"}
          </Paragraph>
        }
        extra={[
          <Button
            key="requests"
            type="primary"
            onClick={() =>
              navigate("/dashboard/user/requests", {
                state: uploadId ? { openOrderId: uploadId } : undefined,
              })
            }
          >
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
            <Text type="secondary">
              {isBalanceCheckout
                ? "Open the order and retry balance payment to unlock CAD download."
                : "If you believe this is wrong, wait a moment and refresh."}
            </Text>
          </Paragraph>
        </div>
      }
      extra={[
        <div key="actions" className="flex flex-col items-center gap-3 w-full">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button type="primary" onClick={() => navigate("/dashboard/user")}>
              Go Home
            </Button>
            <Button
              onClick={() =>
                navigate("/dashboard/user/requests", {
                  state: uploadId ? { openOrderId: uploadId } : undefined,
                })
              }
            >
              Go to Requests
            </Button>
            {uploadId && (
              <Button onClick={refresh} disabled={loading}>
                Refresh
              </Button>
            )}
          </div>
          {uploadId && upload && !isBalanceCheckout && (
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
