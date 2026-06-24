import React, { useState } from "react";
import { Button, Space, message } from "antd";
import { DownloadOutlined, LinkOutlined } from "@ant-design/icons";
import { downloadRemoteFile } from "../../utils/sketchFileUtils";

const FileViewDownloadButtons = ({
  url,
  fileName,
  viewLabel = "View",
  downloadLabel = "Download",
  size = "small",
  downloadKey = url,
  downloadingByKey,
  setDownloadingByKey,
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const loading =
    downloadingByKey != null ? Boolean(downloadingByKey[downloadKey]) : localLoading;

  const handleDownload = async () => {
    if (!url) return;
    const setLoading = (value) => {
      if (setDownloadingByKey) {
        setDownloadingByKey((prev) => ({ ...prev, [downloadKey]: value }));
      } else {
        setLocalLoading(value);
      }
    };
    setLoading(true);
    try {
      await downloadRemoteFile(url, fileName || "download");
    } catch {
      message.error("Download failed");
    } finally {
      setLoading(false);
    }
  };

  if (!url) return null;

  return (
    <Space size={0} wrap>
      <Button
        type="link"
        icon={<LinkOutlined />}
        size={size}
        onClick={() => window.open(url, "_blank")}
      >
        {viewLabel}
      </Button>
      <Button
        type="link"
        icon={<DownloadOutlined />}
        size={size}
        loading={loading}
        onClick={handleDownload}
      >
        {downloadLabel}
      </Button>
    </Space>
  );
};

export default FileViewDownloadButtons;
