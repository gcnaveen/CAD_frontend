import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  InputNumber,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PayCircleOutlined,
  PercentageOutlined,
  ReloadOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { ROLES, resolveStoredUserRole } from "../../../constants/roles.js";
import { formatUserDisplayLabel } from "../../../services/assignmentApi.js";
import {
  getCadWalletPendingSummary,
  payCadUser,
} from "../../../services/admin/cadWalletAdminService.js";
import { formatRupees } from "../../../utils/formatRupees.js";

const { Title, Text } = Typography;

const ALLOWED_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const formatRs = (n) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
};

function getCadUserEmail(user) {
  return user?.auth?.email ?? user?.email ?? "—";
}

function getCadUserPhone(user) {
  return user?.auth?.phone ?? user?.phone ?? user?.mobile ?? "—";
}

function balanceTag(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return <Tag color="green">Paid</Tag>;
  if (s === "PARTIAL") return <Tag color="orange">Partial</Tag>;
  return <Tag color="red">Pending</Tag>;
}

function deliveryKindLabel(kind, revisionNo) {
  const k = String(kind || "").toUpperCase();
  if (k.includes("REVISION")) return `Revision #${revisionNo ?? "—"}`;
  if (k.includes("INITIAL")) return "Initial delivery";
  return kind || "Delivery";
}

const entryColumns = [
  {
    title: "Delivery",
    key: "kind",
    render: (_, row) => deliveryKindLabel(row.kind, row.revisionNo),
  },
  {
    title: "Survey paid",
    key: "source",
    align: "right",
    render: (_, row) => formatRupees(row.sourcePaidRupees, { maximumFractionDigits: 2 }),
  },
  {
    title: "CAD earning",
    key: "earned",
    align: "right",
    render: (_, row) => formatRupees(row.amountRupees, { maximumFractionDigits: 2 }),
  },
  {
    title: "CAD paid",
    key: "paid",
    align: "right",
    render: (_, row) => (
      <Text type="success">{formatRupees(row.paidAmountRupees, { maximumFractionDigits: 2 })}</Text>
    ),
  },
  {
    title: "Remaining",
    key: "remaining",
    align: "right",
    render: (_, row) => (
      <Text strong style={{ color: row.remainingRupees > 0 ? "var(--warning, #faad14)" : undefined }}>
        {formatRupees(row.remainingRupees, { maximumFractionDigits: 2 })}
      </Text>
    ),
  },
  {
    title: "Paid %",
    key: "pct",
    width: 120,
    render: (_, row) => (
      <Progress
        percent={Math.min(100, Math.max(0, row.paidPercent))}
        size="small"
        status={row.balanceStatus === "PAID" ? "success" : "active"}
      />
    ),
  },
  {
    title: "Status",
    key: "status",
    width: 90,
    render: (_, row) => balanceTag(row.balanceStatus),
  },
];

function mergeDetailResponse(apiData, record, cadUserId) {
  if (apiData?.type === "single" && apiData?.summary) {
    return apiData;
  }

  const fromList =
    apiData?.cadUsers?.find((u) => String(u.cadUserId) === String(cadUserId)) ?? record;

  const merged = {
    type: "single",
    cadUser: fromList?.cadUser ?? record?.cadUser,
    cadUserId: fromList?.cadUserId ?? record?.cadUserId ?? cadUserId,
    summary: fromList?.summary ?? record?.summary,
    statistics: fromList?.statistics ?? record?.statistics ?? apiData?.statistics,
    payment: fromList?.payment ?? record?.payment,
    pendingEntryCount: fromList?.pendingEntryCount ?? record?.pendingEntryCount ?? 0,
    assignments: fromList?.assignments ?? apiData?.assignments ?? [],
    payoutPercent:
      apiData?.payoutPercent ??
      fromList?.statistics?.payoutPercent ??
      record?.statistics?.payoutPercent ??
      0,
  };

  if (!merged.payment && merged.summary) {
    merged.payment = {
      maxPayable: merged.summary.pendingPaymentRupees ?? 0,
      canPayFull: (merged.summary.pendingPaymentRupees ?? 0) > 0,
    };
  }

  return merged;
}

