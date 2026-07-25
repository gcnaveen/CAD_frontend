import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { ROLES } from "../../constants/roles.js";
import {
  getOpsHealth,
  getOpsObservability,
  normalizeOpsObservability,
} from "../../services/admin/opsObservabilityAdminService.js";
import SlaStatus from "../../components/sla/SlaStatus.jsx";
import {
  formatSlaAgeHours,
  formatSlaDueAt,
  formatSlaRemaining,
  getSlaRiskTone,
  getSlaStateLabel,
  getSlaStateTagColor,
} from "../../utils/sla.js";

const { Title, Text, Paragraph } = Typography;

const POLL_INTERVAL_MS = 60_000;

function getCurrentRole(roleFromRedux) {
  if (roleFromRedux) return roleFromRedux;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored)?.role : null;
  } catch {
    return null;
  }
}

function alertBadgeStatus(level) {
  const l = String(level || "").toLowerCase();
  if (l === "critical" || l === "error" || l === "danger") return "error";
  if (l === "warning" || l === "warn" || l === "degraded") return "warning";
  if (l === "ok" || l === "healthy" || l === "success" || l === "info") {
    return "success";
  }
  return "default";
}

function formatStatusLabel(status) {
  return String(status || "UNKNOWN")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OpsObservability() {
  const navigate = useNavigate();
  const roleFromRedux = useSelector((s) => s.auth?.role);
  const currentRole = getCurrentRole(roleFromRedux);
  const allowed =
    currentRole === ROLES.SUPER_ADMIN || currentRole === ROLES.ADMIN;

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [health, setHealth] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!allowed) {
      navigate("/superadmin/home", { replace: true });
    }
  }, [allowed, navigate]);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!allowed) return;
      if (!silent) setLoading(true);
      if (!silent) setLoadError("");
      try {
        const [raw, healthResult] = await Promise.all([
          getOpsObservability(),
          getOpsHealth(),
        ]);
        setSnapshot(normalizeOpsObservability(raw));
        setHealth(healthResult);
        setLastUpdated(new Date());
        setLoadError("");
      } catch (e) {
        const msg = e?.message || "Failed to load ops observability";
        if (!silent) {
          setSnapshot(null);
          setLoadError(msg);
          message.error(msg);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [allowed]
  );

  useEffect(() => {
    if (!allowed) return;
    load({ silent: false });
    const id = window.setInterval(() => {
      load({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [allowed, load]);

  const funnelColumns = useMemo(
    () => [
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (v) => formatStatusLabel(v),
      },
      {
        title: "Count",
        dataIndex: "count",
        key: "count",
        align: "right",
      },
    ],
    []
  );

  const flagColumns = useMemo(
    () => [
      {
        title: "Flag",
        dataIndex: "flag",
        key: "flag",
        render: (v) => <Tag>{formatStatusLabel(v)}</Tag>,
      },
      {
        title: "Count",
        dataIndex: "count",
        key: "count",
        align: "right",
      },
    ],
    []
  );

  const mismatchColumns = useMemo(
    () => [
      {
        title: "Flag",
        dataIndex: "flag",
        key: "flag",
        render: (v, row) => formatStatusLabel(v || row?.type || row?.status),
      },
      {
        title: "Merchant order ID",
        dataIndex: "merchantOrderId",
        key: "merchantOrderId",
        render: (v, row) => v || row?.merchantTxnId || "—",
      },
      {
        title: "Upload / order",
        key: "upload",
        render: (_, row) =>
          row?.surveyorSketchUpload ||
          row?.uploadId ||
          row?.orderId ||
          row?.applicationId ||
          "—",
      },
      {
        title: "Note",
        dataIndex: "message",
        key: "message",
        render: (v, row) => v || row?.reason || row?.note || "—",
      },
    ],
    []
  );

  const slaColumns = useMemo(
    () => [
      {
        title: "Order / upload",
        key: "id",
        render: (_, row) =>
          row?.orderId ||
          row?.uploadId ||
          row?.applicationId ||
          row?.id ||
          "—",
      },
      {
        title: "SLA state",
        key: "state",
        render: (_, row) => {
          const state = row?.state || row?.sla?.state;
          if (!state) return "—";
          return <Tag color={getSlaStateTagColor(state)}>{getSlaStateLabel(state)}</Tag>;
        },
      },
      {
        title: "Due (IST)",
        key: "dueAt",
        render: (_, row) => formatSlaDueAt(row?.dueAt ?? row?.sla?.dueAt) || "—",
      },
      {
        title: "Remaining",
        key: "remaining",
        render: (_, row) =>
          formatSlaRemaining(row?.sla || row) || "—",
      },
      {
        title: "Age (h)",
        key: "ageHours",
        render: (_, row) =>
          formatSlaAgeHours(row?.ageHours ?? row?.sla?.ageHours) || "—",
      },
      {
        title: "SLA",
        key: "slaDetail",
        render: (_, row) => <SlaStatus sla={row?.sla || row} compact />,
      },
    ],
    []
  );

  if (!allowed) return null;

  const alertLevel = snapshot?.alerts?.level;
  const alertStatus = alertBadgeStatus(alertLevel);
  const healthOk = health?.ok === true;

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <Space
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}
        wrap
      >
        <Title level={3} style={{ margin: 0 }}>
          Ops observability
        </Title>
        <Space>
          <Text type="secondary">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Not loaded yet"}
            {" · "}
            polls every 60s
          </Text>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => load({ silent: false })}
          >
            Refresh
          </Button>
        </Space>
      </Space>

      <Paragraph type="secondary">
        Funnel, payment flags, SLA risk items (API-sorted), and CAD operator capacity from{" "}
        <Text code>GET /api/admin/ops/observability</Text>. Alerts include warning /
        escalated / breach pressure. For a forced recon window use{" "}
        <Link to="/superadmin/payments/reconciliation">
          Payment reconciliation
        </Link>
        .
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          {health == null ? (
            <Alert
              type="info"
              showIcon
              message="Health probe unavailable"
              description="GET /api/health did not respond. Snapshot panels below are independent."
            />
          ) : (
            <Alert
              type={healthOk ? "success" : "error"}
              showIcon
              icon={healthOk ? <CheckCircleOutlined /> : <WarningOutlined />}
              message={healthOk ? "API healthy" : "API health check failed"}
              description={
                <>
                  Status: {String(health.status || "—")}
                  {health.uptimeSeconds != null
                    ? ` · uptime ${health.uptimeSeconds}s`
                    : null}
                </>
              }
            />
          )}
        </Col>
        <Col xs={24} md={12}>
          <Card size="small">
            <Space align="center">
              <Badge
                status={alertStatus === "default" ? "default" : alertStatus}
                text={
                  <Text strong>
                    Alerts
                    {alertLevel ? `: ${formatStatusLabel(alertLevel)}` : ""}
                  </Text>
                }
              />
              {snapshot?.alerts?.count != null ? (
                <Tag>{snapshot.alerts.count}</Tag>
              ) : null}
            </Space>
            {snapshot?.alerts?.message ? (
              <Paragraph style={{ marginBottom: 0, marginTop: 8 }} type="secondary">
                {snapshot.alerts.message}
              </Paragraph>
            ) : (
              <Paragraph style={{ marginBottom: 0, marginTop: 8 }} type="secondary">
                No alert summary from the snapshot.
              </Paragraph>
            )}
          </Card>
        </Col>
      </Row>

      {loadError ? (
        <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Order funnel"
            size="small"
            extra={
              <Text type="secondary">
                Total {snapshot?.funnel?.total ?? 0}
              </Text>
            }
          >
            <Table
              size="small"
              rowKey={(row) => row.status}
              loading={loading}
              columns={funnelColumns}
              dataSource={snapshot?.funnel?.byStatus || []}
              pagination={false}
              locale={{ emptyText: "No funnel data" }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CloudServerOutlined />
                Operator capacity
              </Space>
            }
            size="small"
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Available"
                  value={snapshot?.operatorCapacity?.available ?? 0}
                  loading={loading}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Busy"
                  value={snapshot?.operatorCapacity?.busy ?? 0}
                  loading={loading}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Offline"
                  value={snapshot?.operatorCapacity?.offline ?? 0}
                  loading={loading}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card size="small">
            <Statistic
              title="SLA breached"
              value={snapshot?.sla?.breached ?? 0}
              loading={loading}
              valueStyle={{
                color: (snapshot?.sla?.breached ?? 0) > 0 ? "#cf1322" : undefined,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Statistic
              title="SLA escalated"
              value={snapshot?.sla?.escalated ?? 0}
              loading={loading}
              valueStyle={{
                color: (snapshot?.sla?.escalated ?? 0) > 0 ? "#d46b08" : undefined,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Statistic
              title="SLA warning"
              value={snapshot?.sla?.warning ?? 0}
              loading={loading}
              valueStyle={{
                color: (snapshot?.sla?.warning ?? 0) > 0 ? "#d48806" : undefined,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Statistic
              title="Within SLA"
              value={snapshot?.sla?.withinSla ?? 0}
              loading={loading}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="Payment reconciliation flags" size="small">
            <Table
              size="small"
              rowKey={(row) => row.flag}
              loading={loading}
              columns={flagColumns}
              dataSource={snapshot?.payments?.flags || []}
              pagination={false}
              locale={{ emptyText: "No payment flags" }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Recent payment mismatches" size="small">
            <Table
              size="small"
              rowKey={(row, i) =>
                row?._id || row?.id || row?.merchantOrderId || `mismatch-${i}`
              }
              loading={loading}
              columns={mismatchColumns}
              dataSource={snapshot?.payments?.recentPaymentMismatches || []}
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: "No recent mismatches" }}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="SLA risk items (API order)" size="small">
        <Table
          size="small"
          rowKey={(row, i) =>
            row?.key || row?._id || row?.id || row?.orderId || row?.uploadId || `sla-${i}`
          }
          loading={loading}
          columns={slaColumns}
          dataSource={snapshot?.sla?.items || []}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No SLA items" }}
          scroll={{ x: true }}
          onRow={(row) => {
            const tone = getSlaRiskTone(row?.state || row?.sla?.state);
            if (!tone) return {};
            const bg =
              tone === "breached"
                ? "rgba(207, 19, 34, 0.08)"
                : tone === "escalated"
                  ? "rgba(250, 140, 22, 0.1)"
                  : "rgba(250, 173, 20, 0.1)";
            return { style: { background: bg } };
          }}
        />
      </Card>
    </div>
  );
}
