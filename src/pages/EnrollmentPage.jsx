import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { completeEnrollment } from "../services/user/userService.js";

/**
 * Public one-time enrollment page (M-04).
 * Operators open the invite link, set a 4-digit PIN, then sign in.
 * Query: /enroll?token=...
 */
export default function EnrollmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => String(searchParams.get("token") || "").trim(), [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This enrollment link is missing a token. Request a new invite from your admin.");
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      setError("Password must be exactly 4 digits");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await completeEnrollment({ token, password });
      setDone(true);
      setTimeout(() => navigate("/login-email", { replace: true }), 1600);
    } catch (err) {
      setError(err?.message || "Failed to complete enrollment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg-primary, #0f1419)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--bg-secondary, #1a222d)",
          border: "1px solid var(--border-color, #2a3544)",
          borderRadius: 16,
          padding: 28,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--brand-gold, #c9a227)",
          }}
        >
          Account enrollment
        </p>
        <h1 style={{ margin: "8px 0 6px", fontSize: 24, color: "var(--fg, #f4efe6)" }}>
          Set your password
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--fg-muted, #9aa4b2)" }}>
          This one-time link lets you activate your operator account. Choose a 4-digit numeric
          password, then sign in with your email.
        </p>

        {!token && (
          <p style={{ color: "var(--danger, #e55)", fontSize: 13, marginBottom: 16 }}>
            Invalid or incomplete enrollment link.
          </p>
        )}

        {done ? (
          <p style={{ color: "var(--success, #3d9a6a)", fontSize: 14, fontWeight: 600 }}>
            Enrollment complete. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <input
                type={showPassword ? "text" : "password"}
                inputMode="numeric"
                maxLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-digit PIN"
                style={{
                  width: "100%",
                  padding: "10px 44px 10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color, #2a3544)",
                  background: "var(--bg-primary, #0f1419)",
                  color: "var(--fg, #f4efe6)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "var(--fg-muted, #9aa4b2)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Confirm password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              inputMode="numeric"
              maxLength={4}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Confirm 4-digit PIN"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border-color, #2a3544)",
                background: "var(--bg-primary, #0f1419)",
                color: "var(--fg, #f4efe6)",
                marginBottom: 14,
              }}
            />

            {error && (
              <p style={{ color: "var(--danger, #e55)", fontSize: 13, margin: "0 0 12px" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                background: "var(--brand-gold, #c9a227)",
                color: "#1a1508",
                fontWeight: 700,
                cursor: loading || !token ? "not-allowed" : "pointer",
                opacity: loading || !token ? 0.6 : 1,
              }}
            >
              {loading ? "Activating…" : "Activate account"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 18, fontSize: 12, textAlign: "center" }}>
          <Link to="/login-email" style={{ color: "var(--brand-gold, #c9a227)" }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
