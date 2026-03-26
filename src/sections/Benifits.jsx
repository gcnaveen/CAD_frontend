import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";
import {
  IndianRupee, FileText, Link2, Bell, ArrowRight,
  Check, Shield, RefreshCw, Clock
} from "lucide-react";

const BENEFIT_ICONS = [IndianRupee, FileText, Link2, Bell];

const INCLUDED = [
  "Professional 2D AutoCAD drawing of Karnataka survey plot",
  "Admin review of uploaded documents before job assignment",
  "6-point QC review before delivery",
  "DWG (editable) and PDF (print-ready) both formats",
  "Secure, order-specific download link",
  "WhatsApp notifications at assignment, completion, and delivery",
  "24/7 order acceptance — order any time",
];

export default function Benefits() {
  const navigate = useNavigate();
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.benefits;
  const sectionRef = useRef(null);
  const included = tr?.includedItems?.length ? tr.includedItems : INCLUDED;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll(".ben-reveal");
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
      { threshold: 0.1 }
    );
    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(22px) scale(0.98)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [lang]);

  const cards = (tr?.cards || []).map((c, i) => ({ ...c, Icon: BENEFIT_ICONS[i] }));
  const stats = tr?.stats || [];

  return (
    <section
      id="benefits"
      ref={sectionRef}
      style={{
        background: "var(--section-benefits-bg)",
        padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 32px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .pricing-card {
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(16px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.10), 0 0 0 1px rgba(201,168,76,0.18);
          position: relative;
        }
        .fee-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 0;
          border-bottom: 1px solid rgba(232,226,216,0.7);
        }
        .fee-row:last-child { border-bottom: none; }
        .include-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 7px 0;
        }
        .ben-mini-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(232,226,216,0.85);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .ben-mini-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 32px rgba(0,0,0,0.09);
          border-color: rgba(201,168,76,0.3);
        }
        .place-order-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--homepage-cta-bg) 0%, color-mix(in srgb, var(--homepage-cta-bg) 90%, black) 100%);
          color: white;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.03em;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 28px rgba(21,40,21,0.28);
          transition: all 0.25s ease;
        }
        .place-order-btn:hover {
          background: linear-gradient(135deg, color-mix(in srgb, var(--homepage-cta-bg) 90%, black) 0%, var(--forest-green-mid) 100%);
          box-shadow: 0 12px 36px rgba(21,40,21,0.38);
          transform: translateY(-2px);
        }
        .info-box {
          background: rgba(201,168,76,0.07);
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 12px;
          padding: 14px 16px;
        }
        .total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 0 0;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes float-slow2 {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
      `}</style>

      {/* Background decorations */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
        <div style={{
          position: "absolute", top: "-80px", right: "-60px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "-60px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(21,40,21,0.06) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.12) 1px, transparent 1px)",
          backgroundSize: "40px 40px", opacity: 0.4,
        }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div className="ben-reveal" data-delay="0" style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 64px)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 18px", borderRadius: "100px",
            background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
            marginBottom: "20px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand-gold)", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand-gold-muted)" }}>
              {tr?.kicker || "Simple Pricing"}
            </span>
          </div>
          <h2
            className="home-serif-title"
            style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic", fontWeight: 600,
              fontSize: "clamp(30px, 4vw, 54px)", lineHeight: 1.12,
              background: "var(--hero-panel-bg)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              marginBottom: "14px", letterSpacing: "-0.01em",
            }}
          >
            {tr?.title}
          </h2>
          <p className="ben-section-lead" style={{ fontSize: "clamp(14.5px, 1.1vw, 16.5px)", color: "var(--text-brown-muted)", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto" }}>
            {tr?.subtitle}
          </p>
        </div>

        {/* ── MAIN LAYOUT: pricing card LEFT, benefits grid RIGHT ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(20px, 3vw, 48px)",
          alignItems: "start",
          marginBottom: "clamp(40px, 6vw, 64px)",
        }}>

          {/* ── PRICING CARD ── */}
          <div className="ben-reveal pricing-card" data-delay="80">
            {/* Gold top bar */}
            <div style={{
              background: "linear-gradient(135deg, var(--homepage-cta-bg) 0%, color-mix(in srgb, var(--homepage-cta-bg) 90%, black) 100%)",
              padding: "28px 28px 24px",
              position: "relative", overflow: "hidden",
            }}>
              {/* Faint grid */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `linear-gradient(color-mix(in srgb, var(--brand-gold) 10%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--brand-gold) 10%, transparent) 1px, transparent 1px)`,
                backgroundSize: "28px 28px",
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(201,168,76,0.7)", marginBottom: "8px" }}>
                  {tr?.pricingCardKicker || "Professional CAD Drawing"}
                </p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", lineHeight: 1 }}>
                  <span style={{
                    fontFamily: "'IBM Plex Serif', Georgia, serif",
                    fontStyle: "italic", fontWeight: 700,
                    fontSize: "clamp(52px, 8vw, 72px)", color: "white", lineHeight: 1,
                  }}>
                    ₹500
                  </span>
                  <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", paddingBottom: "10px", fontWeight: 500 }}>
                    /drawing
                  </span>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="ben-ink-scope" style={{ padding: "24px 28px 28px" }}>

              {/* Fee breakdown */}
              <div style={{
                background: "rgba(244,239,230,0.6)",
                border: "1px solid rgba(232,226,216,0.8)",
                borderRadius: "14px",
                padding: "6px 18px",
                marginBottom: "22px",
              }}>
                <div className="fee-row">
                  <div>
                    <p style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
                      {tr?.bookingFeeLabel || "Booking fee"}
                    </p>
                    <p className="ben-ink-muted" style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
                      {tr?.bookingFeeSubtitle || "At order submission (Step 1)"}
                    </p>
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontWeight: 700, fontSize: "17px", color: "var(--brand-green-deep)" }}>₹100</span>
                </div>
                <div className="fee-row">
                  <div>
                    <p style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
                      {tr?.downloadFeeLabel || "Download fee"}
                    </p>
                    <p className="ben-ink-muted" style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
                      {tr?.downloadFeeSubtitle || "When drawing is ready (Step 4)"}
                    </p>
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontWeight: 700, fontSize: "17px", color: "var(--brand-green-deep)" }}>₹400</span>
                </div>
                <div className="total-row">
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-green-deep)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {tr?.totalLabel || "Total"}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontWeight: 700, fontSize: "20px", color: "var(--brand-gold)" }}>₹500</span>
                </div>
              </div>

              {/* What's included */}
              <p className="ben-included-kicker" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand-gold-muted)", marginBottom: "12px" }}>
                {tr?.includedKicker || "What's included"}
              </p>
              <div style={{ marginBottom: "22px" }}>
                {included.map((item, i) => (
                  <div key={i} className="include-item">
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                      background: "rgba(42,110,42,0.1)", border: "1px solid rgba(42,110,42,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: "1px",
                    }}>
                      <Check size={10} color="var(--forest-green-mid)" strokeWidth={2.5} />
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.55, margin: 0 }}>{item}</p>
                  </div>
                ))}
              </div>

              {/* Info boxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "22px" }}>
                <div className="info-box" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <RefreshCw size={14} color="var(--brand-gold-muted)" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-brown)", margin: "0 0 2px" }}>
                      {tr?.separateChargesTitle || "Separate Charges"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--accent-brown-muted)", margin: 0, lineHeight: 1.5 }}>
                      {tr?.separateChargesDesc ||
                        "Drawing revision (if corrections needed after delivery): ₹100"}
                    </p>
                  </div>
                </div>
                <div className="info-box" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Shield size={14} color="var(--brand-gold-muted)" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-brown)", margin: "0 0 2px" }}>
                      {tr?.refundPolicyTitle || "Refund Policy"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--accent-brown-muted)", margin: 0, lineHeight: 1.5 }}>
                      {tr?.refundPolicyDesc ||
                        "Full refund available unless assigned to a CAD operator. No refund after drawing is completed."}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button className="place-order-btn" onClick={() => navigate("/login")}>
                {tr?.ctaUpload || "Upload Your Drawing"}
                <ArrowRight size={16} />
              </button>

              <p className="ben-footnote" style={{ fontSize: "11px", color: "var(--text-brown-soft)", textAlign: "center", marginTop: "12px", lineHeight: 1.5 }}>
                {tr?.footnote ||
                  "1st revision free within 48 hours. After that: ₹100 per revision."}
              </p>
            </div>
          </div>

          {/* ── RIGHT SIDE: benefit mini-cards + trust section ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* 4 benefit cards */}
            {cards.map((card, idx) => {
              const Icon = card.Icon;
              return (
                <div
                  key={idx}
                  className="ben-mini-card ben-mini-ink ben-reveal"
                  data-delay={String(120 + idx * 90)}
                >
                  {/* ghost number */}
                  <span style={{
                    position: "absolute", bottom: "-4px", right: "12px",
                    fontFamily: "'IBM Plex Serif', Georgia, serif",
                    fontStyle: "italic", fontWeight: 700, fontSize: "60px",
                    color: "rgba(201,168,76,0.06)", pointerEvents: "none", userSelect: "none", lineHeight: 1,
                  }}>
                    {idx + 1}
                  </span>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "11px", flexShrink: 0,
                      background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-gold)",
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 style={{
                        fontFamily: "'IBM Plex Serif', Georgia, serif",
                        fontWeight: 600, fontSize: "15px", color: "var(--brand-green-deep)",
                        marginBottom: "5px", lineHeight: 1.3,
                      }}>
                        {card.title}
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--text-brown-muted)", lineHeight: 1.65, margin: 0 }}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Trust section */}
            <div
              className="ben-reveal ben-trust-surface"
              data-delay="520"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--homepage-cta-bg) 97%, transparent) 0%, var(--brand-green-deep) 100%)",
                borderRadius: "20px",
                padding: "28px 24px",
                position: "relative", overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              }}
            >
              {/* Dot grid */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.10) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h3 style={{
                  fontFamily: "'IBM Plex Serif', Georgia, serif",
                  fontStyle: "italic", fontWeight: 600, fontSize: "19px",
                  color: "white", marginBottom: "6px", lineHeight: 1.3,
                }}>
                  {tr?.trustTitle}
                </h3>
                <p className="ben-trust-sub" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.65, marginBottom: "20px" }}>
                  {tr?.trustSubtitle}
                </p>

                {/* Stats row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}>
                  {stats.map((stat, i) => (
                    <div key={i} className="ben-trust-stat-cell" style={{
                      background: "rgba(201,168,76,0.08)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "12px", padding: "12px 14px",
                      textAlign: "center",
                    }}>
                      <div className="ben-trust-stat-value" style={{
                        fontFamily: "'IBM Plex Serif', Georgia, serif",
                        fontStyle: "italic", fontWeight: 700,
                        fontSize: "clamp(18px, 2.5vw, 26px)", color: "var(--brand-gold)",
                        lineHeight: 1, marginBottom: "4px",
                      }}>
                        {stat.value}
                      </div>
                      <div className="ben-trust-stat-label" style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}