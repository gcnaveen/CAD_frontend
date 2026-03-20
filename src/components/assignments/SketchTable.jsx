import React from "react";

function getStatusBadgeClasses(status) {
  const s = String(status || "").toUpperCase();
  switch (s) {
    case "PENDING":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-700 ring-blue-200";
    case "UNDER_REVIEW":
      return "bg-yellow-100 text-yellow-800 ring-yellow-200";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "REJECTED":
      return "bg-rose-100 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function SketchTable({
  rows,
  loading,
  autoAssignEnabled,
  onAssignClick,
  onEditClick,
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Sketch ID</th>
              <th className="px-4 py-3">Uploaded By</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned CAD User</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : rows?.length ? (
              rows.map((row) => {
                const status = row?.status;
                const isPending = String(status || "").toUpperCase() === "PENDING";
                const canAssign = isPending && autoAssignEnabled === false;
                const canEdit = ["ASSIGNED", "UNDER_REVIEW"].includes(
                  String(status || "").toUpperCase()
                );

                const assignedUserName =
                  row?.assignedCadUser?.name ??
                  row?.cadCenter?.name ??
                  row?.assignment?.cadCenter?.name ??
                  row?.assignment?.cadCenterId?.name ??
                  row?.assignment?.cadUser?.name ??
                  row?.cadCenterId?.name ??
                  "-";

                const uploadedBy =
                  row?.uploadedBy?.name ??
                  row?.uploadedBy?.fullName ??
                  row?.surveyor?.name ??
                  row?.surveyor?.fullName ??
                  row?.user?.name ??
                  row?.user?.fullName ??
                  row?.uploadedBy ??
                  "-";

                const id = row?._id ?? row?.id ?? "-";

                return (
                  <tr key={String(id)} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-slate-900">
                      {String(id)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{uploadedBy}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                          getStatusBadgeClasses(status),
                        ].join(" ")}
                      >
                        {String(status || "-")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{assignedUserName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {fmtDate(row?.createdAt ?? row?.createdDate ?? row?.uploadedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {canAssign ? (
                          <button
                            type="button"
                            onClick={() => onAssignClick?.(row)}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Assign
                          </button>
                        ) : null}

                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => onEditClick?.(row)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  No sketches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {autoAssignEnabled === true ? (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Auto assignment enabled. Manual assignment disabled.
        </div>
      ) : null}
    </div>
  );
}

