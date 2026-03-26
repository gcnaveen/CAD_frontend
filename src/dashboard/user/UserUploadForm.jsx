// src/dashboard/user/UserUploadForm.jsx
// Full redesign — 4-step wizard. All original logic preserved.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form, message } from "antd";
import { createSketchUpload }              from "../../services/surveyor/sketchUploadService.js";
import { createDraft, getDraftById, updateDraft } from "../../services/draftApi.js";


import DrawingStep from "./form/steps/Drawingstep.jsx";
import DocumentsStep from "./form/steps/Documentsstep.jsx";
import ReviewStep from "./form/steps/ReviewStep.jsx";
import LocationStep from "./form/steps/LocationStep.jsx";
import StepIndicator from "./form/Stepindicator.jsx";


/* ── helpers (unchanged from original) ── */
const DOCUMENT_FIELDS      = ["moolaTippani", "hissaTippani", "atlas", "rrPakkabook", "kharabu"];
const MAIN_DOCUMENT_FIELDS = ["moolaTippani", "atlas", "rrPakkabook"];
const DOCUMENT_TYPE_KEYS   = ["is_originaltippani","is_hissatippani","is_atlas","is_rrpakkabook","is_akarabandu","is_kharabuttar","is_mulapatra"];

function toUrl(doc) { if (!doc) return null; if (typeof doc === "string") return doc; return doc.url || doc.fileUrl || doc.fileURL || null; }
function toMeta(doc) { if (!doc) return null; if (typeof doc === "string") return { fileUrl: doc, fileName: "file" }; const url = toUrl(doc); if (!url) return null; return { fileUrl: url, fileName: doc.fileName || doc.name || "file", mimeType: doc.mimeType || doc.type, size: doc.size }; }
function toFileListItem(meta, uid = "draft-file") {
  if (!meta?.fileUrl) return null;
  const isImage = typeof meta.mimeType === "string" && meta.mimeType.startsWith("image/");
  return {
    uid,
    name: meta.fileName || "file",
    url: meta.fileUrl,
    fileUrl: meta.fileUrl,
    // AntD `picture-card` uses `thumbUrl` for image preview when available.
    thumbUrl: isImage ? meta.fileUrl : undefined,
    type: meta.mimeType,
    status: "done",
    percent: 100,
    fileName: meta.fileName,
    mimeType: meta.mimeType,
    size: meta.size,
  };
}

/* ── Icons ── */
const SaveIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);
const ArrowLeft = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ArrowRight = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

/* ── Step field validators ── */
const STEP_FIELDS = [
  ["surveyType", "district", "taluka", "hobli", "surveyNo"], // step 0 (village is optional)
  [],                                                                     // step 1 - no required
  [],                                                                     // step 2 - optional
  [],                                                                     // step 3 - review
];

