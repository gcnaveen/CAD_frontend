import React from "react";
import { Card, Row, Col, Statistic, Typography, Progress } from "antd";
import {
  FileTextOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

/** Static placeholder data until API wiring */
export const STATIC_DRAFT_STATS = {
  totalDrafts: 342,
  inEditing: 118,
  submittedForReview: 45,
  approvedReady: 179,
};

const DraftStats = () => {
  const d = STATIC_DRAFT_STATS;
  const denom = d.totalDrafts || 1;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Drafts"
              value={d.totalDrafts}
              prefix={<FileTextOutlined style={{ color: "var(--accent-color)" }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              All saved project drafts
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="In Editing"
              value={d.inEditing}
              prefix={<EditOutlined style={{ color: "var(--warning)" }} />}
            />
            <Progress
              percent={Math.round((d.inEditing / denom) * 100)}
              showInfo={false}
              strokeColor="var(--warning)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Submitted for Review"
              value={d.submittedForReview}
              prefix={<SendOutlined style={{ color: "var(--cyan-accent)" }} />}
            />
            <Progress
              percent={Math.round((d.submittedForReview / denom) * 100)}
              showInfo={false}
              strokeColor="var(--cyan-accent)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Approved / Ready"
              value={d.approvedReady}
              prefix={<CheckCircleOutlined style={{ color: "var(--success)" }} />}
            />
            <Progress
              percent={Math.round((d.approvedReady / denom) * 100)}
              showInfo={false}
              strokeColor="var(--success)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DraftStats;
