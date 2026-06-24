import React from "react";
import { Rate, Spin, Typography } from "antd";
import { Music } from "lucide-react";
import { getAssignmentFeedback } from "../../services/assignmentApi.js";

const { Text } = Typography;

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN");
  } catch {
    return String(value);
  }
}

/**
 * Read-only CAD feedback for an assignment (GET surveyor feedback API; Admin/Super Admin allowed).
 */
export default function AssignmentFeedbackViewer({ assignmentId }) {
  const [loading, setLoading] = React.useState(Boolean(assignmentId));
  const [feedback, setFeedback] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!assignmentId) {
      setLoading(false);
      setFeedback(null);
      setError("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAssignmentFeedback(assignmentId);
        if (!cancelled) setFeedback(data || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load feedback");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  if (!assignmentId) {
    return <p className="text-sm text-fg-muted">No assignment linked to this sketch.</p>;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin tip="Loading feedback…" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (!feedback) {
    return (
      <p className="text-sm text-fg-muted">
        No surveyor feedback has been submitted for this assignment yet.
      </p>
    );
  }

  const audioUrl = feedback.audio?.url;

  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface-2/40 p-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Rating</div>
        <Rate disabled allowHalf value={Number(feedback.rating) || 0} className="mt-1" />
        <span className="ml-2 text-sm font-semibold text-fg">{feedback.rating ?? "—"}</span>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Remarks</div>
        <Text className="mt-1 block whitespace-pre-wrap text-sm text-fg">
          {feedback.remarks?.trim() ? feedback.remarks : "—"}
        </Text>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Voice note</div>
        {audioUrl ? (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 text-sm text-fg">
              <Music className="h-4 w-4 shrink-0" />
              <span className="truncate">{feedback.audio?.fileName || "Audio"}</span>
            </div>
            <audio controls src={audioUrl} className="w-full" preload="metadata">
              Your browser does not support audio playback.
            </audio>
          </div>
        ) : (
          <p className="mt-1 text-sm text-fg-muted">No audio attached.</p>
        )}
      </div>

      <div className="border-t border-line pt-2 text-xs text-fg-muted">
        Updated {formatDate(feedback.updatedAt ?? feedback.createdAt)}
      </div>
    </div>
  );
}
