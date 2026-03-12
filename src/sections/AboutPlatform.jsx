import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";
import { FileText, Users, ShieldCheck, X, Check } from "lucide-react";

export default function AboutPlatform() {
  const lang = useSelector((state) => state.language?.lang || "en");
  const featureCards = translations[lang]?.about?.featureCards || [];
  const sectionRef = useRef(null);

  // Scroll-triggered reveal
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll(".scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.delay || 0;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, Number(delay));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition = "opacity 0.65s ease, transform 0.65s ease";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [lang]);

  const featureIcons = [
    <FileText size={22} />,
    <Users size={22} />,
    <ShieldCheck size={22} />,
  ];

  const problems = translations[lang]?.about?.problems || [];
  const solutions = translations[lang]?.about?.solutions || [];

  return (
    <section
      ref={sectionRef}
      id="about-platform"
      style={{
        background: "linear-gradient(180deg, #f7f2e8 0%, #f0ead8 60%, #ede5d0 100%)",
        padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 32px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .ap-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232,226,216,0.85);
          border-radius: 20px;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 2px 16px rgba(0,0,0,0.055);
        }
        .ap-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.10);
        }
        .prob-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(232,226,216,0.6);
        }
        .prob-item:last-child { border-bottom: none; }
        .sol-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(201,168,76,0.12);
        }
        .sol-item:last-child { border-bottom: none; }
        .feat-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(232,226,216,0.85);
          border-radius: 18px;
          padding: 32px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 14px rgba(0,0,0,0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .feat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #c9a84c, rgba(201,168,76,0.3));
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .feat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 40px rgba(0,0,0,0.10);
        }
        .feat-card:hover::before { opacity: 1; }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9a7020;
        }
      `}</style>

      {/* Ambient background decorations */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
        <div style={{
          position: "absolute", top: "-80px", right: "-100px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", left: "-80px",
          width: "420px", height: "420px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(21,40,21,0.06) 0%, transparent 65%)",
        }} />
        {/* Subtle dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── SECTION HEADER ── */}
        <div className="scroll-reveal" data-delay="0" style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 72px)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 18px", borderRadius: "100px",
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.3)",
            marginBottom: "20px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c9a84c", display: "inline-block" }} />
            <span className="section-label">The Platform</span>
          </div>

          <h2 style={{
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: "clamp(30px, 3.8vw, 52px)",
            lineHeight: 1.15,
            background: "linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 50%, #2a5a2a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "16px",
            letterSpacing: "-0.01em",
          }}>
            {translations[lang]?.about?.title}
          </h2>

          <p style={{
            fontSize: "clamp(14.5px, 1.1vw, 16.5px)",
            color: "#6b6252",
            lineHeight: 1.8,
            maxWidth: "560px",
            margin: "0 auto",
          }}>
            {translations[lang]?.about?.subtitle}
          </p>
        </div>

        {/* ── PROBLEM vs SOLUTION ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginBottom: "clamp(40px, 6vw, 72px)",
          }}
        >
          {/* PROBLEM CARD */}
          <div className="ap-card scroll-reveal" data-delay="80" style={{ padding: "clamp(24px, 3vw, 36px)" }}>
            {/* Card header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              marginBottom: "28px",
              paddingBottom: "20px",
              borderBottom: "1px solid rgba(232,226,216,0.7)",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "rgba(239,68,68,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <X size={20} color="#ef4444" strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{
                  fontFamily: "'IBM Plex Serif', Georgia, serif",
                  fontWeight: 600, fontSize: "19px", color: "#1a1a1a",
                  margin: 0, marginBottom: "2px",
                }}>
                  {translations[lang]?.about?.problemTitle}
                </h3>
                <p style={{ fontSize: "12.5px", color: "#9a8f80", margin: 0 }}>
                  {translations[lang]?.about?.problemSubtitle}
                </p>
              </div>
            </div>

            {/* Problem items */}
            <div>
              {problems.map((item, idx) => (
                <div key={idx} className="prob-item">
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "6px",
                    background: "rgba(239,68,68,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px",
                  }}>
                    <X size={11} color="#ef4444" strokeWidth={2.5} />
                  </div>
                  <p style={{ fontSize: "14px", color: "#5a5248", lineHeight: 1.65, margin: 0 }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SOLUTION CARD */}
          <div
            className="ap-card scroll-reveal"
            data-delay="160"
            style={{
              padding: "clamp(24px, 3vw, 36px)",
              background: "linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(253,246,227,0.6) 100%)",
              borderColor: "rgba(201,168,76,0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Gold top accent */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "3px",
              background: "linear-gradient(90deg, #c9a84c, rgba(201,168,76,0.3))",
            }} />

            {/* Card header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              marginBottom: "28px",
              paddingBottom: "20px",
              borderBottom: "1px solid rgba(201,168,76,0.15)",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "rgba(201,168,76,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Check size={20} color="#c9a84c" strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{
                  fontFamily: "'IBM Plex Serif', Georgia, serif",
                  fontWeight: 600, fontSize: "19px", color: "#1a1a1a",
                  margin: 0, marginBottom: "2px",
                }}>
                  {translations[lang]?.about?.solutionTitle}
                </h3>
                <p style={{ fontSize: "12.5px", color: "#9a8f80", margin: 0 }}>
                  {translations[lang]?.about?.solutionSubtitle}
                </p>
              </div>
            </div>

            {/* Solution items */}
            <div>
              {solutions.map((item, idx) => (
                <div key={idx} className="sol-item">
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "6px",
                    background: "rgba(201,168,76,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px",
                  }}>
                    <Check size={11} color="#c9a84c" strokeWidth={2.5} />
                  </div>
                  <p style={{ fontSize: "14px", color: "#3a3228", lineHeight: 1.65, margin: 0, fontWeight: 450 }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="scroll-reveal" data-delay="0" style={{
          display: "flex", alignItems: "center", gap: "12px",
          marginBottom: "clamp(32px, 5vw, 56px)",
        }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3))" }} />
          <span className="section-label" style={{ whiteSpace: "nowrap" }}>Why Choose Us</span>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)" }} />
        </div>

        {/* ── FEATURE CARDS ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
          }}
        >
          {featureCards.map((card, idx) => (
            <div
              key={idx}
              className="feat-card scroll-reveal"
              data-delay={String(idx * 100)}
            >
              {/* Large faint icon in background */}
              <div style={{
                position: "absolute", bottom: "-10px", right: "-10px",
                opacity: 0.04, color: "#152815",
                transform: "scale(4)",
                pointerEvents: "none",
              }}>
                {featureIcons[idx]}
              </div>

              {/* Icon badge */}
              <div style={{
                width: "52px", height: "52px", borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.06) 100%)",
                border: "1px solid rgba(201,168,76,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 18px",
                color: "#c9a84c",
              }}>
                {featureIcons[idx]}
              </div>

              {/* Number badge */}
              <div style={{
                position: "absolute", top: "18px", right: "18px",
                fontSize: "11px", fontWeight: 700, color: "rgba(201,168,76,0.5)",
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                fontStyle: "italic",
                letterSpacing: "0.05em",
              }}>
                0{idx + 1}
              </div>

              <h3 style={{
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                fontWeight: 600, fontSize: "17px", color: "#0d1f0d",
                marginBottom: "10px",
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: "13.5px", color: "#6b6252", lineHeight: 1.7,
                margin: 0,
              }}>
                {card.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}