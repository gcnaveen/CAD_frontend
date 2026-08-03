import { useEffect, useState } from "react";

export function formatOtpCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Counts down to expiresAt (ISO string). Returns seconds remaining.
 */
export function useOtpCountdown(expiresAt) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) {
      return undefined;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    // Defer initial tick so setState is not synchronous in the effect body.
    queueMicrotask(tick);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return expiresAt ? secondsLeft : 0;
}

export const OTP_VALIDITY_MS = 10 * 60 * 1000;

export function defaultOtpExpiresAt() {
  return new Date(Date.now() + OTP_VALIDITY_MS).toISOString();
}
