import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { staffLogin } from "../services/auth/authService.js";
import { Eye, EyeOff, ArrowRight, Mail, MapPin, Shield } from "lucide-react";
import InstallButton from "../components/pwa/InstallButton.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import KarnatakaOutlineDecor from "../components/KarnatakaOutlineDecor.jsx";

const getRedirectForRole = (role) => {
  const r = (role || "").toUpperCase();
  if (r === "SUPER_ADMIN") return "/superadmin";
  if (r === "ADMIN") return "/superadmin";
  if (r === "CAD" || r === "CAD_USER") return "/dashboard/cad";
  if (r === "SURVEYOR") return "/dashboard/user";
  if (r === "USER" || r === "CUSTOMER") return "/dashboard/user";
  return "/";
};

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
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      setErrors({ password: "Password must be exactly 4 digits" });
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
      const token = data?.token ?? body?.token;
      const userPayload = data?.user ?? data;
      const user = userPayload ?? (data?.name != null || data?.email != null ? data : null);

      dispatch(setCredentials({ token, user }));
      const role = user?.role ?? data?.role ?? body?.role;
      setMessage({ type: "success", text: "Login successful. Redirecting..." });
      navigate(getRedirectForRole(role), { replace: true });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message ?? "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        .lp-input::placeholder { color: color-mix(in srgb, var(--text-secondary) 55%, transparent); }
        .lp-input:focus {
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
              <img
                src="/assets/logo.png"
                alt="North-cot"
                style={{ width: "80px", height: "80px", objectFit: "contain" }}
              />
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

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--homepage-label)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Please enter your email address"
                    className={`lp-input${errors.email ? " error" : ""}`}
                    autoComplete="email"
                    disabled={isLoading}
                    style={{ paddingLeft: "40px" }}
                  />
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "13px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(100,90,70,0.5)",
                    }}
                  />
                </div>
                {errors.email && <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "5px" }}>{errors.email}</p>}
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--homepage-label)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Enter 4-digit password"
                    className={`lp-input${errors.password ? " error" : ""}`}
                    style={{ paddingRight: "46px" }}
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "5px" }}>{errors.password}</p>}
              </div>

              {message.text && (
                <div
                  style={{
                    padding: "11px 14px",
                    borderRadius: "10px",
                    background: message.type === "success" ? "rgba(42,110,42,0.08)" : "rgba(192,57,43,0.08)",
                    border: `1px solid ${message.type === "success" ? "rgba(42,110,42,0.25)" : "rgba(192,57,43,0.25)"}`,
                    fontSize: "13px",
                    fontWeight: 500,
                    color: message.type === "success" ? "var(--success)" : "color-mix(in srgb, var(--danger) 88%, #000)",
                  }}
                >
                  {message.text}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="auth-footer-line" style={{ textAlign: "center", fontSize: "13px", color: "var(--homepage-body-text)", margin: 0 }}>
                Prefer phone login?{" "}
                <a
                  href="/login"
                  style={{ color: "var(--brand-gold-muted)", fontWeight: 700, textDecoration: "none" }}
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
          <Shield size={12} color="rgba(154,112,32,0.5)" />
          <span className="auth-below-muted" style={{ fontSize: "11px", color: "rgba(154,112,32,0.5)", fontWeight: 500, letterSpacing: "0.04em" }}>
            Protected by industry-standard encryption
          </span>
        </div>
      </div>
    </div>
  );
}
