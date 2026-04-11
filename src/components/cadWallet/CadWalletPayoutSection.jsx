import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  InputNumber,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  markCadWalletEntryPaid,
  recordCadWalletEntryPayment,
} from "../../services/admin/cadWalletAdminService.js";

const { Text } = Typography;

function entriesFromOrder(order) {
  if (!order) return [];
  const raw =
    order.cadWalletEntries ??
    order.walletEntries ??
    order.cadWallet?.entries ??
    [];
  return Array.isArray(raw) ? raw : [];
}

function normalizeEntry(e) {
  const id = e?._id ?? e?.id;
  const total =
    Number(e?.totalAmountRupees ?? e?.totalRupees ?? e?.amountRupees ?? 0) || 0;
  const paid = Number(e?.paidAmountRupees ?? e?.paidRupees ?? 0) || 0;
  const remaining =
    e?.remainingRupees != null
      ? Number(e.remainingRupees) || 0
      : Math.max(0, total - paid);
  let paidPercent = Number(e?.paidPercent);
  if (!Number.isFinite(paidPercent)) {
    paidPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 1000) / 10) : 0;
  }
  const status = String(e?.status ?? "PENDING").toUpperCase();
  return {
    id,
    kind: e?.kind ?? e?.type ?? "—",
    revisionNo: e?.revisionNo ?? e?.revisionNumber ?? "—",
    totalRupees: total,
    paidRupees: paid,
    remainingRupees: remaining,
    status,
    paidPercent: Math.min(100, Math.max(0, paidPercent)),
    paymentLog: Array.isArray(e?.paymentLog) ? e.paymentLog : [],
    date: e?.createdAt ?? e?.updatedAt ?? e?.date,
  };
}

function statusTag(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return <Tag color="green">PAID</Tag>;
  if (s === "PARTIAL") return <Tag color="orange">PARTIAL</Tag>;
  return <Tag color="red">PENDING</Tag>;
}

const formatRs = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDt = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(d);
  }
};

/**
 * Admin payout controls + payment log (data from order payload: cadWalletEntries / walletEntries).
 */
