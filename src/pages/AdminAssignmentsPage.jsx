import React from "react";
import { message, Drawer, Spin, Descriptions, Tag } from "antd";
import { useSelector } from "react-redux";
import { ROLES, normalizeRoleKey, resolveStoredUserRole } from "../constants/roles.js";
import {
  createAssignment,
  getCadUsers,
  getSurveySketchStatuses,
  getSurveySketchUploads,
  getAssignmentFlow,
  updateAssignment,
  updateAssignmentFlow,
  resolveAssignmentIdFromEntity,
  loadSketchUploadWithAssignment,
  formatUserDisplayLabel,
} from "../services/assignmentApi.js";
import {
  enrichAdminAssignmentTableRows,
  extractUploadsListResponse,
} from "../services/admin/adminAssignmentsTableService.js";
import {
  loadManualAssignGates,
  normalizeAssignmentFlow,
  parseManualAssignBlocked,
} from "../services/admin/autoAssignAdminService.js";
import AssignmentFlowToggle from "../components/assignments/AssignmentFlowToggle.jsx";
import SketchTable from "../components/assignments/SketchTable.jsx";
import AssignmentFeedbackViewer from "../components/assignments/AssignmentFeedbackViewer.jsx";
import AssignmentModal from "../components/assignments/AssignmentModal.jsx";
import SlaExtendModal from "../components/sla/SlaExtendModal.jsx";
import { extractFeedbackFromEntity } from "../utils/assignmentFeedbackUtils.js";
import { canonicalizeSketchStatus } from "../utils/lifecycleQc.js";

