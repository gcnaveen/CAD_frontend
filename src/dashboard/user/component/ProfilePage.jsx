// src/dashboard/user/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { performFullLogout } from "../../../utils/performFullLogout.js";
import { getWhatsAppSupportUrl } from "../../../constants/siteMeta.js";
import { getSupportContact } from "../../../services/public/businessRulesService.js";
import { humanizeEnumLabel } from "../../../utils/displayLabels.js";

/* ── Icons ── */
const UserIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const PhoneIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const SupportIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const LogOutIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const ChevronRight = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

/* ── Menu Item ── */
const MenuItem = ({ icon, iconBg, label, sublabel, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3.5 transition-colors text-left ${
      danger ? "hover:bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))]" : "hover:bg-[var(--user-accent-soft)]"
    }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-extrabold ${danger ? "text-danger" : "text-fg"}`}>{label}</p>
      {sublabel && <p className="text-xs font-semibold text-fg-muted mt-0.5">{sublabel}</p>}
    </div>
    {!danger && <ChevronRight className="w-4 h-4 text-fg-muted shrink-0" />}
  </button>
);

const Divider = () => <div className="h-px bg-line mx-4" />;

const Card = ({ children, className = "" }) => (
  <div className={`bg-surface rounded-2xl border border-line overflow-hidden shadow-sm ${className}`}>
    {children}
  </div>
);

/* ── Main ── */
const ProfilePage = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const [whatsappUrl, setWhatsappUrl] = useState(() => getWhatsAppSupportUrl());

  useEffect(() => {
    let cancelled = false;
    getSupportContact()
      .then((contact) => {
        if (cancelled) return;
        if (contact?.whatsappUrl) setWhatsappUrl(contact.whatsappUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const authSlice = useSelector((s) => s.auth);
  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const user = authSlice?.user || storedUser || null;
  const userName = useMemo(() => {
    const first = user?.name?.first;
    const last = user?.name?.last;
    const full = [first, last].filter(Boolean).join(" ").trim();
    return (
      (typeof full === "string" && full) ||
      authSlice?.userName ||
      localStorage.getItem("userName") ||
      "User"
    );
  }, [authSlice?.userName, user]);

  const userPhone =
    user?.auth?.phone ||
    authSlice?.phone ||
    localStorage.getItem("userPhone") ||
    "—";

  const userRole = user?.role || authSlice?.role || "USER";
  const userStatus = user?.status || "—";

  const roleLabel = {
    SURVEYOR: "Government Surveyor",
    USER:     "Land Owner",
    ADMIN:    "Administrator",
  }[userRole] || userRole;

  const handleLogout = async () => {
    await performFullLogout(dispatch);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[var(--user-accent-soft)] via-[color-mix(in_srgb,var(--brand-gold)_08%,var(--bg-secondary))] to-[var(--bg-primary)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-[var(--user-accent)] uppercase mb-1">ಪ್ರೊಫೈಲ್</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg">Profile</h1>
        </div>

        <Card className="mb-4">
          <div className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--user-accent-soft)] border border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] flex items-center justify-center shrink-0">
              <UserIcon className="w-7 h-7 text-[var(--user-accent)]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base font-extrabold text-fg truncate">{userName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg className="w-3 h-3 text-fg-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-xs font-semibold text-fg-muted">{roleLabel}</p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] font-bold text-fg-muted">Status</span>
                <span className="px-2.5 py-0.5 rounded-full border border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] bg-[var(--user-accent-soft)] text-[var(--user-accent)] text-[11px] font-extrabold">
                  {humanizeEnumLabel(userStatus)}
                </span>
              </div>
            </div>
          </div>

          <Divider />

          <div className="flex items-center gap-2.5 px-4 py-3">
            <PhoneIcon className="w-4 h-4 text-fg-muted shrink-0" />
            <p className="text-sm font-semibold text-fg">{userPhone}</p>
          </div>
        </Card>

        <Card>
          <MenuItem
            icon={<SupportIcon className="w-5 h-5 text-success" />}
            iconBg="bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-secondary))] border border-[color-mix(in_srgb,var(--success)_28%,var(--border-color))]"
            label="ಸಹಾಯ / Contact Support"
            sublabel="Chat with us on WhatsApp"
            onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
          />
          <Divider />
          <MenuItem
            icon={<LogOutIcon className="w-5 h-5 text-danger" />}
            iconBg="bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] border border-[color-mix(in_srgb,var(--danger)_28%,var(--border-color))]"
            label="ಲಾಗ್ ಔಟ್ / Logout"
            danger
            onClick={handleLogout}
          />
        </Card>

        <p className="text-center text-xs text-fg-muted font-semibold mt-8">Version 1.0.0</p>
      </div>
    </div>
  );
};

export default ProfilePage;
