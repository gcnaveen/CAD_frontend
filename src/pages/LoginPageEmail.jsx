import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { staffLogin } from "../services/auth/authService.js";
import { extractAccessToken } from "../utils/authToken.js";
import { Eye, EyeOff, ArrowRight, Mail, MapPin, Shield } from "lucide-react";
import InstallButton from "../components/pwa/InstallButton.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import KarnatakaOutlineDecor from "../components/KarnatakaOutlineDecor.jsx";
import { getRedirectForRole } from "../utils/authRedirect.js";

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Crosshair = ({ size = 20, opacity = 0.18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity, color: "var(--brand-gold)" }}>
    <line x1="10" y1="0" x2="10" y2="7" />
    <line x1="10" y1="13" x2="10" y2="20" />
    <line x1="0" y1="10" x2="7" y2="10" />
    <line x1="13" y1="10" x2="20" y2="10" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

export default function LoginPageEmail() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const errorSummaryRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setPassword("");
    const t = setTimeout(() => setMounted(true), 60);
    return () => {
      clearTimeout(t);
      setPassword("");
    };
  }, []);

  const announceFieldErrors = (nextErrors) => {
    setErrors(nextErrors);
    requestAnimationFrame(() => {
      errorSummaryRef.current?.focus();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setErrors({});

    if (!email.trim()) {
      announceFieldErrors({ email: "Email is required" });
      return;
    }
    if (!validateEmail(email.trim())) {
      announceFieldErrors({ email: "Please enter a valid email address" });
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
      const response = await staffLogin({
        email: email.trim(),
        password,
      });

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
      setMessage({ type: "success", text: "Login successful. Redirecting..." });
      navigate(getRedirectForRole(role), { replace: true });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message ?? "Invalid email or password. Please try again.",
      });
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
    } finally {
      setIsLoading(false);
    }
  };

  const fieldErrorList = Object.values(errors).filter(Boolean);
  const showErrorSummary = fieldErrorList.length > 0 || message.type === "error";
  const emailDescribedBy = [
    "login-email-hint",
    errors.email ? "login-email-error" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const passwordDescribedBy = [
    "login-password-hint",
    errors.password ? "login-password-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="theme-animate-surface auth-page" style={{
      minHeight: "100vh",
      background: "var(--homepage-gradient)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(16px, 4vw, 32px)",
      position: "relative",
      overflow: "hidden",
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
        @keyframes card-in {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logo-in {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
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
        /* iOS zooms text inputs below 16px, so bump them up on phones. */
        @media (max-width: 768px) {
          .lp-input { font-size: 16px; }
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
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .submit-btn:focus-visible,
        .auth-input-eye:focus-visible,
        a:focus-visible,
        button:focus-visible {
          outline: 2px solid var(--brand-gold);
          outline-offset: 2px;
        }
        .coord-label {
          font-family: monospace;
          font-size: 10px;
          color: color-mix(in srgb, var(--brand-gold-muted) 40%, transparent);
          letter-spacing: 0.1em;
          position: absolute;
          pointer-events: none;
          user-select: none;
        }
        .auth-error-summary:focus {
          outline: 2px solid var(--danger);
          outline-offset: 2px;
        }
      `}</style>

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
        <span className="coord-label" style={{ top: "18px", left: "56px" }}>12.97N 77.59E</span>
        <span className="coord-label" style={{ top: "18px", right: "56px" }}>KARNATAKA INDIA</span>
        <span className="coord-label" style={{ bottom: "18px", left: "56px" }}>NORTH-COT PLATFORM</span>
        <span className="coord-label" style={{ bottom: "18px", right: "56px" }}>SURVEY CAD QC</span>
      </div>

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "440px",
        animation: mounted ? "card-in 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
        opacity: mounted ? undefined : 0,
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: "28px",
          animation: mounted ? "logo-in 0.6s ease 0.1s both" : "none",
        }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Go to home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              marginBottom: "14px",
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <div style={{
              position: "absolute", inset: "-10px", borderRadius: "50%",
              border: "1px solid rgba(201,168,76,0.3)",
              animation: "ping 2.5s ease-out infinite",
            }} />
            <div style={{
              width: "110px", height: "110px", borderRadius: "50%",
              background: "var(--homepage-video-chrome)",
              backdropFilter: "blur(8px)",
              border: "2px solid rgba(201,168,76,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 28px rgba(201,168,76,0.18), 0 2px 8px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}>
              {logoFailed ? (
                <span style={{
                  fontFamily: "'IBM Plex Serif', Georgia, serif",
                  fontStyle: "italic", fontWeight: 700,
                  fontSize: "22px", color: "var(--brand-gold)",
                }}>
                  NC
                </span>
              ) : (
                <img
                  src="/assets/logo.webp"
                  alt="North-cot"
                  width={80}
                  height={80}
                  decoding="async"
                  style={{ width: "80px", height: "80px", objectFit: "contain" }}
                  onError={() => setLogoFailed(true)}
                />
              )}
            </div>
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ height: "1px", width: "32px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5))" }} />
            <span style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "28px",
              color: "var(--brand-green-deep)",
              letterSpacing: "0.02em",
            }}>
              North-cot
            </span>
            <div style={{ height: "1px", width: "50px", background: "linear-gradient(90deg, rgba(201,168,76,0.5), transparent)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <MapPin size={10} color="var(--brand-gold-muted)" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-gold-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Land Survey and Revenue Documentation
            </span>
          </div>
        </div>

        <div className="auth-form-card" style={{
          background: "rgba(255,255,255,0.68)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(232,226,216,0.9)",
          borderRadius: "24px",
          padding: "clamp(24px, 5vw, 36px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(201,168,76,0.10), 0 0 0 1px rgba(201,168,76,0.08)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: "linear-gradient(90deg, transparent, var(--brand-gold) 30%, var(--brand-gold) 70%, transparent)",
          }} />

          <div style={{ marginBottom: "24px" }}>
            <h1 className="auth-card-title" style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "clamp(20px, 3vw, 26px)",
              color: "var(--brand-green-deep)",
              lineHeight: 1.2,
              marginBottom: "6px",
            }}>
              Welcome Back
            </h1>
            <p className="auth-subtitle" style={{ fontSize: "13px", color: "var(--homepage-body-text)", lineHeight: 1.5 }}>
              Sign in with your email and password
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {showErrorSummary && (
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
                        {errors.email && (
                          <li>
                            <a href="#login-email" style={{ color: "inherit" }}>{errors.email}</a>
                          </li>
                        )}
                        {errors.password && (
                          <li>
                            <a href="#login-password" style={{ color: "inherit" }}>{errors.password}</a>
                          </li>
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
                  style={{
                    padding: "11px 14px",
                    borderRadius: "10px",
                    background: "rgba(42,110,42,0.08)",
                    border: "1px solid rgba(42,110,42,0.25)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--success)",
                  }}
                >
                  {message.text}
                </div>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  style={{ fontSize: "12px", fontWeight: 700, color: "var(--homepage-label)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}
                >
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`lp-input${errors.email ? " error" : ""}`}
                    autoComplete="username"
                    inputMode="email"
                    aria-required="true"
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={emailDescribedBy}
                    disabled={isLoading}
                    style={{ paddingLeft: "40px" }}
                  />
                  <Mail
                    size={16}
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "13px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(100,90,70,0.5)",
                    }}
                  />
                </div>
                <p id="login-email-hint" style={{ fontSize: "12px", color: "var(--homepage-label)", margin: "5px 0 0" }}>
                  Use your work email
                </p>
                {errors.email && (
                  <p id="login-email-error" role="alert" style={{ fontSize: "12px", color: "var(--danger)", marginTop: "5px" }}>
                    {errors.email}
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
                    aria-describedby={passwordDescribedBy}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="auth-input-eye"
                    style={{
                      position: "absolute",
                      right: "13px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(100,90,70,0.5)",
                      padding: "4px",
                    }}
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
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="auth-footer-line" style={{ textAlign: "center", fontSize: "13px", color: "var(--homepage-body-text)", margin: 0 }}>
                Prefer phone login?{" "}
                <a
                  href="/login"
                  style={{ color: "var(--brand-gold-muted)", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  Go to phone login
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
    </div>
  );
}
