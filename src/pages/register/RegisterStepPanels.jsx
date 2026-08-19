import React from "react";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Check,
} from "lucide-react";
import { formatOtpCountdown } from "../../hooks/useOtpCountdown.js";

const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 700,
  color: "var(--homepage-label)", letterSpacing: "0.07em",
  textTransform: "uppercase", marginBottom: "7px",
};

const errStyle = { fontSize: "12px", color: "var(--danger)", marginTop: "5px" };

/**
 * Presentational step content for the register wizard (steps 1–4).
 * State and handlers remain in RegisterPage.
 */
export default function RegisterStepPanels({
  step,
  // Step 1
  accountType, setAccountType,
  surveyorType, setSurveyorType,
  // Step 2
  fullName, setFullName,
  phone, setPhone,
  otp, setOtp,
  otpSent, isOtpVerified,
  sendingOtp, verifyingOtp,
  otpSecondsLeft,
  onSendOtp, onVerifyOtp,
  // Step 3
  password, setPassword,
  confirmPassword, setConfirmPassword,
  showPassword, setShowPassword,
  showConfirmPassword, setShowConfirmPassword,
  // Step 4
  district, setDistrict,
  taluk, setTaluk,
  districtOptions, talukOptions,
  districtsLoading, talukasLoading,
  isSubmitting,
  onSubmit,
  // Shared
  errors,
  goNext, goBack, setStep,
}) {
  return (
    <>
      {/* ── STEP 2 (Details) ── */}
      {step === 2 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div>
            <label htmlFor="register-full-name" style={labelStyle}>Full Name</label>
            <input
              id="register-full-name"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e)=>setFullName(e.target.value)}
              placeholder="Your full name"
              className={`rp-input${errors.fullName?" err":""}`}
              autoComplete="name"
              aria-required="true"
              aria-invalid={errors.fullName ? "true" : "false"}
              aria-describedby={errors.fullName ? "register-full-name-error" : undefined}
              disabled={isOtpVerified}
            />
            {errors.fullName && <p id="register-full-name-error" role="alert" style={errStyle}>{errors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="register-phone" style={labelStyle}>Mobile Number</label>
            <div className="auth-phone-row" style={{ display:"flex", borderRadius:"12px", overflow:"hidden", border:`1.5px solid ${errors.phone ? "rgba(220,80,60,.6)" : "rgba(213,200,178,.8)"}`, background:"rgba(255,255,255,.6)", transition:"border-color .2s, box-shadow .2s" }}
              onFocusCapture={e=>{ e.currentTarget.style.borderColor="rgba(201,168,76,.7)"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(201,168,76,.12)"; }}
              onBlurCapture={e=>{ e.currentTarget.style.borderColor=errors.phone ? "rgba(220,80,60,.6)" : "rgba(213,200,178,.8)"; e.currentTarget.style.boxShadow="none"; }}>
              <span id="register-phone-country" style={{ display:"flex", alignItems:"center", padding:"0 14px", fontSize:"14px", fontWeight:700, color:"var(--brand-gold-muted)", background:"rgba(201,168,76,.08)", borderRight:"1.5px solid rgba(213,200,178,.7)", minWidth:"54px", flexShrink:0 }}>+91</span>
              <input
                id="register-phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e)=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                aria-required="true"
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={["register-phone-country", errors.phone ? "register-phone-error" : null].filter(Boolean).join(" ")}
                className="rp-phone-input"
                disabled={isOtpVerified}
              />
            </div>
            {errors.phone && <p id="register-phone-error" role="alert" style={errStyle}>{errors.phone}</p>}
          </div>

          {otpSent && (
            <div>
              <label htmlFor="register-otp" style={labelStyle}>Enter OTP</label>
              <input
                id="register-otp"
                name="otp"
                type="text"
                value={otp}
                onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="6-digit code"
                className={`rp-input${errors.otp?" err":""}`}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                aria-required="true"
                aria-invalid={errors.otp ? "true" : "false"}
                aria-describedby={[
                  "register-otp-hint",
                  errors.otp ? "register-otp-error" : null,
                  otpSecondsLeft === 0 && !isOtpVerified ? "register-otp-expired" : null,
                ].filter(Boolean).join(" ")}
                disabled={isOtpVerified}
              />
              <p id="register-otp-hint" style={{ fontSize: "12px", color: "var(--homepage-label)", marginTop: 5 }}>
                Enter the 6-digit code sent to your phone
              </p>
              {errors.otp && <p id="register-otp-error" role="alert" style={errStyle}>{errors.otp}</p>}
              {otpSecondsLeft > 0 && (
                <p className="auth-otp-hint" style={{ fontSize: "12px", color: "rgba(107,90,58,.65)", marginTop: 5 }} aria-live="polite">
                  OTP expires in <span style={{ fontWeight: 700, color: "var(--brand-gold-muted)" }}>{formatOtpCountdown(otpSecondsLeft)}</span>
                </p>
              )}
              {otpSent && otpSecondsLeft === 0 && !isOtpVerified && (
                <p id="register-otp-expired" className="auth-otp-hint" role="alert" style={{ fontSize: "12px", color: "var(--danger)", marginTop: 5 }}>
                  OTP expired. Tap Resend OTP to get a new code.
                </p>
              )}
              {!isOtpVerified && (
                <div style={{ display:"flex", gap:"10px", marginTop:"12px", flexWrap:"wrap" }}>
                  <button type="button" className="rp-btn-primary" onClick={onVerifyOtp} disabled={verifyingOtp || otpSecondsLeft === 0} aria-busy={verifyingOtp} title={otpSecondsLeft === 0 ? "OTP expired — resend a new code first" : undefined}>
                    {verifyingOtp ? "Verifying…" : "Verify OTP"}<ArrowRight size={16} aria-hidden="true"/>
                  </button>
                  <button type="button" className="rp-btn-outline" onClick={onSendOtp} disabled={sendingOtp} aria-busy={sendingOtp}>
                    {sendingOtp ? "Sending…" : "Resend OTP"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!otpSent && !isOtpVerified && (
            <button type="button" className="rp-btn-primary" onClick={onSendOtp} disabled={sendingOtp} aria-busy={sendingOtp} style={{ width:"100%" }}>
              {sendingOtp ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}} aria-hidden="true"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Sending OTP…</> : <>Send OTP <ArrowRight size={16} aria-hidden="true"/></>}
            </button>
          )}
          <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
            <button type="button" className="rp-btn-outline" onClick={goBack}>
              <ArrowLeft size={16} aria-hidden="true"/>Back
            </button>
            {isOtpVerified && (
              <button type="button" className="rp-btn-primary" onClick={()=>setStep(3)} style={{ flex:1 }}>
                Next: Password <ArrowRight size={16} aria-hidden="true"/>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 1 (Type) ── */}
      {step === 1 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }} role="group" aria-labelledby="register-account-type-label">
          <div>
            <span id="register-account-type-label" style={labelStyle}>Account Type</span>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }} role="radiogroup" aria-labelledby="register-account-type-label" aria-required="true" aria-describedby={errors.accountType ? "register-account-type-error" : undefined}>
              {[{value:"public",label:"General Public / Citizen",sub:"For land owners and property buyers"},{value:"SURVEYOR",label:" Surveyor",sub:"For licensed or government surveyors"}].map((opt)=>(
                <label key={opt.value} className={`rp-radio-card${accountType===opt.value?" active":""}`} onClick={()=>{setAccountType(opt.value);setSurveyorType("");}}>
                  <input type="radio" name="accountType" value={opt.value} checked={accountType===opt.value} onChange={()=>{setAccountType(opt.value);setSurveyorType("");}} style={{ accentColor:"var(--brand-gold)", flexShrink:0 }} />
                  <div>
                    <p className="auth-radio-title" style={{ fontSize:"14px", fontWeight:600, color:"var(--brand-green-deep)", margin:0 }}>{opt.label}</p>
                    <p className="auth-radio-sub" style={{ fontSize:"12px", color:"var(--homepage-body-text)", margin:0, marginTop:"2px" }}>{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.accountType && <p id="register-account-type-error" role="alert" style={errStyle}>{errors.accountType}</p>}
          </div>

          {accountType === "SURVEYOR" && (
            <div>
              <span id="register-surveyor-type-label" style={labelStyle}>Surveyor Type</span>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }} role="radiogroup" aria-labelledby="register-surveyor-type-label" aria-required="true" aria-describedby={errors.surveyorType ? "register-surveyor-type-error" : undefined}>
                {[{value:"LS",label:"Licensed Surveyor (LS)"},{value:"GS",label:"Government Surveyor (GS)"}].map((opt)=>(
                  <label key={opt.value} className={`rp-radio-card${surveyorType===opt.value?" active":""}`} onClick={()=>setSurveyorType(opt.value)}>
                    <input type="radio" name="surveyorType" value={opt.value} checked={surveyorType===opt.value} onChange={()=>setSurveyorType(opt.value)} style={{ accentColor:"var(--brand-gold)" }} />
                    <span className="auth-radio-title" style={{ fontSize:"14px", color:"var(--text-primary)", fontWeight:500 }}>{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.surveyorType && <p id="register-surveyor-type-error" role="alert" style={errStyle}>{errors.surveyorType}</p>}
            </div>
          )}

          <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
            <button type="button" className="rp-btn-primary" onClick={goNext} style={{ flex:1 }}>
              Next: Details <ArrowRight size={16} aria-hidden="true"/>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {[
            { id:"register-password", name:"password", label:"Password", val:password, set:setPassword, show:showPassword, toggle:()=>setShowPassword(p=>!p), err:errors.password, ph:"••••", autoComplete:"new-password", hint:"4-digit numeric password" },
            { id:"register-confirm-password", name:"confirmPassword", label:"Confirm Password", val:confirmPassword, set:setConfirmPassword, show:showConfirmPassword, toggle:()=>setShowConfirmPassword(p=>!p), err:errors.confirmPassword, ph:"••••", autoComplete:"new-password", hint:"Re-enter the same 4-digit password" },
          ].map((f)=>(
            <div key={f.id}>
              <label htmlFor={f.id} style={labelStyle}>{f.label}</label>
              <div style={{ position:"relative" }}>
                <input
                  id={f.id}
                  name={f.name}
                  type={f.show?"text":"password"}
                  value={f.val}
                  onChange={(e)=>f.set(e.target.value.replace(/\D/g,"").slice(0,4))}
                  placeholder={f.ph}
                  className={`rp-input${f.err?" err":""}`}
                  style={{ paddingRight:"44px" }}
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete={f.autoComplete}
                  aria-required="true"
                  aria-invalid={f.err ? "true" : "false"}
                  aria-describedby={[`${f.id}-hint`, f.err ? `${f.id}-error` : null].filter(Boolean).join(" ")}
                />
                <button type="button" onClick={f.toggle} aria-label={f.show ? `Hide ${f.label}` : `Show ${f.label}`} aria-pressed={f.show} className="auth-input-eye touch-target" style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(100,90,70,.5)", padding:"3px", transition:"color .2s" }} onMouseEnter={e=>{e.currentTarget.style.color="var(--brand-gold-muted)";}} onMouseLeave={e=>{e.currentTarget.style.color="rgba(100,90,70,.5)";}}>
                  {f.show ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}
                </button>
              </div>
              <p id={`${f.id}-hint`} style={{ fontSize: "12px", color: "var(--homepage-label)", marginTop: 5 }}>{f.hint}</p>
              {f.err && <p id={`${f.id}-error`} role="alert" style={errStyle}>{f.err}</p>}
            </div>
          ))}
          <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
            <button type="button" className="rp-btn-outline" onClick={goBack}><ArrowLeft size={16} aria-hidden="true"/>Back</button>
            <button type="button" className="rp-btn-primary" onClick={goNext} style={{ flex:1 }}>Next: Location <ArrowRight size={16} aria-hidden="true"/></button>
          </div>
        </div>
      )}

      {/* ── STEP 4 ── */}
      {step === 4 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div>
            <label htmlFor="register-state" style={labelStyle}>State</label>
            <input id="register-state" name="state" type="text" value="Karnataka" className="rp-input" disabled style={{ opacity:.75 }} />
          </div>
          <div>
            <label htmlFor="register-district" style={labelStyle}>District</label>
            <select
              id="register-district"
              name="district"
              value={district}
              onChange={(e)=>setDistrict(e.target.value)}
              className={`rp-input rp-select${errors.district?" err":""}`}
              aria-required="true"
              aria-invalid={errors.district ? "true" : "false"}
              aria-describedby={errors.district ? "register-district-error" : undefined}
            >
              <option value="">{districtsLoading ? "Loading…" : "Select district"}</option>
              {districtOptions.map((o)=>(<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
            {errors.district && <p id="register-district-error" role="alert" style={errStyle}>{errors.district}</p>}
          </div>
          <div>
            <label htmlFor="register-taluk" style={labelStyle}>Taluka</label>
            <select
              id="register-taluk"
              name="taluk"
              value={taluk}
              onChange={(e)=>setTaluk(e.target.value)}
              className={`rp-input rp-select${errors.taluk?" err":""}`}
              disabled={!district}
              aria-required="true"
              aria-invalid={errors.taluk ? "true" : "false"}
              aria-describedby={errors.taluk ? "register-taluk-error" : undefined}
            >
              <option value="">{!district ? "Select district first" : talukasLoading ? "Loading…" : "Select taluka"}</option>
              {talukOptions.map((o)=>(<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
            {errors.taluk && <p id="register-taluk-error" role="alert" style={errStyle}>{errors.taluk}</p>}
          </div>
          <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
            <button type="button" className="rp-btn-outline" onClick={goBack}><ArrowLeft size={16} aria-hidden="true"/>Back</button>
            <button type="button" className="rp-btn-primary" onClick={onSubmit} disabled={isSubmitting} aria-busy={isSubmitting} style={{ flex:1 }}>
              {isSubmitting ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .8s linear infinite"}} aria-hidden="true"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Creating Account…</> : <>Create Account <Check size={16} aria-hidden="true"/></>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
