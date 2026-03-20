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
function toFileListItem(meta, uid = "draft-file") { if (!meta?.fileUrl) return null; return { uid, name: meta.fileName || "file", url: meta.fileUrl, fileUrl: meta.fileUrl, status: "done", percent: 100, fileName: meta.fileName, mimeType: meta.mimeType, size: meta.size }; }

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

const UserUploadForm = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [form]         = Form.useForm();

  const [step,          setStep]          = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [draftSaving,   setDraftSaving]   = useState(false);
  const [draftLoading,  setDraftLoading]  = useState(false);
  const [draftId,       setDraftId]       = useState(null);
  const [prefillEntities, setPrefill]     = useState(null);
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

  /* ── Submit ── */
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue(true);

      const uploadMode = values.uploadMode ?? "normal";
      const payload = {
        surveyType: values.surveyType,
        district: values.district,
        taluka: values.taluka,
        hobli: values.hobli,
        surveyNo: values.surveyNo,
      };
      if (values.village) payload.village = values.village;
      if (values.others)               payload.others = values.others;
      if (values.googleSuperimpose)    payload.googleSuperimpose = true;
      if (audioData?.fileUrl)          payload.audio = { url: audioData.fileUrl, fileUrl: audioData.fileUrl, fileName: audioData.fileName || "audio", mimeType: audioData.mimeType || "audio/mpeg", size: audioData.size || 0 };

      if (uploadMode === "single") {
        const singleDoc = uploadedDocs.singleUpload;
        if (!singleDoc?.fileUrl?.startsWith("http")) { message.error("Please upload a document first"); return; }
        const docTypes = values.documentTypes ?? [];
        if (!docTypes.length) { message.error("Select at least one document type"); return; }
        payload.singleUpload = { url: singleDoc.fileUrl, fileName: singleDoc.fileName || "file", mimeType: singleDoc.mimeType || "application/octet-stream", size: singleDoc.size || 0 };
        DOCUMENT_TYPE_KEYS.forEach((k) => { payload[k] = docTypes.includes(k); });
        try { processOtherDocuments(payload); } catch { message.error("Other documents still uploading"); return; }
      } else {
        for (const fieldName of DOCUMENT_FIELDS) {
          const fileList = form.getFieldValue(fieldName) || values[fieldName];
          const hasFile  = Array.isArray(fileList) && fileList.length > 0;
          if (!hasFile) continue;
          const doc = uploadedDocs[fieldName];
          if (!doc?.fileUrl?.startsWith("http")) { message.error(`"${fieldName}" is still uploading, please wait`); return; }
          payload[fieldName] = { url: doc.fileUrl, fileName: doc.fileName || "file", mimeType: doc.mimeType || "application/octet-stream", size: doc.size || 0 };
        }
        const hasMain = MAIN_DOCUMENT_FIELDS.some((f) => payload[f]);
        if (!hasMain) { message.error("At least one main document required (Moola Tippani, Atlas, or RR Pakkabook)"); return; }
        try { processOtherDocuments(payload); } catch { message.error("Other documents still uploading"); return; }
      }

      const result = await createSketchUpload(payload);
      if (result.success) {
        message.success("Request submitted successfully!");
        form.resetFields();
        setDraftId(null); setAudioData(null); setUploadedDocs({}); setUploadedOther({});
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
    si("others", values.others); si("uploadMode", values.uploadMode ?? "normal");
    si("googleSuperimpose", values.googleSuperimpose);
    if (audioData?.fileUrl) p.audio = { url: audioData.fileUrl, fileUrl: audioData.fileUrl, fileName: audioData.fileName || "audio", mimeType: audioData.mimeType || "audio/mpeg", size: audioData.size || 0 };
    const mode = values.uploadMode ?? "normal";
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
    }
    const otherList = values.other_documents;
    if (Array.isArray(otherList) && otherList.length > 0) {
      const processed = [];
      for (const file of otherList) {
        const m = (file?.uid && uploadedOther[file.uid]) || toMeta(file);
        if (m?.fileUrl?.startsWith("http")) processed.push({ url: m.fileUrl, fileName: m.fileName || "file", mimeType: m.mimeType || "application/octet-stream", size: m.size || 0 });
      }
      if (processed.length > 0) p.other_documents = processed;
    }
    return p;
  };

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    try {
      const payload = buildDraftPayload(form.getFieldsValue(true));
      if (!draftId) { const c = await createDraft(payload); const id = c?._id ?? c?.id; if (id) setDraftId(id); }
      else { await updateDraft(draftId, payload); }
      message.success(draftId ? "Draft updated" : "Draft saved");
    } catch (e) { message.error(e.message || "Failed to save draft"); }
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
        const uploadMode = draft.uploadMode ?? "normal";
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
          if (item) { nv.singleUpload = [item]; setUploadedDocs((p) => ({ ...p, singleUpload: m })); }
          const types = DOCUMENT_TYPE_KEYS.filter((k) => draft[k] === true);
          if (types.length) nv.documentTypes = types;
        } else {
          const next = {};
          for (const f of DOCUMENT_FIELDS) { const src = draft?.documents?.[f] ?? draft?.[f]; const m = toMeta(src); const item = toFileListItem(m, `draft-${f}`); if (item) { nv[f] = [item]; next[f] = m; } }
          if (Object.keys(next).length) setUploadedDocs((p) => ({ ...p, ...next }));
        }
        if (draft.audio) { const m = toMeta(draft.audio); if (m?.fileUrl) { const av = { fileUrl: m.fileUrl, key: draft.audio?.key, fileName: m.fileName, mimeType: m.mimeType, size: m.size }; setAudioData(av); nv.audio = av; } }
        const otherDocs = Array.isArray(draft.other_documents) ? draft.other_documents : [];
        if (otherDocs.length) { const list = []; const om = {}; otherDocs.forEach((d, i) => { const m = toMeta(d); const uid = `draft-other-${i}`; const item = toFileListItem(m, uid); if (item) { list.push(item); om[uid] = m; } }); if (list.length) { nv.other_documents = list; setUploadedOther((p) => ({ ...p, ...om })); } }
        form.setFieldsValue(nv);
      } catch (e) { message.error(e.message || "Failed to load draft"); }
      finally { setDraftLoading(false); }
    })();
  }, [draftIdFromUrl]);

  const STEP_CONTENT = [
    <LocationStep  key={0} form={form} prefillEntities={prefillEntities} />,
    <DrawingStep   key={1} form={form} onAudioChange={setAudioData} audioData={audioData} />,
    <DocumentsStep key={2} form={form} onDocumentUpload={handleDocumentUpload} onDocumentRemove={handleDocumentRemove} onOtherDocumentUpload={handleOtherUpload} onOtherDocumentRemove={handleOtherRemove} />,
    <ReviewStep    key={3} form={form} uploadedDocs={uploadedDocs} audioData={audioData} />,
  ];

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50/60 to-white upload-form-wrap font-nunito">
        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
          <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              {/* Back */}
              <button
                type="button"
                onClick={() => step === 0 ? navigate(-1) : goPrev()}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft />
                {step === 0 ? "Back" : "Previous"}
              </button>

              {/* Title */}
              <div className="text-center flex-1 min-w-0">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">ಹೊಸ CAD ವಿನಂತಿ</p>
                <p className="text-sm font-extrabold text-slate-900 truncate">New Request</p>
              </div>

              {/* Save Draft */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={draftSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors disabled:opacity-60"
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
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
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
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 mb-6">
              {STEP_CONTENT[step]}
            </div>

            {/* ── Navigation buttons ── */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-extrabold text-sm hover:border-slate-300 transition-colors"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-extrabold text-sm shadow-[0_6px_20px_rgba(234,88,12,0.28)] transition-colors"
                >
                  Continue <ArrowRight />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-extrabold text-sm shadow-[0_6px_20px_rgba(234,88,12,0.28)] transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Submitting…</>
                  ) : (
                    <>Submit Order ✓</>
                  )}
                </button>
              )}
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default UserUploadForm;