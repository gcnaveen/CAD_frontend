import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Result, Spin, Typography, message } from "antd";
import { getSketchUploadById } from "../services/surveyor/sketchUploadService";

const { Paragraph, Text } = Typography;

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizePaymentState(upload) {
  const sketchPaymentStatus =
    upload?.sketchPayment?.status ||
    upload?.sketchPayment?.paymentStatus ||
    upload?.payment?.status ||
    null;

  const orderStatus = upload?.status || null;

  const combined = String(sketchPaymentStatus || orderStatus || "").toUpperCase();

  if (combined.includes("SUCCESS") || combined.includes("PAID") || combined.includes("COMPLETED")) {
    return "success";
  }
  if (combined.includes("FAIL") || combined.includes("DECLINED") || combined.includes("CANCEL")) {
    return "failed";
  }
  if (combined.includes("PENDING") || combined.includes("INIT") || combined.includes("PROCESS")) {
    return "pending";
  }
  return "unknown";
}

export default function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [upload, setUpload] = useState(null);
  const [state, setState] = useState("pending"); // success | pending | failed | unknown

  const lastPayment = useMemo(() => {
    const raw = localStorage.getItem("cad:lastPayment");
    return raw ? safeJsonParse(raw) : null;
  }, []);

  const querySummary = useMemo(() => {
    // PhonePe / PSPs can send different keys; keep it generic and useful for debugging.
    const keys = ["code", "status", "success", "merchantOrderId", "transactionId", "providerReferenceId"];
    const obj = {};
    keys.forEach((k) => {
      const v = searchParams.get(k);
      if (v) obj[k] = v;
    });
    return obj;
  }, [searchParams]);

  const refresh = async () => {
    const uploadId = lastPayment?.uploadId;
    if (!uploadId) {
      setUpload(null);
      setState("unknown");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getSketchUploadById(uploadId);
      if (!res?.success) throw new Error(res?.message || "Failed to fetch order status");
      setUpload(res.data);
      const nextState = normalizePaymentState(res.data);
      setState(nextState);

      if (nextState === "success") {
        try {
          localStorage.removeItem("cad:lastPayment");
        } catch {
          // ignore
        }
      }
    } catch (e) {
      message.error(e?.message || "Failed to refresh payment status");
      setState("unknown");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primaryActions = (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button type="primary" onClick={() => navigate("/dashboard/user/requests")}>
        Go to Requests
      </Button>
      <Button onClick={refresh} disabled={loading}>
        Refresh Status
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spin tip="Checking payment status..." />
      </div>
    );
  }

  if (state === "success") {
    return (
      <Result
        status="success"
        title="Payment successful"
        subTitle={
          <div>
            <Paragraph className="mb-0">
              <Text strong>Application ID:</Text> {upload?.applicationId || "—"}
            </Paragraph>
            <Paragraph className="mb-0">
              <Text strong>Order status:</Text> {upload?.status || "—"}
            </Paragraph>
          </div>
        }
        extra={primaryActions}
      />
    );
  }

  if (state === "failed") {
    return (
      <Result
        status="error"
        title="Payment failed or cancelled"
        subTitle={
          <div>
            <Paragraph className="mb-0">
              Your order is created, but payment is not completed. You can retry from the Requests page.
            </Paragraph>
            {Object.keys(querySummary).length > 0 && (
              <Paragraph className="mb-0">
                <Text strong>Payment response:</Text> <Text code>{JSON.stringify(querySummary)}</Text>
              </Paragraph>
            )}
          </div>
        }
        extra={primaryActions}
      />
    );
  }

  if (state === "pending") {
    return (
      <Result
        status="info"
        title="Payment pending"
        subTitle="If you just paid, the status can take a few seconds to update. Please refresh."
        extra={primaryActions}
      />
    );
  }

  return (
    <Result
      status="warning"
      title="Unable to confirm payment status"
      subTitle="If payment was completed, it may still update shortly. Otherwise, you can retry from Requests."
      extra={primaryActions}
    />
  );
}

