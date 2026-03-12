import React, { useEffect, useRef, useState } from "react";
import { Play, CheckCircle, Pause } from "lucide-react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const QC_ICONS = [
  // Boundary lines — frame/box with corners
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4M21 9V5a2 2 0 00-2-2h-4M21 15v4a2 2 0 01-2 2h-4"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>,
  // Scale — ruler
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M2 12h20M6 8v8M10 10v4M14 10v4M18 8v8"/>
  </svg>,
  // Measurements — dimension arrows
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 20h16M4 4v16M8 16l-4 4 4 4M20 8l4-4-4-4"/>
    <line x1="4" y1="4" x2="20" y2="4"/>
    <line x1="20" y1="4" x2="20" y2="20"/>
  </svg>,
];

// Animated checkmark SVG
const AnimatedCheck = ({ delay = 0, active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="rgba(201,168,76,0.12)" stroke="#c9a84c" strokeWidth="1.5"/>
    <path
      d="M7 12l3.5 3.5L17 8"
      stroke="#c9a84c"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: 14,
        strokeDashoffset: active ? 0 : 14,
        transition: `stroke-dashoffset 0.5s ease ${delay}ms`,
      }}
    />
  </svg>
);

// Scan line animation overlay for the video
const ScanOverlay = ({ scanning }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
    borderRadius: "inherit",
  }}>
    {/* Grid overlay */}
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `
        linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px)
      `,
      backgroundSize: "32px 32px",
    }}/>
    {/* Scanning line */}
    {scanning && (
      <div style={{
        position: "absolute", left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.7) 30%, rgba(201,168,76,0.9) 50%, rgba(201,168,76,0.7) 70%, transparent 100%)",
        animation: "scanline 2.4s ease-in-out infinite",
        boxShadow: "0 0 12px rgba(201,168,76,0.5)",
      }}/>
    )}
    {/* Corner brackets */}
    {[
      { top: "12px", left: "12px", rotate: "0deg" },
      { top: "12px", right: "12px", rotate: "90deg" },
      { bottom: "12px", left: "12px", rotate: "270deg" },
      { bottom: "12px", right: "12px", rotate: "180deg" },
    ].map((pos, i) => (
      <div key={i} style={{ position: "absolute", ...pos }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round">
          <path d="M1 9 L1 1 L9 1"/>
        </svg>
      </div>
    ))}
    {/* HUD labels */}
    <div style={{
      position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)",
      fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em",
      color: "rgba(201,168,76,0.7)", textTransform: "uppercase",
      fontFamily: "monospace",
    }}>
      QC · NORTH-COT · VERIFIED
    </div>
  </div>
);

