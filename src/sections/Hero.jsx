import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { t } from "../constants/translation";
import { ArrowRight, MapPin, Clock, ShieldCheck, IndianRupee } from "lucide-react";
import SurveyingBackground from "../components/SurveyingBackground";

const Hero = () => {
  const navigate = useNavigate();
  const lang = useSelector((state) => state.language?.lang || "en");
  const rootRef = useRef(null);

  const scrollToHowItWorks = () => {
    const element = document.getElementById("how-it-works");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Magnetic button effect
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const btns = root.querySelectorAll(".magnetic-btn");
    const handlers = [];
    btns.forEach((btn) => {
      const onMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.02)`;
      };
      const onLeave = () => { btn.style.transform = ""; };
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);
      handlers.push({ btn, onMove, onLeave });
    });
    return () => handlers.forEach(({ btn, onMove, onLeave }) => {
      btn.removeEventListener("mousemove", onMove);
      btn.removeEventListener("mouseleave", onLeave);
    });
  }, []);

  // Stagger stat cards on mount
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = root.querySelectorAll(".stat-card-anim");
    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      setTimeout(() => {
        card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, 300 + i * 100);
    });
  }, [lang]);

  // Hero text reveal
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".reveal-up");
    els.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      setTimeout(() => {
        el.style.transition = "opacity 0.7s ease, transform 0.7s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, i * 120);
    });
  }, [lang]);

  const stats = useMemo(() => [
    { icon: <IndianRupee size={16} />, value: t(lang, "hero.stats.priceValue"), label: t(lang, "hero.stats.priceLabel") },
    { icon: <Clock size={16} />, value: t(lang, "hero.stats.deliveryValue"), label: t(lang, "hero.stats.deliveryLabel") },
    { icon: <MapPin size={16} />, value: t(lang, "hero.stats.regionValue"), label: t(lang, "hero.stats.regionLabel") },
    { icon: <ShieldCheck size={16} />, value: t(lang, "hero.stats.qcValue"), label: t(lang, "hero.stats.qcLabel") },
  ], [lang]);

  const marqueeItems = useMemo(() => [
    "Licensed Land Surveyors", "AutoCAD Drawings", "₹500 Fixed Price",
    "48-Hour Delivery", "Karnataka Only", "QC-Assured Process",
    "Tippani · RTC · Survey", "North-cot Platform",
  ], []);

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden flex flex-col"
      style={{
        background: "var(--hero-bg)",
        minHeight: "100vh",
        paddingTop: "70px",
      }}
    >
      {/* Decorative background elements */}
      <SurveyingBackground />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Large ambient orb top-left */}
        <div style={{
          position: "absolute", top: "-120px", left: "-100px",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)",
        }} />
        {/* Bottom right orb */}
        <div style={{
          position: "absolute", bottom: "60px", right: "-80px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(21,40,21,0.07) 0%, transparent 65%)",
        }} />
        {/* Subtle grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
        {/* Gold accent line top */}
        <div style={{
          position: "absolute", top: "70px", left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.3) 30%, rgba(201,168,76,0.3) 70%, transparent 100%)",
        }} />
      </div>

      {/* MAIN CONTENT */}
      <div
        className="flex-1 relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: "clamp(32px, 5vw, 64px)", paddingBottom: "40px", display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        {/* Eyebrow badge */}
        <div className="reveal-up flex items-center gap-3 mb-5">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px", borderRadius: "100px",
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.35)",
          }}>
            <span style={{ position: "relative", display: "flex", width: "8px", height: "8px" }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "var(--brand-gold)", opacity: 0.6, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
              }} />
              <span style={{ position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand-gold)" }} />
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand-gold-muted)" }}>
              {t(lang, "hero.eyebrow")}
            </span>
          </div>
        </div>

        {/* HERO TITLE — large, dramatic */}
        <div className="reveal-up mb-5" style={{ maxWidth: "820px" }}>
          <h1 style={{
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 600,
            lineHeight: 1.12,
            fontSize: "clamp(38px, 5.5vw, 72px)",
            background: "var(--hero-panel-bg)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.01em",
          }}>
            {t(lang, "hero.title")}
          </h1>
        </div>

        {/* Decorative divider */}
        <div className="reveal-up flex items-center gap-2 mb-5">
          <div style={{ height: "2px", width: "32px", background: "var(--brand-gold)", borderRadius: "2px" }} />
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand-gold)" }} />
          <div style={{ height: "1px", width: "200px", background: "linear-gradient(90deg, rgba(201,168,76,0.5), transparent)" }} />
        </div>

        {/* Subtitle */}
        <div className="reveal-up mb-8" style={{ maxWidth: "560px" }}>
          <p style={{
            fontSize: "clamp(14.5px, 1.1vw, 16.5px)",
            lineHeight: 1.8,
            color: "var(--text-primary)",
            fontWeight: 400,
          }}>
            {t(lang, "hero.subtitle")}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="reveal-up flex flex-col sm:flex-row gap-3 mb-10">
          <button
            onClick={() => navigate("/login")}
            className="magnetic-btn"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px",
              padding: "14px 32px", borderRadius: "14px",
              background: "linear-gradient(135deg, var(--homepage-cta-bg) 0%, color-mix(in srgb, var(--homepage-cta-bg) 85%, black) 100%)",
              color: "white", fontWeight: 600, fontSize: "14px", letterSpacing: "0.03em",
              boxShadow: "0 8px 32px rgba(21,40,21,0.30), 0 2px 8px rgba(21,40,21,0.15)",
              border: "none", cursor: "pointer",
              transition: "all 0.25s ease",
              width: "auto",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(21,40,21,0.40), 0 4px 12px rgba(21,40,21,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(21,40,21,0.30), 0 2px 8px rgba(21,40,21,0.15)"; }}
          >
            {t(lang, "hero.ctaPrimary")}
            <ArrowRight size={16} />
          </button>

          <button
            onClick={scrollToHowItWorks}
            className="magnetic-btn"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px",
              padding: "14px 28px", borderRadius: "14px",
              background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)",
              color: "var(--homepage-cta-ghost-fg)", fontWeight: 600, fontSize: "14px", letterSpacing: "0.03em",
              border: "1.5px solid rgba(213,207,196,0.8)", cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.9)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(213,207,196,0.8)"; }}
          >
            <span style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: "white", border: "1px solid rgba(0,0,0,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </span>
            {t(lang, "hero.ctaSecondary")}
          </button>
        </div>

        {/* STAT CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            maxWidth: "720px",
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card-anim"
              style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(232,226,216,0.9)",
                borderRadius: "16px",
                padding: "16px",
                cursor: "default",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
              }}
            >
              <div style={{
                width: "34px", height: "34px", borderRadius: "10px",
                background: "rgba(201,168,76,0.12)", color: "var(--brand-gold)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "10px",
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                fontWeight: 600, fontSize: "20px", color: "var(--brand-green-deep)",
                lineHeight: 1, marginBottom: "4px",
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-brown-soft)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MARQUEE TICKER */}
      <div style={{
        flexShrink: 0, overflow: "hidden",
        borderTop: "1px solid rgba(26,52,25,0.9)",
        background: "var(--hero-marquee-bg)",
        padding: "12px 0",
      }}>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes ping { 0% { transform: scale(1); opacity: 0.75; } 75%, 100% { transform: scale(2); opacity: 0; } }
          .marquee-track { display: flex; animation: marquee 28s linear infinite; width: max-content; }
          .marquee-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} style={{ display: "flex", alignItems: "center", flexShrink: 0 }} aria-hidden={dup === 1}>
              {marqueeItems.map((item, i) => (
                <React.Fragment key={`${dup}-${i}`}>
                  <span style={{
                    padding: "0 28px", fontWeight: 500, letterSpacing: "0.15em",
                    textTransform: "uppercase", fontSize: "11px", color: "rgba(255,255,255,0.45)",
                    whiteSpace: "nowrap",
                  }}>
                    {item}
                  </span>
                  <span style={{ color: "var(--brand-gold)", fontSize: "9px" }}>◆</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;