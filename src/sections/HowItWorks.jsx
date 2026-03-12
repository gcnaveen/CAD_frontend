import React, { useEffect, useRef } from "react";
import { Upload, UserCheck, PenTool, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const STEP_ICONS = [Upload, UserCheck, PenTool, Download];

const STEP_ACCENTS = [
  { color: "#c9a84c", bg: "rgba(201,168,76,0.10)", border: "rgba(201,168,76,0.25)" },
  { color: "#2a6e2a", bg: "rgba(42,110,42,0.09)",  border: "rgba(42,110,42,0.22)"  },
  { color: "#c9a84c", bg: "rgba(201,168,76,0.10)", border: "rgba(201,168,76,0.25)" },
  { color: "#2a6e2a", bg: "rgba(42,110,42,0.09)",  border: "rgba(42,110,42,0.22)"  },
];

// SVG dashed curved arrow pointing right or left
const CurvedArrow = ({ flip = false }) => (
  <svg
    width="120" height="60" viewBox="0 0 120 60"
    style={{ display: "block", transform: flip ? "scaleX(-1)" : "none" }}
    aria-hidden="true"
  >
    <path
      d="M 10 30 Q 60 5 110 30"
      fill="none"
      stroke="#c9a84c"
      strokeWidth="2"
      strokeDasharray="6 5"
      strokeLinecap="round"
    />
    {/* Arrowhead at end */}
    <polyline
      points="100,22 110,30 100,38"
      fill="none"
      stroke="#c9a84c"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Vertical dashed line for mobile
const VerticalDash = () => (
  <svg width="2" height="56" viewBox="0 0 2 56" aria-hidden="true"
    style={{ display: "block", margin: "0 auto" }}>
    <line
      x1="1" y1="0" x2="1" y2="56"
      stroke="#c9a84c" strokeWidth="2"
      strokeDasharray="6 5" strokeLinecap="round"
    />
  </svg>
);

export default function HowItWorks() {
  const navigate = useNavigate();
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.howItWorks;
  const sectionRef = useRef(null);

  const steps = (tr?.steps || []).map((s, i) => ({
    ...s,
    number: i + 1,
    Icon: STEP_ICONS[i],
    accent: STEP_ACCENTS[i],
  }));

  // Scroll reveal
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll(".hiw-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = Number(el.dataset.delay || 0);
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0) scale(1)";
            }, delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );
    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px) scale(0.97)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [lang]);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{
        background: "linear-gradient(180deg, #ede5d0 0%, #e8e0cc 50%, #f0ead8 100%)",
        padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 32px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .hiw-card {
          background: rgba(255,255,255,0.70);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
        }
        .hiw-card:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.11) !important;
        }
        .step-num {
          font-family: 'IBM Plex Serif', Georgia, serif;
          font-style: italic;
          font-weight: 700;
          font-size: 72px;
          line-height: 1;
          position: absolute;
          bottom: -8px;
          right: 14px;
          pointer-events: none;
          user-select: none;
          opacity: 0.045;
          color: #152815;
        }
        .cta-shimmer {
          background: linear-gradient(135deg, #152815 0%, #1d3d1d 100%);
          transition: all 0.25s ease;
        }
        .cta-shimmer:hover {
          background: linear-gradient(135deg, #1d3d1d 0%, #2a5a2a 100%);
          box-shadow: 0 14px 40px rgba(21,40,21,0.38) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 767px) {
          .hiw-desktop-row { display: none !important; }
          .hiw-mobile-col { display: flex !important; }
        }
        @media (min-width: 768px) {
          .hiw-desktop-row { display: flex !important; }
          .hiw-mobile-col { display: none !important; }
        }
      `}</style>

      {/* Background decorations */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
        <div style={{
          position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "300px",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)",
        }} />
        {/* Survey grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }} />
        {/* Corner cross markers — surveying aesthetic */}
        {[["12px","12px"], ["12px","auto"], ["auto","12px"], ["auto","auto"]].map(([t,b,l,r], i) => (
          <div key={i} style={{
            position: "absolute",
            top: i < 2 ? "20px" : "auto", bottom: i >= 2 ? "20px" : "auto",
            left: i % 2 === 0 ? "20px" : "auto", right: i % 2 === 1 ? "20px" : "auto",
            width: "20px", height: "20px", opacity: 0.2,
          }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="#c9a84c" strokeWidth="1.5">
              <line x1="10" y1="0" x2="10" y2="7"/><line x1="10" y1="13" x2="10" y2="20"/>
              <line x1="0" y1="10" x2="7" y2="10"/><line x1="13" y1="10" x2="20" y2="10"/>
              <circle cx="10" cy="10" r="2"/>
            </svg>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div className="hiw-reveal" data-delay="0" style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 72px)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 18px", borderRadius: "100px",
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.3)",
            marginBottom: "20px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c9a84c", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9a7020" }}>
              Process
            </span>
          </div>
          <h2 style={{
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            fontStyle: "italic", fontWeight: 600,
            fontSize: "clamp(30px, 3.8vw, 52px)", lineHeight: 1.15,
            background: "linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 50%, #2a5a2a 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            marginBottom: "14px", letterSpacing: "-0.01em",
          }}>
            {tr?.title}
          </h2>
          <p style={{ fontSize: "clamp(14.5px, 1.1vw, 16.5px)", color: "#6b6252", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto" }}>
            {tr?.subtitle}
          </p>
        </div>

        {/* ── DESKTOP ZIGZAG ROW ── */}
        <div
          className="hiw-desktop-row"
          style={{ alignItems: "flex-start", justifyContent: "center", gap: 0, marginBottom: "clamp(40px, 6vw, 64px)", display: "none" }}
        >
          {steps.map((step, idx) => {
            const { Icon, accent, number, title, description } = step;
            const isEven = idx % 2 === 0;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={number}>
                {/* STEP CARD */}
                <div
                  className="hiw-reveal"
                  data-delay={String(idx * 120)}
                  style={{ flex: "1", maxWidth: "230px", minWidth: "160px" }}
                >
                  {/* Top/bottom positioning via margin to create zigzag */}
                  <div
                    className="hiw-card"
                    style={{
                      marginTop: isEven ? "0px" : "56px",
                      border: `1px solid ${accent.border}`,
                      padding: "24px 20px 28px",
                    }}
                  >
                    {/* Large ghost number */}
                    <span className="step-num">{number}</span>

                    {/* Step number pill */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      background: accent.bg, border: `1px solid ${accent.border}`,
                      borderRadius: "100px", padding: "3px 10px 3px 6px",
                      marginBottom: "16px",
                    }}>
                      <span style={{
                        width: "18px", height: "18px", borderRadius: "50%",
                        background: accent.color, color: "white",
                        fontSize: "10px", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'IBM Plex Serif', Georgia, serif",
                      }}>
                        {number}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: accent.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Step
                      </span>
                    </div>

                    {/* Icon */}
                    <div style={{
                      width: "46px", height: "46px", borderRadius: "13px",
                      background: accent.bg, border: `1px solid ${accent.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: accent.color, marginBottom: "14px",
                    }}>
                      <Icon size={20} />
                    </div>

                    <h3 style={{
                      fontFamily: "'IBM Plex Serif', Georgia, serif",
                      fontWeight: 600, fontSize: "15px", color: "#0d1f0d",
                      marginBottom: "8px", lineHeight: 1.3,
                    }}>
                      {title}
                    </h3>
                    <p style={{ fontSize: "12.5px", color: "#6b6252", lineHeight: 1.7, margin: 0 }}>
                      {description}
                    </p>
                  </div>
                </div>

                {/* CONNECTOR */}
                {!isLast && (
                  <div
                    className="hiw-reveal"
                    data-delay={String(idx * 120 + 60)}
                    style={{
                      flexShrink: 0, width: "80px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: isEven ? "40px" : "96px",
                    }}
                  >
                    <CurvedArrow flip={!isEven} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── MOBILE VERTICAL STACK ── */}
        <div
          className="hiw-mobile-col"
          style={{ flexDirection: "column", gap: 0, marginBottom: "clamp(36px, 6vw, 56px)", display: "none" }}
        >
          {steps.map((step, idx) => {
            const { Icon, accent, number, title, description } = step;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={number}>
                <div
                  className="hiw-reveal"
                  data-delay={String(idx * 120)}
                  style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
                >
                  {/* Left timeline column */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    {/* Node circle */}
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%",
                      background: accent.bg, border: `2px solid ${accent.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: accent.color, flexShrink: 0, zIndex: 1,
                      boxShadow: `0 0 0 4px ${accent.bg}`,
                    }}>
                      <Icon size={17} />
                    </div>
                    {/* Dashed line below */}
                    {!isLast && (
                      <div style={{ flex: 1, paddingTop: "6px", paddingBottom: "6px" }}>
                        <VerticalDash />
                      </div>
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className="hiw-card"
                    style={{
                      flex: 1, padding: "18px 18px 20px",
                      border: `1px solid ${accent.border}`,
                      marginBottom: isLast ? 0 : "8px",
                    }}
                  >
                    <span className="step-num" style={{ fontSize: "56px" }}>{number}</span>
                    <div style={{
                      fontSize: "10px", fontWeight: 700, color: accent.color,
                      letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px",
                    }}>
                      Step {number}
                    </div>
                    <h3 style={{
                      fontFamily: "'IBM Plex Serif', Georgia, serif",
                      fontWeight: 600, fontSize: "15px", color: "#0d1f0d",
                      marginBottom: "6px", lineHeight: 1.3,
                    }}>
                      {title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#6b6252", lineHeight: 1.7, margin: 0 }}>
                      {description}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <div className="hiw-reveal" data-delay="560" style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => navigate("/login")}
            className="cta-shimmer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              padding: "14px 36px", borderRadius: "14px",
              color: "white", fontWeight: 600, fontSize: "14px", letterSpacing: "0.03em",
              border: "none", cursor: "pointer",
              boxShadow: "0 8px 28px rgba(21,40,21,0.28)",
            }}
          >
            <Upload size={16} />
            {tr?.cta}
          </button>
        </div>

      </div>
    </section>
  );
}