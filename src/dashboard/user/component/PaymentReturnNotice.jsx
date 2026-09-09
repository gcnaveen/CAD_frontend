import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  normalizePaymentOutcome,
  PAYMENT_QUERY_KEY,
} from "../../../utils/paymentReturnOutcome.js";

const COPY = {
  success: {
    title: "Payment received",
    body: "Your order will unlock once the server confirms the payment. This usually takes a few seconds.",
    tone: "accent",
  },
  failed: {
    title: "Payment cancelled or failed",
    body: "Your request is saved but not paid. Open it from Requests to retry payment.",
    tone: "danger",
  },
  unknown: {
    title: "Payment status unclear",
    body: "We could not read the payment result. Check the order in Requests for its current status.",
    tone: "danger",
  },
};

const TONE = {
  accent: {
    wrap: "border-(--user-accent)/40 bg-[color-mix(in_srgb,var(--user-accent)_10%,transparent)]",
    title: "text-(--user-accent)",
  },
  danger: {
    wrap: "border-danger/40 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]",
    title: "text-danger",
  },
};

/**
 * Shows the gateway outcome after the backend redirects to the dashboard with
 * `?payment=...`, then strips the param so a reload does not replay it.
 */
export default function PaymentReturnNotice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read on first render: the effect below strips the param, so deriving this
  // on every render would blank the notice as soon as the URL is cleaned.
  const [outcome, setOutcome] = useState(() =>
    normalizePaymentOutcome(searchParams.get(PAYMENT_QUERY_KEY))
  );

  useEffect(() => {
    if (!searchParams.has(PAYMENT_QUERY_KEY)) return;
    const next = new URLSearchParams(searchParams);
    next.delete(PAYMENT_QUERY_KEY);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  if (!outcome) return null;

  const copy = COPY[outcome];
  const tone = TONE[copy.tone];

  return (
    <div
      role="status"
      className={`mt-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${tone.wrap}`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-extrabold ${tone.title}`}>{copy.title}</p>
        <p className="text-xs font-semibold text-fg-muted">{copy.body}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => navigate("/dashboard/user/requests")}
          className="rounded-lg bg-(--user-accent) px-3 py-2 text-xs font-bold text-white hover:opacity-90"
        >
          View Requests
        </button>
        <button
          type="button"
          onClick={() => setOutcome(null)}
          className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-fg-muted hover:bg-(--bg-hover)"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
