import { useState } from "react";
import { DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import { Alert, App, Button, Space } from "antd";

import { deleteOriginal, getOriginalUrl } from "../../database/storage";
import type { OriginalFile } from "../../types/resume";

function size(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** The uploaded source file the user chose to keep, with download / remove. */
export default function OriginalFileNotice({
  file,
  onRemoved,
}: {
  file: OriginalFile;
  onRemoved: () => void;
}) {
  const { message, modal } = App.useApp();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const url = await getOriginalUrl(file.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      message.error("Could not open the original file.");
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    modal.confirm({
      title: "Delete the original file?",
      content: "The uploaded file is removed from storage. Your resume stays as it is.",
      okText: "Delete file",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteOriginal(file.path);
          onRemoved();
          message.success("Original file deleted.");
        } catch {
          message.error("Could not delete the file. Try again.");
          throw new Error("delete failed");
        }
      },
    });
  };

  return (
    <Alert
      type="info"
      showIcon
      className="original-file"
      title={`Imported from ${file.name} (${size(file.size)})`}
      description={
        <Space wrap>
          <Button size="small" icon={<DownloadOutlined />} loading={busy} onClick={download}>
            Download original
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={remove}>
            Delete original
          </Button>
        </Space>
      }
    />
  );
}
