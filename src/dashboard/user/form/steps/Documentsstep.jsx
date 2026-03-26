// src/dashboard/user/form/steps/DocumentsStep.jsx
import React, { useState } from "react";
import { Form, Upload, Checkbox, message, Modal } from "antd";
import { Upload as UploadIcon } from "lucide-react";
import { getImagePresignedUrl, getAudioPresignedUrl, deleteUploadedFile } from "../../../../services/upload/upload.api.js";
import { AUDIO_MAX_SIZE_BYTES } from "../../../../services/upload/upload.constants.js";

const UPLOAD_ACCEPT      = ".pdf,.jpg,.jpeg,.png,.webp";
const MAX_FILE_SIZE      = 10 * 1024 * 1024;
const OTHER_DOCS_MAX     = 10;

const CATEGORIES = [
  { key: "moolaTippani", en: "Moola Tippani", kn: "ಮೂಲ ಟಿಪ್ಪಣಿ" },
  { key: "hissaTippani", en: "Hissa Tippani", kn: "ಹಿಸ್ಸ ಟಿಪ್ಪಣಿ" },
  { key: "atlas",        en: "Atlas",         kn: "ಅಟ್ಲಾಸ್"      },
  { key: "rrPakkabook",  en: "RR / Pakka Book", kn: "RR ಪಕ್ಕಬುಕ್" },
  { key: "kharabu",      en: "Kharabu",       kn: "ಖರಾಬು"         },
  { key: "other_documents", en: "Others",     kn: "ಇತರೆ"          },
];