export default function CadWalletPayoutSection({
  order,
  readOnly = false,
  canManage = false,
  onRefresh,
  cardTitle = "CAD payout",
  showWhenEmpty = false,
}) {
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [actingEntryId, setActingEntryId] = useState(null);

  const rows = useMemo(() => entriesFromOrder(order).map((e) => normalizeEntry(e)).filter((r) => r.id), [order]);

  const openRecordPayment = (row) => {
    setActiveEntry(row);
    form.resetFields();
    form.setFieldsValue({ amountRupees: undefined });
    setPayModalOpen(true);
  };

  const closeModal = () => {
    setPayModalOpen(false);
    setActiveEntry(null);
    form.resetFields();
  };

  /** Pay full → POST .../mark-paid (fully paid / settle remaining per backend). */
  const handlePayFull = (row) => {
    if (!row?.id) return;
    if (row.status === "PAID" || row.remainingRupees <= 0) {
      message.warning("Nothing left to pay.");
      return;
    }
    Modal.confirm({
      title: "Mark fully paid?",
      content: `This will mark the entry paid (${formatRs(row.remainingRupees)} remaining).`,
      okText: "Pay full",
      onOk: async () => {
        try {
          setActingEntryId(row.id);
          await markCadWalletEntryPaid(row.id);
          message.success("Marked as fully paid");
          await onRefresh?.();
        } catch (e) {
          message.error(e?.message || "Request failed");
        } finally {
          setActingEntryId(null);
        }
      },
    });
  };

  const submitPartial = async () => {
    if (!activeEntry?.id) return;
    const v = await form.validateFields();
    const amt = Number(v.amountRupees);
    if (!Number.isFinite(amt) || amt <= 0) {
      message.error("Enter a valid amount");
      return;
    }
    if (amt > activeEntry.remainingRupees + 1e-6) {
      message.error(`Amount cannot exceed remaining ${formatRs(activeEntry.remainingRupees)}`);
      return;
    }
    try {
      setSubmitting(true);
      setActingEntryId(activeEntry.id);
      await recordCadWalletEntryPayment(activeEntry.id, { amountRupees: amt });
      message.success("Payment recorded");
      closeModal();
      await onRefresh?.();
    } catch (e) {
      message.error(e?.message || "Request failed");
    } finally {
      setSubmitting(false);
      setActingEntryId(null);
    }
  };

  if (rows.length === 0) {
    if (!showWhenEmpty) return null;
    return (
      <Card size="small" title={cardTitle}>
        <Text type="secondary">No CAD wallet entries for this sketch yet.</Text>
      </Card>
    );
  }

  return (
    <>
      <Divider style={{ margin: "8px 0" }} />
      <Card size="small" title={cardTitle}>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={rows}
          expandable={{
            expandedRowRender: (row) => (
              <div style={{ padding: "8px 0" }}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Payment log
                </Text>
                {!row.paymentLog.length ? (
                  <Text type="secondary">No payments recorded yet.</Text>
                ) : (
                  <Table
                    size="small"
                    pagination={false}
                    rowKey={(_, i) => `log-${row.id}-${i}`}
                    dataSource={row.paymentLog}
                    columns={[
                      {
                        title: "Amount",
                        dataIndex: "amountRupees",
                        render: (x, log) => formatRs(x ?? log?.amount ?? log?.amountRupees),
                      },
                      {
                        title: "Date",
                        dataIndex: "recordedAt",
                        render: (x, log) => formatDt(x ?? log?.date ?? log?.createdAt),
                      },
                      {
                        title: "Recorded by",
                        dataIndex: "recordedBy",
                        render: (x, log) => {
                          const rb = x ?? log?.recordedBy;
                          if (typeof rb === "object" && rb) {
                            return rb.name?.first
                              ? `${rb.name.first} ${rb.name.last || ""}`.trim()
                              : rb.email || rb._id || "—";
                          }
                          return rb != null ? String(rb) : "—";
                        },
                      },
                    ]}
                  />
                )}
              </div>
            ),
          }}
          columns={[
            { title: "Type", dataIndex: "kind", key: "kind", width: 120 },
            { title: "Rev.", dataIndex: "revisionNo", key: "rev", width: 72 },
            { title: "Total amount (₹)", key: "tot", render: (_, r) => formatRs(r.totalRupees) },
            { title: "Paid amount (₹)", key: "paid", render: (_, r) => formatRs(r.paidRupees) },
            { title: "Remaining (₹)", key: "rem", render: (_, r) => formatRs(r.remainingRupees) },
            { title: "Status", key: "st", width: 100, render: (_, r) => statusTag(r.status) },
            {
              title: "Paid %",
              key: "pct",
              width: 140,
              render: (_, r) => (
                <Progress percent={Math.round(r.paidPercent)} size="small" style={{ minWidth: 100 }} />
              ),
            },
            {
              title: "Actions",
              key: "act",
              width: 200,
              render: (_, r) => {
                const fullyDone = r.status === "PAID" || r.remainingRupees <= 0;
                const disabled = readOnly || !canManage || fullyDone;
                const payFullLoading = actingEntryId === r.id && !payModalOpen;
                const recordLoading =
                  submitting && payModalOpen && activeEntry?.id === r.id;
                return (
                  <Space size="small" wrap>
                    <Button
                      type="primary"
                      size="small"
                      disabled={disabled}
                      loading={payFullLoading}
                      onClick={() => handlePayFull(r)}
                    >
                      Pay full
                    </Button>
                    <Button
                      size="small"
                      disabled={disabled}
                      loading={recordLoading}
                      onClick={() => openRecordPayment(r)}
                    >
                      Record payment
                    </Button>
                  </Space>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        title="Record partial payment"
        open={payModalOpen}
        onCancel={closeModal}
        destroyOnClose
        confirmLoading={submitting}
        onOk={submitPartial}
        okText="Submit"
      >
        {activeEntry && (
          <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Remaining">{formatRs(activeEntry.remainingRupees)}</Descriptions.Item>
          </Descriptions>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="amountRupees"
            label="Amount (₹)"
            rules={[
              { required: true, message: "Enter amount" },
              {
                validator: (_, v) => {
                  const n = Number(v);
                  if (!Number.isFinite(n) || n <= 0) return Promise.reject(new Error("Invalid amount"));
                  if (activeEntry && n > activeEntry.remainingRupees + 1e-9) {
                    return Promise.reject(new Error("Exceeds remaining balance"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0.01}
              max={activeEntry ? activeEntry.remainingRupees : undefined}
              style={{ width: "100%" }}
              placeholder="Amount in rupees"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
