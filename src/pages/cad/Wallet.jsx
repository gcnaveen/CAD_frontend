import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  WalletOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { ROLES } from "../../constants/roles.js";
import {
  getCadWallet,
  getCadWalletTransactions,
} from "../../services/cad/cadWalletService.js";
import { cadBi, cadBiFmt } from "../../dashboard/cad/cadBilingual.js";

const { Title, Text } = Typography;

function getStoredRole() {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u)?.role : null;
  } catch {
    return null;
  }
}

function statusTag(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return <Tag color="green">{cadBi.wallet.tagPaid}</Tag>;
  if (s === "PARTIAL") return <Tag color="orange">{cadBi.wallet.tagPartial}</Tag>;
  return <Tag color="red">{cadBi.wallet.tagPending}</Tag>;
}

function mapTxRow(t, idx) {
  const total = Number(t?.totalAmountRupees ?? t?.totalRupees ?? 0) || 0;
  const paid = Number(t?.paidAmountRupees ?? t?.paidRupees ?? 0) || 0;
  const remaining =
    t?.remainingRupees != null
      ? Number(t.remainingRupees) || 0
      : Math.max(0, total - paid);
  let pct = Number(t?.paidPercent);
  if (!Number.isFinite(pct)) {
    pct = total > 0 ? Math.min(100, Math.round((paid / total) * 1000) / 10) : 0;
  }
  return {
    key: String(t?._id ?? t?.id ?? idx),
    kind: t?.kind ?? t?.type ?? "—",
    revisionNo: t?.revisionNo ?? t?.revisionNumber ?? "—",
    totalRupees: total,
    paidRupees: paid,
    remainingRupees: remaining,
    status: String(t?.status ?? "PENDING").toUpperCase(),
    paidPercent: Math.min(100, Math.max(0, pct)),
    date: t?.createdAt ?? t?.updatedAt ?? t?.date,
    paymentLog: Array.isArray(t?.paymentLog) ? t.paymentLog : [],
  };
}

const formatRs = (n) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDt = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(d);
  }
};

export default function CadWalletPage() {
  const navigate = useNavigate();
  const roleFromStore = useSelector((s) => s.auth?.role);
  const role = roleFromStore || getStoredRole();
  const allowed = role === ROLES.CAD || role === ROLES.CAD_USER;

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalEarningsRupees: 0,
    receivedPaymentRupees: 0,
    pendingPaymentRupees: 0,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed) {
      navigate("/dashboard/cad", { replace: true });
    }
  }, [allowed, navigate]);

  const loadSummary = useCallback(async () => {
    if (!allowed) return;
    setSummaryLoading(true);
    setError("");
    try {
      const s = await getCadWallet();
      setSummary(s);
    } catch (e) {
      setError(e?.message || "Failed to load wallet");
      message.error(e?.message || cadBi.wallet.loadFail);
    } finally {
      setSummaryLoading(false);
    }
  }, [allowed]);

  const loadTx = useCallback(async () => {
    if (!allowed) return;
    setTxLoading(true);
    try {
      const res = await getCadWalletTransactions({ page, limit });
      setRows(res.list.map(mapTxRow));
      setTotal(res.total);
    } catch (e) {
      message.error(e?.message || cadBi.wallet.loadTxFail);
      setRows([]);
    } finally {
      setTxLoading(false);
    }
  }, [allowed, page, limit]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadTx();
  }, [loadTx]);

  if (!allowed) return null;

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        <WalletOutlined style={{ marginRight: 12, color: "var(--accent-color)" }} />
        {cadBi.wallet.pageTitle}
      </Title>

      {error ? (
        <Text type="danger" style={{ display: "block", marginBottom: 16 }}>
          {error}
        </Text>
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card bordered={false}>
            {summaryLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title={cadBi.wallet.totalEarnings}
                value={summary.totalEarningsRupees}
                prefix={<DollarOutlined />}
                suffix="₹"
                precision={2}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false}>
            {summaryLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title={cadBi.wallet.receivedPayment}
                value={summary.receivedPaymentRupees}
                prefix={<CheckCircleOutlined />}
                suffix="₹"
                precision={2}
                valueStyle={{ color: "var(--success, #52c41a)" }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false}>
            {summaryLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title={cadBi.wallet.pendingPayment}
                value={summary.pendingPaymentRupees}
                prefix={<ClockCircleOutlined />}
                suffix="₹"
                precision={2}
                valueStyle={{ color: "var(--warning, #faad14)" }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title={cadBi.wallet.transactionHistory} bordered={false}>
        <Table
          rowKey="key"
          loading={txLoading}
          dataSource={rows}
          locale={{ emptyText: <Empty description={cadBi.wallet.noTransactions} /> }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (t, range) =>
              cadBiFmt(cadBi.wallet.rangeOf, { a: range[0], b: range[1], t }),
            onChange: (p, ps) => {
              setPage(p);
              setLimit(ps || 20);
            },
          }}
          scroll={{ x: 960 }}
          expandable={{
            expandedRowRender: (record) =>
              record.paymentLog?.length ? (
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(_, i) => `${record.key}-log-${i}`}
                  dataSource={record.paymentLog}
                  columns={[
                    {
                      title: cadBi.wallet.amount,
                      render: (_, log) => formatRs(log?.amountRupees ?? log?.amount),
                    },
                    {
                      title: cadBi.wallet.date,
                      render: (_, log) => formatDt(log?.recordedAt ?? log?.date ?? log?.createdAt),
                    },
                    {
                      title: cadBi.wallet.recordedBy,
                      render: (_, log) => {
                        const rb = log?.recordedBy;
                        if (rb && typeof rb === "object") {
                          return rb.email || rb.name?.first || rb._id || "—";
                        }
                        return rb != null ? String(rb) : "—";
                      },
                    },
                  ]}
                />
              ) : (
                <Text type="secondary">{cadBi.wallet.noPaymentLog}</Text>
              ),
          }}
          columns={[
            { title: cadBi.wallet.type, dataIndex: "kind", key: "kind", width: 140 },
            { title: cadBi.wallet.revisionNo, dataIndex: "revisionNo", key: "rev", width: 100 },
            { title: cadBi.wallet.totalRs, key: "tot", render: (_, r) => formatRs(r.totalRupees) },
            { title: cadBi.wallet.paidRs, key: "paid", render: (_, r) => formatRs(r.paidRupees) },
            { title: cadBi.wallet.remainingRs, key: "rem", render: (_, r) => formatRs(r.remainingRupees) },
            { title: cadBi.wallet.status, key: "st", width: 100, render: (_, r) => statusTag(r.status) },
            {
              title: cadBi.wallet.paidPct,
              key: "pct",
              width: 160,
              render: (_, r) => <Progress percent={Math.round(r.paidPercent)} size="small" />,
            },
            { title: cadBi.wallet.date, key: "dt", width: 180, render: (_, r) => formatDt(r.date) },
          ]}
        />
      </Card>
    </div>
  );
}