const DOCUMENT_TYPE_CHECKBOXES = [
  { name: "is_originaltippani", en: "Moola Tippani",  kn: "ಮೂಲ ಟಿಪ್ಪಣಿ" },
  { name: "is_hissatippani",    en: "Hissa Tippani",  kn: "ಹಿಸ್ಸ ಟಿಪ್ಪಣಿ" },
  { name: "is_atlas",           en: "Atlas",          kn: "ಅಟ್ಲಾಸ್"      },
  { name: "is_rrpakkabook",     en: "RR Pakkabook",   kn: "RR ಪಕ್ಕಬುಕ್"  },
  { name: "is_akarabandu",      en: "Akarabandu",     kn: "ಆಕಾರಬಂದು"     },
  { name: "is_kharabuttar",     en: "Kharab Utthar",  kn: "ಖರಾಬ್ ಉತ್ತರ"  },
  { name: "is_mulapatra",       en: "Moola Patra",    kn: "ಮೂಲ ಪತ್ರ"     },
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
  const [activeCategory, setActiveCategory] = useState("moolaTippani");
  const [uploading,      setUploading]       = useState({});
  const uploadMode = Form.useWatch("uploadMode", form) ?? "normal";

  const NORMAL_FIELDS = CATEGORIES.map((c) => c.key); // includes other_documents
  const SINGLE_FIELDS = ["singleUpload", "documentTypes"];

  const hasAnyFiles = (fieldName) => {
    const list = form.getFieldValue(fieldName);
    return Array.isArray(list) && list.length > 0;
  };

  const hasAnyUploads = () => {
    if (hasAnyFiles("singleUpload")) return true;
    if (Array.isArray(form.getFieldValue("documentTypes")) && form.getFieldValue("documentTypes")?.length) return true;
    return NORMAL_FIELDS.some((f) => hasAnyFiles(f));
  };

  const clearForMode = (nextMode) => {
    // HARD mutual exclusivity: clear + ignore the opposite mode entirely.
    if (nextMode === "single") {
      const otherBefore = form.getFieldValue("other_documents") || [];
      form.resetFields([...NORMAL_FIELDS, ...SINGLE_FIELDS]);
      NORMAL_FIELDS.forEach((field) => {
        form.setFieldValue(field, []);
        if (field === "other_documents") {
          // parent needs to forget other docs meta too
          otherBefore.forEach((f) => onOtherDocumentRemove?.(f?.uid));
        } else {
          onDocumentRemove?.(field);
        }
      });
      form.setFieldValue("singleUpload", []);
      form.setFieldValue("documentTypes", []);
      onDocumentRemove?.("singleUpload");
    } else {
      form.resetFields([...SINGLE_FIELDS]);
      form.setFieldValue("singleUpload", []);
      form.setFieldValue("documentTypes", []);
      onDocumentRemove?.("singleUpload");
    }

    onClearUploads?.(nextMode);
    setActiveCategory("moolaTippani");
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
      return p && (p.fileUrl || p.url) ? { ...f, fileUrl: p.fileUrl || p.url, url: p.url || p.fileUrl, key: p.key, fileName: p.fileName ?? f.name, mimeType: p.mimeType ?? f.type } : f;
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
      const res = await fetch(uploadUrl, { method: "PUT", body: actual, headers: { "Content-Type": actual.type } });
      if (!res.ok) throw new Error("Upload to storage failed");
      const uid  = file.uid || `upload-${Date.now()}`;
      const meta = { fileUrl, fileName: file.name || actual.name, mimeType: file.type || actual.type, size: file.size || actual.size };
      const cur  = form.getFieldValue(fieldName) || [];
      form.setFieldValue(fieldName, [
        ...cur.filter((f) => f.uid !== file.uid && f.name !== file.name),
        { uid, name: file.name || actual.name, url: fileUrl, fileUrl, key, fileName: meta.fileName, mimeType: meta.mimeType, size: meta.size, status: "done", percent: 100, originFileObj: actual },
      ]);
      if (fieldName === "other_documents") onOtherDocumentUpload?.(uid, meta);
      else onDocumentUpload?.(fieldName, meta);
      message.success("Uploaded successfully");
    } catch (e) { message.error(e.message || "Upload failed"); }
    finally { setUploading((p) => ({ ...p, [fieldName]: false })); }
    return false;
  };

  const handleRemove = async (file, fieldName) => {
    const list     = form.getFieldValue(fieldName) || [];
    const existing = list.find((f) => f.uid === file.uid || f.name === file.name);
    const target   = existing || file;
    if (fieldName === "other_documents") onOtherDocumentRemove?.(file.uid || target?.uid);
    else onDocumentRemove?.(fieldName);
    if (target?.fileUrl || target?.key) {
      try { await deleteUploadedFile(target.fileUrl ? { fileUrl: target.fileUrl } : { key: target.key }); }
      catch { /* silent */ }
    }
    return true;
  };

  /* Which field drives the active category */
  const activeFieldName = activeCategory;
  const isOther         = activeCategory === "other_documents";
  const maxCount        = isOther ? OTHER_DOCS_MAX : 1;
  const uploadAccept    = isOther ? `${UPLOAD_ACCEPT},.mp3,.wav,.m4a,.aac,.ogg` : UPLOAD_ACCEPT;

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
              className={`flex-1 py-2 rounded-xl border-2 text-sm font-extrabold transition-all ${
                active
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
              onRemove={(f)    => handleRemove(f, "singleUpload")}
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
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-line bg-surface ${
                        uploadMode !== "single"
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
        <div>
          {/* Category tabs */}
          <p className="text-sm font-extrabold text-fg mb-2">Document Category</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;
              const fileList = form.getFieldValue(cat.key);
              const hasFile = Array.isArray(fileList) && fileList.some((f) => f.status === "done");
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`relative px-3.5 py-2 rounded-full border text-xs sm:text-sm font-extrabold transition-all ${
                    active
                      ? "border-[var(--user-accent)] bg-[var(--user-accent)] text-white shadow-[0_3px_10px_color-mix(in_srgb,var(--user-accent)_25%,transparent)]"
                      : "border-line bg-surface text-fg-muted hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))]"
                  }`}
                >
                  {cat.en}
                  {hasFile && !active && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-success border-2 border-surface" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Upload area for selected category */}
          <Form.Item
            key={activeFieldName}
            name={activeFieldName}
            valuePropName="fileList"
            getValueFromEvent={getMergeValue(activeFieldName)}
          >
            <Upload
              name={activeFieldName}
              listType={isOther ? "text" : "picture-card"}
              maxCount={maxCount}
              accept={uploadAccept}
              disabled={uploadMode !== "normal" || Boolean(uploading[activeFieldName])}
              beforeUpload={(f) => uploadMode === "normal" ? handleUpload(f, activeFieldName) : false}
              onRemove={(f)    => handleRemove(f, activeFieldName)}
              className={`upload-area-full ${uploadMode !== "normal" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* Show placeholder only when no file yet or multi */}
              {(() => {
                const list = form.getFieldValue(activeFieldName);
                const count = Array.isArray(list) ? list.length : 0;
                if (!isOther && count >= 1) return null;
                return (
                  <div className="flex flex-col items-center justify-center gap-2 w-full py-8 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--user-accent-soft)] border-2 border-dashed border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] flex items-center justify-center">
                      <UploadIcon className="w-6 h-6 text-[var(--user-accent)]" />
                    </div>
                    <p className="text-sm font-extrabold text-fg">Tap to upload</p>
                    <p className="text-xs text-fg-muted font-semibold">PDF, JPG, PNG • Max 10MB</p>
                  </div>
                );
              })()}
            </Upload>
          </Form.Item>
        </div>
      )}

    </div>
  );
};

export default DocumentsStep;