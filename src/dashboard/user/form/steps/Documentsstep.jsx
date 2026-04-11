// src/dashboard/user/form/steps/DocumentsStep.jsx
import React, { useState } from "react";
import { Form, Upload, Checkbox, Input, message, Modal } from "antd";
import { Upload as UploadIcon } from "lucide-react";
import { getImagePresignedUrl, getAudioPresignedUrl, deleteUploadedFile } from "../../../../services/upload/upload.api.js";
import { AUDIO_MAX_SIZE_BYTES } from "../../../../services/upload/upload.constants.js";

const UPLOAD_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const OTHER_DOCS_MAX = 10;

const NORMAL_ROWS = [
  { key: "moolaTippani", en: "Moola Tippani", kn: "ಮೂಲ ಟಿಪ್ಪಣಿ" },
  { key: "hissaTippani", en: "Hissa Tippani", kn: "ಹಿಸ್ಸ ಟಿಪ್ಪಣಿ" },
  { key: "atlas", en: "Atlas", kn: "ಅಟ್ಲಾಸ್" },
  { key: "rrPakkabook", en: "RR / Pakka Book", kn: "RR ಪಕ್ಕಬುಕ್" },
  { key: "kharabu", en: "Kharabu", kn: "ಖರಾಬು" },
  { key: "other_documents", en: "Others", kn: "ಇತರೆ" },
];

const DOCUMENT_TYPE_CHECKBOXES = [
  { name: "is_originaltippani", en: "Moola Tippani", kn: "ಮೂಲ ಟಿಪ್ಪಣಿ" },
  { name: "is_hissatippani", en: "Hissa Tippani", kn: "ಹಿಸ್ಸ ಟಿಪ್ಪಣಿ" },
  { name: "is_atlas", en: "Atlas", kn: "ಅಟ್ಲಾಸ್" },
  { name: "is_rrpakkabook", en: "RR Pakkabook", kn: "RR ಪಕ್ಕಬುಕ್" },
  { name: "is_kharabuttar", en: "Kharab Utthar", kn: "ಖರಾಬ್ ಉತ್ತರ" },
];

