import React, { useCallback, useEffect, useState } from "react";
import { Typography, Table, Space, Tag, message } from "antd";
import { getCadInterests } from "../../../services/cadInterestService.js";
import { parsePagedListResponse } from "../../../utils/paginationUtils.js";

const { Title } = Typography;

const toSkillsText = (skills) => {
  if (!Array.isArray(skills) || skills.length === 0) return "-";
  return skills.filter(Boolean).join(", ");
};

const ViewCadInterests = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

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

  const columns = [
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
  ];

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
        scroll={{ x: 1400 }}
      />
    </div>
  );
};

export default ViewCadInterests;
