import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Typography,
  Table,
  Space,
  Tag,
  message,
  Button,
  Drawer,
  Descriptions,
  Divider,
} from "antd";
import { ReloadOutlined, CopyOutlined, FileSearchOutlined } from "@ant-design/icons";
import { getSurveyDraftReports } from "../../../services/admin/surveyDraftReportsAdminService.js";
import { parsePagedListResponse } from "../../../utils/paginationUtils.js";
import {
  hasUploadedFiles,
  normalizeDocumentsMap,
  normalizeFileList,
  normalizeSingleFile,
} from "../../../utils/sketchFileUtils.js";

const { Title, Text, Paragraph } = Typography;

const formatRef = (v) => {
  if (v == null || v === "") return "—";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const name = v.name ?? v.label ?? v.title;
    const code = v.code;
    if (name && code) return `${name} (${code})`;
    if (name) return String(name);
  }
  return "—";
};

const surveyorFromRow = (row) => {
  const s = row?.surveyor;
  return s != null && typeof s === "object" ? s : null;
};

const surveyorPhoneFromRow = (row) => {
  const s = surveyorFromRow(row);
  if (!s) return "—";
  const phone = s.auth?.phone ?? s.phone;
  if (phone == null || phone === "") return "—";
  return String(phone);
};

const surveyorRoleFromRow = (row) => {
  const role = surveyorFromRow(row)?.role;
  return role ? String(role) : "—";
};

/** Display name for list/table (API returns surveyor as populated user with name.first / name.last). */
const surveyorDisplayName = (row) => {
  const s = row?.surveyor;
  if (s == null) return "—";
  if (typeof s === "string") return "—";
  if (typeof s === "object") {
    const n = s.name;
    const first = (n?.first ?? s.firstName ?? "").trim();
    const last = (n?.last ?? s.lastName ?? "").trim();
    const full = [first, last].filter(Boolean).join(" ").trim();
    if (full) return full;
    return s.email || s.phone || "—";
  }
  return "—";
};

const docKeysSummary = (row) => {
  const docs = normalizeDocumentsMap(row?.documents);
  const keys = Object.keys(docs);
  if (keys.length) return keys.join(", ");
  if (hasUploadedFiles(row?.singleUpload)) return "single upload";
  return "—";
};

