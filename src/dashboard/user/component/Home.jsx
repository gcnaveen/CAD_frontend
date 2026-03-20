// src/dashboard/user/component/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PinIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ChevronRight = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const PencilIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const PlusIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
  </svg>
);

const Home = () => {
  const navigate = useNavigate();
  const userName =
    useSelector((s) => s.auth?.userName) ||
    localStorage.getItem("userName") ||
    "User";

  // Replace with real data from your API/Redux
  const stats = { active: 1, completed: 0, spent: 0 };
  const hasDraft = true;
  const draftStep = 1;
  const draftTotal = 3;
  const draftPct = Math.round((draftStep / draftTotal) * 100);

  const activeOrders = [
    {
      serial: 1,
      id: "NC-2603-00002",
      date: "11 Mar 2026",
      status: "Pending",
      location: "Thalaghattapura, Uttarahalli, Bangalore South, Bangalore Urban",
      tags: ["11E Sketch", "Sy. 20"],
    },
  ];

  const statusPill = (status) => {
    const map = {
      Pending:   "border-orange-200 bg-orange-50   text-orange-700",
      Active:    "border-blue-200   bg-blue-50     text-blue-700",
      Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Cancelled: "border-red-200    bg-red-50      text-red-700",
    };
    return map[status] || map.Pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/60 to-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Welcome ── */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">
            ಸ್ವಾಗತ / Welcome back
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-2">
            {userName} <span>👋</span>
          </h1>
        </div>

        {/* ── Total badge ── */}
        <div className="inline-flex items-center gap-2 bg-white border border-orange-100 rounded-full px-4 py-1.5 mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-700">
            {stats.active + stats.completed} total orders placed
          </span>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Active */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4 flex flex-col gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.active}</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-500 uppercase">Active</div>
          </div>

          {/* Completed */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 sm:p-4 flex flex-col gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.completed}</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-500 uppercase">Completed</div>
          </div>

          {/* Spent */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 sm:p-4 flex flex-col gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h10M9 12h10M9 16h10M4 8h.01M4 12h.01M4 16h.01" />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{stats.spent}</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-500 uppercase">Spent</div>
          </div>
        </div>

        {/* ── Draft banner ── */}
        {hasDraft && (
          <button
            onClick={() => navigate("/dashboard/user/upload")}
            className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4 flex items-center gap-4 hover:bg-amber-100/60 transition-colors text-left"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-center shrink-0 shadow-sm">
              <PencilIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-extrabold text-slate-900">Continue your draft</p>
              <p className="text-xs font-bold text-slate-500 mb-2">
                Step {draftStep} of {draftTotal} — {draftPct}% complete
              </p>
              <div className="h-2 w-full max-w-[240px] rounded-full bg-amber-200/70 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${draftPct}%` }} />
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-500 shrink-0" />
          </button>
        )}

        {/* ── New Request CTA ── */}
        <button
          onClick={() => navigate("/dashboard/user/upload")}
          className="w-full rounded-3xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white px-5 py-4 sm:py-5 flex items-center justify-between gap-4 shadow-[0_12px_32px_rgba(234,88,12,0.28)] mb-6 transition-colors"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-white/75 leading-none mb-1">ಹೊಸ CAD ವಿನಂತಿ</p>
              <p className="text-base sm:text-lg font-extrabold leading-tight">New Request</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
        </button>

        {/* ── Active Orders ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Active Orders</h2>
            <button
              onClick={() => navigate("/dashboard/user/requests")}
              className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-10 text-center text-slate-400 font-bold text-sm">
              No active orders
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate("/dashboard/user/requests")}
                  className="w-full rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-md hover:border-orange-200 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Serial */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                      {order.serial}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm sm:text-base font-extrabold text-slate-900">{order.id}</p>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{order.date}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${statusPill(order.status)}`}>
                            {order.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="mt-2.5 flex items-start gap-1.5 text-xs sm:text-sm text-slate-500 font-semibold leading-snug">
                        <PinIcon className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                        <span>{order.location}</span>
                      </div>

                      {/* Tags */}
                      {order.tags?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {order.tags.map((t) => (
                            <span key={t} className="px-2.5 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 text-[11px] font-extrabold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Home;