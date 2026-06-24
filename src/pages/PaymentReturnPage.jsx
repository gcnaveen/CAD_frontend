import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Result, Spin, Typography, message } from "antd";
import SketchPaymentRetryButton from "../components/payments/SketchPaymentRetryButton.jsx";
import { getSketchUploadById } from "../services/surveyor/sketchUploadService";
import {
  clearSketchPaymentContext,
  isSketchPaymentCompleted,
  normalizeSketchPaymentPageState,
  readSketchPaymentContext,
} from "../utils/sketchPaymentUtils";

const { Paragraph, Text } = Typography;

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 12;

export default function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [upload, setUpload] = useState(null);
  const [state, setState] = useState("pending"); // success | pending | failed | unknown
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef(null);

  const lastPayment = useMemo(() => readSketchPaymentContext(), []);

  const uploadId = useMemo(() => {
    const fromQuery = searchParams.get("uploadId");
    if (fromQuery && String(fromQuery).trim()) return String(fromQuery).trim();
    return lastPayment?.uploadId || null;
  }, [searchParams, lastPayment?.uploadId]);

  const querySummary = useMemo(() => {
    const keys = ["code", "status", "success", "merchantOrderId", "transactionId", "providerReferenceId"];
    const obj = {};
    keys.forEach((k) => {
      const v = searchParams.get(k);
      if (v) obj[k] = v;
    });
    return obj;
  }, [searchParams]);

  const applyUploadState = useCallback((data) => {
    setUpload(data);
    const nextState = normalizeSketchPaymentPageState(data);
    setState(nextState);
    if (nextState === "success") {
      clearSketchPaymentContext();
    }
    return nextState;
  }, []);

  const refresh = useCallback(async () => {
    if (!uploadId) {
      setUpload(null);
      setState("unknown");
      setLoading(false);
      return "unknown";
    }

    setLoading(true);
    try {
      const res = await getSketchUploadById(uploadId);
      if (!res?.success) throw new Error(res?.message || "Failed to fetch order status");
      return applyUploadState(res.data);
    } catch (e) {
      message.error(e?.message || "Failed to refresh payment status");
      setState("unknown");
      return "unknown";
    } finally {
      setLoading(false);
    }
  }, [uploadId, applyUploadState]);

  useEffect(() => {
    let cancelled = false;

    const startPolling = async () => {
      const initialState = await refresh();
      if (cancelled || initialState === "success" || initialState === "failed" || !uploadId) {
        return;
      }

      pollAttemptsRef.current = 0;
      pollTimerRef.current = setInterval(async () => {
        if (cancelled) return;
        pollAttemptsRef.current += 1;

        try {
          const res = await getSketchUploadById(uploadId);
          if (!res?.success || !res?.data) return;

          if (isSketchPaymentCompleted(res.data)) {
            applyUploadState(res.data);
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            return;
          }

          if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
            applyUploadState(res.data);
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          }
        } catch {
          if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS && pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
          }
        }
      }, POLL_INTERVAL_MS);
    };

    startPolling();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [uploadId, refresh, applyUploadState]);

  const retrySection =
    uploadId && upload ? (
      <SketchPaymentRetryButton
        uploadId={uploadId}
        upload={upload}
        block
        className="mt-4 max-w-xs mx-auto"
      />
    ) : null;

  const primaryActions = (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap gap-2 justify-center">
        <Button type="primary" onClick={() => navigate("/dashboard/user/requests")}>
          Go to Requests
        </Button>
        <Button onClick={refresh} disabled={loading}>
          Refresh Status
        </Button>
      </div>
      {retrySection}
    </div>
  );

  if (loading && !upload) {
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
              Your order is saved as <Text strong>{upload?.applicationId || "—"}</Text>, but payment
              is not completed.
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
        subTitle={
          <div>
            <Paragraph className="mb-0">
              If you just paid, the status can take a few seconds to update. We are checking
              automatically.
            </Paragraph>
            {upload?.applicationId && (
              <Paragraph className="mb-0">
                <Text strong>Application ID:</Text> {upload.applicationId}
              </Paragraph>
            )}
          </div>
        }
        extra={primaryActions}
      />
    );
  }

  return (
    <Result
      status="warning"
      title="Unable to confirm payment status"
      subTitle="If payment was completed, it may still update shortly. Otherwise, retry payment below or open Requests."
      extra={primaryActions}
    />
  );
}
