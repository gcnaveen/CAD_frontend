import React, { useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Logo + brand title section for the login page.
 * Manages logo image fallback via React state (no innerHTML).
 */
export default function LoginBrandHeader({ mounted, onHomeClick }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div style={{
      textAlign: "center", marginBottom: "28px",
      animation: mounted ? "logo-in 0.6s ease 0.1s both" : "none",
    }}>
      <button
        type="button"
        onClick={onHomeClick}
        aria-label="Go to home"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          marginBottom: "14px",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <div style={{
          position: "absolute", inset: "-10px", borderRadius: "50%",
          border: "1px solid rgba(201,168,76,0.3)",
          animation: "ping 2.5s ease-out infinite",
        }} />
        <div style={{
          position: "absolute", inset: "-4px", borderRadius: "50%",
          border: "1.5px solid rgba(201,168,76,0.25)",
        }} />
        <div style={{
          width: "110px", height: "110px", borderRadius: "50%",
          background: "var(--homepage-video-chrome)",
          backdropFilter: "blur(8px)",
          border: "2px solid rgba(201,168,76,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 28px rgba(201,168,76,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          {logoFailed ? (
            <span style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "22px",
              color: "var(--brand-gold)",
            }}>
              NC
            </span>
          ) : (
            <img
              src="/assets/logo.webp"
              alt="North-cot"
              width={80}
              height={80}
              decoding="async"
              style={{ width: "80px", height: "80px", objectFit: "contain" }}
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
        <div style={{ height: "1px", width: "32px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5))" }} />
        <span style={{
          fontFamily: "'IBM Plex Serif', Georgia, serif",
          fontStyle: "italic", fontWeight: 700,
          fontSize: "28px", color: "var(--brand-green-deep)", letterSpacing: "0.02em",
        }}>
          North-cot
        </span>
        <div style={{ height: "1px", width: "50px", background: "linear-gradient(90deg, rgba(201,168,76,0.5), transparent)" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
        <MapPin size={10} color="var(--brand-gold-muted)" />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-gold-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Land Survey & Revenue Documentation
        </span>
      </div>
    </div>
  );
}
