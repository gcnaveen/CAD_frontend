import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, Quote } from "lucide-react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const TESTIMONIALS = [
  {
    name: "Sunita Devi",
    location: "Dharwad, Karnataka",
    role: "Licensed surveyor",
    initials: "SD",
    text: "Very easy process. I uploaded the Tippani from my phone and got a QC-checked DWG in two days. The tahsildar office accepted the drawing on the first visit — no more running to CAD shops in the city.",
  },
  {
    name: "Raghavendra Bhat",
    location: "Udupi, Karnataka",
    role: "Land surveyor",
    initials: "RB",
    text: "Fixed ₹500 is honest pricing. Admin clarified one measurement on WhatsApp, and the final AutoCAD matched my field notes. This is built the way Karnataka surveyors actually work.",
  },
  {
    name: "Prakash Naik",
    location: "Belagavi, Karnataka",
    role: "Surveyor",
    initials: "PN",
    text: "Earlier I lost almost a week waiting at a CAD bureau. Here the pipeline is clear: upload, assignment, drawing, QC, download. Saves diesel and time on every RTC package.",
  },
  {
    name: "Lakshmi Reddy",
    location: "Ballari, Karnataka",
    role: "Property survey",
    initials: "LR",
    text: "Local drafters quoted ₹4,000–5,000 and two weeks. North-cot delivered in 48 hours with proper layers and scale. Registration desk had no objections.",
  },
  {
    name: "Mohan Gowda",
    location: "Mandya, Karnataka",
    role: "Farmer & surveyor",
    initials: "MG",
    text: "I work mostly from the field. Being able to submit documents from the phone and pay in two steps is perfect. The drawing matched my government sketch boundaries exactly.",
  },
  {
    name: "Kavita Sharma",
    location: "Mysuru, Karnataka",
    role: "Surveyor",
    initials: "KS",
    text: "Professional communication throughout. They cross-checked my hobli and survey numbers before CAD work started. Exactly what we need for Karnataka land records work.",
  },
  {
    name: "Rajesh Patil",
    location: "Vijayapura, Karnataka",
    role: "Licensed surveyor",
    initials: "RP",
    text: "Best decision for our district practice. DWG plus PDF both were clean, and the secure download link meant I did not have to use random WhatsApp forwards.",
  },
  {
    name: "Suresh Kumar",
    location: "Hassan, Karnataka",
    role: "Surveyor",
    initials: "SK",
    text: "Uploaded on Sunday evening, got QC approval by Tuesday. Speed without cutting corners — the checklist-style review shows before I pay the download fee.",
  },
  {
    name: "Anjali Desai",
    location: "Bengaluru Rural, Karnataka",
    role: "Surveyor",
    initials: "AD",
    text: "We only take Karnataka survey jobs, so a platform that understands Tippani and RTC flow matters. This team speaks our language and keeps the process transparent.",
  },
];

const COLORS = [
  {
    bg: "color-mix(in srgb, var(--brand-gold) 14%, transparent)",
    border: "color-mix(in srgb, var(--brand-gold) 32%, var(--border-color))",
    text: "var(--brand-gold-muted)",
  },
  {
    bg: "color-mix(in srgb, var(--success) 12%, transparent)",
    border: "color-mix(in srgb, var(--success) 28%, var(--border-color))",
    text: "var(--success)",
  },
  {
    bg: "color-mix(in srgb, var(--user-accent) 12%, transparent)",
    border: "color-mix(in srgb, var(--user-accent) 28%, var(--border-color))",
    text: "var(--accent-brown)",
  },
];

const ITEMS_PER_PAGE = 3;

