import React from "react";
import { Card, Row, Col, Statistic, Typography, Progress } from "antd";
import {
  ShoppingOutlined,
  SyncOutlined,
  TruckOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

/** Static placeholder data until API wiring */
export const STATIC_ORDER_STATS = {
  newOrders: 24,
  processing: 41,
  delivered: 198,
  cancelled: 9,
};

const OrderStats = () => {
  const o = STATIC_ORDER_STATS;
  const total = o.newOrders + o.processing + o.delivered + o.cancelled || 1;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="New Orders"
              value={o.newOrders}
              prefix={<ShoppingOutlined style={{ color: "var(--accent-color)" }} />}
            />
            <Progress
              percent={Math.round((o.newOrders / total) * 100)}
              showInfo={false}
              strokeColor="var(--accent-color)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Processing"
              value={o.processing}
              prefix={<SyncOutlined style={{ color: "var(--warning)" }} />}
            />
            <Progress
              percent={Math.round((o.processing / total) * 100)}
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
              title="Delivered"
              value={o.delivered}
              prefix={<TruckOutlined style={{ color: "var(--success)" }} />}
            />
            <Progress
              percent={Math.round((o.delivered / total) * 100)}
              showInfo={false}
              strokeColor="var(--success)"
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ height: "100%" }}>
            <Statistic
              title="Cancelled"
              value={o.cancelled}
              prefix={<CloseCircleOutlined style={{ color: "var(--danger)" }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {Math.round((o.cancelled / total) * 100)}% of all orders
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderStats;
