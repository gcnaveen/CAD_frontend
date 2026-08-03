import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import {
  userLogin,
  surveyorForgotPasswordStart,
  surveyorForgotPasswordReset,
} from "../services/user/userService";
import { extractAccessToken } from "../utils/authToken.js";
import {
  useOtpCountdown,
  defaultOtpExpiresAt,
} from "../hooks/useOtpCountdown.js";
import { formatOtpSendError } from "../utils/otpErrorMessage.js";
import { Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import InstallButton from "../components/pwa/InstallButton.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import KarnatakaOutlineDecor from "../components/KarnatakaOutlineDecor.jsx";
import { getRedirectForRole } from "../utils/authRedirect.js";
import LoginBrandHeader from "./login/LoginBrandHeader.jsx";
import ForgotPasswordPanel from "./login/ForgotPasswordPanel.jsx";

const Crosshair = ({ size = 20, opacity = 0.18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity, color: "var(--brand-gold)" }}>
    <line x1="10" y1="0" x2="10" y2="7" />
    <line x1="10" y1="13" x2="10" y2="20" />
    <line x1="0" y1="10" x2="7" y2="10" />
    <line x1="13" y1="10" x2="20" y2="10" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotOtpExpiresAt, setForgotOtpExpiresAt] = useState(null);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const forgotOtpSecondsLeft = useOtpCountdown(forgotOtpExpiresAt);
  const [forgotMessage, setForgotMessage] = useState({ type: "", text: "" });
  const [forgotErrors, setForgotErrors] = useState({});
  const errorSummaryRef = useRef(null);
  const forgotErrorSummaryRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setPassword("");
    setForgotNewPassword("");
    setForgotOtp("");
    const t = setTimeout(() => setMounted(true), 60);
    return () => {
      clearTimeout(t);
      setPassword("");
      setForgotNewPassword("");
      setForgotOtp("");
    };
  }, []);

  const announceFieldErrors = (nextErrors) => {
    setErrors(nextErrors);
    requestAnimationFrame(() => errorSummaryRef.current?.focus());
  };

  const announceForgotErrors = (nextErrors) => {
    setForgotErrors(nextErrors);
    requestAnimationFrame(() => forgotErrorSummaryRef.current?.focus());
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setErrors({});
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "").slice(0, 10))) {
      announceFieldErrors({ phone: "Phone number must be exactly 10 digits" });
      return;
    }
    if (!password) {
      announceFieldErrors({ password: "Password is required" });
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      announceFieldErrors({ password: "Password must be exactly 4 digits" });
      return;
    }
    setIsLoading(true);
    try {
      const payload = { phone: phone.replace(/\D/g, "").slice(0, 10), password };
      const response = await userLogin(payload);
      const body = response?.data ?? response;
      const data = body?.data ?? body;
      const token = extractAccessToken(data) ?? extractAccessToken(body);
      const userPayload = data?.user ?? data;
      const user = userPayload ?? (data?.name != null || data?.email != null ? data : null);
      if (!token) {
        setMessage({
          type: "error",
          text: "Login succeeded but no access token was returned. Please try again.",
        });
        requestAnimationFrame(() => errorSummaryRef.current?.focus());
        return;
      }
      dispatch(setCredentials({ token, accessToken: token, user }));
      const role = user?.role ?? data?.role ?? body?.role;
      setPassword("");
      setMessage({ type: "success", text: "Login successful. Redirecting…" });
      navigate(getRedirectForRole(role), { replace: true });
    } catch (err) {
      setMessage({ type: "error", text: err?.message ?? "Login failed. Please try again." });
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotStep(1);
    setForgotPhone(phone.replace(/\D/g, "").slice(0, 10));
    setForgotOtp("");
    setForgotOtpExpiresAt(null);
    setForgotNewPassword("");
    setForgotMessage({ type: "", text: "" });
    setForgotErrors({});
  };

  const handleForgotPasswordStart = async () => {
    const cleanedPhone = forgotPhone.replace(/\D/g, "").slice(0, 10);
    setForgotErrors({});
    setForgotMessage({ type: "", text: "" });

    if (!/^\d{10}$/.test(cleanedPhone)) {
      announceForgotErrors({ phone: "Please enter a valid 10-digit phone number" });
      return;
    }

    setForgotLoading(true);
    try {
      const result = await surveyorForgotPasswordStart({ phone: cleanedPhone });
      setForgotPhone(cleanedPhone);
      setForgotOtp("");
      setForgotOtpExpiresAt(result?.expiresAt ?? defaultOtpExpiresAt());
      setForgotStep(2);
      setForgotMessage({
        type: "success",
        text: result?.message ?? "OTP sent to your mobile.",
      });
    } catch (err) {
      setForgotMessage({
        type: "error",
        text: formatOtpSendError(err, "Failed to send OTP. Please try again."),
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotPasswordReset = async () => {
    const cleanedPhone = forgotPhone.replace(/\D/g, "").slice(0, 10);
    const cleanedOtp = forgotOtp.replace(/\D/g, "").slice(0, 6);
    const cleanedPassword = forgotNewPassword.replace(/\D/g, "").slice(0, 4);
    const nextErrors = {};
    setForgotMessage({ type: "", text: "" });

    if (!/^\d{10}$/.test(cleanedPhone)) nextErrors.phone = "Please enter a valid 10-digit phone number";
    if (!/^\d{6}$/.test(cleanedOtp)) nextErrors.otp = "OTP must be exactly 6 digits";
    if (!/^\d{4}$/.test(cleanedPassword)) nextErrors.password = "Password must be exactly 4 digits";
    if (Object.keys(nextErrors).length) {
      announceForgotErrors(nextErrors);
      return;
    }

    setForgotLoading(true);
    setForgotErrors({});
    try {
      const result = await surveyorForgotPasswordReset({
        phone: cleanedPhone,
        otp: cleanedOtp,
        password: cleanedPassword,
      });
      const token = extractAccessToken(result);
      const user = result?.user;
      setShowForgotPassword(false);
      setForgotStep(1);
      setForgotOtp("");
      setForgotOtpExpiresAt(null);
      setForgotNewPassword("");
      if (token) {
        dispatch(setCredentials({ token, accessToken: token, user }));
        setPassword("");
        setMessage({ type: "success", text: "Password reset successful. Redirecting…" });
        navigate(getRedirectForRole(user?.role), { replace: true });
      } else {
        setPassword("");
        setPhone(cleanedPhone);
        setMessage({
          type: "success",
          text: "Password reset successful. Please login with your new password.",
        });
      }
    } catch (err) {
      setForgotMessage({
        type: "error",
        text: err?.message ?? "Failed to reset password. Please try again.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCancelForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotOtp("");
    setForgotOtpExpiresAt(null);
    setForgotNewPassword("");
    setForgotMessage({ type: "", text: "" });
    setForgotErrors({});
  };

  return (
    <div className="theme-animate-surface auth-page" style={{
      minHeight: "100vh",
      background: "var(--homepage-gradient)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "clamp(16px, 4vw, 32px)",
      position: "relative", overflow: "hidden",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "var(--text-primary)",
    }}>
      <div
        style={{
          position: "absolute",
          top: "max(16px, env(safe-area-inset-top))",
          right: "max(16px, env(safe-area-inset-right))",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <ThemeToggle variant="compact" />
        <InstallButton
          size="middle"
          showLabel={false}
          style={{
            borderColor: "color-mix(in srgb, var(--brand-green) 35%, var(--border-color))",
            color: "var(--brand-green)",
            background: "color-mix(in srgb, var(--bg-elevated) 78%, transparent)",
            backdropFilter: "blur(8px)",
          }}
        />
      </div>
      <style>{`
        @keyframes ping { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logo-in {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-input {
          width: 100%;
          background: color-mix(in srgb, var(--bg-elevated) 65%, transparent);
          border: 1.5px solid var(--homepage-cream-border);
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 14.5px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-sizing: border-box;
          backdrop-filter: blur(4px);
        }
        .lp-phone-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 13px 14px;
          font-size: 14.5px;
          color: var(--text-primary);
        }
        /* iOS zooms text inputs below 16px, so bump them up on phones. */
        @media (max-width: 768px) {
          .lp-input,
          .lp-phone-input {
            font-size: 16px;
          }
        }
        .lp-input::placeholder { color: color-mix(in srgb, var(--text-secondary) 55%, transparent); }
        .lp-input:focus,
        .lp-input:focus-visible {
          border-color: color-mix(in srgb, var(--brand-gold) 65%, var(--border-color));
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-gold) 18%, transparent);
          background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
        }
        .lp-input.error {
          border-color: color-mix(in srgb, var(--danger) 55%, var(--border-color));
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 12%, transparent);
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 13px;
          background: linear-gradient(135deg, var(--homepage-cta-bg) 0%, color-mix(in srgb, var(--homepage-cta-bg) 80%, var(--accent-color)) 100%);
          color: var(--homepage-cta-fg);
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.04em;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 28px var(--homepage-card-shadow);
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, color-mix(in srgb, var(--brand-gold) 12%, transparent) 100%);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .submit-btn:hover:not(:disabled) {
          filter: brightness(1.05);
          box-shadow: 0 12px 36px var(--homepage-card-shadow);
          transform: translateY(-1px);
        }
        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .submit-btn:focus-visible,
        .mode-toggle-btn:focus-visible,
        .auth-input-eye:focus-visible,
        a:focus-visible,
        button:focus-visible {
          outline: 2px solid var(--brand-gold);
          outline-offset: 2px;
        }
        .auth-error-summary:focus {
          outline: 2px solid var(--danger);
          outline-offset: 2px;
        }
        .mode-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--brand-gold-muted);
          transition: color 0.2s ease;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.01em;
        }
        .mode-toggle-btn:hover { color: var(--brand-gold); }
        .coord-label {
          font-family: monospace;
          font-size: 10px;
          color: color-mix(in srgb, var(--brand-gold-muted) 40%, transparent);
          letter-spacing: 0.1em;
          position: absolute;
          pointer-events: none;
          user-select: none;
        }
      `}</style>

      {/* ── BACKGROUND DECORATIONS ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
        <div style={{
          position: "absolute", top: "-120px", left: "-100px",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.13) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-80px", right: "-80px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(21,40,21,0.08) 0%, transparent 65%)",
        }} />

        <KarnatakaOutlineDecor variant="auth" />

        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.055) 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
        }} />

        <div style={{ position: "absolute", top: "28px", left: "28px" }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position: "absolute", top: "28px", right: "28px" }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position: "absolute", bottom: "28px", left: "28px" }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position: "absolute", bottom: "28px", right: "28px" }}><Crosshair size={22} opacity={0.22} /></div>

        <span className="coord-label" style={{ top: "18px", left: "56px" }}>12.97°N 77.59°E</span>
        <span className="coord-label" style={{ top: "18px", right: "56px" }}>KARNATAKA · INDIA</span>
        <span className="coord-label" style={{ bottom: "18px", left: "56px" }}>NORTH-COT · PLATFORM</span>
        <span className="coord-label" style={{ bottom: "18px", right: "56px" }}>SURVEY · CAD · QC</span>

        {[
          { top: "18%", left: "8%", size: 16, op: 0.12 },
          { top: "60%", left: "5%", size: 14, op: 0.10 },
          { top: "30%", right: "7%", size: 16, op: 0.12 },
          { top: "70%", right: "6%", size: 14, op: 0.10 },
          { top: "45%", left: "14%", size: 12, op: 0.09 },
          { top: "45%", right: "14%", size: 12, op: 0.09 },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos }}>
            <Crosshair size={pos.size} opacity={pos.op} />
          </div>
        ))}

        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.12) 20%, rgba(201,168,76,0.12) 80%, transparent 100%)",
        }} />
      </div>

      {/* ── MAIN CARD ── */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: "440px",
        animation: mounted ? "card-in 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
        opacity: mounted ? undefined : 0,
      }}>

        <LoginBrandHeader mounted={mounted} onHomeClick={() => navigate("/")} />

        {/* ── FORM CARD ── */}
        <div className="auth-form-card" style={{
          background: "rgba(255,255,255,0.68)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(232,226,216,0.9)",
          borderRadius: "24px",
          padding: "clamp(24px, 5vw, 36px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(201,168,76,0.10), 0 0 0 1px rgba(201,168,76,0.08)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: "linear-gradient(90deg, transparent, var(--brand-gold) 30%, var(--brand-gold) 70%, transparent)",
          }} />

          <div style={{ marginBottom: "24px" }}>
            <h1 className="auth-card-title" style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic", fontWeight: 600,
              fontSize: "clamp(20px, 3vw, 26px)", color: "var(--brand-green-deep)",
              lineHeight: 1.2, marginBottom: "6px",
            }}>
              Welcome Back
            </h1>
            <p className="auth-subtitle" style={{ fontSize: "13px", color: "var(--homepage-body-text)", lineHeight: 1.5 }}>
              Sign in with your phone number and password
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {(Object.keys(errors).length > 0 || message.type === "error") && (
                <div
                  ref={errorSummaryRef}
                  id="login-error-summary"
                  className="auth-error-summary"
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                  style={{
                    padding: "11px 14px",
                    borderRadius: "10px",
                    background: "rgba(192,57,43,0.08)",
                    border: "1px solid rgba(192,57,43,0.25)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "color-mix(in srgb, var(--danger) 88%, #000)",
                  }}
                >
                  {message.type === "error" && message.text ? (
                    <p style={{ margin: 0 }}>{message.text}</p>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Please fix the following:</p>
                      <ul style={{ margin: 0, paddingLeft: "18px" }}>
                        {errors.phone && (
                          <li><a href="#login-phone" style={{ color: "inherit" }}>{errors.phone}</a></li>
                        )}
                        {errors.password && (
                          <li><a href="#login-password" style={{ color: "inherit" }}>{errors.password}</a></li>
                        )}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {message.type === "success" && message.text && (
                <div
                  role="status"
                  aria-live="polite"
                  className="auth-message auth-message--success"
                  style={{
                    padding: "11px 14px", borderRadius: "10px",
                    background: "rgba(42,110,42,0.08)",
                    border: "1px solid rgba(42,110,42,0.25)",
                    fontSize: "13px", fontWeight: 500,
                    color: "var(--success)",
                  }}
                >
                  {message.text}
                </div>
              )}

              <div>
                <label
                  htmlFor="login-phone"
                  style={{ fontSize: "12px", fontWeight: 700, color: "var(--homepage-label)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}
                >
                  Phone Number
                </label>
                <div
                  className="auth-phone-row"
                  style={{
                    display: "flex", gap: 0, borderRadius: "12px", overflow: "hidden",
                    border: `1.5px solid ${errors.phone ? "rgba(220,80,60,.6)" : "rgba(213,200,178,0.8)"}`,
                    background: "rgba(255,255,255,0.6)",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = errors.phone ? "rgba(220,80,60,.6)" : "rgba(213,200,178,0.8)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span
                    id="login-phone-country"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 14px", fontSize: "14px", fontWeight: 700,
                      color: "var(--brand-gold-muted)", background: "rgba(201,168,76,0.08)",
                      borderRight: "1.5px solid rgba(213,200,178,0.7)",
                      minWidth: "54px", flexShrink: 0,
                    }}
                  >
                    +91
                  </span>
                  <input
                    id="login-phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    aria-required="true"
                    aria-invalid={errors.phone ? "true" : "false"}
                    aria-describedby={[
                      "login-phone-country",
                      "login-phone-hint",
                      errors.phone ? "login-phone-error" : null,
                    ].filter(Boolean).join(" ")}
                    disabled={isLoading}
                    className="lp-phone-input"
                  />
                </div>
                <p id="login-phone-hint" style={{ fontSize: "12px", color: "var(--homepage-label)", margin: "5px 0 0" }}>
                  Indian mobile number without country code
                </p>
                {errors.phone && (
                  <p id="login-phone-error" role="alert" style={{ fontSize: "12px", color: "var(--danger)", marginTop: "5px" }}>
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  style={{ fontSize: "12px", fontWeight: 700, color: "var(--homepage-label)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className={`lp-input${errors.password ? " error" : ""}`}
                    style={{ paddingRight: "46px" }}
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="current-password"
                    aria-required="true"
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={[
                      "login-password-hint",
                      errors.password ? "login-password-error" : null,
                    ].filter(Boolean).join(" ")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    style={{
                      position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(100,90,70,0.5)", padding: "4px",
                      transition: "color 0.2s ease",
                    }}
                    className="auth-input-eye"
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--brand-gold-muted)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(100,90,70,0.5)"; }}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
                <p id="login-password-hint" style={{ fontSize: "12px", color: "var(--homepage-label)", margin: "5px 0 0" }}>
                  4-digit numeric password
                </p>
                {errors.password && (
                  <p id="login-password-error" role="alert" style={{ fontSize: "12px", color: "var(--danger)", marginTop: "5px" }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="mode-toggle-btn"
                  style={{ fontSize: "12px" }}
                  aria-expanded={showForgotPassword}
                  aria-controls="forgot-password-panel"
                >
                  Forgot Password?
                </button>
              </div>

              {showForgotPassword && (
                <ForgotPasswordPanel
                  forgotStep={forgotStep}
                  forgotPhone={forgotPhone}
                  setForgotPhone={setForgotPhone}
                  forgotOtp={forgotOtp}
                  setForgotOtp={setForgotOtp}
                  forgotNewPassword={forgotNewPassword}
                  setForgotNewPassword={setForgotNewPassword}
                  forgotLoading={forgotLoading}
                  forgotOtpSecondsLeft={forgotOtpSecondsLeft}
                  forgotMessage={forgotMessage}
                  forgotErrors={forgotErrors}
                  forgotErrorSummaryRef={forgotErrorSummaryRef}
                  onStart={handleForgotPasswordStart}
                  onReset={handleForgotPasswordReset}
                  onCancel={handleCancelForgotPassword}
                />
              )}

              {isLoading && (
                <p id="login-submit-status" className="sr-only" aria-live="polite">
                  Signing in, please wait
                </p>
              )}

              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
                aria-busy={isLoading}
                aria-describedby={isLoading ? "login-submit-status" : undefined}
              >
                {isLoading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="auth-footer-line" style={{ textAlign: "center", fontSize: "13px", color: "var(--homepage-body-text)", margin: 0 }}>
                Don't have an account?{" "}
                <a href="/register" style={{
                  color: "var(--brand-gold-muted)", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "2px",
                  transition: "color 0.2s ease",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--brand-gold)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--brand-gold-muted)"; }}
                >
                  Register here
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="auth-below-card" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          marginTop: "20px",
        }}>
          <Shield size={12} color="var(--homepage-label)" aria-hidden="true" />
          <span className="auth-below-muted" style={{ fontSize: "11px", color: "var(--homepage-label)", fontWeight: 500, letterSpacing: "0.04em" }}>
            Protected by industry-standard encryption
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
