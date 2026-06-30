import React from "react";
import { Drawer, Spin, Typography, Descriptions, Tag } from "antd";
import CadWalletPayoutSection from "../cadWallet/CadWalletPayoutSection.jsx";
import { formatUserDisplayLabel, resolveAssignmentIdFromEntity } from "../../services/assignmentApi.js";
import AssignmentFeedbackViewer from "./AssignmentFeedbackViewer.jsx";

const { Title } = Typography;

/**
 * Admin assignments: survey sketch detail + CAD wallet payout (entries from upload payload).
 */
export default function AssignmentCadPayoutDrawer({
  open,
  onClose,
  sketch,
  loading = false,
  canManage = true,
  onRefresh,
}) {
  const status = String(sketch?.status ?? "—");
  const assignmentIdForFeedback = resolveAssignmentIdFromEntity(sketch);
  const applicationId = sketch?.applicationId || "—";
  const uploadedBy =
    formatUserDisplayLabel(sketch?.uploadedBy) ||
    formatUserDisplayLabel(sketch?.surveyor) ||
    formatUserDisplayLabel(sketch?.user) ||
    "—";

  return (
    <Drawer
      title="Survey sketch & CAD payout"
      placement="right"
      width={Math.min(920, typeof window !== "undefined" ? window.innerWidth - 24 : 920)}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" tip="Loading sketch…" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Title level={5} style={{ marginBottom: 8 }}>
              Sketch summary
            </Title>
            <Descriptions size="small" bordered column={1}>
              <Descriptions.Item label="Application ID">{applicationId}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag>{status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Uploaded by">{uploadedBy}</Descriptions.Item>
              <Descriptions.Item label="Assigned CAD">
                {formatUserDisplayLabel(sketch?.assignedCadUser) ||
                  formatUserDisplayLabel(sketch?.assignment?.cadUser) ||
                  formatUserDisplayLabel(sketch?.assignment?.cadCenterId) ||
                  "—"}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <div>
            <Title level={5} style={{ marginBottom: 8 }}>
              Surveyor feedback (CAD)
            </Title>
            <AssignmentFeedbackViewer assignmentId={assignmentIdForFeedback} />
          </div>

          <CadWalletPayoutSection
            order={sketch}
            readOnly={false}
            canManage={canManage}
            onRefresh={onRefresh}
            cardTitle="CAD payout"
            showWhenEmpty
          />
        </div>
      )}
    </Drawer>
  );
}
