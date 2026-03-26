import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  MapPin,
  Briefcase,
} from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import InstallButton from "../../components/pwa/InstallButton.jsx";

const STEPS = [
  { key: 1, label: "Profile", short: "You", Icon: User },
  { key: 2, label: "Location", short: "Where", Icon: MapPin },
  { key: 3, label: "Expertise", short: "Skills", Icon: Briefcase },
];

const initialForm = {
  fullName: "",
  mobile: "",
  email: "",
  address: "",
  skills: "",
  yearsExperience: "",
};

function digitsOnly(s) {
  return (s || "").replace(/\D/g, "");
}

export default function Cadregisterform() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [karnatakaConfirmed, setKarnatakaConfirmed] = useState(false);

  const progressPct = useMemo(
    () => ((step - 1) / (STEPS.length - 1)) * 100,
    [step]
  );

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.fullName.trim()) e.fullName = "Enter your full name";
      const m = digitsOnly(form.mobile);
      if (m.length !== 10) e.mobile = "Enter a valid 10-digit mobile number";
      const em = form.email.trim();
      if (!em) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) e.email = "Enter a valid email";
    }
    if (s === 3) {
      if (!form.skills.trim()) e.skills = "Describe your AutoCAD skills";
      const y = String(form.yearsExperience).trim();
      if (y === "" || Number.isNaN(Number(y)) || Number(y) < 0)
        e.yearsExperience = "Enter years of experience (0 or more)";
      if (!karnatakaConfirmed)
        e.karnatakaConfirm =
          "Confirm that you work on Karnataka survey drawings only — we do not onboard operators for other states.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < STEPS.length) setStep(step + 1);
  };

  const goBack = () => {
    setErrors({});
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validateStep(3)) return;
    const payload = {
      ...form,
      mobile: digitsOnly(form.mobile),
      yearsExperience: Number(form.yearsExperience),
      karnatakaOperatorOnly: true,
    };
    console.info("[CAD operator registration]", payload);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="homepage-font theme-animate-surface relative flex min-h-dvh flex-col items-center justify-center px-4 py-10"
        style={{
          background:
            "linear-gradient(168deg, #07140f 0%, #0d2419 40%, #123528 58%, #0c1f16 100%)",
          color: "rgba(248,250,252,0.95)",
        }}
      >
        <div
          className="absolute top-0 right-0 flex items-center gap-2 p-4"
          style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
        >
          <ThemeToggle variant="compact" />
          <InstallButton
            size="middle"
            showLabel={false}
            style={{
              borderColor: "rgba(201,168,76,0.35)",
              color: "var(--brand-gold)",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
            }}
          />
        </div>
        <div
          className="max-w-md text-center"
          style={{
            padding: "clamp(28px, 5vw, 40px)",
            borderRadius: "24px",
            border: "1px solid rgba(201,168,76,0.25)",
            background: "rgba(255,255,255,0.05)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(201,168,76,0.2)",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "var(--brand-gold)",
            }}
          >
            <Check size={32} strokeWidth={2} />
          </div>
          <h1
            style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontWeight: 600,
              fontStyle: "italic",
              fontSize: "clamp(1.5rem, 4vw, 1.85rem)",
              marginBottom: "12px",
            }}
          >
            Application received
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.65, color: "rgba(226,232,240,0.7)", marginBottom: "28px" }}>
            Thanks, {form.fullName || "there"}. Our team will review your profile and
            reach out on your registered number or email.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-[14px] font-semibold no-underline transition-transform hover:scale-[1.02]"
            style={{
              background: "rgba(244, 239, 230, 0.96)",
              color: "#0f2418",
              boxShadow: "0 8px 28px rgba(0,0,0,0.2)",
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = (name) =>
    `cad-op-input w-full rounded-[14px] border px-[14px] py-3 text-[14px] outline-none transition-all ${errors[name] ? "cad-op-input--error" : ""}`;

  return (
    <div
      className="homepage-font theme-animate-surface relative min-h-dvh overflow-x-hidden"
      style={{
        background:
          "linear-gradient(168deg, #07140f 0%, #0d2419 38%, #123528 55%, #0c1f16 100%)",
        color: "rgba(248,250,252,0.92)",
      }}
    >
      <style>{`
        .cad-op-input {
          background: rgba(255,255,255,0.06);
          border-color: rgba(201,168,76,0.22);
          color: rgba(248,250,252,0.95);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .cad-op-input::placeholder { color: rgba(226,232,240,0.38); }
        .cad-op-input:focus {
          border-color: rgba(201,168,76,0.55);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.09);
        }
        .cad-op-input--error {
          border-color: rgba(248,113,113,0.55) !important;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.12) !important;
        }
      `}</style>

      {/* Top bar */}
      <header
        className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4 pb-2 sm:px-6"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-full border bg-transparent px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-white/5"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            color: "rgba(226,232,240,0.85)",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} />
          {step === 1 ? "Back" : "Previous"}
        </button>
        {/* <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <InstallButton
            size="middle"
            showLabel={false}
            style={{
              borderColor: "rgba(201,168,76,0.35)",
              color: "var(--brand-gold)",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
            }}
          />
        </div> */}
      </header>

      <div className="relative z-1 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-2 sm:px-6">
        <div className="mb-6 text-center">
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(201,168,76,0.9)",
              marginBottom: "10px",
            }}
          >
            CAD operator
          </p>
          <h1
            style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontWeight: 600,
              fontStyle: "italic",
              fontSize: "clamp(1.65rem, 4.5vw, 2.1rem)",
              lineHeight: 1.15,
              margin: "0 0 8px 0",
            }}
          >
            Register here
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(226,232,240,0.55)", lineHeight: 1.55 }}>
            Three quick steps — same forest-and-gold look as the rest of North-cot.
          </p>
          <p
            style={{
              margin: "12px 0 0 0",
              fontSize: "12px",
              lineHeight: 1.55,
              color: "rgba(201,168,76,0.88)",
              maxWidth: "28rem",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Karnataka only: we onboard CAD operators for Karnataka survey work. Applications aimed at other states are
            not accepted.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div
            className="relative mx-auto mb-3 h-1.5 max-w-[280px] overflow-hidden rounded-full sm:max-w-[320px]"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, var(--brand-gold-muted), var(--brand-gold))",
              }}
            />
          </div>
          <div className="flex justify-between gap-1 sm:gap-2">
            {STEPS.map(({ key, label, short, Icon }) => {
              const active = step === key;
              const done = step > key;
              return (
                <div
                  key={key}
                  className="flex flex-1 flex-col items-center gap-1.5 text-center"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all sm:h-11 sm:w-11"
                    style={{
                      borderColor: done || active ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.1)",
                      background: active
                        ? "rgba(201,168,76,0.2)"
                        : done
                          ? "rgba(201,168,76,0.1)"
                          : "rgba(255,255,255,0.04)",
                      color: active || done ? "var(--brand-gold)" : "rgba(226,232,240,0.35)",
                    }}
                  >
                    {done ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} strokeWidth={1.75} />}
                  </div>
                  <span
                    className="hidden text-[11px] font-bold uppercase tracking-wider sm:block"
                    style={{ color: active ? "rgba(248,250,252,0.9)" : "rgba(226,232,240,0.4)" }}
                  >
                    {label}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider sm:hidden"
                    style={{ color: active ? "rgba(248,250,252,0.85)" : "rgba(226,232,240,0.38)" }}
                  >
                    {short}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}
          className="flex flex-1 flex-col rounded-[22px] border p-5 sm:p-7"
          style={{
            borderColor: "rgba(255,255,255,0.1)",
            background:
              "linear-gradient(165deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
            minHeight: "min(52vh, 420px)",
          }}
        >
          {step === 1 && (
            <div className="flex flex-1 flex-col gap-5">
              <Field
                label="Full name"
                error={errors.fullName}
                input={
                  <input
                    className={inputClass("fullName")}
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    autoComplete="name"
                  />
                }
              />
              <Field
                label="Mobile number"
                error={errors.mobile}
                input={
                  <input
                    className={inputClass("mobile")}
                    placeholder="10-digit Indian mobile"
                    inputMode="numeric"
                    maxLength={14}
                    value={form.mobile}
                    onChange={(e) => setField("mobile", e.target.value)}
                    autoComplete="tel"
                  />
                }
              />
              <Field
                label="Email"
                error={errors.email}
                input={
                  <input
                    className={inputClass("email")}
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    autoComplete="email"
                  />
                }
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-1 flex-col gap-5">
              <Field
                label="Address (optional)"
                error={errors.address}
                hint="If you add it: city, district, PIN — helps match you to nearby survey clusters."
                input={
                  <textarea
                    className={`${inputClass("address")} min-h-[140px] resize-y`}
                    placeholder="House / street, area, city, district, state, PIN"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    rows={5}
                  />
                }
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-1 flex-col gap-5">
              <Field
                label="Skills"
                error={errors.skills}
                hint="e.g. 2D survey drafting, layers & xrefs, Tippani / RTC packages"
                input={
                  <textarea
                    className={`${inputClass("skills")} min-h-[120px] resize-y`}
                    placeholder="List software versions, specializations, and drawing types you handle best"
                    value={form.skills}
                    onChange={(e) => setField("skills", e.target.value)}
                    rows={4}
                  />
                }
              />
              <Field
                label="Years of experience"
                error={errors.yearsExperience}
                input={
                  <input
                    className={inputClass("yearsExperience")}
                    type="number"
                    min={0}
                    max={60}
                    step={0.5}
                    placeholder="e.g. 4"
                    value={form.yearsExperience}
                    onChange={(e) => setField("yearsExperience", e.target.value)}
                  />
                }
              />
              <div>
                <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-[rgba(201,168,76,0.22)] bg-[rgba(255,255,255,0.04)] p-3.5 sm:p-4">
                  <input
                    type="checkbox"
                    checked={karnatakaConfirmed}
                    onChange={(e) => {
                      setKarnatakaConfirmed(e.target.checked);
                      setErrors((prev) => ({ ...prev, karnatakaConfirm: undefined }));
                    }}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[rgba(201,168,76,0.4)] accent-[#c9a84c]"
                  />
                  <span style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(248,250,252,0.88)" }}>
                    I confirm I am registering to draft{" "}
                    <span style={{ color: "rgba(244,239,230,0.98)", fontWeight: 700 }}>Karnataka</span> survey/Tippani
                    packages on North-cot, and I understand the platform does{" "}
                    <span style={{ color: "rgba(244,239,230,0.98)", fontWeight: 700 }}>not</span> onboard operators for
                    work outside Karnataka.
                  </span>
                </label>
                {errors.karnatakaConfirm && (
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#fca5a5" }}>{errors.karnatakaConfirm}</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto flex flex-col-reverse gap-3 pt-8 sm:flex-row sm:justify-end">
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-0 py-3.5 text-[15px] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:min-w-[160px]"
                style={{
                  background: "rgba(244, 239, 230, 0.96)",
                  color: "#0f2418",
                  cursor: "pointer",
                  boxShadow: "0 10px 32px rgba(0,0,0,0.22)",
                }}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-0 py-3.5 text-[15px] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:min-w-[180px]"
                style={{
                  background: "rgba(244, 239, 230, 0.96)",
                  color: "#0f2418",
                  cursor: "pointer",
                  boxShadow: "0 10px 32px rgba(0,0,0,0.22)",
                }}
              >
                Submit application
                <Check size={18} strokeWidth={2.25} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* soft glow */}
      <div
        className="pointer-events-none fixed bottom-0 left-1/2 h-40 w-[120%] -translate-x-1/2 opacity-40"
        style={{
          background: "radial-gradient(ellipse at center, rgba(201,168,76,0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

function Field({ label, hint, error, input }) {
  return (
    <div>
      <label
        className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "rgba(201,168,76,0.85)" }}
      >
        {label}
      </label>
      {input}
      {hint && !error && (
        <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "rgba(226,232,240,0.45)" }}>{hint}</p>
      )}
      {error && (
        <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#fca5a5" }}>{error}</p>
      )}
    </div>
  );
}
