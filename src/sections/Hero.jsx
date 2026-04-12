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
    { Icon: IndianRupee, value: t(lang, "hero.stats.priceValue"), label: t(lang, "hero.stats.priceLabel") },
    { Icon: Clock, value: t(lang, "hero.stats.deliveryValue"), label: t(lang, "hero.stats.deliveryLabel") },
    { Icon: MapPin, value: t(lang, "hero.stats.regionValue"), label: t(lang, "hero.stats.regionLabel") },
    { Icon: ShieldCheck, value: t(lang, "hero.stats.qcValue"), label: t(lang, "hero.stats.qcLabel") },
  ], [lang]);

  const marqueeItems = useMemo(() => [
    "Karnataka", "Licensed surveyors", "₹500 · 48h", "QC-assured",
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

      {/* MAIN CONTENT — copy left, video + stat cards right */}
      <div
        className="flex-1 relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: "clamp(28px, 4vw, 48px)", paddingBottom: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-10 xl:gap-12">
          <div className="flex min-w-0 flex-1 flex-col justify-center lg:max-w-[48%]">
            {/* Eyebrow */}
            <div className="reveal-up mb-4">
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "6px 14px", borderRadius: "100px",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.28)",
              }}>
                <span style={{ position: "relative", display: "flex", width: "8px", height: "8px" }}>
                  <span style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "var(--brand-gold)", opacity: 0.55, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
                  }} />
                  <span style={{ position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand-gold)" }} />
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brand-gold-muted)" }}>
                  {t(lang, "hero.eyebrow")}
                </span>
              </div>
            </div>

            <div className="reveal-up mb-4" style={{ maxWidth: "520px" }}>
              <h1
                className="home-serif-title"
                style={{
                  fontFamily: "'IBM Plex Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 600,
                  lineHeight: 1.14,
                  fontSize: "clamp(30px, 4.2vw, 52px)",
                  background: "var(--hero-panel-bg)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                }}
              >
                {t(lang, "hero.title")}
              </h1>
            </div>

            <div className="reveal-up mb-6" style={{ maxWidth: "480px" }}>
              <p style={{
                fontSize: "clamp(14px, 1.35vw, 17px)",
                lineHeight: 1.72,
                color: "var(--text-primary)",
                fontWeight: 400,
              }}>
                {t(lang, "hero.subtitle")}
              </p>
            </div>

            <div className="reveal-up flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="magnetic-btn"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  padding: "12px 26px", borderRadius: "14px",
                  background: "linear-gradient(135deg, var(--homepage-cta-bg) 0%, color-mix(in srgb, var(--homepage-cta-bg) 85%, black) 100%)",
                  color: "white", fontWeight: 600, fontSize: "14px", letterSpacing: "0.025em",
                  boxShadow: "0 6px 24px rgba(21,40,21,0.22)",
                  border: "none", cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 32px rgba(21,40,21,0.32)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(21,40,21,0.22)"; }}
              >
                {t(lang, "hero.ctaPrimary")}
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={scrollToHowItWorks}
                className="magnetic-btn hero-cta-secondary"
              >
                <span className="hero-play-bubble">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </span>
                {t(lang, "hero.ctaSecondary")}
              </button>
            </div>
          </div>

          <div className="reveal-up flex min-w-0 flex-1 flex-col justify-center lg:max-w-[52%]">
            <div
              className="relative w-full overflow-hidden rounded-2xl border shadow-lg"
              style={{
                borderColor: "rgba(26,52,25,0.12)",
                boxShadow: "0 20px 50px rgba(15,30,20,0.12)",
                aspectRatio: "16 / 10",
                maxHeight: "min(52vh, 420px)",
              }}
            >
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster=""
                aria-label="Karnataka survey context"
              >
                <source src="/assets/herobgvideofinal.mp4" type="video/mp4" />
              </video>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(15,40,25,0.08) 100%)",
                }}
              />
            </div>

            <div
              className="mt-4 grid w-full grid-cols-2 gap-2 sm:gap-3"
              role="list"
              aria-label={t(lang, "hero.statsAria")}
            >
              {stats.map((stat, i) => {
                const Icon = stat.Icon;
                return (
                  <div
                    key={i}
                    role="listitem"
                    className="stat-card-anim flex min-h-[108px] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center sm:min-h-[118px] sm:px-3 sm:py-4"
                    style={{
                      borderColor: "rgba(26,52,25,0.1)",
                      background: "rgba(255,255,255,0.78)",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 6px 20px rgba(15,30,20,0.06)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 26px rgba(15,30,20,0.1)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(15,30,20,0.06)";
                    }}
                  >
                    <div
                      className="mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
                      style={{
                        background: "rgba(201,168,76,0.12)",
                        color: "var(--brand-gold)",
                      }}
                    >
                      <Icon size={18} strokeWidth={2} aria-hidden />
                    </div>
                    <div
                      className="hero-stat-value"
                      style={{
                        fontFamily: "'IBM Plex Serif', Georgia, serif",
                        fontWeight: 600,
                        fontSize: "clamp(15px, 2.4vw, 18px)",
                        color: "var(--brand-green-deep)",
                        lineHeight: 1.15,
                        marginBottom: "4px",
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="hero-stat-label"
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "var(--text-brown-soft)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        lineHeight: 1.3,
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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