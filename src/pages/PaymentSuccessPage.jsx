import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button, Result, Spin, Typography } from "antd";
import Confetti from "react-confetti";
import { getSketchUploadById } from "../services/surveyor/sketchUploadService.js";
import {
  clearSketchPaymentContext,
  isSketchPaymentCompleted,
  resolveSketchPaymentUploadId,
} from "../utils/sketchPaymentUtils.js";

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
  const [confettiActive, setConfettiActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [upload, setUpload] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef(null);

  const uploadId = useMemo(
    () => resolveSketchPaymentUploadId(searchParams, location.state),
    [searchParams, location.state]
  );

  const refresh = useCallback(async () => {
    if (!uploadId) {
      setLoading(false);
      return false;
    }

    try {
      const res = await getSketchUploadById(uploadId);
      if (!res?.success || !res?.data) return false;
      setUpload(res.data);
      if (isSketchPaymentCompleted(res.data)) {
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
  }, [uploadId]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    const confettiTimer = setTimeout(() => setConfettiActive(false), 4000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(confettiTimer);
    };
  }, []);

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
    const redirectTimer = setTimeout(() => navigate("/dashboard/user/requests"), 5000);
    return () => clearTimeout(redirectTimer);
  }, [confirmed, navigate]);

  if (loading && uploadId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spin tip="Confirming payment status..." />
      </div>
    );
  }

  return (
    <>
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        run={confettiActive}
        recycle={confettiActive}
        numberOfPieces={confettiActive ? 200 : 0}
        gravity={0.15}
        tweenDuration={4000}
      />
      <Result
        status="success"
        title="Payment successful"
        subTitle={
          <div>
            <Paragraph className="mb-0">
              Your payment was completed. You can track your request from the dashboard.
            </Paragraph>
            {upload?.applicationId && (
              <Paragraph className="mb-0">
                <Text strong>Application ID:</Text> {upload.applicationId}
              </Paragraph>
            )}
            {upload?.status && (
              <Paragraph className="mb-0">
                <Text strong>Order status:</Text> {upload.status}
              </Paragraph>
            )}
            {!confirmed && uploadId && (
              <Paragraph className="mb-0" style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Payment confirmation is still processing. Status will update shortly.
                </Text>
              </Paragraph>
            )}
            {confirmed && (
              <Paragraph className="mb-0" style={{ marginTop: 8 }}>
                <Text type="secondary">Taking you to Requests in 5 seconds…</Text>
              </Paragraph>
            )}
          </div>
        }
        extra={[
          <Button key="requests" type="primary" onClick={() => navigate("/dashboard/user/requests")}>
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
