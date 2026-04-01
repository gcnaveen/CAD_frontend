// src/dashboard/user/pages/RequestsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSurveyorOrders } from "../../../services/surveyor/sketchUploadService.js";
import SurveyOrderDetailDrawer from "./SurveyOrderDetailDrawer.jsx";

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
  Pending:
    "border-line bg-[color-mix(in_srgb,var(--user-accent)_14%,var(--bg-secondary))] text-[var(--user-accent)]",
  Active:
    "border-line bg-[color-mix(in_srgb,var(--accent-color)_12%,var(--bg-secondary))] text-accent",
  Completed:
    "border-line bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-secondary))] text-success",
  Cancelled:
    "border-line bg-[color-mix(in_srgb,var(--danger)_10%,var(--bg-secondary))] text-danger",
};

const TABS = ["all", "active", "completed", "cancelled"];

const RequestsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders,  setOrders]  = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [tab,     setTab]     = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState(null);

  const mapStatus = (apiStatus) => {
    if (apiStatus === "CAD_DELIVERED" || apiStatus === "APPROVED") return "Completed";
    if (apiStatus === "REJECTED") return "Cancelled";
    if (apiStatus === "PENDING") return "Pending";
    return "Active";
  };

  const getEntityName = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value?.name || value?.label || value?.code || "";
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getSurveyorOrders({ bucket: tab, page: 1, limit: 50 });
        const rows = Array.isArray(res?.data) ? res.data : [];
        setOrders(rows.map((row, index) => ({
          serial: index + 1,
          id: row?.applicationId || row?._id,
          date: new Date(row?.createdAt || Date.now()).toLocaleDateString("en-IN"),
          status: mapStatus(row?.status),
          location: [getEntityName(row?.village), getEntityName(row?.hobli), getEntityName(row?.taluka), getEntityName(row?.district)]
            .filter(Boolean)
            .join(", "),
          tags: [row?.surveyType, row?.surveyNo ? `Sy. ${row.surveyNo}` : ""].filter(Boolean),
          uploadId: row?._id,
        })));
        setCounts({
          all: Number(res?.meta?.counts?.all || 0),
          active: Number(res?.meta?.counts?.active || 0),
          completed: Number(res?.meta?.counts?.completed || 0),
          cancelled: Number(res?.meta?.counts?.cancelled || 0),
        });
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  useEffect(() => {
    const preselect = location?.state?.openOrderId;
    if (preselect) {
      setSelectedUploadId(preselect);
      setDrawerOpen(true);
    }
  }, [location?.state]);

  const countFor = (t) => counts[t] || 0;

  const filtered = useMemo(() => orders.filter((o) => {
    const q           = search.toLowerCase();
    const matchSearch = !q || o.id?.toLowerCase().includes(q) || o.location?.toLowerCase().includes(q);
    return matchSearch;
  }), [orders, search]);

  return (
    <div className="theme-animate-surface min-h-screen bg-gradient-to-br from-surface via-surface-2 to-surface">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-[var(--user-accent)] uppercase mb-1">ವಿನಂತಿಗಳು</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg">Requests</h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/user/upload")}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--user-accent)] hover:opacity-90 active:opacity-95 text-white px-4 py-2.5 font-extrabold text-sm shadow-[0_8px_20px_color-mix(in_srgb,var(--user-accent)_28%,transparent)] transition-colors shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            New
          </button>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-4">
          <SearchIcon className="w-4 h-4 text-fg-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search order ID, survey no, district…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-line rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-fg placeholder:text-fg-muted outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--user-accent)_35%,transparent)] focus:border-[var(--user-accent)] transition shadow-sm"
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
                  ? "bg-[var(--user-accent)] border-[var(--user-accent)] text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--user-accent)_28%,transparent)]"
                  : "bg-surface border-line text-fg-muted hover:border-[color-mix(in_srgb,var(--user-accent)_40%,var(--border-color))] hover:text-[var(--user-accent)]"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({countFor(t)})
            </button>
          ))}
        </div>

        {/* ── List ── */}
        <div className="flex flex-col gap-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-2 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-2 rounded-lg w-2/5" />
                    <div className="h-3 bg-surface-2 rounded-lg w-1/4" />
                    <div className="h-3 bg-surface-2 rounded-lg w-3/4 mt-3" />
                    <div className="h-5 bg-surface-2 rounded-full w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-[color-mix(in_srgb,var(--bg-elevated)_65%,transparent)] py-14 text-center">
              <p className="text-fg-muted font-extrabold text-sm">No requests found.</p>
              <p className="text-fg-muted/70 text-xs mt-1 font-semibold">Try a different filter or search term</p>
            </div>
          ) : (
            filtered.map((order) => (
              <button
                key={order.id}
                onClick={() => {
                  setSelectedUploadId(order.uploadId);
                  setDrawerOpen(true);
                }}
                className="w-full rounded-2xl bg-surface border border-line p-4 hover:shadow-md hover:border-[color-mix(in_srgb,var(--user-accent)_40%,var(--border-color))] transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  {/* Serial */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[color-mix(in_srgb,var(--user-accent)_14%,var(--bg-secondary))] border border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] text-[var(--user-accent)] font-extrabold text-sm flex items-center justify-center shrink-0 group-hover:bg-[color-mix(in_srgb,var(--user-accent)_18%,var(--bg-secondary))] transition-colors">
                    {order.serial ?? 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-extrabold text-fg truncate">{order.id}</p>
                        <p className="text-xs font-bold text-fg-muted mt-0.5">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold whitespace-nowrap ${STATUS_STYLES[order.status] || STATUS_STYLES.Pending}`}>
                          {order.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-fg-muted group-hover:text-[var(--user-accent)] transition-colors" />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs sm:text-sm text-fg-muted font-semibold leading-snug">
                      <PinIcon className="w-3.5 h-3.5 text-[var(--user-accent)] shrink-0 mt-0.5" />
                      <span>{order.location}</span>
                    </div>

                    {/* Tags */}
                    {order.tags?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {order.tags.map((t) => (
                          <span key={t} className="px-2.5 py-0.5 rounded-full border border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--user-accent)_12%,var(--bg-secondary))] text-[var(--user-accent)] text-[11px] font-extrabold">
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

        <SurveyOrderDetailDrawer
          open={drawerOpen}
          uploadId={selectedUploadId}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedUploadId(null);
          }}
        />

      </div>
    </div>
  );
};

export default RequestsPage;