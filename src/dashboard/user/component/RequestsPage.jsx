// src/dashboard/user/pages/RequestsPage.jsx
import React, { useEffect, useState } from "react";
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
const SearchIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const PlusIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
  </svg>
);

const STATUS_STYLES = {
  Pending:   "border-orange-200 bg-orange-50   text-orange-700",
  Active:    "border-blue-200   bg-blue-50     text-blue-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-200    bg-red-50      text-red-700",
};

const TABS = ["All", "Active", "Completed", "Cancelled"];

const RequestsPage = () => {
  const navigate = useNavigate();
  const token    = useSelector((s) => s.auth?.token);

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [tab,     setTab]     = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setOrders(data?.orders || data || []);
      } catch {
        // fallback demo
        setOrders([
          {
            serial: 1, id: "NC-2603-00002", date: "11 Mar 2026",
            status: "Pending",
            location: "Thalaghattapura, Uttarahalli, Bangalore South, Bangalore Urban",
            tags: ["11E Sketch", "Sy. 20"],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const countFor = (t) =>
    t === "All" ? orders.length : orders.filter((o) => o.status === t).length;

  const filtered = orders.filter((o) => {
    const matchTab    = tab === "All" || o.status === tab;
    const q           = search.toLowerCase();
    const matchSearch = !q || o.id?.toLowerCase().includes(q) || o.location?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/60 to-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">ವಿನಂತಿಗಳು</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Requests</h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/user/upload")}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white px-4 py-2.5 font-extrabold text-sm shadow-[0_8px_20px_rgba(234,88,12,0.25)] transition-colors shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            New
          </button>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-4">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search order ID, survey no, district…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition shadow-sm"
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-extrabold whitespace-nowrap transition-colors ${
                tab === t
                  ? "bg-orange-600 border-orange-600 text-white shadow-[0_4px_12px_rgba(234,88,12,0.25)]"
                  : "bg-white border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-700"
              }`}
            >
              {t} ({countFor(t)})
            </button>
          ))}
        </div>

        {/* ── List ── */}
        <div className="flex flex-col gap-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-lg w-2/5" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/4" />
                    <div className="h-3 bg-slate-100 rounded-lg w-3/4 mt-3" />
                    <div className="h-5 bg-slate-100 rounded-full w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-14 text-center">
              <p className="text-slate-400 font-extrabold text-sm">No requests found.</p>
              <p className="text-slate-300 text-xs mt-1 font-semibold">Try a different filter or search term</p>
            </div>
          ) : (
            filtered.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate(`/dashboard/user/requests/${order.id}`)}
                className="w-full rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-md hover:border-orange-200 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  {/* Serial */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-extrabold text-sm flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                    {order.serial ?? 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{order.id}</p>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold whitespace-nowrap ${STATUS_STYLES[order.status] || STATUS_STYLES.Pending}`}>
                          {order.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400 transition-colors" />
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
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default RequestsPage;