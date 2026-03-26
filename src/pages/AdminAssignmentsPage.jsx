import React from "react";
import { useSelector } from "react-redux";
import { ROLES } from "../constants/roles.js";
import {
  createAssignment,
  getCadUsers,
  getSurveySketchStatuses,
  getSurveySketchUploads,
  getAssignmentFlow,
  updateAssignment,
  updateAssignmentFlow,
} from "../services/assignmentApi.js";

import AssignmentFlowToggle from "../components/assignments/AssignmentFlowToggle.jsx";
import SketchTable from "../components/assignments/SketchTable.jsx";
import AssignmentModal from "../components/assignments/AssignmentModal.jsx";

function getCurrentRole(roleFromRedux) {
  if (roleFromRedux) return roleFromRedux;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored)?.role : null;
  } catch {
    return null;
  }
}

function normalizeStatuses(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.statuses)) return payload.statuses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function extractUploadsResponse(payload) {
  // Expected backend could be:
  // - { success, data: { uploads: [], total, page, limit } }
  // - { success, data: [], meta: { ... } }
  // - { uploads: [], total, ... }
  // - [] (direct)
  const root = payload?.data ?? payload;
  const uploads =
    Array.isArray(root) ? root :
    Array.isArray(root?.uploads) ? root.uploads :
    Array.isArray(root?.results) ? root.results :
    Array.isArray(root?.items) ? root.items :
    Array.isArray(root?.data) ? root.data :
    [];

  const metaRoot = root?.meta ?? root?.pagination ?? root;
  const pager =
    metaRoot?.pagination && typeof metaRoot.pagination === "object"
      ? metaRoot.pagination
      : metaRoot;
  const page = Number(pager?.page ?? metaRoot?.page ?? pager?.currentPage ?? 1) || 1;
  const limit = Number(pager?.limit ?? metaRoot?.limit ?? pager?.perPage ?? 10) || 10;
  const total =
    Number(
      pager?.total ?? metaRoot?.total ?? pager?.totalItems ?? pager?.count ?? uploads.length
    ) || uploads.length;
  const totalPages =
    Number(
      pager?.totalPages ?? metaRoot?.totalPages ?? pager?.pages ?? (limit ? Math.ceil(total / limit) : 1)
    ) || 1;

  return { uploads, meta: { page, limit, total, totalPages } };
}

function getAssignmentIdFromSketch(sketch) {
  return (
    sketch?.assignmentId ??
    sketch?.assignment?._id ??
    sketch?.assignment?.id ??
    sketch?.assignment?._id ??
    sketch?.assignment?._id ??
    null
  );
}

export default function AdminAssignmentsPage() {
  const roleFromRedux = useSelector((s) => s.auth?.role);
  const currentRole = getCurrentRole(roleFromRedux);
  const allowed = currentRole === ROLES.ADMIN || currentRole === ROLES.SUPER_ADMIN;

  const [autoAssignEnabled, setAutoAssignEnabled] = React.useState(false);
  const [flowLoading, setFlowLoading] = React.useState(false);

  const [statuses, setStatuses] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState("");

  const [rows, setRows] = React.useState([]);
  const [tableLoading, setTableLoading] = React.useState(false);

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [meta, setMeta] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [cadUsers, setCadUsers] = React.useState([]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("assign"); // "assign" | "edit"
  const [modalSketch, setModalSketch] = React.useState(null);
  const [modalInitial, setModalInitial] = React.useState({});
  const [modalError, setModalError] = React.useState("");
  const [modalLoading, setModalLoading] = React.useState(false);

  const [pageError, setPageError] = React.useState("");

  const loadTop = React.useCallback(async () => {
    if (!allowed) return;
    setPageError("");

    try {
      const [flow, st] = await Promise.all([getAssignmentFlow(), getSurveySketchStatuses()]);
      const enabled =
        flow?.autoAssignEnabled ??
        flow?.enabled ??
        flow?.isAuto ??
        flow?.auto ??
        flow?.autoAssign ??
        false;
      setAutoAssignEnabled(Boolean(enabled));
      setStatuses(normalizeStatuses(st));
    } catch (err) {
      if (err?.status === 403) {
        setPageError("No permission");
      } else {
        setPageError(err?.message || "Failed to load assignment module");
      }
    }
  }, [allowed]);

  const loadTable = React.useCallback(async () => {
    if (!allowed) return;
    setTableLoading(true);
    setPageError("");
    try {
      const resp = await getSurveySketchUploads(statusFilter, page, limit);
      const { uploads, meta: m } = extractUploadsResponse(resp);
      setRows(uploads);
      setMeta(m);
    } catch (err) {
      if (err?.status === 403) {
        setPageError("No permission");
      } else {
        setPageError(err?.message || "Failed to load sketches");
      }
    } finally {
      setTableLoading(false);
    }
  }, [allowed, statusFilter, page, limit]);

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
      await updateAssignmentFlow({ autoAssignEnabled: Boolean(nextAutoEnabled) });
      setAutoAssignEnabled(Boolean(nextAutoEnabled));
    } catch (err) {
      if (err?.status === 403) {
        setPageError("No permission");
      } else {
        setPageError(err?.message || "Failed to update assignment flow");
      }
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
      dueDate:
        sketch?.assignment?.dueDate?.slice?.(0, 10) ??
        sketch?.dueDate?.slice?.(0, 10) ??
        "",
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

  const submitModal = async (payload) => {
    setModalLoading(true);
    setModalError("");
    try {
      if (modalMode === "assign") {
        await createAssignment(payload);
      } else {
        const assignmentId = getAssignmentIdFromSketch(modalSketch);
        if (!assignmentId) {
          throw new Error("Missing assignment id for this sketch");
        }
        await updateAssignment(assignmentId, payload);
      }
      closeModal();
      await loadTable();
    } catch (err) {
      if (err?.status === 409) {
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
          <div className="text-lg font-semibold text-fg">
            Survey Sketch Assignments
          </div>
          <div className="mt-1 text-sm text-fg-muted">
            Manage assignments created from survey sketch uploads.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadTable()}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2"
          >
            Refresh
          </button>
        </div>
      </div>

      {pageError ? (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] px-4 py-3 text-sm text-danger">
          {pageError}
        </div>
      ) : null}

      <AssignmentFlowToggle value={autoAssignEnabled} loading={flowLoading} onChange={onToggleFlow} />

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-fg">Status</label>
            <select
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              {statuses.map((s) => (
                <option key={String(s?.value ?? s)} value={String(s?.value ?? s)}>
                  {String(s?.label ?? s?.value ?? s)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-fg">Rows</label>
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
                  {n} / page
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-fg">Pagination</label>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2 disabled:opacity-60"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <div className="text-sm text-fg-muted">
                Page <span className="font-semibold text-fg">{meta.page}</span>
                {meta.totalPages ? (
                  <>
                    {" "}
                    / <span className="font-semibold text-fg">{meta.totalPages}</span>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2 disabled:opacity-60"
                disabled={meta.totalPages ? page >= meta.totalPages : rows.length < limit}
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
        onAssignClick={openAssign}
        onEditClick={openEdit}
      />

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
    </div>
  );
}

