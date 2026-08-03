import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { Button, Result, Spin, Typography } from "antd";
import { getSketchUploadById } from "../services/surveyor/sketchUploadService.js";
import {
  clearSketchPaymentContext,
  isBalancePaymentCompleted,
  isCadBalancePaymentPurpose,
  isSketchPaymentCompleted,
  readSketchPaymentContext,
  resolveSketchPaymentUploadId,
} from "../utils/sketchPaymentUtils.js";
import { getSketchStatusLabel } from "../utils/lifecycleQc.js";

const { Paragraph, Text } = Typography;

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 12;

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [confettiActive, setConfettiActive] = useState(false);
  const [Confetti, setConfetti] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upload, setUpload] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pollExhausted, setPollExhausted] = useState(false);
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef(null);

  const uploadId = useMemo(
    () => resolveSketchPaymentUploadId(searchParams, location.state),
    [searchParams, location.state]
  );

  useEffect(() => {
    let cancelled = false;
    import("react-confetti").then((mod) => {
      if (!cancelled) setConfetti(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      setLoading(false);
      return false;
    }

    try {
      const res = await getSketchUploadById(uploadId);
      if (!res?.success || !res?.data) return false;
      setUpload(res.data);
      const completed = isBalanceCheckout
        ? isBalancePaymentCompleted(res.data)
        : isSketchPaymentCompleted(res.data);
      if (completed) {
        setConfirmed(true);
        clearSketchPaymentContext();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [uploadId, isBalanceCheckout]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Confetti only after server confirms paid — browser redirect alone is not success (§4.1 / 27–28).
  useEffect(() => {
    if (!confirmed) {
      setConfettiActive(false);
      return undefined;
    }
    setConfettiActive(true);
    const confettiTimer = setTimeout(() => setConfettiActive(false), 4000);
    return () => clearTimeout(confettiTimer);
  }, [confirmed]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const done = await refresh();
      if (cancelled || done || !uploadId) return;

      pollAttemptsRef.current = 0;
      pollTimerRef.current = setInterval(async () => {
        if (cancelled) return;
        pollAttemptsRef.current += 1;

        const completed = await refresh();
        if (completed || pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          if (!completed) setPollExhausted(true);
        }
      }, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [uploadId, refresh]);

  useEffect(() => {
    if (!confirmed) return undefined;
    const redirectTimer = setTimeout(
      () =>
        navigate("/dashboard/user/requests", {
          state: uploadId ? { openOrderId: uploadId } : undefined,
        }),
      5000
    );
    return () => clearTimeout(redirectTimer);
  }, [confirmed, navigate, uploadId]);

  if (loading && uploadId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spin tip="Confirming payment with server..." />
      </div>
    );
  }

  const goRequests = () =>
    navigate("/dashboard/user/requests", {
      state: uploadId ? { openOrderId: uploadId } : undefined,
    });

  if (!uploadId) {
    return (
      <Result
        status="info"
        title="Payment return"
        subTitle="Missing order reference. Open your request from the dashboard to check payment status."
        extra={[
          <Button key="requests" type="primary" onClick={goRequests}>
            Go to Requests
          </Button>,
          <Button key="home" onClick={() => navigate("/dashboard/user")}>
            Go Home
          </Button>,
        ]}
      />
    );
  }

  if (!confirmed) {
    return (
      <Result
        status={pollExhausted ? "warning" : "info"}
        title={
          pollExhausted
            ? "Payment confirmation still pending"
            : "Confirming your payment"
        }
        subTitle={
          <div>
            <Paragraph className="mb-0">
              {pollExhausted
                ? "We have not received server confirmation yet. Your order is only marked paid after PhonePe status matches the expected amount — this page alone does not unlock the order."
                : "Waiting for server-to-server confirmation. Do not close this page."}
            </Paragraph>
            {upload?.applicationId && (
              <Paragraph className="mb-0">
                <Text strong>Application ID:</Text> {upload.applicationId}
              </Paragraph>
            )}
            {upload?.status && (
              <Paragraph className="mb-0">
                <Text strong>Order status:</Text>{" "}
                {getSketchStatusLabel(upload.status) || upload.status}
              </Paragraph>
            )}
            {!pollExhausted && (
              <Paragraph className="mb-0" style={{ marginTop: 8 }}>
                <Spin size="small" />{" "}
                <Text type="secondary">Polling payment status…</Text>
              </Paragraph>
            )}
          </div>
        }
        extra={[
          <Button key="refresh" type="primary" onClick={() => refresh()}>
            Refresh status
          </Button>,
          <Button key="requests" onClick={goRequests}>
            Go to Requests
          </Button>,
        ]}
      />
    );
  }

  return (
    <>
      {Confetti ? (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          run={confettiActive}
          recycle={confettiActive}
          numberOfPieces={confettiActive ? 200 : 0}
          gravity={0.15}
          tweenDuration={4000}
        />
      ) : null}
      <Result
        status="success"
        title={isBalanceCheckout ? "Balance payment confirmed" : "Payment confirmed"}
        subTitle={
          <div>
            <Paragraph className="mb-0">
              {isBalanceCheckout
                ? "CAD download is unlocked. You can download files from the order details."
                : "Your payment was confirmed by the server. You can track your request from the dashboard."}
            </Paragraph>
            {upload?.applicationId && (
              <Paragraph className="mb-0">
                <Text strong>Application ID:</Text> {upload.applicationId}
              </Paragraph>
            )}
            {upload?.status && (
              <Paragraph className="mb-0">
                <Text strong>Order status:</Text>{" "}
                {getSketchStatusLabel(upload.status) || upload.status}
              </Paragraph>
            )}
            <Paragraph className="mb-0" style={{ marginTop: 8 }}>
              <Text type="secondary">Taking you to Requests in 5 seconds…</Text>
            </Paragraph>
          </div>
        }
        extra={[
          <Button key="requests" type="primary" onClick={goRequests}>
            Go to Requests
          </Button>,
          <Button key="home" onClick={() => navigate("/dashboard/user")}>
            Go Home
          </Button>,
        ]}
      />
    </>
  );
}
