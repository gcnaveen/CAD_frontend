import React from "react";
import { Button, Space } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { fileNameFromUrl } from "../../dashboard/cad/profileFormUtils.js";

/**
 * View + Download links for a stored resume URL. Shows "-" when missing.
 * @param {{ url?: string|null }} props
 */
export default function ResumeActions({ url }) {
  const href = typeof url === "string" ? url.trim() : "";
  if (!href) return "-";

  const fileName = fileNameFromUrl(href);

  return (
    <Space size="small" wrap>
      <Button
        type="link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        icon={<EyeOutlined />}
        aria-label="View resume"
        style={{ paddingInline: 0 }}
      >
        View
      </Button>
      <Button
        type="link"
        href={href}
        download={fileName}
        icon={<DownloadOutlined />}
        aria-label="Download resume"
        style={{ paddingInline: 0 }}
      >
        Download
      </Button>
    </Space>
  );
}
