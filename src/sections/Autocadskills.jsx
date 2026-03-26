import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";
import {
  ArrowRight,
  Wallet,
  Zap,
  ShieldCheck,
  Layers,
  PenLine,
  Sparkles,
} from "lucide-react";

const FEATURE_ICONS = [Wallet, Zap, ShieldCheck, Layers, PenLine, Sparkles];

const FALLBACK_FEATURES = [
  {
    title: "Per-drawing payouts",
    body: "Get compensated for every approved AutoCAD deliverable you complete through the platform.",
  },
  {
    title: "Rapid settlement",
    body: "Track your work and get paid within 24–48 hours after approval — no long invoice cycles.",
  },
  {
    title: "QC-backed briefs",
    body: "Clear specs and review checkpoints so you draft with confidence and fewer revisions.",
  },
  {
    title: "Focused workload",
    body: "Karnataka survey drawings — Tippani, RTC, and related 2D packages in one pipeline.",
  },
  {
    title: "Draft in your stack",
    body: "Use the AutoCAD workflow you already know; upload DWG + PDF when the job is done.",
  },
  {
    title: "Grow with North-cot",
    body: "Join a curated operator bench alongside licensed survey workflows and steady demand.",
  },
];

const Autocadskills = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.autocadskills;

  const featureDefs = tr?.features?.length ? tr.features : FALLBACK_FEATURES;
  const verticalLabels = tr?.verticalLabels?.length
    ? tr.verticalLabels
    : ["Briefed jobs", "Platform QC", "Timely pay"];

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll(".cad-skill-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const d = Number(el.dataset.delay || 0);
          requestAnimationFrame(() => {
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, d);
          });
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    nodes.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.65s ease, transform 0.65s ease";
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="cad-operators"
      ref={sectionRef}
      className="homepage-font relative overflow-hidden"
      style={{
        padding: "clamp(56px, 9vw, 104px) clamp(16px, 4vw, 40px)",
        background:
          "linear-gradient(168deg, #07140f 0%, #0d2419 32%, #123528 55%, #0c1f16 100%)",
      }}
    >
      {/* Ambient accents */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "min(72vw, 520px)",
            height: "min(72vw, 520px)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-25%",
            left: "-15%",
            width: "min(85vw, 640px)",
            height: "min(85vw, 640px)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 58%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.45,
            backgroundImage: `
              linear-gradient(105deg, transparent 0%, rgba(201,168,76,0.03) 50%, transparent 100%),
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 48px 48px, 48px 48px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "12%",
            right: "12%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)",
          }}
        />
      </div>

      <div className="relative z-1 mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          {/* Left column — narrative */}
          <div>
            <div
              className="cad-skill-reveal mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2"
              style={{
                borderColor: "rgba(201,168,76,0.35)",
                background: "rgba(201,168,76,0.08)",
              }}
              data-delay="0"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: "var(--brand-gold)",
                  boxShadow: "0 0 12px rgba(201,168,76,0.7)",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(244,239,230,0.88)",
                }}
              >
                {tr?.kicker || "Operator program"}
              </span>
            </div>

            <h2
              className="cad-skill-reveal mb-5"
              data-delay="60"
              style={{
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                fontWeight: 600,
                fontStyle: "italic",
                lineHeight: 1.08,
                fontSize: "clamp(2rem, 4.2vw, 3.15rem)",
                color: "rgba(248,250,252,0.96)",
                letterSpacing: "-0.02em",
              }}
            >
              {tr?.titlePrefix || "Turn precision drafting into"}{" "}
              <span className="shimmer-gold">{tr?.titleHighlight || "predictable income"}</span>
            </h2>

            <p
              className="cad-skill-reveal mb-8 max-w-md"
              data-delay="120"
              style={{
                fontSize: "clamp(14px, 1.05vw, 16px)",
                lineHeight: 1.75,
                color: "rgba(226,232,240,0.72)",
              }}
            >
              {tr?.subtitle ||
                "A different kind of CAD gig: structured jobs, survey-grade context, and a payout rhythm designed for serious AutoCAD operators — not endless freelance bidding."}
            </p>

            {/* Vertical rhythm strip — desktop only */}
            <div
              className="cad-skill-reveal hidden lg:flex flex-col gap-3 pl-1"
              data-delay="180"
              style={{
                borderLeft: "2px solid rgba(201,168,76,0.35)",
                paddingLeft: "20px",
              }}
            >
              {verticalLabels.map((label) => (
                <span
                  key={label}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(201,168,76,0.92)",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right column — mosaic cards */}
          <div
            className="grid gap-3 sm:grid-cols-2 sm:gap-4"
            style={{ gridAutoRows: "minmax(0, auto)" }}
          >
            {featureDefs.map((f, i) => (
              <article
                key={f?.title || i}
                className="cad-skill-reveal card-lift group rounded-2xl border p-5 sm:p-6"
                data-delay={String(80 + i * 55)}
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                  boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
                }}
              >
                <div className="flex gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: "rgba(201,168,76,0.18)",
                      border: "1px solid rgba(201,168,76,0.35)",
                      color: "var(--brand-gold)",
                    }}
                  >
                    {(() => {
                      const Icon = FEATURE_ICONS[i] || Wallet;
                      return <Icon size={22} strokeWidth={1.75} />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "rgba(248,250,252,0.95)",
                        marginBottom: "8px",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {f?.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "13.5px",
                        lineHeight: 1.65,
                        color: "rgba(226,232,240,0.62)",
                        margin: 0,
                      }}
                    >
                      {f?.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Bottom band */}
        <div
          className="cad-skill-reveal mx-auto mt-14 max-w-3xl"
          data-delay="420"
          style={{
            borderRadius: "20px",
            border: "1px solid rgba(201,168,76,0.22)",
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.07) 0%, rgba(201,168,76,0.06) 50%, rgba(255,255,255,0.04) 100%)",
            padding: "clamp(18px, 3vw, 26px) clamp(20px, 4vw, 32px)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 6px 0",
              fontSize: "clamp(15px, 1.2vw, 17px)",
              fontWeight: 600,
              color: "rgba(248,250,252,0.9)",
            }}
          >
            {tr?.bottomFeePrefix || "Typical survey drawing fee on North-cot —"}{" "}
            <span
              style={{
                color: "var(--brand-gold)",
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                fontSize: "1.15em",
              }}
            >
              ₹500
            </span>{" "}
            <span
              style={{
                color: "rgba(226,232,240,0.55)",
                fontWeight: 500,
                fontSize: "0.92em",
              }}
            >
              {tr?.operatorSharePrefix || "(operator share up to"}{" "}
              <span style={{ color: "rgba(201,168,76,0.95)" }}>₹400</span>{" "}
              {tr?.operatorShareSuffix || "depending on tier)"}
            </span>
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "rgba(226,232,240,0.5)",
            }}
          >
            {tr?.bottomDisclaimer ||
              "Figures indicative; final rates confirmed when you onboard."}
          </p>
        </div>

        <div
          className="cad-skill-reveal mt-10 flex justify-center"
          data-delay="480"
        >
          <button
            type="button"
            onClick={() => navigate("/register/cad-operator")}
            className="btn-primary-shimmer inline-flex items-center justify-center gap-2 rounded-full border-0 px-10 py-3.5 text-[15px] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "rgba(244, 239, 230, 0.96)",
              color: "#0f2418",
              boxShadow:
                "0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(201,168,76,0.25)",
              cursor: "pointer",
            }}
          >
            {tr?.ctaButton || "Register as an operator"}
            <ArrowRight size={18} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Autocadskills;
