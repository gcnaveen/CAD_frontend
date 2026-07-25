import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { ROLES } from "../../constants/roles.js";
import {
  RECONCILIATION_FLAG_KEYS,
  getAdminPaymentReconciliation,
  normalizeReconciliationReport,
} from "../../services/admin/paymentReconciliationAdminService.js";

const { Title, Text, Paragraph } = Typography;

function getCurrentRole(roleFromRedux) {
  if (roleFromRedux) return roleFromRedux;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored)?.role : null;
  } catch {
    return null;
  }
}

const FLAG_LABELS = {
  MISSING: "Missing",
  DUPLICATED: "Duplicated",
  MISMATCHED: "Mismatched",
  EXPIRED: "Expired",
  REFUNDED: "Refunded",
  MANUALLY_ADJUSTED: "Manually adjusted",
};

export default function PaymentReconciliation() {
  const navigate = useNavigate();
  const roleFromRedux = useSelector((s) => s.auth?.role);
  const currentRole = getCurrentRole(roleFromRedux);
  const allowed =
    currentRole === ROLES.SUPER_ADMIN || currentRole === ROLES.ADMIN;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!allowed) {
      navigate("/superadmin/home", { replace: true });
    }
  }, [allowed, navigate]);

  const runReport = useCallback(
    async (values) => {
      if (!allowed) return;
      setLoading(true);
      setLoadError("");
      try {
        const params = {
          persist: values?.persist !== false,
        };
        if (values?.range?.[0] && values?.range?.[1]) {
          params.from = values.range[0].startOf("day").toISOString();
          params.to = values.range[1].endOf("day").toISOString();
        } else if (values?.asOf) {
          params.date = values.asOf.format("YYYY-MM-DD");
        } else {
          params.date = dayjs().format("YYYY-MM-DD");
        }

        const raw = await getAdminPaymentReconciliation(params);
        setReport(normalizeReconciliationReport(raw));
      } catch (e) {
        setReport(null);
        setLoadError(e?.message || "Failed to load reconciliation");
        message.error(e?.message || "Failed to load reconciliation");
      } finally {
        setLoading(false);
      }
    },
    [allowed]
  );

  useEffect(() => {
    if (!allowed) return;
    form.setFieldsValue({
      asOf: dayjs(),
      persist: true,
    });
    runReport({ asOf: dayjs(), persist: true });
  }, [allowed, form, runReport]);

  const flagCards = useMemo(() => {
    const flags = report?.flags ?? {};
    return RECONCILIATION_FLAG_KEYS.map((key) => ({
      key,
      label: FLAG_LABELS[key] || key,
      value: flags[key] ?? 0,
    }));
  }, [report]);

  const detailColumns = [
    {
      title: "Flag",
      dataIndex: "flag",
      key: "flag",
      render: (v) => FLAG_LABELS[v] || v || "—",
    },
    {
      title: "Merchant order ID",
      dataIndex: "merchantOrderId",
      key: "merchantOrderId",
      render: (v, row) => v || row?.merchantTxnId || "—",
    },
    {
      title: "Upload / order",
      dataIndex: "surveyorSketchUpload",
      key: "upload",
      render: (v, row) =>
        v || row?.uploadId || row?.orderId || row?.applicationId || "—",
    },
    {
      title: "Expected (₹)",
      key: "expected",
      render: (_, row) => {
        const paise = row?.expectedAmountPaise ?? row?.amountPaise;
        if (paise == null) return "—";
        return (Number(paise) / 100).toFixed(2);
      },
    },
    {
      title: "Note",
      dataIndex: "message",
      key: "message",
      render: (v, row) => v || row?.reason || row?.note || "—",
    },
  ];

  if (!allowed) return null;

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Payment reconciliation
      </Title>
      <Paragraph type="secondary">
        Daily ops report for PhonePe payment attempts: missing, duplicated,
        mismatched, expired, refunded, and manually adjusted. Order amounts are
        server-owned; this page only reads the admin reconciliation API.
      </Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={runReport}
          initialValues={{ persist: true }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="asOf" label="UTC day (date / asOf)">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                name="range"
                label="Custom window (from / to)"
                extra="If set, overrides the single day above"
              >
                <DatePicker.RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="persist"
                label="Persist flags"
                valuePropName="checked"
                extra="Off = report only (persist=false)"
              >
                <Switch checkedChildren="Write" unCheckedChildren="Report only" />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Run reconciliation
            </Button>
            <Button
              onClick={() => {
                form.setFieldsValue({
                  asOf: dayjs(),
                  range: undefined,
                  persist: true,
                });
                runReport({ asOf: dayjs(), persist: true });
              }}
            >
              Today (UTC)
            </Button>
          </Space>
        </Form>
      </Card>

      {loadError ? (
        <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {flagCards.map((f) => (
          <Col xs={12} sm={8} md={4} key={f.key}>
            <Card size="small">
              <Statistic title={f.label} value={f.value} loading={loading} />
            </Card>
          </Col>
        ))}
      </Row>

      {report?.meta && (
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          {report.meta.asOf ? (
            <>
              <Text strong>As of:</Text> {String(report.meta.asOf)}{" "}
            </>
          ) : null}
          {report.meta.from || report.meta.to ? (
            <>
              <Text strong>Window:</Text> {String(report.meta.from || "—")} →{" "}
              {String(report.meta.to || "—")}{" "}
            </>
          ) : null}
          {report.meta.totalAttempts != null ? (
            <>
              <Text strong>Attempts scanned:</Text> {report.meta.totalAttempts}{" "}
            </>
          ) : null}
          {report.meta.persisted != null ? (
            <>
              <Text strong>Persisted:</Text> {String(report.meta.persisted)}
            </>
          ) : null}
        </Paragraph>
      )}

      <Card title="Flag details" size="small">
        <Table
          rowKey={(row, i) =>
            row?._id || row?.id || row?.merchantOrderId || `flag-${i}`
          }
          loading={loading}
          columns={detailColumns}
          dataSource={report?.items || []}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: "No flagged items in this window" }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
}