export default function PayCadUser() {
  const navigate = useNavigate();
  const roleFromRedux = useSelector((s) => s.auth?.role);
  const userRoleFromRedux = useSelector((s) => s.auth?.user?.role);
  const currentRole = resolveStoredUserRole(roleFromRedux, userRoleFromRedux);
  const allowed = ALLOWED_ROLES.includes(currentRole);

  const [payForm] = Form.useForm();
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [totalPending, setTotalPending] = useState(0);
  const [payoutPercent, setPayoutPercent] = useState(0);
  const [platformStats, setPlatformStats] = useState(null);
  const [cadUsers, setCadUsers] = useState([]);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSummaryLoading, setUserSummaryLoading] = useState(false);
  const [userSummary, setUserSummary] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payResult, setPayResult] = useState(null);

  useEffect(() => {
    if (!allowed) {
      navigate("/superadmin/home", { replace: true });
    }
  }, [allowed, navigate]);

  const loadPendingList = useCallback(async () => {
    if (!allowed) return;
    setListLoading(true);
    setListError("");
    try {
      const data = await getCadWalletPendingSummary();
      setTotalPending(data.totalPending ?? 0);
      setPayoutPercent(data.payoutPercent ?? 0);
      setPlatformStats(data.statistics ?? null);
      setCadUsers(data.cadUsers ?? []);
    } catch (e) {
      const msg = e?.message || "Failed to load pending payouts";
      setListError(msg);
      message.error(msg);
      setTotalPending(0);
      setPayoutPercent(0);
      setPlatformStats(null);
      setCadUsers([]);
    } finally {
      setListLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    loadPendingList();
  }, [loadPendingList]);

  const openPayModal = async (record) => {
    const cadUserId = record.cadUserId;
    setSelectedUser(record);
    setPayResult(null);
    setUserSummary(mergeDetailResponse(null, record, cadUserId));
    setDetailError("");
    setPayModalOpen(true);
    payForm.resetFields();

    setUserSummaryLoading(true);
    try {
      const data = await getCadWalletPendingSummary(cadUserId);
      const merged = mergeDetailResponse(data, record, cadUserId);
      setUserSummary(merged);

      const maxPayable =
        merged.payment?.maxPayable ?? merged.summary?.pendingPaymentRupees ?? 0;
      if (maxPayable > 0) {
        payForm.setFieldsValue({ amountRupees: maxPayable });
      }
    } catch (e) {
      const msg = e?.message || "Failed to load user payout summary";
      setDetailError(msg);
      message.error(msg);
    } finally {
      setUserSummaryLoading(false);
    }
  };

  const closePayModal = () => {
    setPayModalOpen(false);
    setSelectedUser(null);
    setUserSummary(null);
    setDetailError("");
    setPayResult(null);
    payForm.resetFields();
  };

  const onPayFinish = async (values) => {
    const cadUserId = selectedUser?.cadUserId;
    const amountRupees = Number(values.amountRupees);
    if (!cadUserId) {
      message.error("No CAD user selected");
      return;
    }
    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
      message.error("Amount must be greater than 0");
      return;
    }

    const maxPayable =
      userSummary?.payment?.maxPayable ?? userSummary?.summary?.pendingPaymentRupees ?? 0;
    if (amountRupees > maxPayable) {
      message.error(`Amount cannot exceed max payable (${formatRs(maxPayable)})`);
      return;
    }

    setSubmitting(true);
    try {
      const data = await payCadUser({ cadUserId, amountRupees });
      setPayResult(data);
      message.success("Payment applied successfully");
      await loadPendingList();
    } catch (e) {
      message.error(e?.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onPayFull = async () => {
    const cadUserId = selectedUser?.cadUserId;
    if (!cadUserId) {
      message.error("No CAD user selected");
      return;
    }

    setSubmitting(true);
    try {
      const data = await payCadUser({ cadUserId, payFull: true });
      setPayResult(data);
      message.success("Full pending balance paid");
      await loadPendingList();
    } catch (e) {
      message.error(e?.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const assignmentColumns = useMemo(
    () => [
      {
        title: "Application ID",
        dataIndex: "applicationId",
        key: "applicationId",
        ellipsis: true,
      },
      {
        title: "Survey No.",
        dataIndex: "surveyNo",
        key: "surveyNo",
        width: 110,
      },
      {
        title: "Earned",
        key: "earned",
        align: "right",
        width: 100,
        render: (_, row) => formatRupees(row.assignmentEarnedRupees, { maximumFractionDigits: 2 }),
      },
      {
        title: "Paid",
        key: "paid",
        align: "right",
        width: 100,
        render: (_, row) => (
          <Text type="success">
            {formatRupees(row.assignmentPaidRupees, { maximumFractionDigits: 2 })}
          </Text>
        ),
      },
      {
        title: "Pending",
        key: "remaining",
        align: "right",
        width: 100,
        render: (_, row) => (
          <Text strong style={{ color: row.assignmentRemainingRupees > 0 ? "var(--warning, #faad14)" : undefined }}>
            {formatRupees(row.assignmentRemainingRupees, { maximumFractionDigits: 2 })}
          </Text>
        ),
      },
      {
        title: "Completed",
        key: "completedAt",
        width: 150,
        responsive: ["md"],
        render: (_, row) => fmtDate(row.completedAt),
      },
    ],
    []
  );

  if (!allowed) return null;

  const columns = [
    {
      title: "CAD User",
      key: "name",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatUserDisplayLabel(record.cadUser)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {getCadUserEmail(record.cadUser)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Phone",
      key: "phone",
      responsive: ["md"],
      render: (_, record) => getCadUserPhone(record.cadUser),
    },
    {
      title: "Assignments",
      key: "assignments",
      align: "center",
      width: 110,
      responsive: ["lg"],
      render: (_, record) => record.statistics?.assignmentCount ?? 0,
    },
    {
      title: "Total earned",
      key: "totalEarnings",
      align: "right",
      render: (_, record) => formatRupees(record.summary.totalEarningsRupees, { maximumFractionDigits: 2 }),
    },
    {
      title: "Already paid",
      key: "received",
      align: "right",
      render: (_, record) => (
        <Text type="success">
          {formatRupees(record.summary.receivedPaymentRupees, { maximumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: "Pending to pay",
      key: "pending",
      align: "right",
      render: (_, record) => (
        <Text strong style={{ color: record.summary.pendingPaymentRupees > 0 ? "var(--warning, #faad14)" : undefined }}>
          {formatRupees(record.summary.pendingPaymentRupees, { maximumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type={record.summary.pendingPaymentRupees > 0 ? "primary" : "default"}
          size="small"
          icon={<PayCircleOutlined />}
          onClick={() => openPayModal(record)}
        >
          {record.summary.pendingPaymentRupees > 0 ? "Pay" : "View"}
        </Button>
      ),
    },
  ];

  const detail = userSummary ?? selectedUser;
  const summary = detail?.summary ?? selectedUser?.summary;
  const userStats = detail?.statistics ?? selectedUser?.statistics;
  const payment =
    detail?.payment ??
    (summary
      ? {
          maxPayable: summary.pendingPaymentRupees ?? 0,
          canPayFull: (summary.pendingPaymentRupees ?? 0) > 0,
        }
      : null);
  const maxPayable = payment?.maxPayable ?? summary?.pendingPaymentRupees ?? 0;
  const canPay = maxPayable > 0;
  const selectedName = selectedUser ? formatUserDisplayLabel(selectedUser.cadUser) : "";
  const userPayoutPercent = detail?.payoutPercent ?? userStats?.payoutPercent ?? payoutPercent;
  const detailCadUser = detail?.cadUser ?? selectedUser?.cadUser;
  const detailAssignments = detail?.assignments ?? [];
  const showDetail = Boolean(summary) && !payResult;

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <WalletOutlined style={{ marginRight: 10, color: "var(--accent-color)" }} />
            Pay CAD User
          </Title>
          <Text type="secondary">
            CAD earnings are {payoutPercent || 20}% of surveyor payments on completed deliveries.
            Review balances and record payouts below.
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Platform pending"
                value={totalPending}
                prefix={<ClockCircleOutlined />}
                suffix="₹"
                precision={2}
                valueStyle={{ color: "var(--warning, #faad14)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Platform total earned"
                value={platformStats?.totalEarningsRupees ?? 0}
                prefix={<DollarOutlined />}
                suffix="₹"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Platform already paid"
                value={platformStats?.receivedPaymentRupees ?? 0}
                prefix={<CheckCircleOutlined />}
                suffix="₹"
                precision={2}
                valueStyle={{ color: "var(--success, #52c41a)" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Payout rate"
                value={payoutPercent || 20}
                prefix={<PercentageOutlined />}
                suffix="%"
                precision={0}
              />
            </Card>
          </Col>
        </Row>

        {listError ? (
          <Alert
            type="error"
            message={listError}
            showIcon
            action={
              <Button icon={<ReloadOutlined />} onClick={loadPendingList}>
                Retry
              </Button>
            }
          />
        ) : null}

        <Card
          title="CAD payout balances"
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadPendingList} loading={listLoading}>
              Refresh
            </Button>
          }
        >
          <Spin spinning={listLoading}>
            <Table
              rowKey="cadUserId"
              columns={columns}
              dataSource={cadUsers}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              locale={{
                emptyText: (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No CAD users found" />
                ),
              }}
              scroll={{ x: 900 }}
            />
          </Spin>
        </Card>
      </Space>

      <Modal
        title={
          <Space>
            <PayCircleOutlined />
            {payResult ? "Payment recorded" : `CAD payout — ${selectedName}`}
          </Space>
        }
        open={payModalOpen}
        onCancel={closePayModal}
        footer={null}
        width={920}
        key={selectedUser?.cadUserId ?? "pay-modal"}
        styles={{ body: { maxHeight: "75vh", overflowY: "auto", paddingTop: 16 } }}
      >
        <Spin spinning={userSummaryLoading}>
          {detailError && !summary ? (
            <Alert
              type="error"
              showIcon
              message="Could not load payout details"
              description={detailError}
              action={
                <Button size="small" onClick={() => selectedUser && openPayModal(selectedUser)}>
                  Retry
                </Button>
              }
            />
          ) : null}

          {showDetail ? (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {detailError ? (
                <Alert type="warning" showIcon message={detailError} closable />
              ) : null}

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Total earned"
                    value={summary.totalEarningsRupees}
                    prefix={<DollarOutlined />}
                    suffix="₹"
                    precision={2}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Already paid"
                    value={summary.receivedPaymentRupees}
                    prefix={<CheckCircleOutlined />}
                    suffix="₹"
                    precision={2}
                    valueStyle={{ color: "var(--success, #52c41a)" }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Pending to pay"
                    value={summary.pendingPaymentRupees}
                    prefix={<ClockCircleOutlined />}
                    suffix="₹"
                    precision={2}
                    valueStyle={{ color: "var(--warning, #faad14)" }}
                  />
                </Col>
              </Row>

              <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Email">{getCadUserEmail(detailCadUser)}</Descriptions.Item>
                <Descriptions.Item label="Payout rate">{userPayoutPercent}%</Descriptions.Item>
                <Descriptions.Item label="Surveyor payments total">
                  {formatRupees(userStats?.totalSourcePaidRupees ?? 0, { maximumFractionDigits: 2 })}
                </Descriptions.Item>
                <Descriptions.Item label="Assignments">
                  {userStats?.assignmentCount ?? 0} · {userStats?.completedDeliveryCount ?? 0} deliveries
                </Descriptions.Item>
                <Descriptions.Item label="Open ledger rows">
                  {detail?.pendingEntryCount ?? 0}
                </Descriptions.Item>
              </Descriptions>

              {detailAssignments.length > 0 ? (
                <>
                  <Divider orientation="left" style={{ margin: "8px 0" }}>
                    Assignments
                  </Divider>
                  <Table
                    size="small"
                    rowKey={(row) => row.assignmentId || row.applicationId}
                    columns={assignmentColumns}
                    dataSource={detailAssignments}
                    pagination={false}
                    expandable={{
                      expandedRowRender: (row) => (
                        <Table
                          size="small"
                          rowKey={(e) => e.ledgerId || `${row.applicationId}-${e.kind}-${e.revisionNo}`}
                          columns={entryColumns}
                          dataSource={row.entries}
                          pagination={false}
                        />
                      ),
                      rowExpandable: (row) => (row.entries?.length ?? 0) > 0,
                    }}
                    scroll={{ x: 700 }}
                  />
                </>
              ) : (
                <Text type="secondary">No completed assignment deliveries yet.</Text>
              )}

              {canPay ? (
                <>
                  <Divider style={{ margin: "8px 0" }} />
                  <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="Pending owed">
                      {formatRupees(summary.pendingPaymentRupees, { maximumFractionDigits: 2 })}
                    </Descriptions.Item>
                    <Descriptions.Item label="Max you can pay">
                      {formatRupees(maxPayable, { maximumFractionDigits: 2 })}
                    </Descriptions.Item>
                  </Descriptions>

                  <Form
                    form={payForm}
                    layout="vertical"
                    onFinish={onPayFinish}
                    preserve={false}
                  >
                    <Form.Item
                      name="amountRupees"
                      label="Payment amount (₹)"
                      rules={[
                        { required: true, message: "Enter amount" },
                        {
                          validator: (_, v) => {
                            const n = Number(v);
                            if (!Number.isFinite(n) || n <= 0) {
                              return Promise.reject(new Error("Amount must be greater than 0"));
                            }
                            if (n > maxPayable) {
                              return Promise.reject(
                                new Error(`Cannot exceed max payable (${formatRs(maxPayable)})`)
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        min={0.01}
                        max={maxPayable}
                        step={0.01}
                        style={{ width: "100%" }}
                        placeholder="Enter partial or full amount"
                      />
                    </Form.Item>

                    <Space wrap>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        icon={<PayCircleOutlined />}
                      >
                        Record payment
                      </Button>
                      {payment?.canPayFull ? (
                        <Button loading={submitting} onClick={onPayFull}>
                          Pay full ({formatRupees(maxPayable, { maximumFractionDigits: 2 })})
                        </Button>
                      ) : null}
                      <Button onClick={closePayModal} disabled={submitting}>
                        Cancel
                      </Button>
                    </Space>
                  </Form>
                </>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="No pending balance"
                  description="All earnings for this CAD user have been paid."
                />
              )}
            </Space>
          ) : null}

          {payResult ? (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Alert type="success" message="Payment recorded successfully" showIcon />

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Total earned"
                    value={payResult.summary.totalEarningsRupees}
                    suffix="₹"
                    precision={2}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Already paid"
                    value={payResult.summary.receivedPaymentRupees}
                    suffix="₹"
                    precision={2}
                    valueStyle={{ color: "var(--success, #52c41a)" }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Pending"
                    value={payResult.summary.pendingPaymentRupees}
                    suffix="₹"
                    precision={2}
                    valueStyle={{ color: "var(--warning, #faad14)" }}
                  />
                </Col>
              </Row>

              <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Applied amount">
                  {formatRs(payResult.appliedAmountRupees)}
                </Descriptions.Item>
                <Descriptions.Item label="Unapplied amount">
                  {formatRs(payResult.unappliedAmountRupees)}
                </Descriptions.Item>
                <Descriptions.Item label="Entries updated" span={2}>
                  {payResult.touchedEntryIds.length} ledger entries updated
                </Descriptions.Item>
              </Descriptions>

              <Button type="primary" onClick={closePayModal}>
                Done
              </Button>
            </Space>
          ) : null}
        </Spin>
      </Modal>
    </div>
  );
}
