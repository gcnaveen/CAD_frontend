import React from "react";
import { Modal, Select } from "antd";
import { resolveAssignedCadUserIdFromEntity, formatUserDisplayLabel } from "../../services/assignmentApi.js";

function getSketchId(sketch) {
  return sketch?._id ?? sketch?.id ?? "";
}

function getCurrentAssignedCadUserId(sketch) {
  return resolveAssignedCadUserIdFromEntity(sketch);
}

export default function PullbackReassignModal({
  open,
  loading,
  sketch,
  cadUsers,
  errorText,
  onClose,
  onSubmit,
}) {
  const [assignedCadUserId, setAssignedCadUserId] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setAssignedCadUserId("");
    }
  }, [open, sketch?._id]);

  const sketchId = getSketchId(sketch);
  const currentId = getCurrentAssignedCadUserId(sketch);
  const cadOptions = (cadUsers || []).filter((u) => {
    const id = u?._id ?? u?.id;
    if (!id || !currentId) return true;
    return String(id) !== String(currentId);
  });

  const submit = () => {
    if (!assignedCadUserId) return;
    onSubmit?.({ assignedCadUserId });
  };

  return (
    <Modal
      title="Pull back & reassign"
      open={open}
      onCancel={() => onClose?.()}
      onOk={submit}
      okText={loading ? "Saving…" : "Pull back & reassign"}
      cancelText="Cancel"
      confirmLoading={loading}
      okButtonProps={{
        disabled: loading || !assignedCadUserId || cadOptions.length === 0,
      }}
      destroyOnClose
      zIndex={2000}
      getContainer={() => document.body}
      maskClosable={!loading}
      width={520}
    >
      <p className="mb-3 text-xs text-fg-muted">
        Removes the job from the current CAD user and assigns it to someone else. Allowed while
        assignment is ASSIGNED, IN_PROGRESS, or ON_HOLD.
      </p>
      <p className="mb-4 text-xs text-fg-muted">
        Sketch: <span className="font-mono">{String(sketchId || "-")}</span>
      </p>

      {errorText ? (
        <div className="mb-4 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] px-3 py-2 text-sm text-danger">
          {errorText}
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-fg">Reassign to CAD user</label>
        <Select
          className="w-full"
          placeholder="Select CAD user"
          value={assignedCadUserId || undefined}
          onChange={setAssignedCadUserId}
          options={cadOptions.map((u) => ({
            value: String(u?._id ?? u?.id ?? ""),
            label: formatUserDisplayLabel(u) || String(u?._id ?? u?.id ?? ""),
          }))}
          showSearch
          optionFilterProp="label"
          disabled={loading}
        />
        {cadOptions.length === 0 ? (
          <p className="mt-2 text-xs text-fg-muted">
            No other CAD users available. Add CAD users or pick a different operator.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
