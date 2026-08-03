import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  Button,
  Drawer,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  HistoryOutlined,
  ReloadOutlined,
  RetweetOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { ROLES, normalizeRoleKey, resolveStoredUserRole } from "../../constants/roles.js";
import {
  createAssignment,
  getCadUsers,
  formatUserDisplayLabel,
} from "../../services/assignmentApi.js";
import {
  formatOverrideAt,
  getAutoAssignAttempts,
  getAutoAssignExceptions,
  getManualAssignGate,
  parseManualAssignBlocked,
  retryAutoAssign,
} from "../../services/admin/autoAssignAdminService.js";
import AssignmentModal from "../../components/assignments/AssignmentModal.jsx";
import { getAutoAssignExceptionStatusLabel } from "../../utils/displayLabels.js";

const { Title, Text, Paragraph } = Typography;

const STATUS_OPTIONS = [
  { value: "", label: "All (Pending retry + Exception)" },
  { value: "PENDING_RETRY", label: "Pending retry" },
  { value: "EXCEPTION", label: "Exception" },
];

function statusTagColor(status) {
  const s = String(status || "").toUpperCase();
  if (s === "EXCEPTION") return "error";
  if (s === "PENDING_RETRY") return "warning";
  return "default";
}

export default function AutoAssignExceptions() {
  const navigate = useNavigate();
  const roleFromStore = useSelector((s) => s.auth?.role);
  const userRoleFromStore = useSelector((s) => s.auth?.user?.role);
  const roleKey = normalizeRoleKey(resolveStoredUserRole(roleFromStore, userRoleFromStore));
  const allowed = roleKey === ROLES.ADMIN || roleKey === ROLES.SUPER_ADMIN;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionKey, setActionKey] = useState("");

  const [cadUsers, setCadUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSketch, setModalSketch] = useState(null);
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [attemptsRow, setAttemptsRow] = useState(null);

  useEffect(() => {
    if (!allowed) navigate("/superadmin/home", { replace: true });
  }, [allowed, navigate]);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setLoadError("");
    try {
      const result = await getAutoAssignExceptions({
        page,
        limit,
        status: statusFilter || undefined,
      });
      setRows(result.items);
      setMeta(result.meta);
    } catch (e) {
      setRows([]);
      setLoadError(e?.message || "Failed to load exception queue");
      message.error(e?.message || "Failed to load exception queue");
    } finally {
      setLoading(false);
    }
  }, [allowed, page, limit, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureCadUsers = useCallback(async () => {
    if (cadUsers.length) return cadUsers;
    const users = await getCadUsers();
    setCadUsers(users);
    return users;
  }, [cadUsers]);

  const onRetry = useCallback(async (row) => {
    const uploadId = row?.uploadId;
    if (!uploadId) {
      message.error("Missing upload id");
      return;
    }
    setActionKey(`retry:${uploadId}`);
    try {
      await retryAutoAssign(uploadId);
      message.success("Auto-assign retry queued");
      await load();
    } catch (e) {
      message.error(e?.message || "Retry failed");
    } finally {
      setActionKey("");
    }
  }, [load]);

  const onManualAssign = useCallback(async (row) => {
    const uploadId = row?.uploadId;
    if (!uploadId) {
      message.error("Missing upload id");
      return;
    }
    setActionKey(`gate:${uploadId}`);
    setModalError("");
    try {
      const gate = await getManualAssignGate(uploadId);
      if (!gate.allowed) {
        const hint = gate.manualOverrideAllowedAt
          ? `Manual assign not allowed yet. Override at ${formatOverrideAt(gate.manualOverrideAllowedAt)}.`
          : gate.message || "Manual assign is not allowed for this order yet.";
        message.warning(hint);
        return;
      }
      await ensureCadUsers();
      setModalSketch({
        _id: uploadId,
        id: uploadId,
        applicationId: row.applicationId,
        status: row.status,
      });
      setModalOpen(true);
    } catch (e) {
      message.error(e?.message || "Failed to check manual assign gate");
    } finally {
      setActionKey("");
    }
  }, [ensureCadUsers]);

  const submitManualAssign = async (payload) => {
    setModalLoading(true);
    setModalError("");
    try {
      await createAssignment(payload);
      message.success("Assigned successfully");
      setModalOpen(false);
      setModalSketch(null);
      await load();
    } catch (err) {
      const blocked = parseManualAssignBlocked(err);
      if (blocked.blocked) setModalError(blocked.message);
      else if (err?.status === 409) setModalError("Sketch already assigned");
      else setModalError(err?.message || "Failed to assign");
    } finally {
      setModalLoading(false);
    }
  };

  const openAttempts = async (row) => {
    const uploadId = row?.uploadId;
    if (!uploadId) {
      message.error("Missing upload id");
      return;
    }
    setAttemptsRow(row);
    setAttemptsOpen(true);
    setAttemptsLoading(true);
    setAttempts([]);
    try {
      const list = await getAutoAssignAttempts(uploadId);
      setAttempts(list);
    } catch (e) {
      message.error(e?.message || "Failed to load attempts");
    } finally {
      setAttemptsLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Application ID",
        dataIndex: "applicationId",
        key: "applicationId",
        render: (v) => v || "—",
      },
      {
        title: "Upload ID",
        dataIndex: "uploadId",
        key: "uploadId",
        render: (v) => (
          <Text code copyable={Boolean(v)} style={{ fontSize: 12 }}>
            {v || "—"}
          </Text>
        ),
      },
      {
        title: "Queue status",
        dataIndex: "status",
        key: "status",
        render: (v) => (
          <Tag color={statusTagColor(v)}>{getAutoAssignExceptionStatusLabel(v)}</Tag>
        ),
      },
      {
        title: "Failure reason",
        dataIndex: "failureReason",
        key: "failureReason",
        render: (v) => v || "—",
      },
      {
        title: "Last attempt",
        dataIndex: "lastAttemptAt",
        key: "lastAttemptAt",
        render: (v) => formatOverrideAt(v) || "—",
      },
      {
        title: "Attempts",
        dataIndex: "attemptCount",
        key: "attemptCount",
        width: 90,
        render: (v) => (v != null ? v : "—"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 280,
        render: (_, row) => {
          const uploadId = row?.uploadId;
          const busy = Boolean(actionKey) && actionKey.endsWith(`:${uploadId}`);
          return (
            <Space wrap size="small">
              <Button
                size="small"
                icon={<RetweetOutlined />}
                loading={actionKey === `retry:${uploadId}`}
                disabled={busy && actionKey !== `retry:${uploadId}`}
                onClick={() => onRetry(row)}
              >
                Retry
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<UserAddOutlined />}
                loading={actionKey === `gate:${uploadId}`}
                disabled={busy && actionKey !== `gate:${uploadId}`}
                onClick={() => onManualAssign(row)}
              >
                Assign
              </Button>
              <Button
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => openAttempts(row)}
              >
                History
              </Button>
            </Space>
          );
        },
      },
    ],
    [actionKey, onManualAssign, onRetry]
  );

  const attemptColumns = [
    {
      title: "#",
      dataIndex: "attemptNumber",
      key: "attemptNumber",
      width: 60,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => v || "—",
    },
    {
      title: "CAD user",
      dataIndex: "cadUserId",
      key: "cadUserId",
      render: (v) => {
        if (!v) return "—";
        const match = cadUsers.find((u) => String(u._id ?? u.id) === String(v));
        return formatUserDisplayLabel(match) || String(v);
      },
    },
    {
      title: "Reason",
      dataIndex: "failureReason",
      key: "failureReason",
      render: (v) => v || "—",
    },
    {
      title: "When",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => formatOverrideAt(v) || "—",
    },
  ];

  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Auto-assign exception queue
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Uploads pending retry or in exception that need a force retry or manual assign.
          </Paragraph>
          <Text type="secondary">
            <Link to="/superadmin/assignments">← Back to Sketch Assignments</Link>
          </Text>
        </div>
        <Space wrap>
          <Select
            style={{ minWidth: 220 }}
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>
            Refresh
          </Button>
        </Space>
      </div>

      {loadError ? <Alert type="error" showIcon message={loadError} /> : null}

      <Table
        rowKey={(row, index) =>
          String(row.uploadId || row.applicationId || `exception-${page}-${index}`)
        }
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize: limit,
          total: meta.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          onChange: (nextPage, nextLimit) => {
            setPage(nextPage);
            setLimit(nextLimit);
          },
        }}
      />

      <AssignmentModal
        open={modalOpen}
        mode="assign"
        loading={modalLoading}
        sketch={modalSketch}
        statuses={[]}
        cadUsers={cadUsers}
        initialValues={{}}
        errorText={modalError}
        onClose={() => {
          setModalOpen(false);
          setModalSketch(null);
          setModalError("");
        }}
        onSubmit={submitManualAssign}
      />

      <Drawer
        title={
          attemptsRow?.applicationId
            ? `Auto-assign attempts · ${attemptsRow.applicationId}`
            : "Auto-assign attempts"
        }
        open={attemptsOpen}
        onClose={() => {
          setAttemptsOpen(false);
          setAttemptsRow(null);
          setAttempts([]);
        }}
        width={Math.min(640, typeof window !== "undefined" ? window.innerWidth - 24 : 640)}
        destroyOnClose
      >
        <Table
          size="small"
          rowKey={(r) => String(r.id)}
          loading={attemptsLoading}
          columns={attemptColumns}
          dataSource={attempts}
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No attempts recorded" }}
        />
      </Drawer>
    </div>
  );
}
