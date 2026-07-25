import React from "react";
import { Card, Row, Col, Statistic, Typography, Progress, Skeleton, Tag, Space } from "antd";
import {
  ShoppingOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  UserSwitchOutlined,
  SendOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  FALLBACK_LIFECYCLE_MACHINE,
  getSketchStatusLabel,
} from "../../../utils/lifecycleQc.js";

const { Text } = Typography;

const STATUS_ICONS = {
  PAYMENT_PENDING: CreditCardOutlined,
  PENDING: ClockCircleOutlined,
  ASSIGNED: UserSwitchOutlined,
  CAD_DELIVERED: SendOutlined,
  UNDER_REVISION: SyncOutlined,
  APPROVED: CheckCircleOutlined,
  REJECTED: CloseCircleOutlined,
};

const STATUS_COLORS = {
  PAYMENT_PENDING: { color: "var(--warning)", tagColor: "gold" },
  PENDING: { color: "var(--accent-color)", tagColor: "blue" },
  ASSIGNED: { color: "var(--cyan-accent)", tagColor: "processing" },
  CAD_DELIVERED: { color: "var(--violet-accent)", tagColor: "cyan" },
  UNDER_REVISION: { color: "var(--warning)", tagColor: "orange" },
  APPROVED: { color: "var(--success)", tagColor: "success" },
  REJECTED: { color: "var(--danger)", tagColor: "error" },
};

const ORDER_STATUS_CONFIG = FALLBACK_LIFECYCLE_MACHINE.sketchStatuses.map(
  ({ code }) => ({
    key: code,
    title: getSketchStatusLabel(code),
    icon: STATUS_ICONS[code] || ClockCircleOutlined,
    color: STATUS_COLORS[code]?.color || "var(--accent-color)",
    tagColor: STATUS_COLORS[code]?.tagColor || "default",
  })
);

const OrderStats = ({ orders, loading }) => {
  if (loading && !orders) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  const byStatus = orders?.byStatus ?? {};
  const total = orders?.totalOrders ?? byStatus.total ?? 0;
  const denom = total || 1;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Total Orders"
              value={total}
              prefix={<ShoppingOutlined style={{ color: "var(--accent-color)" }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="Orders by status" style={{ marginBottom: 16 }}>
        <Space size={[8, 8]} wrap>
          {ORDER_STATUS_CONFIG.map(({ key, title, tagColor }) => (
            <Tag key={key} color={tagColor}>
              {title}: {byStatus[key] ?? 0}
            </Tag>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {ORDER_STATUS_CONFIG.map(({ key, title, icon: Icon, color }) => {
          const count = byStatus[key] ?? 0;
          return (
            <Col key={key} xs={24} sm={12} lg={8} xl={6}>
              <Card size="small" style={{ height: "100%" }}>
                <Statistic
                  title={title}
                  value={count}
                  prefix={<Icon style={{ color }} />}
                />
                <Progress
                  percent={Math.round((count / denom) * 100)}
                  showInfo={false}
                  strokeColor={color}
                  size="small"
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {Math.round((count / denom) * 100)}% of all orders
                </Text>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default OrderStats;
