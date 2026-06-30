/** Statuses where surveyors may submit CAD feedback. */
export const FEEDBACK_ELIGIBLE_STATUSES = new Set([
  "CAD_DELIVERED",
  "UNDER_REVIEW",
  "UNDER_REVISION",
  "APPROVED",
  "REJECTED",
]);

/** Embedded feedback on sketch/list payloads (when backend includes it). */
export function extractFeedbackFromEntity(entity) {
  if (!entity || typeof entity !== "object") return null;
  const fb =
    entity.feedback ??
    entity.assignmentFeedback ??
    entity.surveyorFeedback ??
    entity.cadFeedback ??
    null;
  if (!fb || typeof fb !== "object") return null;
  if (fb.rating == null && !fb.remarks?.trim() && !fb.audio?.url) return null;
  return fb;
}

export function isFeedbackEligibleStatus(status) {
  return FEEDBACK_ELIGIBLE_STATUSES.has(String(status || "").toUpperCase());
}

export function canViewAssignmentFeedback(row) {
  if (!row) return false;
  if (extractFeedbackFromEntity(row)) return true;
  if (isFeedbackEligibleStatus(row.status)) return true;
  return false;
}
