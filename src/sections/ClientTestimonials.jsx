import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, Quote } from "lucide-react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const TESTIMONIALS = [
  {
    name: "Ramesh Kumar",
    location: "Village Rampur, UP",
    role: "Land Owner",
    initials: "RK",
    text: "I was visiting the tehsil office 4 times with my hand-drawn sketch. Every time they rejected it. With this service, I uploaded my sketch and got a perfect CAD drawing in 2 days. Approved in first visit!",
  },
  {
    name: "Sunita Devi",
    location: "Dharwad, Karnataka",
    role: "Property Owner",
    initials: "SD",
    text: "Very easy process. I don't know computers much, but my son helped me upload the sketch from phone. The CAD drawing came exactly as needed for property registration. Saved us many trips to taluk office.",
  },
  {
    name: "Prakash Patil",
    location: "Nashik, Maharashtra",
    role: "Farmer",
    initials: "PP",
    text: "Government office always said my drawing is not proper. Now with professional CAD design, they accepted immediately. Good service and helpful team. Highly recommend for all farmers and land owners.",
  },
  {
    name: "Lakshmi Reddy",
    location: "Anantapur, Andhra Pradesh",
    role: "Land Owner",
    initials: "LR",
    text: "Saved me so much time and money! The local CAD person wanted ₹5000 and 15 days. Here I got it in 3 days at half the price. The drawing quality is excellent and passed government check first time.",
  },
  {
    name: "Mohan Singh",
    location: "Alwar, Rajasthan",
    role: "Farmer",
    initials: "MS",
    text: "I have 5 acres of agricultural land. Making proper boundary map was very difficult. This service made everything easy. They called me to clarify measurements and delivered perfect government-ready drawing.",
  },
  {
    name: "Kavita Sharma",
    location: "Satara, Maharashtra",
    role: "Property Owner",
    initials: "KS",
    text: "My husband passed away and I needed property transfer documents. The team was very understanding and helped me throughout. Got all CAD drawings for mutation within one week. Very grateful for their support.",
  },
  {
    name: "Rajesh Patel",
    location: "Mehsana, Gujarat",
    role: "Land Owner",
    initials: "RP",
    text: "Best decision to use this service! The designer called me twice to confirm all details. Final drawing had every dimension perfect. Revenue office approved without a single question.",
  },
  {
    name: "Suresh Yadav",
    location: "Bhopal, Madhya Pradesh",
    role: "Farmer",
    initials: "SY",
    text: "Very professional service. I uploaded sketch on Sunday night, got a call on Monday morning, and received drawing by Tuesday evening. The speed and quality both are excellent. Will use again.",
  },
  {
    name: "Anjali Desai",
    location: "Valsad, Gujarat",
    role: "Builder",
    initials: "AD",
    text: "Local person wanted ₹8000 and said come after 20 days. Found this service online, paid ₹3500 and got drawing in 4 days. Municipality accepted it without any changes!",
  },
];

const COLORS = [
  { bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.3)", text: "#9a7020" },
  { bg: "rgba(42,110,42,0.10)", border: "rgba(42,110,42,0.25)", text: "#1a5a1a" },
  { bg: "rgba(139,90,43,0.10)", border: "rgba(139,90,43,0.22)", text: "#6b4a20" },
];

const ITEMS_PER_PAGE = 3;

export default function ClientTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.testimonials;
  const sectionRef = useRef(null);
  const totalPages = Math.ceil(TESTIMONIALS.length / ITEMS_PER_PAGE);

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

  const currentCards = TESTIMONIALS.slice(
    currentIndex * ITEMS_PER_PAGE,
    currentIndex * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      style={{
        background: "linear-gradient(180deg, #f7f2e8 0%, #f0ead8 60%, #ede5d0 100%)",
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
          color: #152815;
        }
        .nav-btn:hover {
          background: #152815;
          border-color: #152815;
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
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c9a84c", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9a7020" }}>
              Testimonials
            </span>
          </div>
          <h2 style={{
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            fontStyle: "italic", fontWeight: 600,
            fontSize: "clamp(28px, 3.8vw, 50px)", lineHeight: 1.15,
            background: "linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 50%, #2a5a2a 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            marginBottom: "14px", letterSpacing: "-0.01em",
          }}>
            {tr?.title}
          </h2>
          <p style={{ fontSize: "clamp(14px, 1.1vw, 16px)", color: "#6b6252", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto" }}>
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
                  opacity: 0.06, color: "#152815",
                  transform: "scale(3)", transformOrigin: "top right",
                  pointerEvents: "none",
                }}>
                  <Quote size={28} />
                </div>

                {/* Stars */}
                <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#c9a84c" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: "13.5px", color: "#4a4238",
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
                    <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#0d1f0d", margin: 0 }}>{t.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={10} color="#b5aa98" />
                      <p style={{ fontSize: "11.5px", color: "#b5aa98", margin: 0 }}>{t.location}</p>
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
                  background: i === currentIndex ? "#c9a84c" : "rgba(201,168,76,0.25)",
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
          fontSize: "11px", fontWeight: 600, color: "#b5aa98",
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {currentIndex + 1} / {totalPages}
        </p>

      </div>
    </section>
  );
}