const ViewSurveyDraftReports = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [detailRow, setDetailRow] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSurveyDraftReports({
        page: pagination.page,
        limit: pagination.limit,
      });
      const { items: list, total, page, limit } = parsePagedListResponse(res, {
        page: pagination.page,
        limit: pagination.limit,
      });
      setItems(Array.isArray(list) ? list : []);
      setPagination((prev) => ({ ...prev, page, limit, total }));
    } catch (err) {
      message.error(err.message || "Failed to load draft reports.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleTableChange = (pag) => {
    setPagination((prev) => ({
      ...prev,
      page: pag.current ?? 1,
      limit: pag.pageSize ?? prev.limit,
    }));
  };

  const copyText = async (text) => {
    if (!text || text === "—") return;
    try {
      await navigator.clipboard.writeText(String(text));
      message.success("Copied");
    } catch {
      message.error("Copy failed");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "SL",
        key: "sl",
        width: 64,
        render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
      },
      {
        title: "Surveyor",
        key: "surveyor",
        width: 200,
        ellipsis: true,
        render: (_, row) => (
          <Text strong>{surveyorDisplayName(row)}</Text>
        ),
      },
      {
        title: "Survey type",
        dataIndex: "surveyType",
        width: 120,
        render: (v) => (v ? <Tag>{String(v)}</Tag> : "—"),
      },
      {
        title: "Survey No.",
        dataIndex: "surveyNo",
        width: 120,
        ellipsis: true,
        render: (v) => v || "—",
      },
      {
        title: "Location (summary)",
        key: "loc",
        ellipsis: true,
        render: (_, row) =>
          [row.district, row.taluka, row.hobli, row.village].map(formatRef).join(" · "),
      },
      {
        title: "Docs",
        key: "docs",
        width: 160,
        ellipsis: true,
        render: (_, row) => docKeysSummary(row),
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        width: 160,
        render: (v) => (v ? new Date(v).toLocaleString("en-IN") : "—"),
      },
      {
        title: "",
        key: "actions",
        width: 100,
        fixed: "right",
        render: (_, row) => (
          <Button type="link" size="small" onClick={() => setDetailRow(row)}>
            Details
          </Button>
        ),
      },
    ],
    [pagination.page, pagination.limit]
  );

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Survey draft reports
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
            Drafts saved during sketch upload (before payment / submit). Open Details for full
            surveyor and location context.
          </Paragraph>
        </div>

        <Space wrap align="start">
          <Button icon={<ReloadOutlined />} onClick={() => fetchList()}>
            Refresh
          </Button>
        </Space>

        <Table
          rowKey={(r) => r._id ?? r.id ?? JSON.stringify(r)}
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 960 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (t) => `Total ${t} drafts`,
          }}
          onChange={handleTableChange}
        />
      </Space>

      <Drawer
        title={
          <Space>
            <FileSearchOutlined />
            <span>Draft detail</span>
          </Space>
        }
        width={560}
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        destroyOnClose
      >
        {detailRow ? (() => {
          const detailPhone = surveyorPhoneFromRow(detailRow);
          return (
          <>
            <Descriptions bordered size="small" column={1} title="Surveyor details">
              <Descriptions.Item label="Name">
                {surveyorDisplayName(detailRow)}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {surveyorRoleFromRow(detailRow)}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Space>
                  {detailPhone !== "—" ? (
                    <a href={`tel:${detailPhone}`}>{detailPhone}</a>
                  ) : (
                    <Text>—</Text>
                  )}
                  {detailPhone !== "—" ? (
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyText(detailPhone)}
                    />
                  ) : null}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "12px 0" }} />

            <Descriptions bordered size="small" column={1} title="Draft details">
              <Descriptions.Item label="Survey type">
                {detailRow.surveyType ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Survey No.">
                {detailRow.surveyNo ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="District">{formatRef(detailRow.district)}</Descriptions.Item>
              <Descriptions.Item label="Taluka">{formatRef(detailRow.taluka)}</Descriptions.Item>
              <Descriptions.Item label="Hobli">{formatRef(detailRow.hobli)}</Descriptions.Item>
              <Descriptions.Item label="Village">{formatRef(detailRow.village)}</Descriptions.Item>
              <Descriptions.Item label="Notes (others)">
                {detailRow.others ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Superimpose">
                {detailRow.isSuperimpose != null ? String(detailRow.isSuperimpose) : "—"}
              </Descriptions.Item>
              {detailRow.currentStep != null && detailRow.currentStep !== "" ? (
                <Descriptions.Item label="Current step (wizard)">
                  {String(detailRow.currentStep)}
                </Descriptions.Item>
              ) : null}
              <Descriptions.Item label="Created">
                {detailRow.createdAt
                  ? new Date(detailRow.createdAt).toLocaleString("en-IN")
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {detailRow.updatedAt
                  ? new Date(detailRow.updatedAt).toLocaleString("en-IN")
                  : "—"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Documents</Divider>
            {normalizeFileList(detailRow.singleUpload).map((file, index) => (
              <Paragraph key={file.url || index}>
                <Text strong>Single upload: </Text>
                <a href={file.url} target="_blank" rel="noreferrer">
                  {file.fileName || "Open file"}
                </a>
              </Paragraph>
            ))}
            {Object.keys(normalizeDocumentsMap(detailRow.documents)).length > 0 ? (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {Object.entries(normalizeDocumentsMap(detailRow.documents)).flatMap(([key, files]) =>
                  files.map((doc, index) => (
                    <li key={`${key}-${index}`} style={{ marginBottom: 6 }}>
                      <Text strong>{key}: </Text>
                      <a href={doc.url} target="_blank" rel="noreferrer">
                        {doc.fileName || "Open"}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            ) : !hasUploadedFiles(detailRow.singleUpload) ? (
              <Text type="secondary">No structured documents on draft.</Text>
            ) : null}
            {Array.isArray(detailRow.other_documents) && detailRow.other_documents.length > 0 ? (
              <>
                <Divider orientation="left">Other documents</Divider>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {detailRow.other_documents.map((doc, i) =>
                    doc?.url ? (
                      <li key={i}>
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          {doc.fileName || `File ${i + 1}`}
                        </a>
                      </li>
                    ) : null
                  )}
                </ul>
              </>
            ) : null}
            {(() => {
              const audio = normalizeSingleFile(detailRow.audio);
              if (!audio) return null;
              return (
                <>
                  <Divider orientation="left">Audio</Divider>
                  <a href={audio.url} target="_blank" rel="noreferrer">
                    {audio.fileName || "Open audio"}
                  </a>
                </>
              );
            })()}
          </>
          );
        })() : null}
      </Drawer>
    </div>
  );
};

export default ViewSurveyDraftReports;
