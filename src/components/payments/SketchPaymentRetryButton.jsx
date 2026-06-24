import React, { useState } from "react";
import { Button, Typography, message } from "antd";
import { retrySketchUploadPayment } from "../../services/surveyor/sketchUploadService.js";
import { getApiErrorMessage } from "../../utils/apiErrorMessage.js";
import {
  canRetrySketchPayment,
  formatSketchPayableRupees,
  redirectToSketchCheckout,
} from "../../utils/sketchPaymentUtils.js";

const { Text } = Typography;

/**
 * Retry initial sketch upload payment when upload is PAYMENT_PENDING and payment failed/abandoned.
 */
export default function SketchPaymentRetryButton({
  uploadId,
  upload,
  paymentMeta,
  size = "middle",
  block = false,
  showAmount = true,
  className = "",
}) {
  const [loading, setLoading] = useState(false);

  if (!uploadId || !canRetrySketchPayment(upload)) {
    return null;
  }

  const payableRupees = formatSketchPayableRupees(upload, paymentMeta);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const result = await retrySketchUploadPayment(uploadId);
      const payment = result?.meta?.payment;
      const id = result?.data?._id ?? result?.data?.id ?? uploadId;
      if (!redirectToSketchCheckout(payment, id)) {
        message.error("Payment is required but checkout URL is missing. Please try again.");
        return;
      }
      message.success(payment?.message || "Redirecting to payment…");
    } catch (error) {
      message.error(getApiErrorMessage(error, "Failed to retry payment"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {showAmount && payableRupees != null && (
        <Text type="secondary" className="block mb-2 text-sm">
          Amount due: <Text strong>₹{Number(payableRupees).toFixed(2)}</Text>
        </Text>
      )}
      <Button type="primary" size={size} block={block} loading={loading} onClick={handleRetry}>
        Retry payment
      </Button>
    </div>
  );
}
