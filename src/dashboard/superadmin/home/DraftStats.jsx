import React from "react";
import { Card, Row, Col, Statistic, Typography, Skeleton } from "antd";
import { FileTextOutlined } from "@ant-design/icons";

const { Text } = Typography;

const DraftStats = ({ drafts, loading }) => {
  if (loading && !drafts) {
    return <Skeleton active paragraph={{ rows: 2 }} />;
  }

  const totalDrafts = drafts?.totalDrafts ?? 0;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Drafts"
              value={totalDrafts}
              prefix={<FileTextOutlined style={{ color: "var(--accent-color)" }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Non-deleted survey drafts
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DraftStats;