export default function ClientTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.testimonials;
  const sectionRef = useRef(null);
  const testimonials = tr?.items?.length ? tr.items : TESTIMONIALS;
  const totalPages = Math.ceil(testimonials.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, currentIndex]);

  // Header reveal
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll(".test-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, Number(el.dataset.delay || 0));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );
    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNext = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    setCurrentIndex((p) => (p + 1) % totalPages);
  };

  const handlePrev = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    setCurrentIndex((p) => (p === 0 ? totalPages - 1 : p - 1));
  };

  const currentCards = testimonials.slice(
    currentIndex * ITEMS_PER_PAGE,
    currentIndex * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      style={{
        background: "var(--section-cream-alt)",
        padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 32px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .test-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232,226,216,0.85);
          border-radius: 20px;
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 16px rgba(0,0,0,0.055);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .test-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.10);
          border-color: rgba(201,168,76,0.25);
        }
        .test-cards-wrap {
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        .test-cards-wrap.fading {
          opacity: 0;
        }
        .nav-btn {
          width: 44px; height: 44px; border-radius: 50%;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(232,226,216,0.9);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          transition: all 0.2s ease;
          color: var(--homepage-cta-bg);
        }
        .nav-btn:hover {
          background: var(--homepage-cta-bg);
          border-color: var(--homepage-cta-bg);
          color: white;
          box-shadow: 0 4px 16px rgba(21,40,21,0.25);
          transform: scale(1.05);
        }
        .dot-btn {
          height: 6px; border-radius: 3px;
          border: none; cursor: pointer;
          transition: all 0.3s ease;
        }
      `}</style>

      {/* Background decorations */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
        <div style={{
          position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)",
          width: "800px", height: "400px",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.10) 1px, transparent 1px)",
          backgroundSize: "44px 44px", opacity: 0.45,
        }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div className="test-reveal" data-delay="0" style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 60px)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 18px", borderRadius: "100px",
            background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
            marginBottom: "20px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand-gold)", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand-gold-muted)" }}>
              {tr?.kicker || "Testimonials"}
            </span>
          </div>
          <h2
            className="home-serif-title"
            style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic", fontWeight: 600,
              fontSize: "clamp(28px, 3.8vw, 50px)", lineHeight: 1.15,
              background: "var(--hero-panel-bg)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              marginBottom: "14px", letterSpacing: "-0.01em",
            }}
          >
            {tr?.title}
          </h2>
          <p className="testimonials-section-sub" style={{ fontSize: "clamp(14px, 1.1vw, 16px)", color: "var(--text-brown-muted)", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto" }}>
            {tr?.subtitle}
          </p>
        </div>

        {/* TESTIMONIAL CARDS */}
        <div
          className={`test-cards-wrap${animating ? " fading" : ""}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {currentCards.map((t, idx) => {
            const color = COLORS[idx % COLORS.length];
            return (
              <div key={`${currentIndex}-${idx}`} className="test-card">
                {/* Ghost quote mark */}
                <div style={{
                  position: "absolute", top: "12px", right: "16px",
                  opacity: 0.06, color: "var(--homepage-cta-bg)",
                  transform: "scale(3)", transformOrigin: "top right",
                  pointerEvents: "none",
                }}>
                  <Quote size={28} />
                </div>

                {/* Stars */}
                <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--brand-gold)" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="test-quote" style={{
                  fontSize: "13.5px", color: "var(--text-primary)",
                  lineHeight: 1.75, fontStyle: "italic",
                  flex: 1, marginBottom: "20px",
                }}>
                  "{t.text}"
                </p>

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(232,226,216,0.7)", marginBottom: "16px" }} />

                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Avatar */}
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                    background: color.bg, border: `1.5px solid ${color.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 700, color: color.text,
                      fontFamily: "'IBM Plex Serif', Georgia, serif",
                    }}>
                      {t.initials}
                    </span>
                  </div>
                  <div>
                    <p className="test-author-name" style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--brand-green-deep)", margin: 0 }}>{t.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={10} color="var(--text-brown-soft)" />
                      <p className="test-author-meta" style={{ fontSize: "11.5px", color: "var(--text-brown-soft)", margin: 0 }}>{t.location}</p>
                    </div>
                  </div>
                  {/* Role badge */}
                  <div style={{
                    marginLeft: "auto", padding: "3px 9px",
                    background: color.bg, border: `1px solid ${color.border}`,
                    borderRadius: "20px",
                  }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: color.text }}>{t.role}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* NAVIGATION */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <button className="nav-btn" onClick={handlePrev} aria-label="Previous">
            <ChevronLeft size={18} />
          </button>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className="dot-btn"
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: i === currentIndex ? "28px" : "6px",
                  background: i === currentIndex ? "var(--brand-gold)" : "rgba(201,168,76,0.25)",
                }}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <button className="nav-btn" onClick={handleNext} aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Page label */}
        <p style={{
          textAlign: "center", marginTop: "12px",
          fontSize: "11px", fontWeight: 600, color: "var(--text-brown-soft)",
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {currentIndex + 1} / {totalPages}
        </p>

      </div>
    </section>
  );
}