export default function HowVideo() {
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.quality;
  const sectionRef = useRef(null);
  const [checksActive, setChecksActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [playing, setPlaying] = useState(false);

  const features = (tr?.points || []).map((p, i) => ({
    ...p, number: i + 1, icon: QC_ICONS[i],
  }));

  // Scroll reveal
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll(".qc-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0) scale(1)";
            }, Number(el.dataset.delay || 0));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px) scale(0.97)";
      el.style.transition = "opacity 0.65s ease, transform 0.65s ease";
      observer.observe(el);
    });

    // Trigger checks + scan when section enters view
    const triggerObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setChecksActive(true), 600);
          setTimeout(() => setScanning(true), 900);
          triggerObs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (section) triggerObs.observe(section);
    return () => { observer.disconnect(); triggerObs.disconnect(); };
  }, [lang]);

  return (
    <section
      ref={sectionRef}
      style={{
        background: "linear-gradient(170deg, #0d1f0d 0%, #152815 45%, #1a3419 100%)",
        padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 32px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes scanline {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .qc-feat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 18px;
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
          transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }
        .qc-feat-card:hover {
          background: rgba(201,168,76,0.07);
          border-color: rgba(201,168,76,0.35);
          transform: translateY(-4px);
        }
        .qc-feat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .qc-feat-card:hover::before { opacity: 1; }
        .play-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .play-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 0 8px rgba(201,168,76,0.15), 0 12px 36px rgba(201,168,76,0.3) !important;
        }
        .progress-bar {
          height: 2px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 12px;
        }
        .progress-fill {
          height: 100%;
          width: 35%;
          background: linear-gradient(90deg, #c9a84c, rgba(201,168,76,0.5));
          border-radius: 2px;
          animation: progress-anim 3s ease-in-out infinite alternate;
        }
        @keyframes progress-anim {
          from { width: 20%; }
          to { width: 75%; }
        }
      `}</style>

      {/* Background decorations */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
        {/* Radial glow center */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px", height: "600px",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 65%)",
        }}/>
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          opacity: 0.5,
        }}/>
        {/* Top edge gold line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4) 30%, rgba(201,168,76,0.4) 70%, transparent)",
        }}/>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div className="qc-reveal" data-delay="0" style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 64px)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 18px", borderRadius: "100px",
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.25)",
            marginBottom: "20px",
          }}>
            <span style={{
              position: "relative", display: "inline-flex", width: "8px", height: "8px",
            }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%", background: "#c9a84c",
                animation: "pulse-ring 1.5s ease-out infinite",
              }}/>
              <span style={{ position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: "#c9a84c", display: "inline-block" }}/>
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c9a84c" }}>
              {tr?.tag}
            </span>
          </div>

          <h2 style={{
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            fontStyle: "italic", fontWeight: 600,
            fontSize: "clamp(28px, 3.5vw, 50px)", lineHeight: 1.15,
            color: "white",
            marginBottom: "16px", letterSpacing: "-0.01em",
            maxWidth: "680px", margin: "0 auto 16px",
          }}>
            {tr?.title}
          </h2>
          <p style={{
            fontSize: "clamp(14px, 1.1vw, 16px)", color: "rgba(255,255,255,0.5)",
            lineHeight: 1.8, maxWidth: "520px", margin: "0 auto",
          }}>
            {tr?.subtitle}
          </p>
        </div>

        {/* ── MAIN TWO-COLUMN LAYOUT ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(24px, 4vw, 56px)",
          alignItems: "center",
          marginBottom: "clamp(40px, 6vw, 64px)",
        }}>

          {/* LEFT — VIDEO MOCKUP */}
          <div className="qc-reveal" data-delay="100">
            <div style={{
              position: "relative",
              borderRadius: "22px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.2)",
              animation: "float 5s ease-in-out infinite",
              aspectRatio: "16/10",
              background: "#0a1a0a",
            }}>
              {/* Placeholder image / video frame */}
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop"
                alt="CAD drawing quality review"
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  opacity: 0.55,
                  filter: "saturate(0.4) sepia(0.2)",
                }}
              />

              {/* Scan overlay */}
              <ScanOverlay scanning={scanning} />

              {/* Dark gradient bottom */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                background: "linear-gradient(0deg, rgba(10,26,10,0.85) 0%, transparent 100%)",
              }}/>

              {/* Play button */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <button
                  className="play-btn"
                  onClick={() => setPlaying(!playing)}
                  style={{
                    width: "68px", height: "68px", borderRadius: "50%",
                    background: "rgba(201,168,76,0.9)",
                    border: "2px solid rgba(201,168,76,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 0 0 12px rgba(201,168,76,0.12), 0 8px 28px rgba(201,168,76,0.35)",
                  }}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing
                    ? <Pause size={22} color="#0d1f0d" fill="#0d1f0d"/>
                    : <Play size={22} color="#0d1f0d" fill="#0d1f0d" style={{ marginLeft: "3px" }}/>
                  }
                </button>
              </div>

              {/* Bottom HUD bar */}
              <div style={{
                position: "absolute", bottom: "14px", left: "16px", right: "16px",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "6px",
                }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                    QC REVIEW
                  </span>
                  <span style={{ fontSize: "10px", color: "rgba(201,168,76,0.8)", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                    ● LIVE
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill"/>
                </div>
              </div>
            </div>

            {/* Below video — checklist preview */}
            <div style={{
              marginTop: "16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "14px",
              padding: "14px 18px",
              display: "flex", flexDirection: "column", gap: "8px",
            }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <AnimatedCheck delay={i * 300} active={checksActive} />
                  <span style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                    {f.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — FEATURE CARDS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="qc-feat-card qc-reveal"
                data-delay={String(200 + idx * 110)}
              >
                {/* Large ghost number */}
                <span style={{
                  position: "absolute", bottom: "-6px", right: "12px",
                  fontFamily: "'IBM Plex Serif', Georgia, serif",
                  fontStyle: "italic", fontWeight: 700,
                  fontSize: "72px", lineHeight: 1,
                  color: "rgba(201,168,76,0.06)",
                  pointerEvents: "none", userSelect: "none",
                }}>
                  {feature.number}
                </span>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  {/* Icon */}
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                    background: "rgba(201,168,76,0.10)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#c9a84c",
                  }}>
                    {feature.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    {/* Step indicator */}
                    <div style={{
                      fontSize: "10px", fontWeight: 700, color: "rgba(201,168,76,0.6)",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      marginBottom: "5px", fontFamily: "monospace",
                    }}>
                      CHECK · {String(feature.number).padStart(2, "0")}
                    </div>
                    <h3 style={{
                      fontFamily: "'IBM Plex Serif', Georgia, serif",
                      fontWeight: 600, fontSize: "16px", color: "rgba(255,255,255,0.9)",
                      marginBottom: "6px", lineHeight: 1.3,
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      fontSize: "13px", color: "rgba(255,255,255,0.45)",
                      lineHeight: 1.7, margin: 0,
                    }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM STAT STRIP ── */}
        <div
          className="qc-reveal"
          data-delay="500"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            flexWrap: "wrap", gap: "0",
            background: "rgba(201,168,76,0.06)",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {[
            { value: "100%", label: "Drawings QC-checked" },
            { value: "3-point", label: "Verification checklist" },
            { value: "0", label: "Drawings skipped" },
          ].map((item, i) => (
            <div key={i} style={{
              flex: "1", minWidth: "160px",
              padding: "20px 24px", textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(201,168,76,0.12)" : "none",
            }}>
              <div style={{
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                fontStyle: "italic", fontWeight: 700,
                fontSize: "clamp(22px, 3vw, 32px)", color: "#c9a84c",
                lineHeight: 1, marginBottom: "5px",
              }}>
                {item.value}
              </div>
              <div style={{
                fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}