import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  surveyorStart,
  surveyorVerifyOtp,
  surveyorComplete,
} from "../services/auth/authService.js";
import { getDistricts } from "../services/masters/districtService.js";
import { getTalukasByDistrict } from "../services/masters/talukaService.js";
import {
  MapPin, Eye, EyeOff, ArrowRight, ArrowLeft, Check,
  Phone, User, Lock, Shield,
} from "lucide-react";
import InstallButton from "../components/pwa/InstallButton.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import KarnatakaOutlineDecor from "../components/KarnatakaOutlineDecor.jsx";

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
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  const [fullName, setFullName]           = useState("");
  const [phone, setPhone]                 = useState("");
  const [otp, setOtp]                     = useState("");
  const [otpSent, setOtpSent]             = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp]       = useState(false);
  const [verifyingOtp, setVerifyingOtp]   = useState(false);

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

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  useEffect(() => {
    setDistrictsLoading(true);
    getDistricts()
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
      // Backend expects `firstName` and `lastName`.
      // Requirement: keep only fullname; last name should not be mandatory.
      await surveyorStart({ phone: p, firstName: f, lastName: "" });
      setOtpSent(true);
      setMessage({ type: "success", text: "OTP sent to your mobile." });
    } catch (err) {
      setMessage({ type: "error", text: err?.message ?? "Failed to send OTP." });
    } finally { setSendingOtp(false); }
  };

  const handleVerifyOtp = async () => {
    const p = getMobile(), o = (otp || "").trim();
    if (p.length < 10) { setErrors({ phone: "Enter a valid 10-digit mobile number" }); return; }
    if (o.length < 4)  { setErrors({ otp: "Enter the OTP sent to your mobile" }); return; }
    setVerifyingOtp(true); setMessage({ type: "", text: "" });
    try {
      await surveyorVerifyOtp({ phone: p, otp: o });
      setIsOtpVerified(true);
      setMessage({ type: "success", text: "OTP verified successfully." });
      setStep(2);
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
      if (otpSent && !isOtpVerified && (otp || "").trim().length < 4) e.otp = "Enter OTP";
    }
    if (s === 3) {
      if (!/^\d{4}$/.test(password || "")) e.password = "Password must be exactly 4 digits";
      if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    if (s === 4) {
      if (!district) e.district = "Select district";
      if (!taluk)    e.taluk    = "Select taluk";
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
    const payload = { phone: getMobile(), password, district, taluka: taluk, category };
    if (category === "SURVEYOR" && surveyorType) payload.surveyType = surveyorType;
    setIsSubmitting(true); setMessage({ type: "", text: "" });
    try {
      await surveyorComplete(payload);
      setMessage({ type: "success", text: "Registration successful. Redirecting to login…" });
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setMessage({ type: "error", text: err?.message ?? "Registration failed." });
    } finally { setIsSubmitting(false); }
  };

  const districtOptions = districts.map((d) => ({ value: d._id ?? d.id, label: d.code ? `${d.name} (${d.code})` : d.name }));
  const talukOptions    = talukas.map((t)    => ({ value: t._id ?? t.id, label: t.code ? `${t.name} (${t.code})` : t.name }));

  // Shared label style
  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: 700,
    color: "var(--homepage-label)", letterSpacing: "0.07em",
    textTransform: "uppercase", marginBottom: "7px",
  };

  const errStyle = { fontSize: "12px", color: "var(--danger)", marginTop: "5px" };

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
        .rp-input:focus {
          border-color: color-mix(in srgb, var(--brand-gold) 65%, var(--border-color));
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-gold) 18%, transparent);
          background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
        }
        .rp-input.err { border-color: color-mix(in srgb, var(--danger) 55%, var(--border-color)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 12%, transparent); }
        .rp-input:disabled { opacity:.6; cursor:not-allowed; }

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
              <img
                src="/assets/logo.png"
                alt="North-cot"
                style={{ width: "80px", height: "80px", objectFit: "contain" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `
                    <span style="font-family:'IBM Plex Serif',Georgia,serif;font-style:italic;font-weight:700;font-size:22px;color:var(--brand-gold);">NC</span>
                  `;
                }}
              />
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
              {step === 4 && "Select your district and taluk in Karnataka."}
            </p>
          </div>

          {/* Message banner */}
          {message.text && (
            <div
              className={message.type === "success" ? "auth-message auth-message--success" : "auth-message auth-message--error"}
              style={{
                padding:"10px 14px", borderRadius:"10px", marginBottom:"18px",
                background: message.type==="success" ? "rgba(42,110,42,.09)" : "rgba(192,57,43,.09)",
                border:`1px solid ${message.type==="success" ? "rgba(42,110,42,.25)" : "rgba(192,57,43,.25)"}`,
                fontSize:"13px", fontWeight:500,
                color: message.type==="success" ? "var(--success)" : "color-mix(in srgb, var(--danger) 88%, #000)",
              }}
            >
              {message.text}
            </div>
          )}

          {/* ── STEP 2 (Details) ── */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e)=>setFullName(e.target.value)}
                  placeholder="Full name"
                  className={`rp-input${errors.fullName?" err":""}`}
                  disabled={isOtpVerified}
                />
                {errors.fullName && <p style={errStyle}>{errors.fullName}</p>}
              </div>

              <div>
                <label style={labelStyle}>Mobile Number</label>
                <div className="auth-phone-row" style={{ display:"flex", borderRadius:"12px", overflow:"hidden", border:`1.5px solid ${errors.phone ? "rgba(220,80,60,.6)" : "rgba(213,200,178,.8)"}`, background:"rgba(255,255,255,.6)", transition:"border-color .2s, box-shadow .2s" }}
                  onFocusCapture={e=>{ e.currentTarget.style.borderColor="rgba(201,168,76,.7)"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(201,168,76,.12)"; }}
                  onBlurCapture={e=>{ e.currentTarget.style.borderColor="rgba(213,200,178,.8)"; e.currentTarget.style.boxShadow="none"; }}>
                  <span style={{ display:"flex", alignItems:"center", padding:"0 14px", fontSize:"14px", fontWeight:700, color:"var(--brand-gold-muted)", background:"rgba(201,168,76,.08)", borderRight:"1.5px solid rgba(213,200,178,.7)", minWidth:"54px", flexShrink:0 }}>+91</span>
                  <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="98765 43210" style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"12px 14px", fontSize:"14px", color:"var(--text-primary)" }} disabled={isOtpVerified} />
                </div>
                {errors.phone && <p style={errStyle}>{errors.phone}</p>}
              </div>

              {otpSent && (
                <div>
                  <label style={labelStyle}>Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,8))}
                    placeholder="Enter OTP sent to your mobile"
                    className={`rp-input${errors.otp?" err":""}`}
                    disabled={isOtpVerified}
                  />
                  {errors.otp && <p style={errStyle}>{errors.otp}</p>}
                  <p className="auth-otp-hint" style={{ fontSize: "12px", color: "rgba(107,90,58,.65)", marginTop: 5 }}>
                    Default OTP: <span style={{ fontWeight: 700, color: "var(--brand-gold-muted)" }}>123456</span>
                  </p>
                  {!isOtpVerified && (
                    <div style={{ display:"flex", gap:"10px", marginTop:"12px", flexWrap:"wrap" }}>
                      <button type="button" className="rp-btn-primary" onClick={handleVerifyOtp} disabled={verifyingOtp}>
                        {verifyingOtp ? "Verifying…" : "Verify OTP"}<ArrowRight size={16}/>
                      </button>
                      <button type="button" className="rp-btn-outline" onClick={handleSendOtp} disabled={sendingOtp}>
                        {sendingOtp ? "Sending…" : "Resend OTP"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!otpSent && !isOtpVerified && (
                <button type="button" className="rp-btn-primary" onClick={handleSendOtp} disabled={sendingOtp} style={{ width:"100%" }}>
                  {sendingOtp ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Sending OTP…</> : <>Send OTP <ArrowRight size={16}/></>}
                </button>
              )}
              <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
                <button type="button" className="rp-btn-outline" onClick={goBack}>
                  <ArrowLeft size={16}/>Back
                </button>
                {isOtpVerified && (
                  <button type="button" className="rp-btn-primary" onClick={()=>setStep(3)} style={{ flex:1 }}>
                    Next: Password <ArrowRight size={16}/>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1 (Type) ── */}
          {step === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <label style={labelStyle}>Account Type</label>
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {[{value:"public",label:"General Public / Citizen",sub:"For land owners and property buyers"},{value:"SURVEYOR",label:"Licensed Surveyor",sub:"For Karnataka licensed surveyors"}].map((opt)=>(
                    <label key={opt.value} className={`rp-radio-card${accountType===opt.value?" active":""}`} onClick={()=>{setAccountType(opt.value);setSurveyorType("");}}>
                      <input type="radio" name="accountType" value={opt.value} checked={accountType===opt.value} onChange={()=>{setAccountType(opt.value);setSurveyorType("");}} style={{ accentColor:"var(--brand-gold)", flexShrink:0 }} />
                      <div>
                        <p className="auth-radio-title" style={{ fontSize:"14px", fontWeight:600, color:"var(--brand-green-deep)", margin:0 }}>{opt.label}</p>
                        <p className="auth-radio-sub" style={{ fontSize:"12px", color:"var(--homepage-body-text)", margin:0, marginTop:"2px" }}>{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.accountType && <p style={errStyle}>{errors.accountType}</p>}
              </div>

              {accountType === "SURVEYOR" && (
                <div>
                  <label style={labelStyle}>Surveyor Type</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {[{value:"LS",label:"Licensed Surveyor (LS)"},{value:"GS",label:"Government Surveyor (GS)"}].map((opt)=>(
                      <label key={opt.value} className={`rp-radio-card${surveyorType===opt.value?" active":""}`} onClick={()=>setSurveyorType(opt.value)}>
                        <input type="radio" name="surveyorType" value={opt.value} checked={surveyorType===opt.value} onChange={()=>setSurveyorType(opt.value)} style={{ accentColor:"var(--brand-gold)" }} />
                        <span className="auth-radio-title" style={{ fontSize:"14px", color:"var(--text-primary)", fontWeight:500 }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.surveyorType && <p style={errStyle}>{errors.surveyorType}</p>}
                </div>
              )}

              <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
                <button type="button" className="rp-btn-primary" onClick={goNext} style={{ flex:1 }}>
                  Next: Details <ArrowRight size={16}/>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {[{label:"Password",val:password,set:setPassword,show:showPassword,toggle:()=>setShowPassword(p=>!p),err:errors.password,ph:"Enter 4-digit numeric password"},{label:"Confirm Password",val:confirmPassword,set:setConfirmPassword,show:showConfirmPassword,toggle:()=>setShowConfirmPassword(p=>!p),err:errors.confirmPassword,ph:"Confirm 4-digit password"}].map((f,i)=>(
                <div key={i}>
                  <label style={labelStyle}>{f.label}</label>
                  <div style={{ position:"relative" }}>
                    <input type={f.show?"text":"password"} value={f.val} onChange={(e)=>f.set(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder={f.ph} className={`rp-input${f.err?" err":""}`} style={{ paddingRight:"44px" }} inputMode="numeric" maxLength={4} />
                    <button type="button" onClick={f.toggle} aria-label={f.show?"Hide":"Show"} className="auth-input-eye" style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(100,90,70,.5)", padding:"3px", transition:"color .2s" }} onMouseEnter={e=>{e.currentTarget.style.color="var(--brand-gold-muted)";}} onMouseLeave={e=>{e.currentTarget.style.color="rgba(100,90,70,.5)";}}>
                      {f.show ? <EyeOff size={17}/> : <Eye size={17}/>}
                    </button>
                  </div>
                  {f.err && <p style={errStyle}>{f.err}</p>}
                </div>
              ))}
              <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
                <button type="button" className="rp-btn-outline" onClick={goBack}><ArrowLeft size={16}/>Back</button>
                <button type="button" className="rp-btn-primary" onClick={goNext} style={{ flex:1 }}>Next: Location <ArrowRight size={16}/></button>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div>
                <label style={labelStyle}>State</label>
                <input type="text" value="Karnataka" className="rp-input" disabled style={{ opacity:.75 }} />
              </div>
              <div>
                <label style={labelStyle}>District</label>
                <select value={district} onChange={(e)=>setDistrict(e.target.value)} className={`rp-input rp-select${errors.district?" err":""}`}>
                  <option value="">{districtsLoading ? "Loading…" : "Select district"}</option>
                  {districtOptions.map((o)=>(<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
                {errors.district && <p style={errStyle}>{errors.district}</p>}
              </div>
              <div>
                <label style={labelStyle}>Taluk</label>
                <select value={taluk} onChange={(e)=>setTaluk(e.target.value)} className={`rp-input rp-select${errors.taluk?" err":""}`} disabled={!district}>
                  <option value="">{!district ? "Select district first" : talukasLoading ? "Loading…" : "Select taluk"}</option>
                  {talukOptions.map((o)=>(<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
                {errors.taluk && <p style={errStyle}>{errors.taluk}</p>}
              </div>
              <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
                <button type="button" className="rp-btn-outline" onClick={goBack}><ArrowLeft size={16}/>Back</button>
                <button type="button" className="rp-btn-primary" onClick={handleSubmit} disabled={isSubmitting} style={{ flex:1 }}>
                  {isSubmitting ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Creating Account…</> : <>Create Account <Check size={16}/></>}
                </button>
              </div>
            </div>
          )}
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