const UserUploadForm = ({
  onSubmit,
  onCancel,
  submitLabel = "Submit Order ✓",
  loading: externalLoading = false,
}) => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [form]         = Form.useForm();

  const [step,          setStep]          = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [draftSaving,   setDraftSaving]   = useState(false);
  const [draftLoading,  setDraftLoading]  = useState(false);
  const [draftId,       setDraftId]       = useState(null);
  const [prefillEntities, setPrefill]     = useState(null);
  const [locationLabels, setLocationLabels] = useState({});
  const [audioData,     setAudioData]     = useState(null);
  const [uploadedDocs,  setUploadedDocs]  = useState({});
  const [uploadedOther, setUploadedOther] = useState({});

  const draftIdFromUrl = useMemo(() => {
    const raw = searchParams.get("draftId");
    return raw && String(raw).trim() ? String(raw).trim() : null;
  }, [searchParams]);

  /* ── Draft handlers ── */
  const handleDocumentUpload  = (field, data) => setUploadedDocs((p) => ({ ...p, [field]: data }));
  const handleDocumentRemove  = (field)        => setUploadedDocs((p) => { const n = { ...p }; delete n[field]; return n; });
  const handleOtherUpload     = (uid, data)    => setUploadedOther((p) => ({ ...p, [uid]: data }));
  const handleOtherRemove     = (uid)          => setUploadedOther((p) => { const n = { ...p }; delete n[uid]; return n; });
  const handleClearUploads    = () => {
    setUploadedDocs({});
    setUploadedOther({});
  };

  /* ── Navigation ── */
  const goNext = async () => {
    try {
      const fields = STEP_FIELDS[step];
      if (fields.length > 0) await form.validateFields(fields);
      setStep((s) => Math.min(s + 1, 3));
    } catch { /* validation failed, ant shows inline errors */ }
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  /* ── Build payload (same logic as original) ── */
  const processOtherDocuments = (payload) => {
    const list = form.getFieldValue("other_documents");
    if (!list || !Array.isArray(list) || list.length === 0) return;
    const processed = [];
    for (const file of list) {
      const doc = file?.uid ? uploadedOther[file.uid] : null;
      if (!doc?.fileUrl?.startsWith("http")) throw new Error("OTHER_DOCS_PENDING");
      processed.push({ url: doc.fileUrl, fileName: doc.fileName || "file", mimeType: doc.mimeType || "application/octet-stream", size: doc.size || 0 });
    }
    if (processed.length > 0) payload.other_documents = processed;
  };

  const resetFormState = () => {
    form.resetFields();
    setDraftId(null);
    setAudioData(null);
    setUploadedDocs({});
    setUploadedOther({});
    setLocationLabels({});
    setStep(0);
  };

  const handleCancel = () => {
    resetFormState();
    onCancel?.();
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit(form.getFieldsValue(true), form);
      return;
    }

    setLoading(true);
    try {
      const values = form.getFieldsValue(true);

      if (!values.village) {
        message.error("Please select village first");
        return;
      }

      // STRICT mutual exclusivity + validation (single vs normal).
      // Only treat uploads as present when we have an uploaded `fileUrl`.
      const singleMeta =
        uploadedDocs.singleUpload?.fileUrl ? uploadedDocs.singleUpload : toMeta(values.singleUpload?.[0]);
      const hasSingleUpload = Boolean(singleMeta?.fileUrl?.startsWith("http"));

      const hasAnyNormalUpload = DOCUMENT_FIELDS.some((fieldName) => {
        const fileList = form.getFieldValue(fieldName) || values[fieldName];
        const first = Array.isArray(fileList) ? fileList[0] : null;
        const meta = uploadedDocs[fieldName] || toMeta(first);
        return Boolean(meta?.fileUrl?.startsWith("http"));
      });
      const hasAnyMainNormal = MAIN_DOCUMENT_FIELDS.some((fieldName) => {
        const fileList = form.getFieldValue(fieldName) || values[fieldName];
        const first = Array.isArray(fileList) ? fileList[0] : null;
        const meta = uploadedDocs[fieldName] || toMeta(first);
        return Boolean(meta?.fileUrl?.startsWith("http"));
      });

      const uploadMode = values.uploadMode ?? "normal";

      if (uploadMode === "single") {
        if (!hasSingleUpload) { message.error("Single mode: please upload exactly one document"); return; }
        const docTypes = Array.isArray(values.documentTypes) ? values.documentTypes : [];
        if (docTypes.length === 0) { message.error("Single mode: select at least one document type"); return; }
        if (hasAnyNormalUpload) { message.error("Single mode: remove normal uploads (switching mode will clear them)"); return; }
      } else {
        if (hasSingleUpload) { message.error("Normal mode: remove single upload (switching mode will clear it)"); return; }
        if (!hasAnyMainNormal) { message.error("Normal mode: upload at least one main document (Moola Tippani, Atlas, or RR Pakkabook)"); return; }
      }
      const payload = {
        surveyType: values.surveyType,
        district: values.district,
        taluka: values.taluka,
        hobli: values.hobli,
        uploadMode,
        surveyNo: values.surveyNo,
      };
      if (values.village) payload.village = values.village;
      if (values.others)               payload.others = values.others;
      if (values.googleSuperimpose)    payload.googleSuperimpose = true;
      if (audioData?.fileUrl)          payload.audio = { url: audioData.fileUrl, fileUrl: audioData.fileUrl, fileName: audioData.fileName || "audio", mimeType: audioData.mimeType || "audio/mpeg", size: audioData.size || 0 };

      if (uploadMode === "single") {
        const singleDoc = uploadedDocs.singleUpload || toMeta(values.singleUpload?.[0]);
        if (!singleDoc?.fileUrl?.startsWith("http")) { message.error("Please upload a document first"); return; }
        const docTypes = values.documentTypes ?? [];
        if (!docTypes.length) { message.error("Select at least one document type"); return; }
        payload.singleUpload = { url: singleDoc.fileUrl, fileName: singleDoc.fileName || "file", mimeType: singleDoc.mimeType || "application/octet-stream", size: singleDoc.size || 0 };
        DOCUMENT_TYPE_KEYS.forEach((k) => { payload[k] = docTypes.includes(k); });
      } else {
        for (const fieldName of DOCUMENT_FIELDS) {
          const fileList = form.getFieldValue(fieldName) || values[fieldName];
          const hasFile  = Array.isArray(fileList) && fileList.length > 0;
          if (!hasFile) continue;
          const doc = uploadedDocs[fieldName] || toMeta((fileList || [])[0]);
          if (!doc?.fileUrl?.startsWith("http")) { message.error(`"${fieldName}" is still uploading, please wait`); return; }
          payload[fieldName] = { url: doc.fileUrl, fileName: doc.fileName || "file", mimeType: doc.mimeType || "application/octet-stream", size: doc.size || 0 };
        }
        const hasMain = MAIN_DOCUMENT_FIELDS.some((f) => payload[f]);
        if (!hasMain) { message.error("At least one main document required (Moola Tippani, Atlas, or RR Pakkabook)"); return; }
        try { processOtherDocuments(payload); } catch { message.error("Other documents still uploading"); return; }

        // Backend requires `singleUpload` even in normal mode.
        // Derive it from the first available MAIN document (keeps payload structure unchanged).
        const pick =
          payload.moolaTippani ||
          payload.atlas ||
          payload.rrPakkabook ||
          null;
        if (pick?.url) {
          payload.singleUpload = { ...pick };
        } else {
          message.error("Normal mode: unable to derive singleUpload (upload a main document)");
          return;
        }
      }

      // Defensive payload cleanup (no mixed-mode payloads, ever).
      if (uploadMode === "single") {
        DOCUMENT_FIELDS.forEach((k) => { delete payload[k]; });
        delete payload.other_documents;
      } else {
        delete payload.documentTypes;
        DOCUMENT_TYPE_KEYS.forEach((k) => { delete payload[k]; });
      }

      // Debugging aid: confirm we don't send `uploadMode: "single"` without `singleUpload`.
      // Check browser console when you hit the backend error.
      console.debug("[UserUploadForm] submit payload", {
        uploadMode: payload.uploadMode,
        hasSingleUpload: Boolean(payload.singleUpload?.url),
        hasAnyMainDoc: DOCUMENT_FIELDS.some((f) => Boolean(payload[f]?.url)),
      });

      const result = await createSketchUpload(payload);
      if (result.success) {
        message.success("Request submitted successfully!");
        resetFormState();
        navigate("/dashboard/user");
      } else { message.error(result.message || "Failed to submit"); }
    } catch (e) { message.error(e.message || "Submission failed"); }
    finally { setLoading(false); }
  };

  /* ── Save Draft ── */
  const buildDraftPayload = (values) => {
    const p = {};
    const si = (k, v) => { if (v !== undefined && v !== null && v !== "") p[k] = v; };
    si("surveyType", values.surveyType); si("district", values.district); si("taluka", values.taluka);
    si("hobli", values.hobli); si("village", values.village); si("surveyNo", values.surveyNo);
    // Same logic as submit: only treat uploads as present when we have `fileUrl` ready.
    const singleMeta =
      uploadedDocs.singleUpload?.fileUrl ? uploadedDocs.singleUpload : toMeta(values.singleUpload?.[0]);
    const hasSingleUpload = Boolean(singleMeta?.fileUrl?.startsWith("http"));

    const hasNormalUpload = DOCUMENT_FIELDS.some((fieldName) => {
      const fileList = form.getFieldValue(fieldName) || values[fieldName];
      const first = Array.isArray(fileList) ? fileList[0] : null;
      const meta = uploadedDocs[fieldName] || toMeta(first);
      return Boolean(meta?.fileUrl?.startsWith("http"));
    });
    // Draft must obey the same mutual-exclusivity rules as submit.
    const resolvedMode = values.uploadMode ?? "normal";
    si("others", values.others); si("uploadMode", resolvedMode);
    si("googleSuperimpose", values.googleSuperimpose);
    if (audioData?.fileUrl) p.audio = { url: audioData.fileUrl, fileUrl: audioData.fileUrl, fileName: audioData.fileName || "audio", mimeType: audioData.mimeType || "audio/mpeg", size: audioData.size || 0 };
    const mode = resolvedMode;
    if (mode === "single") {
      const m = uploadedDocs.singleUpload || toMeta(values.singleUpload?.[0]);
      if (m?.fileUrl) p.singleUpload = { url: m.fileUrl, fileName: m.fileName || "file", mimeType: m.mimeType || "application/octet-stream", size: m.size || 0 };
      const types = Array.isArray(values.documentTypes) ? values.documentTypes : [];
      if (types.length > 0) DOCUMENT_TYPE_KEYS.forEach((k) => { p[k] = types.includes(k); });
    } else {
      for (const f of DOCUMENT_FIELDS) {
        const m = uploadedDocs[f] || toMeta((values[f] || [])[0]);
        if (m?.fileUrl) p[f] = { url: m.fileUrl, fileName: m.fileName || "file", mimeType: m.mimeType || "application/octet-stream", size: m.size || 0 };
      }

      // Backend requires `singleUpload` even in normal mode; derive it from main docs.
      const pick = p.moolaTippani || p.atlas || p.rrPakkabook || null;
      if (pick?.url) p.singleUpload = { ...pick };
    }
    // `other_documents` is part of normal mode only (prevents mixed-mode drafts).
    if (mode !== "single") {
      const otherList = values.other_documents;
      if (Array.isArray(otherList) && otherList.length > 0) {
        const processed = [];
        for (const file of otherList) {
          const m = (file?.uid && uploadedOther[file.uid]) || toMeta(file);
          if (m?.fileUrl?.startsWith("http")) processed.push({ url: m.fileUrl, fileName: m.fileName || "file", mimeType: m.mimeType || "application/octet-stream", size: m.size || 0 });
        }
        if (processed.length > 0) p.other_documents = processed;
      }
    }

    // Defensive payload cleanup (drafts must be mutually exclusive too).
    if (mode === "single") {
      DOCUMENT_FIELDS.forEach((k) => { delete p[k]; });
      delete p.other_documents;
    } else {
      delete p.documentTypes;
      DOCUMENT_TYPE_KEYS.forEach((k) => { delete p[k]; });
    }
    return p;
  };

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    try {
      const payload = buildDraftPayload(form.getFieldsValue(true));

      console.debug("[UserUploadForm] draft payload", {
        uploadMode: payload.uploadMode,
        hasSingleUpload: Boolean(payload.singleUpload?.url),
        hasAnyMainDoc: DOCUMENT_FIELDS.some((f) => Boolean(payload[f]?.url)),
      });

      if (!draftId) { const c = await createDraft(payload); const id = c?._id ?? c?.id; if (id) setDraftId(id); }
      else { await updateDraft(draftId, payload); }
      message.success(draftId ? "Draft updated" : "Draft saved");
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) message.error("No permission");
      else if (status === 404) message.error("Draft not found");
      else message.error(e.message || "Failed to save draft");
    }
    finally { setDraftSaving(false); }
  };

  /* ── Load Draft from URL ── */
  useEffect(() => {
    if (!draftIdFromUrl) return;
    setDraftId(draftIdFromUrl);
    setDraftLoading(true);
    (async () => {
      try {
        const draft = await getDraftById(draftIdFromUrl);
        if (!draft) { message.error("Draft not found"); return; }
        setPrefill({ district: draft.district ?? null, taluka: draft.taluka ?? null, hobli: draft.hobli ?? null, village: draft.village ?? null });
        setLocationLabels({
          district: draft.district?.name ?? draft.district?.label ?? null,
          taluka: draft.taluka?.name ?? draft.taluka?.label ?? null,
          hobli: draft.hobli?.name ?? draft.hobli?.label ?? null,
          village: draft.village?.name ?? draft.village?.label ?? null,
        });
        // Some draft responses may not include `uploadMode`.
        // If `singleUpload` exists, infer `single` to prefill the correct uploader.
        const uploadMode = draft.uploadMode ?? (draft?.singleUpload?.url ? "single" : "normal");

        // Hard reset upload caches before hydrating (prevents mixed-mode ghosts).
        setUploadedDocs({});
        setUploadedOther({});
        form.setFieldsValue({
          singleUpload: [],
          documentTypes: [],
          other_documents: [],
          moolaTippani: [],
          hissaTippani: [],
          atlas: [],
          rrPakkabook: [],
          kharabu: [],
        });
        const nv = {
          uploadMode, surveyType: draft.surveyType,
          district: draft.district?._id ?? draft.district?.id ?? draft.district,
          taluka:   draft.taluka?._id   ?? draft.taluka?.id   ?? draft.taluka,
          hobli:    draft.hobli?._id    ?? draft.hobli?.id     ?? draft.hobli,
          village:  draft.village?._id  ?? draft.village?.id   ?? draft.village,
          surveyNo: draft.surveyNo, others: draft.others,
          googleSuperimpose: draft.googleSuperimpose ?? false,
        };
        if (uploadMode === "single") {
          const m = toMeta(draft.singleUpload); const item = toFileListItem(m, "draft-singleUpload");
          if (item) { nv.singleUpload = [item]; setUploadedDocs({ singleUpload: m }); }
          const types = DOCUMENT_TYPE_KEYS.filter((k) => draft[k] === true);
          if (types.length) nv.documentTypes = types;
        } else {
          const next = {};
          for (const f of DOCUMENT_FIELDS) { const src = draft?.documents?.[f] ?? draft?.[f]; const m = toMeta(src); const item = toFileListItem(m, `draft-${f}`); if (item) { nv[f] = [item]; next[f] = m; } }
          if (Object.keys(next).length) setUploadedDocs(next);
        }
        if (draft.audio) { const m = toMeta(draft.audio); if (m?.fileUrl) { const av = { fileUrl: m.fileUrl, key: draft.audio?.key, fileName: m.fileName, mimeType: m.mimeType, size: m.size }; setAudioData(av); nv.audio = av; } }
        const otherDocs = Array.isArray(draft.other_documents) ? draft.other_documents : [];
        if (otherDocs.length) { const list = []; const om = {}; otherDocs.forEach((d, i) => { const m = toMeta(d); const uid = `draft-other-${i}`; const item = toFileListItem(m, uid); if (item) { list.push(item); om[uid] = m; } }); if (list.length) { nv.other_documents = list; setUploadedOther((p) => ({ ...p, ...om })); } }
        form.setFieldsValue(nv);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 403) message.error("No permission");
        else if (status === 404) message.error("Draft not found");
        else message.error(e.message || "Failed to load draft");
      }
      finally { setDraftLoading(false); }
    })();
  }, [draftIdFromUrl, form]);

  const STEP_CONTENT = [
    <LocationStep  key={0} form={form} prefillEntities={prefillEntities} onLocationLabelsChange={setLocationLabels} />,
    <DrawingStep   key={1} form={form} onAudioChange={setAudioData} audioData={audioData} />,
    <DocumentsStep
      key={2}
      form={form}
      onDocumentUpload={handleDocumentUpload}
      onDocumentRemove={handleDocumentRemove}
      onOtherDocumentUpload={handleOtherUpload}
      onOtherDocumentRemove={handleOtherRemove}
      onClearUploads={handleClearUploads}
    />,
    <ReviewStep    key={3} form={form} uploadedDocs={uploadedDocs} audioData={audioData} locationLabels={locationLabels} />,
  ];

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-[var(--user-accent-soft)] via-[color-mix(in_srgb,var(--brand-gold)_10%,var(--bg-secondary))] to-[var(--bg-primary)] upload-form-wrap font-nunito">
        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-30 bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] backdrop-blur border-b border-line shadow-sm">
          <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              {/* Back */}
              <button
                type="button"
                onClick={() => step === 0 ? navigate(-1) : goPrev()}
                className="flex items-center gap-1.5 text-sm font-bold text-fg-muted hover:text-fg transition-colors"
              >
                <ArrowLeft />
                {step === 0 ? "Back" : "Previous"}
              </button>

              {/* Title */}
              <div className="text-center flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[var(--user-accent)] uppercase tracking-widest leading-none">ಹೊಸ CAD ವಿನಂತಿ</p>
                <p className="text-sm font-extrabold text-fg truncate">New Request</p>
              </div>

              {/* Save Draft */}
                <button
                type="button"
                onClick={handleSaveDraft}
                  disabled={draftSaving || draftLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-surface hover:bg-surface-2 text-fg font-bold text-xs transition-colors disabled:opacity-60"
              >
                <SaveIcon />
                {draftSaving ? "Saving…" : "Save Draft"}
              </button>
            </div>

            {/* Step indicator */}
            <StepIndicator current={step} />
          </div>
        </div>

        {/* ── Draft loading banner ── */}
        {draftLoading && (
          <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--cyan-accent)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--cyan-accent)_10%,var(--bg-secondary))] px-4 py-3 text-sm font-bold text-[var(--cyan-accent)] flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[var(--cyan-accent)] border-t-transparent animate-spin" />
              Loading draft…
            </div>
          </div>
        )}

        {/* ── Step content ── */}
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ uploadMode: "normal", googleSuperimpose: false }}
            className="space-y-0"
          >
            <Form.Item name="uploadMode" noStyle>
              <input type="hidden" />
            </Form.Item>
            <div className="theme-animate-surface rounded-2xl border border-line bg-surface shadow-sm p-5 sm:p-6 mb-6">
              {STEP_CONTENT[step]}
            </div>

            {/* ── Navigation buttons ── */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-line bg-surface text-fg font-extrabold text-sm hover:border-fg-muted/40 transition-colors"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[var(--user-accent)] hover:bg-[var(--user-accent-hover)] active:opacity-95 text-white font-extrabold text-sm shadow-[0_6px_20px_color-mix(in_srgb,var(--user-accent)_28%,transparent)] transition-colors"
                >
                  Continue <ArrowRight />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || externalLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[var(--user-accent)] hover:bg-[var(--user-accent-hover)] active:opacity-95 text-white font-extrabold text-sm shadow-[0_6px_20px_color-mix(in_srgb,var(--user-accent)_28%,transparent)] transition-colors disabled:opacity-60"
                >
                  {loading || externalLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Submitting…</>
                  ) : (
                    <>{submitLabel}</>
                  )}
                </button>
              )}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-2.5 rounded-xl border border-line bg-surface text-fg-muted font-bold text-sm hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default UserUploadForm;