import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import {
  surveyorStart,
  surveyorVerifyOtp,
  surveyorComplete,
} from "../services/auth/authService.js";
import { setCredentials } from "../features/auth/authSlice";
import { extractAccessToken } from "../utils/authToken.js";
import { getActiveDistricts } from "../services/masters/districtService.js";
import { getTalukasByDistrict } from "../services/masters/talukaService.js";
import {
  useOtpCountdown,
  defaultOtpExpiresAt,
} from "../hooks/useOtpCountdown.js";
import { formatOtpSendError } from "../utils/otpErrorMessage.js";
import {
  MapPin, Check,
  User, Lock, Shield,
} from "lucide-react";
import InstallButton from "../components/pwa/InstallButton.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import KarnatakaOutlineDecor from "../components/KarnatakaOutlineDecor.jsx";
import { getRedirectForRole } from "../utils/authRedirect.js";
import RegisterStepPanels from "./register/RegisterStepPanels.jsx";

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const STEPS = [
  { key: 1, label: "Type",    icon: <Shield size={14} /> },
  { key: 2, label: "Details", icon: <User size={14} /> },
  { key: 3, label: "Password",icon: <Lock size={14} /> },
  { key: 4, label: "Location",icon: <MapPin size={14} /> },
];

const Crosshair = ({ size = 20, opacity = 0.18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity, color: "var(--brand-gold)" }}>
    <line x1="10" y1="0"  x2="10" y2="7"  />
    <line x1="10" y1="13" x2="10" y2="20" />
    <line x1="0"  y1="10" x2="7"  y2="10" />
    <line x1="13" y1="10" x2="20" y2="10" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const redirectTimeoutRef = useRef(null);

  const [fullName, setFullName]           = useState("");
  const [phone, setPhone]                 = useState("");
  const [otp, setOtp]                     = useState("");
  const [otpSent, setOtpSent]             = useState(false);
  const [otpExpiresAt, setOtpExpiresAt]   = useState(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp]       = useState(false);
  const [verifyingOtp, setVerifyingOtp]   = useState(false);
  const otpSecondsLeft = useOtpCountdown(otpExpiresAt);

  const [accountType, setAccountType]   = useState("");
  const [surveyorType, setSurveyorType] = useState("");

  const [password, setPassword]                   = useState("");
  const [confirmPassword, setConfirmPassword]     = useState("");
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [district, setDistrict]       = useState("");
  const [taluk, setTaluk]             = useState("");
  const [districts, setDistricts]     = useState([]);
  const [talukas, setTalukas]         = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [talukasLoading, setTalukasLoading]     = useState(false);

  const [message, setMessage]     = useState({ type: "", text: "" });
  const [errors, setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => clearTimeout(redirectTimeoutRef.current), []);

  useEffect(() => {
    setDistrictsLoading(true);
    getActiveDistricts()
      .then((res) => setDistricts(normalizeList(res)))
      .catch(() => setDistricts([]))
      .finally(() => setDistrictsLoading(false));
  }, []);

  useEffect(() => {
    if (!district) { setTalukas([]); setTaluk(""); return; }
    const id = typeof district === "string" ? district : district?._id ?? district?.id ?? "";
    if (!id) { setTalukas([]); return; }
    setTalukasLoading(true);
    getTalukasByDistrict(id)
      .then((res) => setTalukas(normalizeList(res)))
      .catch(() => setTalukas([]))
      .finally(() => setTalukasLoading(false));
  }, [district]);

  const getMobile = () => (phone || "").replace(/\D/g, "").slice(0, 10);

  const handleSendOtp = async () => {
    setMessage({ type: "", text: "" }); setErrors({});
    const f = fullName?.trim() ?? "", p = getMobile();
    if (!f) { setErrors({ fullName: "Full name is required" }); return; }
    if (p.length < 10) { setErrors({ phone: "Enter a valid 10-digit mobile number" }); return; }
    setSendingOtp(true);
    try {
      const result = await surveyorStart({ phone: p, firstName: f, lastName: "" });
      setOtpSent(true);
      setOtp("");
      setOtpExpiresAt(result?.expiresAt ?? defaultOtpExpiresAt());
      setMessage({ type: "success", text: result?.message ?? "OTP sent to your mobile." });
    } catch (err) {
      setMessage({ type: "error", text: formatOtpSendError(err, "Failed to send OTP.") });
    } finally { setSendingOtp(false); }
  };

  const handleVerifyOtp = async () => {
    const p = getMobile(), o = (otp || "").trim();
    if (p.length < 10) { setErrors({ phone: "Enter a valid 10-digit mobile number" }); return; }
    if (!/^\d{6}$/.test(o)) { setErrors({ otp: "Enter the 6-digit OTP sent to your mobile" }); return; }
    setVerifyingOtp(true); setMessage({ type: "", text: "" });
    try {
      await surveyorVerifyOtp({ phone: p, otp: o });
      setIsOtpVerified(true);
      setMessage({ type: "success", text: "OTP verified. Set your password to continue." });
      setStep(3);
    } catch (err) {
      setMessage({ type: "error", text: err?.message ?? "OTP verification failed." });
    } finally { setVerifyingOtp(false); }
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!accountType) e.accountType = "Select account type";
      if (accountType === "SURVEYOR" && !surveyorType) e.surveyorType = "Select surveyor type";
    }
    if (s === 2) {
      if (!fullName?.trim()) e.fullName = "Full name is required";
      if (getMobile().length < 10) e.phone = "Valid 10-digit mobile required";
      if (otpSent && !isOtpVerified && !/^\d{6}$/.test((otp || "").trim())) e.otp = "Enter the 6-digit OTP";
    }
    if (s === 3) {
      if (!/^\d{4}$/.test(password || "")) e.password = "Password must be exactly 4 digits";
      if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    if (s === 4) {
      if (!district) e.district = "Select district";
      if (!taluk)    e.taluk    = "Select taluka";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 2 && otpSent && !isOtpVerified) { handleVerifyOtp(); return; }
    if (step === 1) {
      if (!validateStep(1)) return;
      setStep(2); return;
    }
    if (step === 2) {
      if (!validateStep(2)) return;
      if (!isOtpVerified) { handleSendOtp(); return; }
      setStep(3); return;
    }
    if (step === 3) { if (!validateStep(3)) return; setStep(4); return; }
  };

  const goBack = () => {
    setMessage({ type: "", text: "" }); setErrors({});
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    const category = accountType === "SURVEYOR" ? "SURVEYOR" : "public";
    const f = fullName?.trim() ?? "";
    const payload = {
      phone: getMobile(),
      password,
      district,
      taluka: taluk,
      category,
      firstName: f,
      lastName: "",
    };
    if (category === "SURVEYOR" && surveyorType) payload.surveyType = surveyorType;
    setIsSubmitting(true); setMessage({ type: "", text: "" });
    try {
      const result = await surveyorComplete(payload);
      const token = extractAccessToken(result);
      const user = result?.user;
      if (token) {
        dispatch(setCredentials({ token, accessToken: token, user }));
        setMessage({ type: "success", text: "Registration successful. Redirecting…" });
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = setTimeout(
          () => navigate(getRedirectForRole(user?.role), { replace: true }),
          1200,
        );
      } else {
        setMessage({ type: "success", text: "Registration successful. Redirecting to login…" });
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = setTimeout(() => navigate("/login", { replace: true }), 1500);
      }
    } catch (err) {
      setMessage({ type: "error", text: err?.message ?? "Registration failed." });
    } finally { setIsSubmitting(false); }
  };

  const districtOptions = districts.map((d) => ({ value: d._id ?? d.id, label: d.code ? `${d.name} (${d.code})` : d.name }));
  const talukOptions    = talukas.map((t)    => ({ value: t._id ?? t.id, label: t.code ? `${t.name} (${t.code})` : t.name }));

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
        @keyframes ping       { 0% { transform:scale(1); opacity:.7; } 100% { transform:scale(2.2); opacity:0; } }
        @keyframes card-in    { from { opacity:0; transform:translateY(28px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes logo-in    { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin       { to { transform: rotate(360deg); } }

        .rp-input {
          width: 100%;
          background: color-mix(in srgb, var(--bg-elevated) 65%, transparent);
          border: 1.5px solid var(--homepage-cream-border);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
          box-sizing: border-box;
          backdrop-filter: blur(4px);
        }
        .rp-input::placeholder { color: color-mix(in srgb, var(--text-secondary) 55%, transparent); }
        .rp-input:focus,
        .rp-input:focus-visible {
          border-color: color-mix(in srgb, var(--brand-gold) 65%, var(--border-color));
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-gold) 18%, transparent);
          background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
        }
        .rp-input.err { border-color: color-mix(in srgb, var(--danger) 55%, var(--border-color)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 12%, transparent); }
        .rp-input:disabled { opacity:.6; cursor:not-allowed; }

        .rp-phone-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 12px 14px;
          font-size: 14px;
          color: var(--text-primary);
        }

        /* iOS zooms text inputs below 16px, so bump them up on phones. */
        @media (max-width: 768px) {
          .rp-input,
          .rp-phone-input { font-size: 16px; }
        }

        .rp-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23657683' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px !important;
          cursor: pointer;
        }

        .rp-btn-primary {
          padding: 13px 22px; border-radius: 13px;
          background: linear-gradient(135deg, var(--homepage-cta-bg) 0%, color-mix(in srgb, var(--homepage-cta-bg) 85%, black) 100%);
          color: var(--homepage-cta-fg); font-weight: 700; font-size: 14px; letter-spacing: .04em;
          border: none; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 8px 24px var(--homepage-card-shadow);
          transition: all .25s ease;
        }
        .rp-btn-primary:hover:not(:disabled) {
          filter: brightness(1.05);
          box-shadow: 0 12px 32px var(--homepage-card-shadow);
          transform: translateY(-1px);
        }
        .rp-btn-primary:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .rp-btn-primary:focus-visible,
        .rp-btn-outline:focus-visible,
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

        .rp-btn-outline {
          padding: 12px 18px; border-radius: 12px;
          background: color-mix(in srgb, var(--bg-elevated) 55%, transparent); backdrop-filter: blur(6px);
          color: var(--homepage-cta-ghost-fg); font-weight: 600; font-size: 13px;
          border: 1.5px solid var(--homepage-cream-border); cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: all .2s ease;
          box-shadow: 0 1px 6px var(--homepage-card-shadow);
        }
        .rp-btn-outline:hover { background: color-mix(in srgb, var(--bg-elevated) 80%, transparent); border-color: color-mix(in srgb, var(--brand-gold) 40%, var(--border-color)); }

        .rp-radio-card {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 16px; border-radius: 12px; cursor: pointer;
          border: 1.5px solid var(--homepage-cream-border);
          background: color-mix(in srgb, var(--bg-elevated) 55%, transparent); backdrop-filter: blur(4px);
          transition: all .2s ease;
        }
        .rp-radio-card.active {
          border-color: color-mix(in srgb, var(--brand-gold) 55%, var(--border-color));
          background: color-mix(in srgb, var(--brand-gold) 10%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-gold) 12%, transparent);
        }
        .coord-label {
          font-family: monospace; font-size: 10px;
          color: color-mix(in srgb, var(--brand-gold-muted) 40%, transparent); letter-spacing: .1em;
          position: absolute; pointer-events: none; user-select: none;
        }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }} aria-hidden="true">
        <div style={{ position:"absolute", top:"-120px", left:"-100px", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle,rgba(201,168,76,.13) 0%,transparent 65%)" }} />
        <div style={{ position:"absolute", bottom:"-80px", right:"-80px", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(21,40,21,.08) 0%,transparent 65%)" }} />
        <KarnatakaOutlineDecor variant="auth" />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(201,168,76,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.055) 1px,transparent 1px)", backgroundSize:"52px 52px" }} />
        <div style={{ position:"absolute", top:"28px", left:"28px"  }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position:"absolute", top:"28px", right:"28px" }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position:"absolute", bottom:"28px", left:"28px"  }}><Crosshair size={22} opacity={0.22} /></div>
        <div style={{ position:"absolute", bottom:"28px", right:"28px" }}><Crosshair size={22} opacity={0.22} /></div>
        <span className="coord-label" style={{ top:"18px", left:"56px"   }}>12.97°N 77.59°E</span>
        <span className="coord-label" style={{ top:"18px", right:"56px"  }}>KARNATAKA · INDIA</span>
        <span className="coord-label" style={{ bottom:"18px", left:"56px"  }}>NORTH-COT · PLATFORM</span>
        <span className="coord-label" style={{ bottom:"18px", right:"56px" }}>SURVEY · CAD · QC</span>
        {/* mid-point subtle crosshairs */}
        {[{top:"20%",left:"7%"},{top:"65%",left:"5%"},{top:"30%",right:"6%"},{top:"72%",right:"7%"}].map((pos,i)=>(
          <div key={i} style={{ position:"absolute", ...pos }}><Crosshair size={14} opacity={0.10} /></div>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{
        position:"relative", zIndex:1, width:"100%", maxWidth:"520px",
        animation: mounted ? "card-in .65s cubic-bezier(.16,1,.3,1) forwards" : "none",
        opacity: mounted ? undefined : 0,
      }}>

        {/* LOGO */}
        <div style={{
          textAlign: "center", marginBottom: "28px",
          animation: mounted ? "logo-in 0.6s ease 0.1s both" : "none",
        }}>
          {/* Logo container with pulsing ring */}
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            position: "relative", marginBottom: "14px",
          }}>
            {/* Outer pulse ring */}
            <div style={{
              position: "absolute", inset: "-10px", borderRadius: "50%",
              border: "1px solid rgba(201,168,76,0.3)",
              animation: "ping 2.5s ease-out infinite",
            }} />
            {/* Inner ring */}
            <div style={{
              position: "absolute", inset: "-4px", borderRadius: "50%",
              border: "1.5px solid rgba(201,168,76,0.25)",
            }} />
            {/* Logo image */}
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
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ height: "1px", width: "32px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5))" }} />
            <span style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic", fontWeight: 700,
              fontSize: "28px", color: "var(--brand-green-deep)", letterSpacing: "0.02em",
            }}>
              North-cot
            </span>
            <div style={{ height: "1px", width: "50px", background: "linear-gradient(90deg, rgba(201,168,76,0.5), transparent)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <MapPin size={10} color="var(--brand-gold-muted)" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-gold-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Land Survey & Revenue Documentation
            </span>
          </div>
        </div>

        {/* STEP INDICATOR */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"22px", padding:"0 4px" }}>
          {STEPS.map((s, i) => {
            const isDone   = step > s.key;
            const isActive = step === s.key;
            return (
              <React.Fragment key={s.key}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                  <div className={isActive ? "auth-step-pill" : isDone ? "auth-step-pill-done" : "auth-step-pill-inactive"} style={{
                    width:"38px", height:"38px", borderRadius:"50%",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"13px", fontWeight:700, marginBottom:"6px",
                    transition:"all .3s ease",
                    background: isDone ? "rgba(201,168,76,.18)" : isActive ? "var(--brand-gold)" : "rgba(255,255,255,.55)",
                    color:       isDone ? "var(--brand-gold-muted)"              : isActive ? "var(--brand-green-deep)" : "rgba(100,90,70,.5)",
                    border: `2px solid ${isDone ? "rgba(201,168,76,.45)" : isActive ? "var(--brand-gold)" : "rgba(213,200,178,.7)"}`,
                    boxShadow: isActive ? "0 4px 14px rgba(201,168,76,.3)" : "none",
                    backdropFilter: "blur(4px)",
                  }}>
                    {isDone ? <Check size={16} strokeWidth={2.5} /> : s.icon}
                  </div>
                  <span className={step >= s.key ? "auth-step-label" : "auth-step-label-muted"} style={{ fontSize:"10px", fontWeight:600, letterSpacing:".04em", textAlign:"center", maxWidth:"60px", color: step >= s.key ? "var(--homepage-label)" : "rgba(107,90,58,.45)" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex:1, height:"2px", margin:"0 4px 22px",
                    background: step > s.key
                      ? "linear-gradient(90deg, rgba(201,168,76,.5), rgba(201,168,76,.3))"
                      : "rgba(213,200,178,.5)",
                    borderRadius:1, transition:"background .4s ease",
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* FORM CARD */}
        <div className="auth-form-card" style={{
          background:"rgba(255,255,255,.68)", backdropFilter:"blur(20px)",
          border:"1px solid rgba(232,226,216,.9)", borderRadius:"24px",
          padding:"clamp(24px,5vw,36px)",
          boxShadow:"0 20px 60px rgba(0,0,0,.10), 0 4px 16px rgba(201,168,76,.10), 0 0 0 1px rgba(201,168,76,.08)",
          position:"relative", overflow:"hidden",
        }}>
          {/* Gold top accent */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:"linear-gradient(90deg,transparent,var(--brand-gold) 30%,var(--brand-gold) 70%,transparent)" }} />

          {/* Card heading */}
          <div style={{ marginBottom:"20px" }}>
            <h2 className="auth-card-title" style={{ fontFamily:"'IBM Plex Serif',Georgia,serif", fontStyle:"italic", fontWeight:600, fontSize:"clamp(18px,2.5vw,23px)", color:"var(--brand-green-deep)", lineHeight:1.2, marginBottom:"5px" }}>
              {step === 1 && "Account Type"}
              {step === 2 && "Basic Details & Verification"}
              {step === 3 && "Set Your Password"}
              {step === 4 && "Location Details"}
            </h2>
            <p className="auth-subtitle auth-muted" style={{ fontSize:"13px", color:"var(--homepage-body-text)", lineHeight:1.55, margin:0 }}>
              {step === 1 && "Choose how you'll use the platform."}
              {step === 2 && "Enter your full name and mobile, then verify with OTP."}
              {step === 3 && "Create a secure password for your account."}
              {step === 4 && "Select your district and taluka in Karnataka."}
            </p>
          </div>

          {/* Message / error summary */}
          {(message.text || Object.keys(errors).length > 0) && (
            <div
              id="register-error-summary"
              className={
                message.type === "success"
                  ? "auth-message auth-message--success"
                  : "auth-message auth-message--error auth-error-summary"
              }
              role={message.type === "success" ? "status" : "alert"}
              aria-live={message.type === "success" ? "polite" : "assertive"}
              tabIndex={message.type === "success" ? undefined : -1}
              style={{
                padding:"10px 14px", borderRadius:"10px", marginBottom:"18px",
                background: message.type==="success" ? "rgba(42,110,42,.09)" : "rgba(192,57,43,.09)",
                border:`1px solid ${message.type==="success" ? "rgba(42,110,42,.25)" : "rgba(192,57,43,.25)"}`,
                fontSize:"13px", fontWeight:500,
                color: message.type==="success" ? "var(--success)" : "color-mix(in srgb, var(--danger) 88%, #000)",
              }}
            >
              {message.text || Object.values(errors).filter(Boolean).join(". ")}
            </div>
          )}

          <RegisterStepPanels
            step={step}
            accountType={accountType}
            setAccountType={setAccountType}
            surveyorType={surveyorType}
            setSurveyorType={setSurveyorType}
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            otp={otp}
            setOtp={setOtp}
            otpSent={otpSent}
            isOtpVerified={isOtpVerified}
            sendingOtp={sendingOtp}
            verifyingOtp={verifyingOtp}
            otpSecondsLeft={otpSecondsLeft}
            onSendOtp={handleSendOtp}
            onVerifyOtp={handleVerifyOtp}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            district={district}
            setDistrict={setDistrict}
            taluk={taluk}
            setTaluk={setTaluk}
            districtOptions={districtOptions}
            talukOptions={talukOptions}
            districtsLoading={districtsLoading}
            talukasLoading={talukasLoading}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            errors={errors}
            goNext={goNext}
            goBack={goBack}
            setStep={setStep}
          />
        </div>

        {/* Footer links */}
        <div className="auth-below-card" style={{ textAlign:"center", marginTop:"20px" }}>
          <p className="auth-below-muted" style={{ fontSize:"13px", color:"rgba(107,90,58,.65)", margin:"0 0 6px" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color:"var(--brand-gold-muted)", fontWeight:700, textDecoration:"none" }}
              onMouseEnter={e=>{e.currentTarget.style.color="var(--brand-gold)";}}
              onMouseLeave={e=>{e.currentTarget.style.color="var(--brand-gold-muted)";}}>
              Login here
            </a>
          </p>
          <p className="auth-below-fine" style={{ fontSize:"11px", color:"rgba(107,90,58,.4)", margin:0 }}>
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}