const SectionHeader = ({ icon, titleKn, titleEn, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-9 h-9 rounded-2xl bg-[var(--user-accent-soft)] border border-[color-mix(in_srgb,var(--user-accent)_22%,var(--border-color))] flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold text-[var(--user-accent)] uppercase tracking-widest leading-none mb-0.5">{titleKn}</p>
      <p className="text-lg font-extrabold text-fg leading-none">{titleEn}</p>
      {subtitle && <p className="text-xs text-fg-muted font-semibold mt-1">{subtitle}</p>}
    </div>
  </div>
);

const DocumentsStep = ({
  form,
  onDocumentUpload,
  onDocumentRemove,
  onOtherDocumentUpload,
  onOtherDocumentRemove,
  onClearUploads,
}) => {
  const [uploading, setUploading] = useState({});
  const [enabled, setEnabled] = useState({});
  const [otherDocName, setOtherDocName] = useState("");
  const uploadMode = Form.useWatch("uploadMode", form) ?? "normal";

  const NORMAL_DOC_FIELDS = ["moolaTippani", "hissaTippani", "atlas", "rrPakkabook", "kharabu"];
  const SINGLE_FIELDS = ["singleUpload", "documentTypes"];

  const hasAnyFiles = (fieldName) => {
    const list = form.getFieldValue(fieldName);
    return Array.isArray(list) && list.length > 0;
  };

  const hasAnyUploads = () => {
    const single = form.getFieldValue("singleUpload");
    const types = form.getFieldValue("documentTypes");

    if (Array.isArray(single) && single.length > 0) return true;
    if (Array.isArray(types) && types.length > 0) return true;

    return NORMAL_DOC_FIELDS.some((f) => {
      const list = form.getFieldValue(f);
      return Array.isArray(list) && list.length > 0;
    });
  };

  const clearForMode = (nextMode) => {
    if (nextMode === "single") {
      // clear normal docs ONLY
      NORMAL_DOC_FIELDS.forEach((field) => {
        form.setFieldValue(field, []);
        onDocumentRemove?.(field);
      });
    } else {
      // clear single mode ONLY
      form.setFieldValue("singleUpload", []);
      form.setFieldValue("documentTypes", []);
      onDocumentRemove?.("singleUpload");
    }

    onClearUploads?.(nextMode);
    setEnabled({});
    setOtherDocName("");
  };

  const handleUploadModeChange = (nextMode) => {
    if (nextMode === uploadMode) return;

    const proceed = () => {
      clearForMode(nextMode);
      form.setFieldValue("uploadMode", nextMode);
    };

    if (!hasAnyUploads()) {
      proceed();
      return;
    }

    Modal.confirm({
      title: "Switch upload mode?",
      content: "Switching mode will remove existing uploads.",
      okText: "Switch & clear",
      cancelText: "Cancel",
      onOk: proceed,
    });
  };


  const isAudio = (file) => file.type?.startsWith("audio/");

  const getMergeValue = (fieldName) => (e) => {
    const next = Array.isArray(e) ? e : (e?.fileList ?? []);
    const prev = form.getFieldValue(fieldName) || [];
    return next.map((f) => {
      const p = prev.find((x) => x.uid === f.uid || x.name === f.name);
      return p && (p.fileUrl || p.url)
        ? {
          ...f,
          fileUrl: p.fileUrl || p.url,
          url: p.url || p.fileUrl,
          key: p.key,
          fileName: p.fileName ?? f.name,
          mimeType: p.mimeType ?? f.type,
          otherDocName: p.otherDocName ?? f.otherDocName,
        }
        : f;
    });
  };

  const handleUpload = async (file, fieldName) => {
    const fileObj = file instanceof File ? file : (file.originFileObj instanceof File ? file.originFileObj : file);
    const villageId = form.getFieldValue("village");
    if (!villageId) { message.warning("Please select village first (go back to Location step)"); return false; }
    const maxSize = isAudio(file) ? AUDIO_MAX_SIZE_BYTES : MAX_FILE_SIZE;
    if (file.size > maxSize) { message.error(`Max ${maxSize / 1024 / 1024}MB`); return false; }
    setUploading((p) => ({ ...p, [fieldName]: true }));
    try {
      const actual = fileObj instanceof File ? fileObj : file;
      const result = isAudio(actual)
        ? await getAudioPresignedUrl({ fileName: actual.name, contentType: actual.type, entityId: villageId })
        : await getImagePresignedUrl({ fileName: actual.name, contentType: actual.type, entityId: villageId });
      const { uploadUrl, fileUrl, key } = result?.data ?? result;
      if (!uploadUrl || !fileUrl) throw new Error("Failed to get upload URL");
      const redactedUploadUrl = typeof uploadUrl === "string" ? uploadUrl.split("?")[0] : uploadUrl;
      try {
        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: actual,
          headers: { "Content-Type": actual.type },
        });

        if (!res.ok) {
          let details = "";
          try {
            details = await res.text();
          } catch {
            // ignore
          }

          // Temporary: helps backend verify why presigned PUT fails.
          console.error("s3 backend log", {
            uploadUrl: redactedUploadUrl,
            fileName: actual?.name,
            contentType: actual?.type,
            status: res.status,
            statusText: res.statusText,
            responseBody: typeof details === "string" ? details : "",
          });

          throw new Error("Upload to storage failed");
        }
      } catch (e) {
        // If fetch throws (network/CORS), still log something useful.
        console.error("s3 backend log", {
          uploadUrl: redactedUploadUrl,
          fileName: actual?.name,
          contentType: actual?.type,
          error: e?.message || String(e),
        });
        throw e;
      }
      const uid = file.uid || `upload-${Date.now()}`;
      const meta = { fileUrl, fileName: file.name || actual.name, mimeType: file.type || actual.type, size: file.size || actual.size };
      const cur = form.getFieldValue(fieldName) || [];
      const attachOtherName = fieldName === "other_documents" && typeof otherDocName === "string" && otherDocName.trim();
      form.setFieldValue(fieldName, [
        ...cur.filter((f) => f.uid !== file.uid && f.name !== file.name),
        {
          uid,
          name: file.name || actual.name,
          url: fileUrl,
          fileUrl,
          key,
          fileName: meta.fileName,
          mimeType: meta.mimeType,
          size: meta.size,
          status: "done",
          percent: 100,
          originFileObj: actual,
          ...(attachOtherName ? { otherDocName: otherDocName.trim() } : {}),
        },
      ]);
      if (fieldName === "other_documents") onOtherDocumentUpload?.(uid, meta);
      else onDocumentUpload?.(fieldName, meta);
      message.success("Uploaded successfully");
    } catch (e) { message.error(e.message || "Upload failed"); }
    finally { setUploading((p) => ({ ...p, [fieldName]: false })); }
    return false;
  };

  const handleRemove = async (file, fieldName) => {
    const list = form.getFieldValue(fieldName) || [];
    const existing = list.find((f) => f.uid === file.uid || f.name === file.name);
    const target = existing || file;
    if (fieldName === "other_documents") onOtherDocumentRemove?.(file.uid || target?.uid);
    else onDocumentRemove?.(fieldName);
    if (target?.fileUrl || target?.key) {
      try { await deleteUploadedFile(target.fileUrl ? { fileUrl: target.fileUrl } : { key: target.key }); }
      catch { /* silent */ }
    }
    return true;
  };

  const openInNewTab = (url) => {
    if (!url || typeof url !== "string") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isImageUrl = (file) => {
    const t = file?.mimeType || file?.type;
    return typeof t === "string" && t.startsWith("image/");
  };

  const clearField = (fieldName) => {
    const list = form.getFieldValue(fieldName) || [];
    if (fieldName === "other_documents") {
      if (Array.isArray(list) && list.length) {
        list.forEach((f) => onOtherDocumentRemove?.(f?.uid));
      }
    } else {
      onDocumentRemove?.(fieldName);
    }
    form.setFieldValue(fieldName, []);
  };

  const toggleEnabled = (fieldName, nextChecked) => {
    setEnabled((p) => ({ ...p, [fieldName]: nextChecked }));
    if (!nextChecked) {
      clearField(fieldName);
      if (fieldName === "other_documents") setOtherDocName("");
    }
  };

  return (
    <div>
      <SectionHeader
        titleKn="ದಾಖಲೆಗಳು"
        titleEn="Documents"
        subtitle="Upload reference documents (PDF, JPG, PNG — max 10MB each). This step is optional."
        icon={
          <svg className="w-5 h-5 text-[var(--user-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        }
      />

      {/* Upload Mode toggle */}
      <div className="flex gap-2 mb-5">
        {["normal", "single"].map((m) => {
          const active = uploadMode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => handleUploadModeChange(m)}
              className={`flex-1 py-2 rounded-xl border-2 text-sm font-extrabold transition-all ${active
                ? "border-[var(--user-accent)] bg-[var(--user-accent-soft)] text-[var(--user-accent)]"
                : "border-line bg-surface text-fg-muted hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))]"
                }`}
            >
              {m === "normal" ? "Normal Upload" : "Single Upload"}
            </button>
          );
        })}
      </div>

      {uploadMode === "single" ? (
        /* ── Single Upload ── */
        <div className="space-y-4">
          <Form.Item
            name="singleUpload"
            valuePropName="fileList"
            getValueFromEvent={getMergeValue("singleUpload")}
          >
            <Upload
              name="singleUpload"
              listType="picture-card"
              maxCount={1}
              accept={UPLOAD_ACCEPT}
              disabled={uploadMode !== "single" || Boolean(uploading.singleUpload)}
              beforeUpload={(f) => uploadMode === "single" ? handleUpload(f, "singleUpload") : false}
              onRemove={(f) => handleRemove(f, "singleUpload")}
              className={`upload-area-full ${uploadMode !== "single" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--user-accent-soft)] border border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] flex items-center justify-center">
                  <UploadIcon className="w-5 h-5 text-[var(--user-accent)]" />
                </div>
                <p className="text-sm font-extrabold text-fg">Tap to upload</p>
                <p className="text-xs text-fg-muted font-semibold">PDF, JPG, PNG • Max 10MB</p>
              </div>
            </Upload>
          </Form.Item>

          <div>
            <p className="text-sm font-extrabold text-fg mb-2">Document Category</p>
            <Form.Item
              name="documentTypes"
              rules={[{
                validator: (_, v) => {
                  if (uploadMode !== "single") return Promise.resolve();
                  const singleList = form.getFieldValue("singleUpload") || [];
                  const hasSingleFile = Array.isArray(singleList) && singleList.length > 0;
                  if (!hasSingleFile) return Promise.resolve(); // optional unless single file exists
                  return Array.isArray(v) && v.length ? Promise.resolve() : Promise.reject("Select at least one type");
                },
              }]}
            >
              <Checkbox.Group className="w-full" disabled={uploadMode !== "single"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DOCUMENT_TYPE_CHECKBOXES.map(({ name, en, kn }) => (
                    <label
                      key={name}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-line bg-surface ${uploadMode !== "single"
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] cursor-pointer"
                        }`}
                    >
                      <Checkbox value={name} />
                      <div>
                        <p className="text-sm font-bold text-fg">{en}</p>
                        <p className="text-xs text-fg-muted font-semibold">{kn}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </Checkbox.Group>
            </Form.Item>
          </div>
        </div>
      ) : (
        /* ── Normal Upload ── */
        <div className="space-y-3">
          <p className="text-sm font-extrabold text-fg mb-2">Document Category</p>

          {NORMAL_ROWS.map((row) => {
            const fieldName = row.key;
            const isOther = fieldName === "other_documents";
            const accept = isOther ? `${UPLOAD_ACCEPT},.mp3,.wav,.m4a,.aac,.ogg` : UPLOAD_ACCEPT;
            const maxCount = isOther ? OTHER_DOCS_MAX : 1;

            return (
              <Form.Item
                key={fieldName}
                shouldUpdate={(prev, next) =>
                  prev?.[fieldName] !== next?.[fieldName] ||
                  prev?.uploadMode !== next?.uploadMode
                }
                noStyle
              >
                {() => {
                  const list = form.getFieldValue(fieldName) || [];
                  const hasFile = Array.isArray(list) && list.length > 0;
                  const checked = Boolean(enabled[fieldName] ?? hasFile);
                  const disabledRow = uploadMode !== "normal";
                  const canUpload = !disabledRow && checked && !uploading[fieldName] && (isOther ? true : !hasFile);

                  const first = Array.isArray(list) ? list[0] : null;
                  const firstUrl = first?.fileUrl || first?.url;
                  const firstName = first?.fileName || first?.name;

                  return (
                    <div className={`rounded-2xl border border-line bg-surface px-3.5 py-3 ${disabledRow ? "opacity-60" : ""}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Checkbox + labels */}
                        <div className="flex items-start gap-3 sm:w-[240px] shrink-0">
                          <Checkbox
                            checked={checked}
                            disabled={disabledRow}
                            onChange={(e) => toggleEnabled(fieldName, e.target.checked)}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold truncate">{row.en}</p>
                            <p className="text-xs text-fg-muted truncate">{row.kn}</p>
                          </div>
                        </div>

                        {/* Upload / File name */}
                        <div className="flex-1 min-w-0 w-full">
                          {!checked ? (
                            <div className="text-xs font-bold text-fg-muted">Select the checkbox to enable upload</div>
                          ) : !isOther && hasFile ? (
                            <div className="flex items-center gap-2 min-w-0 w-full">
                              {isImageUrl(first) && firstUrl ? (
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-line bg-surface-2 shrink-0">
                                  <img
                                    src={firstUrl}
                                    alt={firstName || "Uploaded"}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-[var(--user-accent-soft)] border border-[color-mix(in_srgb,var(--user-accent)_22%,var(--border-color))] flex items-center justify-center shrink-0">
                                  <UploadIcon className="w-4 h-4 text-[var(--user-accent)]" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-bold" title={firstName}>
                                  {firstName || "Uploaded file"}
                                </p>
                                <p className="truncate text-xs text-fg-muted">
                                  {first?.mimeType || first?.type || ""}
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* register form field */
                            <Form.Item
                              name={fieldName}
                              valuePropName="fileList"
                              getValueFromEvent={getMergeValue(fieldName)}
                              className="mb-0 w-full"
                            >
                              <Upload
                                name={fieldName}
                                accept={accept}
                                maxCount={maxCount}
                                listType="text"
                                showUploadList={false}
                                disabled={!canUpload}
                                beforeUpload={(f) => uploadMode === "normal" ? handleUpload(f, fieldName) : false}
                                onRemove={(f) => handleRemove(f, fieldName)}
                                className="w-full"
                              >
                                <button
                                  type="button"
                                  disabled={!canUpload}
                                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border-2 text-sm font-extrabold flex items-center justify-center gap-2 transition-colors ${
                                    canUpload
                                      ? "border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] bg-[var(--user-accent-soft)] text-[var(--user-accent)] hover:opacity-90"
                                      : "border-line bg-surface text-fg-muted cursor-not-allowed"
                                  }`}
                                >
                                  <UploadIcon className="w-4 h-4" />
                                  {uploading[fieldName] ? "Uploading…" : isOther ? "Upload files" : "Upload"}
                                </button>
                              </Upload>
                            </Form.Item>
                          )}

                          {/* Others: name input */}
                          {isOther && checked && (
                            <div className="mt-2">
                              <div className="text-[11px] font-bold text-fg-muted uppercase tracking-widest mb-1">
                                Document name
                              </div>
                              <Input
                                value={otherDocName}
                                onChange={(e) => setOtherDocName(e.target.value)}
                                placeholder="Enter custom document name (optional)"
                                disabled={disabledRow}
                                className="rounded-xl"
                              />
                            </div>
                          )}

                          {/* Others: uploaded list */}
                          {isOther && hasFile && (
                            <div className="mt-2 space-y-2">
                              {list.map((f) => {
                                const url = f?.fileUrl || f?.url;
                                const displayName = f?.fileName || f?.name || "file";
                                const label = f?.otherDocName;
                                return (
                                  <div key={f.uid || displayName} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2">
                                    {/* <div className="min-w-0 flex items-center gap-2">
                                      {isImageUrl(f) && url ? (
                                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-line bg-surface shrink-0">
                                          <img
                                            src={url}
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-9 h-9 rounded-xl bg-[var(--user-accent-soft)] border border-[color-mix(in_srgb,var(--user-accent)_22%,var(--border-color))] flex items-center justify-center shrink-0">
                                          <UploadIcon className="w-4 h-4 text-[var(--user-accent)]" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-fg truncate">
                                          {label ? `${label} — ${displayName}` : displayName}
                                        </p>
                                        <p className="text-xs text-fg-muted font-semibold truncate">{f?.mimeType || f?.type || ""}</p>
                                      </div>
                                    </div> */}
                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                      {isImageUrl(first) && firstUrl ? (
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-line bg-surface-2 shrink-0">
                                          <img
                                            src={firstUrl}
                                            alt={firstName || "Uploaded"}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-10 h-10 rounded-xl bg-[var(--user-accent-soft)] border border-[color-mix(in_srgb,var(--user-accent)_22%,var(--border-color))] flex items-center justify-center shrink-0">
                                          <UploadIcon className="w-4 h-4 text-[var(--user-accent)]" />
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-fg truncate" title={firstName}>
                                          {firstName || "Uploaded file"}
                                        </p>
                                        <p className="text-xs text-fg-muted font-semibold truncate">
                                          {first?.mimeType || first?.type || ""}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        disabled={!url}
                                        onClick={() => openInNewTab(url)}
                                        className="px-3 py-1.5 rounded-lg border border-line bg-surface text-fg font-bold text-xs disabled:opacity-60"
                                      >
                                        View
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const ok = await handleRemove(f, fieldName);
                                          if (ok) {
                                            form.setFieldValue(fieldName, (form.getFieldValue(fieldName) || []).filter((x) => x.uid !== f.uid));
                                          }
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] text-danger font-bold text-xs"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* View / Delete (single-file rows) */}
                        {!isOther && (
                          <div className="flex gap-2 sm:justify-end shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              disabled={!firstUrl}
                              onClick={() => openInNewTab(firstUrl)}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-line bg-surface text-fg font-extrabold text-xs disabled:opacity-60"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              disabled={!hasFile}
                              onClick={async () => {
                                if (!first) return;
                                const ok = await handleRemove(first, fieldName);
                                if (ok) clearField(fieldName);
                              }}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] text-danger font-extrabold text-xs disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              </Form.Item>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default DocumentsStep;