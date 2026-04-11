// src/dashboard/user/component/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getDrafts } from "../../../services/draftApi.js";
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
  const authSlice = useSelector((s) => s.auth);
  const userName = useMemo(() => {
    const fromRedux =
      authSlice?.user?.name?.first ||
      authSlice?.user?.name?.last ||
      authSlice?.userName;

    let fromStorageUserName = localStorage.getItem("userName");
    let fromStorageUser;
    try {
      const raw = localStorage.getItem("user");
      fromStorageUser = raw ? JSON.parse(raw) : null;
    } catch {
      fromStorageUser = null;
    }

    const first = fromStorageUser?.name?.first;
    const last = fromStorageUser?.name?.last;
    const full = [first, last].filter(Boolean).join(" ").trim();

    return (typeof fromRedux === "string" && fromRedux.trim()) ||
      (typeof full === "string" && full) ||
      (typeof fromStorageUserName === "string" && fromStorageUserName.trim()) ||
      "User";
  }, [authSlice]);

  const [drafts, setDrafts] = useState([]);
  const [draftTotal, setDraftTotal] = useState(0);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderRows, setOrderRows] = useState([]);
  const [orderCounts, setOrderCounts] = useState({ all: 0, active: 0, completed: 0, cancelled: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState(null);

  const loadDrafts = async () => {
    setDraftsLoading(true);
    try {
      const res = await getDrafts(1, 20);
      const items = Array.isArray(res?.items) ? res.items : [];
      const sorted = [...items].sort((a, b) => {
        const ad = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bd = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bd - ad;
      });
      setDrafts(sorted.slice(0, 3));
      setDraftTotal(typeof res?.meta?.total === "number" ? res.meta.total : items.length);
    } catch {
      setDrafts([]);
      setDraftTotal(0);
    } finally {
      setDraftsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await getSurveyorOrders({ bucket: "active", page: 1, limit: 5 });
      const items = Array.isArray(res?.data) ? res.data : [];
      const counts = res?.meta?.counts || {};
      setOrderRows(items);
      setOrderCounts({
        all: Number(counts?.all || 0),
        active: Number(counts?.active || 0),
        completed: Number(counts?.completed || 0),
        cancelled: Number(counts?.cancelled || 0),
      });
    } catch {
      setOrderRows([]);
      setOrderCounts({ all: 0, active: 0, completed: 0, cancelled: 0 });
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const stats = { active: orderCounts.active, completed: orderCounts.completed, spent: 0 };
  const hasDraft = drafts.length > 0;

  const pickId = (draft) => draft?._id ?? draft?.id;
  const getEntityName = (val) => (typeof val === "object" ? (val?.name ?? val?.label ?? val?._id ?? val?.id) : val);
  const getDraftProgress = (d) => {
    let done = 0;
    const total = 3;
    if (d?.surveyType && d?.district && d?.taluka && d?.hobli && d?.village && d?.surveyNo) done += 1;
    if (d?.others || d?.audio?.url || d?.isSuperimpose || d?.googleSuperimpose) done += 1;
    const hasSingle = !!(d?.singleUpload?.url || d?.singleUpload);
    const hasNormal = !!(d?.moolaTippani || d?.hissaTippani || d?.atlas || d?.rrPakkabook || d?.kharabu || d?.documents);
    if (hasSingle || hasNormal) done += 1;
    const pct = Math.round((done / total) * 100);
    return { step: done, total, pct };
  };
  const latestDraft = useMemo(() => drafts[0] ?? null, [drafts]);
  const latestProgress = latestDraft ? getDraftProgress(latestDraft) : { step: 0, total: 3, pct: 0 };

  const getOrderEntityName = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val?.name || val?.label || val?.code || "";
  };

  const normalizedOrders = useMemo(
    () =>
      orderRows.map((row, idx) => {
        const status =
          row?.status === "CAD_DELIVERED" || row?.status === "APPROVED"
            ? "Completed"
            : row?.status === "REJECTED"
            ? "Cancelled"
            : row?.status === "PENDING"
            ? "Pending"
            : "Active";
        return {
          serial: idx + 1,
          id: row?.applicationId || row?._id,
          date: new Date(row?.createdAt || Date.now()).toLocaleDateString("en-IN"),
          status,
          location: [getOrderEntityName(row?.village), getOrderEntityName(row?.hobli), getOrderEntityName(row?.taluka), getOrderEntityName(row?.district)]
            .filter(Boolean)
            .join(", "),
          tags: [row?.surveyType, row?.surveyNo ? `Sy. ${row.surveyNo}` : ""].filter(Boolean),
          uploadId: row?._id,
        };
      }),
    [orderRows]
  );

  const statusPill = (status) => {
    const map = {
      Pending:
        "border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] bg-[var(--user-accent-soft)] text-[var(--user-accent)]",
      Active:
        "border-[color-mix(in_srgb,var(--cyan-accent)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--cyan-accent)_10%,var(--bg-secondary))] text-[var(--cyan-accent)]",
      Completed:
        "border-[color-mix(in_srgb,var(--success)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--success)_10%,var(--bg-secondary))] text-success",
      Cancelled:
        "border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] text-danger",
    };
    return map[status] || map.Pending;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[var(--user-accent-soft)] via-[color-mix(in_srgb,var(--brand-gold)_08%,var(--bg-secondary))] to-[var(--bg-primary)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Welcome ── */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-[var(--user-accent)] uppercase mb-1">
            ಸ್ವಾಗತ / Welcome back
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg flex items-center gap-2">
            {userName} <span>👋</span>
          </h1>
        </div>

        {/* ── Total badge ── */}
        <div className="inline-flex items-center gap-2 bg-surface border border-[color-mix(in_srgb,var(--user-accent)_28%,var(--border-color))] rounded-full px-4 py-1.5 mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--user-accent)] animate-pulse" />
          <span className="text-sm font-bold text-fg">
            {stats.active + stats.completed} total orders placed
          </span>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Active */}
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--cyan-accent)_28%,var(--border-color))] bg-[color-mix(in_srgb,var(--cyan-accent)_10%,var(--bg-secondary))] p-3 sm:p-4 flex flex-col gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-surface flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--cyan-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-fg">{stats.active}</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-widest text-fg-muted uppercase">Active</div>
          </div>

          {/* Completed */}
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--success)_28%,var(--border-color))] bg-[color-mix(in_srgb,var(--success)_10%,var(--bg-secondary))] p-3 sm:p-4 flex flex-col gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-surface flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-fg">{stats.completed}</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-widest text-fg-muted uppercase">Completed</div>
          </div>

          {/* Spent */}
          {/* <div className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_28%,var(--border-color))] bg-[color-mix(in_srgb,var(--warning)_10%,var(--bg-secondary))] p-3 sm:p-4 flex flex-col gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-surface flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--warning)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h10M9 12h10M9 16h10M4 8h.01M4 12h.01M4 16h.01" />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-fg">₹{stats.spent}</div>
            <div className="text-[10px] sm:text-xs font-bold tracking-widest text-fg-muted uppercase">Spent</div>
          </div> */}
        </div>

        {/* ── Drafts preview (latest 3) ── */}
        {!draftsLoading && hasDraft && (
          <div className="mb-4 space-y-3">
            <button
              onClick={() => navigate(`/dashboard/user/upload?draftId=${pickId(latestDraft)}`)}
              className="w-full rounded-2xl border border-[color-mix(in_srgb,var(--warning)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--warning)_10%,var(--bg-secondary))] p-4 flex items-center gap-4 hover:bg-[color-mix(in_srgb,var(--warning)_16%,var(--bg-secondary))] transition-colors text-left"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-surface border border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] flex items-center justify-center shrink-0 shadow-sm">
                <PencilIcon className="w-5 h-5 text-[var(--user-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-extrabold text-fg">Continue your latest draft</p>
                <p className="text-xs font-bold text-fg-muted mb-2">
                  Step {latestProgress.step} of {latestProgress.total} — {latestProgress.pct}% complete
                </p>
                <div className="h-2 w-full max-w-[240px] rounded-full bg-[color-mix(in_srgb,var(--user-accent)_28%,var(--border-color))] overflow-hidden">
                  <div className="h-full bg-[var(--user-accent)] rounded-full transition-all" style={{ width: `${latestProgress.pct}%` }} />
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--user-accent)] shrink-0" />
            </button>

            <div className="rounded-2xl border border-line bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-extrabold text-fg">Recent Drafts</p>
                {draftTotal > 3 && (
                  <button
                    onClick={() => navigate("/dashboard/user/drafts")}
                    className="text-xs font-bold text-[var(--user-accent)] hover:opacity-90"
                  >
                    See more
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {drafts.map((d) => {
                  const id = pickId(d);
                  const village = getEntityName(d?.village) || "-";
                  const surveyNo = d?.surveyNo || "-";
                  return (
                    <button
                      key={id}
                      onClick={() => navigate(`/dashboard/user/upload?draftId=${id}`)}
                      className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-left hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] hover:bg-[var(--user-accent-soft)] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-fg truncate">Survey No: {surveyNo}</p>
                        <span className="text-[11px] font-semibold text-fg-muted">
                          {new Date(d?.updatedAt || d?.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-fg-muted truncate mt-0.5">{village}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── New Request CTA ── */}
        <button
          onClick={() => navigate("/dashboard/user/upload")}
          className="w-full rounded-3xl bg-[var(--user-accent)] hover:bg-[var(--user-accent-hover)] active:opacity-95 text-white px-5 py-4 sm:py-5 flex items-center justify-between gap-4 shadow-[0_12px_32px_color-mix(in_srgb,var(--user-accent)_28%,transparent)] mb-6 transition-colors"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[color-mix(in_srgb,white_20%,transparent)] border border-[color-mix(in_srgb,white_30%,transparent)] flex items-center justify-center shrink-0">
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
            <h2 className="text-lg sm:text-xl font-extrabold text-fg">Active Orders</h2>
            <button
              onClick={() => navigate("/dashboard/user/requests")}
              className="flex items-center gap-1 text-sm font-bold text-[var(--user-accent)] hover:opacity-90"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {ordersLoading ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface/60 py-10 text-center text-fg-muted font-bold text-sm">
              Loading active orders...
            </div>
          ) : normalizedOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface/60 py-10 text-center text-fg-muted font-bold text-sm">
              No active orders
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {normalizedOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedUploadId(order.uploadId);
                    setDrawerOpen(true);
                  }}
                  className="w-full rounded-2xl bg-surface border border-line p-4 hover:shadow-md hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Serial */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--user-accent-soft)] border border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] text-[var(--user-accent)] font-extrabold text-sm flex items-center justify-center shrink-0">
                      {order.serial}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm sm:text-base font-extrabold text-fg">{order.id}</p>
                          <p className="text-xs font-bold text-fg-muted mt-0.5">{order.date}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${statusPill(order.status)}`}>
                            {order.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-fg-muted" />
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
                            <span key={t} className="px-2.5 py-0.5 rounded-full border border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] bg-[var(--user-accent-soft)] text-[var(--user-accent)] text-[11px] font-extrabold">
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

export default Home;