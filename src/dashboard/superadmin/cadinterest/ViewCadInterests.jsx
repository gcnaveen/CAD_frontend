import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Typography, Table, Space, Tag, message, Button, Tooltip, Modal, Input } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { getCadInterests } from "../../../services/cadInterestService.js";
import { parsePagedListResponse } from "../../../utils/paginationUtils.js";
import { createEnrollmentInvite } from "../../../services/user/userService.js";

const { Title, Text, Paragraph } = Typography;

const toSkillsText = (skills) => {
  if (!Array.isArray(skills) || skills.length === 0) return "-";
  return skills.filter(Boolean).join(", ");
};

const normalizeEmail = (value) => (value == null ? "" : String(value).trim());
const isValidEmail = (value) => {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

function showEnrollmentLinkModal({ email, enrollmentUrl, expiresAt }) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(enrollmentUrl);
      message.success("Enrollment link copied");
    } catch {
      message.warning("Copy failed — select the link manually");
    }
  };

  Modal.success({
    title: "CAD enrollment invite created",
    width: 520,
    content: (
      <div>
        <Paragraph>
          One-time enrollment link for <Text strong>{email}</Text>. Share out of band — the
          operator sets their own password. No default password is issued.
        </Paragraph>
        {expiresAt ? (
          <Paragraph type="secondary" style={{ marginBottom: 8 }}>
            Expires: {new Date(expiresAt).toLocaleString()}
          </Paragraph>
        ) : null}
        <Space.Compact style={{ width: "100%" }}>
          <Input readOnly value={enrollmentUrl} />
          <Button icon={<CopyOutlined />} onClick={copyLink}>
            Copy
          </Button>
        </Space.Compact>
      </div>
    ),
  });
}

const ViewCadInterests = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const [addedUsers, setAddedUsers] = useState([]);
  const [alreadyAddedUsers, setAlreadyAddedUsers] = useState([]);
  const [addingEmails, setAddingEmails] = useState([]);

  const fetchCadInterests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCadInterests({
        page: pagination.page,
        limit: pagination.limit,
      });
      const { items: list, total, page, limit } = parsePagedListResponse(res, {
        page: pagination.page,
        limit: pagination.limit,
      });
      setItems(Array.isArray(list) ? list : []);
      setPagination({ page, limit, total });
    } catch (err) {
      message.error(err.message || "Failed to load CAD interests.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCadInterests();
  }, [fetchCadInterests]);

  const handleTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      page: pag.current ?? 1,
      limit: pag.pageSize ?? prev.limit,
    }));
  };

  const handleAddCadUser = useCallback(
    async (row) => {
      const email = normalizeEmail(row?.email);
      if (!isValidEmail(email)) return;

      if (addingEmails.includes(email)) return;
      if (addedUsers.includes(email) || alreadyAddedUsers.includes(email)) return;

      const payload = {
        role: "CAD",
        email,
        firstName: row?.name ?? "",
        lastName: "",
      };

      setAddingEmails((prev) => (prev.includes(email) ? prev : [...prev, email]));
      try {
        const invite = await createEnrollmentInvite(payload);
        setAddedUsers((prev) => (prev.includes(email) ? prev : [...prev, email]));
        showEnrollmentLinkModal({
          email: invite.email || email,
          enrollmentUrl: invite.enrollmentUrl,
          expiresAt: invite.expiresAt,
        });
      } catch (err) {
        const rawMsg = String(err?.message || "");
        const msg = rawMsg.toLowerCase();
        const looksLikeDuplicate =
          msg.includes("already") ||
          msg.includes("exist") ||
          msg.includes("duplicate") ||
          msg.includes("conflict");

        if (looksLikeDuplicate) {
          setAlreadyAddedUsers((prev) => (prev.includes(email) ? prev : [...prev, email]));
        } else {
          message.error(rawMsg || "Failed to create CAD enrollment invite");
        }
      } finally {
        setAddingEmails((prev) => prev.filter((e) => e !== email));
      }
    },
    [addingEmails, addedUsers, alreadyAddedUsers]
  );

  const columns = useMemo(() => {
    return [
      {
        title: "SL No",
        key: "slNo",
        width: 80,
        render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        width: 180,
        render: (value) => value || "-",
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        width: 220,
        render: (value) => value || "-",
      },
      {
        title: "Phone",
        dataIndex: "phone",
        key: "phone",
        width: 150,
        render: (value) => value || "-",
      },
      {
        title: "Address",
        dataIndex: "address",
        key: "address",
        width: 240,
        render: (value) => value || "-",
      },
      {
        title: "Skills",
        dataIndex: "skills",
        key: "skills",
        width: 260,
        render: (skills) => toSkillsText(skills),
      },
      {
        title: "Experience (Years)",
        dataIndex: "yearsOfExperience",
        key: "yearsOfExperience",
        width: 150,
        render: (value) =>
          Number.isFinite(Number(value)) ? Number(value) : <Tag color="default">N/A</Tag>,
      },
      {
        title: "Resume URL",
        dataIndex: "resumeUrl",
        key: "resumeUrl",
        width: 260,
        render: (value) =>
          value ? (
            <a href={value} target="_blank" rel="noopener noreferrer">
              View Resume
            </a>
          ) : (
            "-"
          ),
      },
      {
        title: "Submitted At",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (value) => (value ? new Date(value).toLocaleString() : "-"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 170,
        fixed: "right",
        render: (_, row) => {
          const email = normalizeEmail(row?.email);
          const emailOk = isValidEmail(email);
          const isAdding = emailOk && addingEmails.includes(email);
          const isAdded = emailOk && addedUsers.includes(email);
          const isAlreadyAdded = emailOk && alreadyAddedUsers.includes(email);

          const disabled = !emailOk || isAdding || isAdded || isAlreadyAdded;
          const label = isAlreadyAdded
            ? "Already Added"
            : isAdded
              ? "Invite Sent"
              : "Send Enrollment Link";
          const tooltip = !emailOk ? "Email required to create user" : undefined;

          const button = (
            <Button
              type="primary"
              size="small"
              loading={isAdding}
              disabled={disabled}
              onClick={() => {
                if (!emailOk || isAdding || isAdded || isAlreadyAdded) return;
                Modal.confirm({
                  title: "Confirm Onboarding",
                  content:
                    "Send a one-time enrollment link so this candidate can set their own password? No default password will be created.",
                  okText: "Send Link",
                  cancelText: "Cancel",
                  onOk: async () => handleAddCadUser(row),
                });
              }}
            >
              {label}
            </Button>
          );

          return (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              {tooltip ? (
                <Tooltip title={tooltip}>
                  <span>{button}</span>
                </Tooltip>
              ) : (
                button
              )}
            </div>
          );
        },
      },
    ];
  }, [
    pagination.page,
    pagination.limit,
    addingEmails,
    addedUsers,
    alreadyAddedUsers,
    handleAddCadUser,
  ]);

  return (
    <div>
      <Space
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 24 }}
        wrap
      >
        <Title level={3} style={{ margin: 0 }}>
          CAD Interest
        </Title>
      </Space>

      <Table
        columns={columns}
        dataSource={items}
        loading={loading}
        rowKey={(record) => record._id}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total) => `Total ${total} interests`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1550 }}
      />
    </div>
  );
};

export default ViewCadInterests;
