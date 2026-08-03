import React from "react";
import { formatOtpCountdown } from "../../hooks/useOtpCountdown.js";

/**
 * Multi-step forgot-password UI (presentational).
 * State and handlers live in LoginPage.
 */
export default function ForgotPasswordPanel({
  forgotStep,
  forgotPhone,
  setForgotPhone,
  forgotOtp,
  setForgotOtp,
  forgotNewPassword,
  setForgotNewPassword,
  forgotLoading,
  forgotOtpSecondsLeft,
  forgotMessage,
  forgotErrors,
  forgotErrorSummaryRef,
  onStart,
  onReset,
  onCancel,
}) {
  return (
    <div
      id="forgot-password-panel"
      role="region"
      aria-label="Forgot password"
      style={{
        border: "1px solid rgba(213,200,178,0.75)",
        borderRadius: "12px",
        padding: "14px",
        background: "rgba(255,255,255,0.52)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <p id="forgot-step-heading" style={{ margin: 0, fontSize: "12px", color: "var(--homepage-body-text)", fontWeight: 600 }}>
        {forgotStep === 1 ? "Forgot Password - Step 1: Send OTP" : "Forgot Password - Step 2: Verify OTP"}
      </p>

      {(Object.keys(forgotErrors).length > 0 || forgotMessage.type === "error") && (
        <div
          ref={forgotErrorSummaryRef}
          id="forgot-error-summary"
          className="auth-error-summary"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          style={{
            padding: "9px 11px",
            borderRadius: "8px",
            background: "rgba(192,57,43,0.08)",
            border: "1px solid rgba(192,57,43,0.25)",
            fontSize: "12px",
            color: "color-mix(in srgb, var(--danger) 88%, #000)",
          }}
        >
          {forgotMessage.type === "error" && forgotMessage.text
            ? forgotMessage.text
            : Object.values(forgotErrors).join(". ")}
        </div>
      )}

      <div>
        <label
          htmlFor="forgot-phone"
          style={{ fontSize: "12px", fontWeight: 700, color: "var(--homepage-label)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}
        >
          Phone Number
        </label>
        <input
          id="forgot-phone"
          name="forgot-phone"
          type="tel"
          value={forgotPhone}
          onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile number"
          className={`lp-input${forgotErrors.phone ? " error" : ""}`}
          maxLength={10}
          inputMode="numeric"
          autoComplete="tel"
          aria-required="true"
          aria-invalid={forgotErrors.phone ? "true" : "false"}
          aria-describedby={forgotErrors.phone ? "forgot-phone-error" : undefined}
          disabled={forgotLoading}
        />
        {forgotErrors.phone && (
          <p id="forgot-phone-error" role="alert" style={{ fontSize: "12px", color: "var(--danger)", margin: "5px 0 0" }}>
            {forgotErrors.phone}
          </p>
        )}
      </div>

      {forgotStep === 2 && (
        <>
          <div>
            <label
              htmlFor="forgot-otp"
              style={{ fontSize: "12px", fontWeight: 700, color: "var(--homepage-label)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}
            >
              One-time code (OTP)
            </label>
            <input
              id="forgot-otp"
              name="otp"
              type="text"
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className={`lp-input${forgotErrors.otp ? " error" : ""}`}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              aria-required="true"
              aria-invalid={forgotErrors.otp ? "true" : "false"}
              aria-describedby={[
                "forgot-otp-hint",
                forgotErrors.otp ? "forgot-otp-error" : null,
                forgotOtpSecondsLeft === 0 ? "forgot-otp-expired" : null,
              ].filter(Boolean).join(" ")}
              disabled={forgotLoading}
            />
            <p id="forgot-otp-hint" style={{ fontSize: "12px", color: "var(--homepage-label)", margin: "5px 0 0" }}>
              Enter the 6-digit code sent to your phone
            </p>
            {forgotErrors.otp && (
              <p id="forgot-otp-error" role="alert" style={{ fontSize: "12px", color: "var(--danger)", margin: "5px 0 0" }}>
                {forgotErrors.otp}
              </p>
            )}
            {forgotOtpSecondsLeft > 0 && (
              <p style={{ fontSize: "12px", color: "rgba(107,90,58,.65)", margin: "5px 0 0" }} aria-live="polite">
                OTP expires in <strong>{formatOtpCountdown(forgotOtpSecondsLeft)}</strong>
              </p>
            )}
            {forgotOtpSecondsLeft === 0 && (
              <p id="forgot-otp-expired" role="alert" style={{ fontSize: "12px", color: "var(--danger)", margin: "5px 0 0" }}>
                OTP expired. Send a new OTP to continue.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="forgot-new-password"
              style={{ fontSize: "12px", fontWeight: 700, color: "var(--homepage-label)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}
            >
              New Password
            </label>
            <input
              id="forgot-new-password"
              name="new-password"
              type="password"
              value={forgotNewPassword}
              onChange={(e) => setForgotNewPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className={`lp-input${forgotErrors.password ? " error" : ""}`}
              inputMode="numeric"
              maxLength={4}
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={forgotErrors.password ? "true" : "false"}
              aria-describedby={[
                "forgot-new-password-hint",
                forgotErrors.password ? "forgot-new-password-error" : null,
              ].filter(Boolean).join(" ")}
              disabled={forgotLoading}
            />
            <p id="forgot-new-password-hint" style={{ fontSize: "12px", color: "var(--homepage-label)", margin: "5px 0 0" }}>
              New 4-digit numeric password
            </p>
            {forgotErrors.password && (
              <p id="forgot-new-password-error" role="alert" style={{ fontSize: "12px", color: "var(--danger)", margin: "5px 0 0" }}>
                {forgotErrors.password}
              </p>
            )}
          </div>
        </>
      )}

      {forgotMessage.type === "success" && forgotMessage.text && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: "9px 11px",
            borderRadius: "8px",
            background: "rgba(42,110,42,0.08)",
            border: "1px solid rgba(42,110,42,0.25)",
            fontSize: "12px",
            color: "var(--success)",
          }}
        >
          {forgotMessage.text}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {forgotStep === 1 ? (
          <button
            type="button"
            className="submit-btn"
            disabled={forgotLoading}
            aria-busy={forgotLoading}
            aria-describedby={forgotLoading ? "forgot-loading-status" : undefined}
            onClick={onStart}
            style={{ padding: "10px", fontSize: "13px" }}
          >
            {forgotLoading ? "Sending OTP..." : "Send OTP"}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="submit-btn"
              disabled={forgotLoading || forgotOtpSecondsLeft === 0}
              aria-busy={forgotLoading}
              title={forgotOtpSecondsLeft === 0 ? "OTP expired — resend a new code first" : undefined}
              onClick={onReset}
              style={{ padding: "10px", fontSize: "13px", flex: 1 }}
            >
              {forgotLoading ? "Resetting..." : "Verify OTP & Reset"}
            </button>
            <button
              type="button"
              className="submit-btn"
              disabled={forgotLoading}
              aria-busy={forgotLoading}
              onClick={onStart}
              style={{ padding: "10px", fontSize: "13px", flex: 1 }}
            >
              {forgotLoading ? "Sending..." : "Resend OTP"}
            </button>
          </>
        )}

        {forgotLoading && (
          <span id="forgot-loading-status" className="sr-only">Please wait</span>
        )}

        <button
          type="button"
          onClick={onCancel}
          style={{
            border: "1px solid rgba(213,200,178,0.8)",
            borderRadius: "10px",
            padding: "10px 12px",
            background: "rgba(255,255,255,0.65)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--homepage-body-text)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
