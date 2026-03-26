import React from "react";
import { Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import { translations } from "../constants/translation";

const QUICK_LINKS = [
  { name: "How It Works", href: "#how-it-works" },
  { name: "Benefits", href: "#benefits" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Upload Drawing", href: "#upload" },
];

const SUPPORT_LINKS = [
  { name: "FAQ", href: "#faq" },
  { name: "Privacy Policy", href: "#privacy" },
  { name: "Terms of Service", href: "#terms" },
  { name: "Refund Policy", href: "#refund" },
];

export default function Footer() {
  const lang = useSelector((state) => state.language?.lang || "en");
  const tr = translations[lang]?.footer;

  const scrollTo = (id) => {
    const el = document.getElementById(id.replace("#", ""));
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="theme-animate-surface" style={{
      background: "var(--footer-bg)",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        .footer-link {
          font-size: 13px;
          color: var(--footer-fg-muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          text-align: left;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .footer-link:hover { color: var(--brand-gold); }
        .footer-link-icon { opacity: 0; transition: opacity 0.2s ease; }
        .footer-link:hover .footer-link-icon { opacity: 1; }
        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .contact-item:last-child { border-bottom: none; }
        .footer-col-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--brand-gold) 72%, transparent);
          margin-bottom: 16px;
        }
      `}</style>

      {/* Background decoration */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
        <div style={{
          position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)",
          width: "800px", height: "400px",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.05) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)",
          backgroundSize: "36px 36px", opacity: 0.5,
        }} />
        {/* Top gold line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.35) 30%, rgba(201,168,76,0.35) 70%, transparent)",
        }} />
      </div>

      {/* MAIN CONTENT */}
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: "clamp(48px, 7vw, 72px) clamp(16px, 4vw, 32px) 0",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "clamp(24px, 4vw, 48px)",
          paddingBottom: "clamp(40px, 6vw, 60px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>

          {/* BRAND */}
          <div style={{ gridColumn: "span 1" }}>
            <div style={{ marginBottom: "16px" }}>
              <img
                src="/assets/logo.png"
                alt="North-cot"
                style={{ height: "52px", width: "auto" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `
                    <div style="display:inline-flex;align-items:center;gap:8px;">
                      <div style="width:32px;height:32px;borderRadius:8px;background:rgba(201,168,76,0.15);display:flex;align-items:center;justify-content:center;">
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='var(--brand-gold)' strokeWidth='2'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z'/><circle cx='12' cy='10' r='3'/></svg>
                      </div>
                      <span style='font-family:IBM Plex Serif,serif;font-style:italic;font-weight:700;font-size:18px;color:white;'>North-cot</span>
                    </div>
                  `;
                }}
              />
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.38)", lineHeight: 1.75, maxWidth: "220px" }}>
              {tr?.tagline}
            </p>
            {/* Decorative gold divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "20px" }}>
              <div style={{ width: "20px", height: "1.5px", background: "var(--brand-gold)", borderRadius: "2px" }} />
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--brand-gold)" }} />
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, rgba(201,168,76,0.5), transparent)" }} />
            </div>
            {/* Karnataka badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              marginTop: "16px", padding: "5px 12px", borderRadius: "100px",
              background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)",
            }}>
              <MapPin size={10} color="var(--brand-gold)" />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(201,168,76,0.75)", letterSpacing: "0.1em" }}>
                Karnataka Only
              </span>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <p className="footer-col-label">{tr?.quickLinksTitle || "Quick Links"}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {QUICK_LINKS.map((link) => (
                <li key={link.name}>
                  <button
                    className="footer-link"
                    onClick={() => scrollTo(link.href)}
                  >
                    {link.name}
                    <ArrowUpRight size={11} className="footer-link-icon" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <p className="footer-col-label">{tr?.supportTitle || "Support"}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {SUPPORT_LINKS.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="footer-link">
                    {link.name}
                    <ArrowUpRight size={11} className="footer-link-icon" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <p className="footer-col-label">{tr?.contactTitle || "Contact Us"}</p>
            <div>
              <div className="contact-item">
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                  background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Phone size={13} color="var(--brand-gold)" />
                </div>
                <a href="tel:+919876543210" style={{ fontSize: "13px", color: "rgba(255,255,255,0.42)", textDecoration: "none", paddingTop: "6px", transition: "color 0.2s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--brand-gold)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.42)"; }}>
                  +91 98765 43210
                </a>
              </div>
              <div className="contact-item">
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                  background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Mail size={13} color="var(--brand-gold)" />
                </div>
                <a href="mailto:support@northcot.in" style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.42)", textDecoration: "none", paddingTop: "6px", transition: "color 0.2s ease", wordBreak: "break-all" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--brand-gold)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.42)"; }}>
                  support@northcot.in
                </a>
              </div>
              <div className="contact-item">
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                  background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MapPin size={13} color="var(--brand-gold)" />
                </div>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.42)", paddingTop: "6px" }}>
                  Karnataka, India
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div style={{
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
          gap: "12px",
          padding: "20px 0",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.22)", margin: 0 }}>
              © 2026 North-cot. All rights reserved.
            </p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.18)", margin: 0 }}>
              Designed & developed by{" "}
              <a
                href="https://www.naviinfo.tech/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "rgba(201,168,76,0.55)",
                  textDecoration: "none",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--brand-gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(201,168,76,0.55)"; }}
              >
                Navi Infotech ↗
              </a>
            </p>
          </div>

          {/* Gold divider dot */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(201,168,76,0.4)", display: "inline-block" }} />
            <span style={{ fontSize: "11px", color: "rgba(201,168,76,0.45)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Karnataka Land Surveyors
            </span>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(201,168,76,0.4)", display: "inline-block" }} />
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.22)", textDecoration: "none", transition: "color 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--brand-gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.22)"; }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}