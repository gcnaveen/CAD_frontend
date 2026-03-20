// src/dashboard/user/pages/ProfilePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../features/auth/authSlice";

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
const EditIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
const HistoryIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
const XIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ── Change Number Modal ── */
const ChangeNumberModal = ({ onClose }) => {
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    // TODO: replace with real API call
    await new Promise((r) => setTimeout(r, 900));
    setSuccess(true);
    setLoading(false);
    setTimeout(onClose, 1300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">Change Number</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <XIcon className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="font-extrabold text-slate-900">Number updated!</p>
          </div>
        ) : (
          <>
            <label className="block text-xs font-bold text-slate-600 mb-2">New Mobile Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter 10-digit number"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition mb-4"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || phone.length < 10}
              className={`w-full py-3 rounded-2xl font-extrabold text-sm transition-all ${
                phone.length >= 10
                  ? "bg-orange-600 hover:bg-orange-500 text-white shadow-[0_6px_16px_rgba(234,88,12,0.25)]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Updating…" : "Update Number"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Menu Item ── */
const MenuItem = ({ icon, iconBg, label, sublabel, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3.5 transition-colors text-left ${
      danger ? "hover:bg-red-50" : "hover:bg-orange-50/50"
    }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-extrabold ${danger ? "text-red-500" : "text-slate-900"}`}>{label}</p>
      {sublabel && <p className="text-xs font-semibold text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
    {!danger && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
  </button>
);

const Divider = () => <div className="h-px bg-slate-100 mx-4" />;

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
    {children}
  </div>
);

/* ── Main ── */
const ProfilePage = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const [showModal, setShowModal] = useState(false);

  const WHATSAPP_URL =
    "https://api.whatsapp.com/send/?phone=919876543210&text=Hi+North-cot+Support&type=phone_number&app_absent=0";

  const userName  = useSelector((s) => s.auth?.userName) || localStorage.getItem("userName") || "User";
  const userPhone = useSelector((s) => s.auth?.phone)    || localStorage.getItem("userPhone") || "—";
  const userRole  = useSelector((s) => s.auth?.role)     || "USER";

  const roleLabel = {
    SURVEYOR: "Government Surveyor",
    USER:     "Land Owner",
    ADMIN:    "Administrator",
  }[userRole] || userRole;

  const handleLogout = () => { dispatch(logout()); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/60 to-white">
      {showModal && <ChangeNumberModal onClose={() => setShowModal(false)} />}

      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Title ── */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">ಪ್ರೊಫೈಲ್</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Profile</h1>
        </div>

        {/* ── Identity Card ── */}
        <Card className="mb-4">
          <div className="flex items-center gap-4 p-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
              <UserIcon className="w-7 h-7 text-orange-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-extrabold text-slate-900 truncate">{userName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg className="w-3 h-3 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-xs font-semibold text-slate-500">{roleLabel}</p>
              </div>
            </div>

            {/* Edit btn */}
            <button
              onClick={() => setShowModal(true)}
              className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-colors"
            >
              <EditIcon className="w-3.5 h-3.5 text-orange-600" />
            </button>
          </div>

          <Divider />

          {/* Phone */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <PhoneIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-sm font-semibold text-slate-700">{userPhone}</p>
          </div>
        </Card>

        {/* ── Actions ── */}
        <Card className="mb-4">
          <MenuItem
            icon={<HistoryIcon className="w-5 h-5 text-orange-600" />}
            iconBg="bg-orange-50 border border-orange-100"
            label="Order History"
            sublabel="View all past CAD requests"
            onClick={() => navigate("/dashboard/user/order-history")}
          />
          <Divider />
          <MenuItem
            icon={<PhoneIcon className="w-5 h-5 text-orange-600" />}
            iconBg="bg-orange-50 border border-orange-100"
            label="Change Number"
            sublabel="Update your mobile number"
            onClick={() => setShowModal(true)}
          />
        </Card>

        {/* ── Support & Logout ── */}
        <Card>
          <MenuItem
            icon={<SupportIcon className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50 border border-emerald-100"
            label="ಸಹಾಯ / Contact Support"
            sublabel="Chat with us on WhatsApp"
            onClick={() => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")}
          />
          <Divider />
          <MenuItem
            icon={<LogOutIcon className="w-5 h-5 text-red-500" />}
            iconBg="bg-red-50 border border-red-100"
            label="ಲಾಗ್ ಔಟ್ / Logout"
            danger
            onClick={handleLogout}
          />
        </Card>

        {/* ── Version ── */}
        <p className="text-center text-xs text-slate-300 font-semibold mt-8">Version 1.0.0</p>

      </div>
    </div>
  );
};

export default ProfilePage;