function normalizeStatuses(payload) {
  if (!payload) return [];
  if (Array.isArray(payload?.statuses)) return payload.statuses;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getAssignmentIdFromSketch(sketch) {
  return resolveAssignmentIdFromEntity(sketch);
}

export default function AdminAssignmentsPage() {
  const roleFromStore = useSelector((s) => s.auth?.role);
  const userRoleFromStore = useSelector((s) => s.auth?.user?.role);
  const roleKey = normalizeRoleKey(resolveStoredUserRole(roleFromStore, userRoleFromStore));
  const allowed = roleKey === ROLES.ADMIN || roleKey === ROLES.SUPER_ADMIN;

  const [autoAssignEnabled, setAutoAssignEnabled] = React.useState(false);
  const [flowPolicy, setFlowPolicy] = React.useState(null);
  const [exceptionQueueTotal, setExceptionQueueTotal] = React.useState(0);
  const [manualAssignHint, setManualAssignHint] = React.useState("");
  const [flowLoading, setFlowLoading] = React.useState(false);
  const [statuses, setStatuses] = React.useState([]);
  const [statusMeta, setStatusMeta] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [manualGates, setManualGates] = React.useState({});
  const [gatesLoading, setGatesLoading] = React.useState(false);
  const [tableLoading, setTableLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [meta, setMeta] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [cadUsers, setCadUsers] = React.useState([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("assign");
  const [modalSketch, setModalSketch] = React.useState(null);
  const [modalInitial, setModalInitial] = React.useState({});
  const [modalError, setModalError] = React.useState("");
  const [modalLoading, setModalLoading] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackSketch, setFeedbackSketch] = React.useState(null);
  const [feedbackLoading, setFeedbackLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState("");
  const [slaExtendOpen, setSlaExtendOpen] = React.useState(false);
  const [slaExtendAssignmentId, setSlaExtendAssignmentId] = React.useState(null);

  const applyFlow = React.useCallback((flowRaw) => {
    const flow = normalizeAssignmentFlow(flowRaw);
    setAutoAssignEnabled(flow.autoAssignEnabled);
    setFlowPolicy(flow.policy);
    setExceptionQueueTotal(flow.exceptionQueueTotal);
    setManualAssignHint(flow.manualAssignHint);
    return flow;
  }, []);

  const loadTop = React.useCallback(async () => {
    if (!allowed) return;
    setPageError("");
    try {
      const [flow, st, users] = await Promise.all([
        getAssignmentFlow(),
        getSurveySketchStatuses(),
        cadUsers.length ? Promise.resolve(cadUsers) : getCadUsers(),
      ]);
      applyFlow(flow);
      setStatuses(normalizeStatuses(st));
      setStatusMeta(
        st && typeof st === "object" && !Array.isArray(st)
          ? {
              labels: st.labels,
              transitions: st.transitions,
              qc: st.qc,
              notificationTriggers: st.notificationTriggers,
              analyticsKeys: st.analyticsKeys,
            }
          : null
      );
      if (!cadUsers.length && users?.length) setCadUsers(users);
    } catch (err) {
      if (err?.status === 403) setPageError("No permission");
      else setPageError(err?.message || "Failed to load assignment module");
    }
  }, [allowed, cadUsers.length, applyFlow]);

  const loadTable = React.useCallback(async () => {
    if (!allowed) return;
    setTableLoading(true);
    setGatesLoading(true);
    setPageError("");
    try {
      const resp = await getSurveySketchUploads(statusFilter, page, limit);
      const { uploads, meta: serverMeta } = extractUploadsListResponse(resp);
      setMeta(serverMeta);

      let users = cadUsers;
      if (!users.length) {
        users = await getCadUsers();
        setCadUsers(users);
      }

      const enriched = await enrichAdminAssignmentTableRows(uploads, users);
      setRows(enriched);

      const pendingIds = enriched
        .filter((row) => canonicalizeSketchStatus(row?.status) === "PENDING")
        .map((row) => row?._id ?? row?.id)
        .filter(Boolean);

      if (pendingIds.length) {
        const gates = await loadManualAssignGates(pendingIds);
        setManualGates(gates);
      } else {
        setManualGates({});
      }
    } catch (err) {
      if (err?.status === 403) setPageError("No permission");
      else setPageError(err?.message || "Failed to load sketches");
      setRows([]);
      setManualGates({});
    } finally {
      setTableLoading(false);
      setGatesLoading(false);
    }
  }, [allowed, statusFilter, page, limit, cadUsers]);

  React.useEffect(() => {
    loadTop();
  }, [loadTop]);

  React.useEffect(() => {
    loadTable();
  }, [loadTable]);

  const onToggleFlow = async (nextAutoEnabled) => {
    setFlowLoading(true);
    setPageError("");
    try {
      const updated = await updateAssignmentFlow({
        autoAssignEnabled: Boolean(nextAutoEnabled),
      });
      applyFlow(updated ?? { autoAssignEnabled: nextAutoEnabled });
      await loadTable();
    } catch (err) {
      if (err?.status === 403) setPageError("No permission");
      else setPageError(err?.message || "Failed to update assignment flow");
    } finally {
      setFlowLoading(false);
    }
  };

  const openAssign = async (sketch) => {
    setModalError("");
    setModalSketch(sketch);
    setModalMode("assign");
    setModalInitial({});
    setModalOpen(true);
    try {
      if (!cadUsers?.length) {
        const users = await getCadUsers();
        setCadUsers(users);
      }
    } catch (err) {
      setModalError(err?.message || "Failed to load CAD users");
    }
  };

  const openEdit = (sketch) => {
    setModalError("");
    setModalSketch(sketch);
    setModalMode("edit");
    setModalInitial({
      status: sketch?.status ?? "",
      notes: sketch?.assignment?.notes ?? sketch?.notes ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalSketch(null);
    setModalError("");
    setModalLoading(false);
  };

  const openFeedback = async (row) => {
    const uploadId = row?._id ?? row?.id;
    if (!uploadId) {
      message.error("Missing sketch id");
      return;
    }
    setFeedbackSketch(row);
    setFeedbackOpen(true);
    setFeedbackLoading(true);
    try {
      const detail = await loadSketchUploadWithAssignment(uploadId, row);
      setFeedbackSketch(detail);
    } catch (err) {
      message.error(err?.message || "Failed to load sketch for feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    setFeedbackSketch(null);
    setFeedbackLoading(false);
    loadTable();
  };

  const openExtendSla = (row) => {
    const assignmentId = getAssignmentIdFromSketch(row);
    if (!assignmentId) {
      message.error("Missing assignment id for this sketch");
      return;
    }
    setSlaExtendAssignmentId(assignmentId);
    setSlaExtendOpen(true);
  };

  const submitModal = async (payload) => {
    setModalLoading(true);
    setModalError("");
    try {
      if (modalMode === "assign") {
        await createAssignment(payload);
      } else {
        const assignmentId = getAssignmentIdFromSketch(modalSketch);
        if (!assignmentId) throw new Error("Missing assignment id for this sketch");
        await updateAssignment(assignmentId, payload);
      }
      closeModal();
      await loadTop();
      await loadTable();
    } catch (err) {
      const blocked = parseManualAssignBlocked(err);
      if (blocked.blocked) {
        setModalError(blocked.message);
      } else if (err?.status === 409) {
        setModalError("Sketch already assigned");
      } else if (err?.status === 403) {
        setModalError("No permission");
      } else {
        setModalError(err?.message || "Failed to save assignment");
      }
    } finally {
      setModalLoading(false);
    }
  };

  const feedbackAssignmentId = resolveAssignmentIdFromEntity(feedbackSketch);
  const feedbackEmbedded = extractFeedbackFromEntity(feedbackSketch);
  const feedbackSurveyor =
    formatUserDisplayLabel(feedbackSketch?.surveyor) ||
    formatUserDisplayLabel(feedbackSketch?.uploadedBy) ||
    formatUserDisplayLabel(feedbackSketch?.user) ||
    "—";
  const feedbackCadUser =
    feedbackSketch?.assignedCadUserLabel ||
    formatUserDisplayLabel(feedbackSketch?.assignedCadUser) ||
    formatUserDisplayLabel(feedbackSketch?.assignment?.cadUser) ||
    formatUserDisplayLabel(feedbackSketch?.assignment?.cadCenterId) ||
    "—";

  const rangeStart = meta.total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, meta.total);
  const canGoPrev = page > 1;
  const canGoNext = page < meta.totalPages;

  if (!allowed) {
    return (
      <div className="theme-animate-surface rounded-xl border border-line bg-surface p-6">
        <div className="text-base font-semibold text-fg">No permission</div>
        <div className="mt-1 text-sm text-fg-muted">
          This page is available only for ADMIN and SUPER_ADMIN.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-fg">Survey Sketch Assignments</div>
          <div className="mt-1 text-sm text-fg-muted">
            Assign CAD users and view surveyor feedback after delivery.
          </div>
          {statusMeta?.qc?.approvedCopy ? (
            <div className="mt-1 text-xs text-fg-muted">
              QC ({statusMeta.qc.checkCount || 10}-point {statusMeta.qc.checklistId || "11E"}):{" "}
              {statusMeta.qc.approvedCopy}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            loadTop();
            loadTable();
          }}
          disabled={tableLoading}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {pageError ? (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] px-4 py-3 text-sm text-danger">
          {pageError}
        </div>
      ) : null}

      <AssignmentFlowToggle
        value={autoAssignEnabled}
        loading={flowLoading}
        onChange={onToggleFlow}
        policy={flowPolicy}
        exceptionQueueTotal={exceptionQueueTotal}
        manualAssignHint={manualAssignHint}
      />

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-fg">Status</label>
            <select
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={String(s?.value ?? s)} value={String(s?.value ?? s)}>
                  {String(s?.label ?? s?.value ?? s)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg">Rows per page</label>
            <select
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-fg">Results</label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm text-fg-muted">
                {meta.total > 0 ? (
                  <>
                    Showing <span className="font-semibold text-fg">{rangeStart}</span>–
                    <span className="font-semibold text-fg">{rangeEnd}</span> of{" "}
                    <span className="font-semibold text-fg">{meta.total}</span>
                  </>
                ) : (
                  "No results"
                )}
              </span>
              <button
                type="button"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2 disabled:opacity-60"
                disabled={!canGoPrev || tableLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm text-fg-muted">
                Page <span className="font-semibold text-fg">{page}</span> of{" "}
                <span className="font-semibold text-fg">{meta.totalPages || 1}</span>
              </span>
              <button
                type="button"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2 disabled:opacity-60"
                disabled={!canGoNext || tableLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SketchTable
        rows={rows}
        loading={tableLoading}
        autoAssignEnabled={autoAssignEnabled}
        manualGates={manualGates}
        gatesLoading={gatesLoading}
        onAssignClick={openAssign}
        onEditClick={openEdit}
        onFeedbackClick={openFeedback}
        onExtendSlaClick={openExtendSla}
      />

      <Drawer
        title="Surveyor feedback"
        placement="right"
        width={Math.min(520, typeof window !== "undefined" ? window.innerWidth - 24 : 520)}
        open={feedbackOpen}
        onClose={closeFeedback}
        destroyOnClose
      >
        {feedbackLoading ? (
          <div className="flex justify-center py-12">
            <Spin tip="Loading…" />
          </div>
        ) : (
          <div className="space-y-4">
            <Descriptions size="small" bordered column={1}>
              <Descriptions.Item label="Application ID">
                {feedbackSketch?.applicationId || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag>{String(feedbackSketch?.status || "—")}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Surveyor">{feedbackSurveyor}</Descriptions.Item>
              <Descriptions.Item label="CAD user">{feedbackCadUser}</Descriptions.Item>
            </Descriptions>
            <AssignmentFeedbackViewer
              assignmentId={feedbackAssignmentId}
              initialFeedback={feedbackEmbedded}
            />
          </div>
        )}
      </Drawer>

      <AssignmentModal
        open={modalOpen}
        mode={modalMode}
        loading={modalLoading}
        sketch={modalSketch}
        statuses={statuses}
        cadUsers={cadUsers}
        initialValues={modalInitial}
        errorText={modalError}
        onClose={closeModal}
        onSubmit={submitModal}
      />

      <SlaExtendModal
        open={slaExtendOpen}
        assignmentId={slaExtendAssignmentId}
        onClose={() => {
          setSlaExtendOpen(false);
          setSlaExtendAssignmentId(null);
        }}
        onSuccess={() => {
          loadTable();
        }}
      />
    </div>
  );
}
