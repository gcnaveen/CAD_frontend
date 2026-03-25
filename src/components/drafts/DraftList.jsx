import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import { deleteDraft, getDrafts } from "../../services/draftApi.js";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function pickId(draft) {
  return draft?._id ?? draft?.id;
}

function getLabel(value) {
  return value ?? "-";
}

export default function DraftList({ className = "" }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);

  const totalPages = useMemo(() => {
    if (!total || !limit) return null;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDrafts(page, limit);
      const nextItems = data?.items ?? data?.docs ?? data ?? [];
      const meta = data?.meta ?? null;
      setItems(Array.isArray(nextItems) ? nextItems : []);
      if (typeof meta?.total === "number") setTotal(meta.total);
      else if (typeof data?.total === "number") setTotal(data.total);
      else if (typeof data?.count === "number") setTotal(data.count);
      else setTotal(null);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) message.error("No permission");
      else message.error(err.message || "Failed to load drafts");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleContinue = (id) => {
    if (!id) return;
    navigate(`/dashboard/user/upload?draftId=${id}`);
  };

  const handleDelete = (draft) => {
    const id = pickId(draft);
    if (!id) return;
    Modal.confirm({
      title: "Delete draft?",
      content: "This will permanently remove the saved draft.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setDeletingId(id);
        try {
          await deleteDraft(id);
          setItems((prev) => prev.filter((d) => pickId(d) !== id));
          message.success("Draft deleted");
        } catch (err) {
          const status = err?.response?.status;
          if (status === 403) message.error("No permission");
          else if (status === 404) message.error("Draft not found");
          else message.error(err.message || "Failed to delete draft");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your Drafts</h2>
          <p className="text-sm text-gray-600">
            Continue where you left off, or delete old drafts.
          </p>
        </div>
        <Button onClick={load} loading={loading} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Survey Type</th>
                <th className="px-4 py-3">Survey No</th>
                <th className="px-4 py-3">District / Village</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-600" colSpan={5}>
                    {loading ? "Loading drafts..." : "No drafts yet."}
                  </td>
                </tr>
              ) : (
                items.map((d) => {
                  const id = pickId(d);
                  const districtName = d?.district?.name ?? d?.districtName ?? d?.district;
                  const villageName = d?.village?.name ?? d?.villageName ?? d?.village;
                  const updatedAt = d?.updatedAt ?? d?.lastUpdated ?? d?.modifiedAt;
                  return (
                    <tr key={id ?? Math.random()} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">{getLabel(d?.surveyType)}</td>
                      <td className="px-4 py-3">{getLabel(d?.surveyNo)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {getLabel(districtName)}
                        </div>
                        <div className="text-xs text-gray-600">{getLabel(villageName)}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="primary"
                            onClick={() => handleContinue(id)}
                            disabled={!id}
                          >
                            Continue
                          </Button>
                          <Button
                            danger
                            onClick={() => handleDelete(d)}
                            loading={deletingId === id}
                            disabled={!id || deletingId === id}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {(totalPages && totalPages > 1) || items.length > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-3">
            <div className="text-xs text-gray-600">
              Page {page}
              {totalPages ? ` of ${totalPages}` : ""}
            </div>
            <div className="flex gap-2">
              <Button
                size="small"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                size="small"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || (totalPages ? page >= totalPages : false)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

