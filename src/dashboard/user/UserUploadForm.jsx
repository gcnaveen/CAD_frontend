import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form, Button, message } from "antd";
import { ArrowLeft } from "lucide-react";
import SurveyInfo from "./form/SurveyInfo";
import UploadSurvey from "./form/UploadSurvey";
import { createSketchUpload } from "../../services/surveyor/sketchUploadService.js";
import { createDraft, getDraftById, updateDraft } from "../../services/draftApi.js";

const DOCUMENT_FIELDS = [
  "moolaTippani",
  "hissaTippani",
  "atlas",
  "rrPakkabook",
  "kharabu",
];

const MAIN_DOCUMENT_FIELDS = ["moolaTippani", "atlas", "rrPakkabook"];

const DOCUMENT_TYPE_KEYS = [
  "is_originaltippani",
  "is_hissatippani",
  "is_atlas",
  "is_rrpakkabook",
  "is_akarabandu",
  "is_kharabuttar",
  "is_mulapatra",
];

function toUrl(doc) {
  if (!doc) return null;
  if (typeof doc === "string") return doc;
  return doc.url || doc.fileUrl || doc.fileURL || null;
}

function toMeta(doc) {
  if (!doc) return null;
  if (typeof doc === "string") return { fileUrl: doc, fileName: "file" };
  const url = toUrl(doc);
  if (!url) return null;
  return {
    fileUrl: url,
    fileName: doc.fileName || doc.name || "file",
    mimeType: doc.mimeType || doc.type,
    size: doc.size,
  };
}

function toFileListItem(meta, uid = "draft-file") {
  if (!meta?.fileUrl) return null;
  return {
    uid,
    name: meta.fileName || "file",
    url: meta.fileUrl,
    fileUrl: meta.fileUrl,
    status: "done",
    percent: 100,
    fileName: meta.fileName,
    mimeType: meta.mimeType,
    size: meta.size,
  };
}

const UserUploadForm = ({
  onSubmit,
  onCancel,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  loading: externalLoading = false,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [prefillEntities, setPrefillEntities] = useState(null);
  // Audio stored in parent so it is always available for payload (Ant Design form may omit object fields)
  const [audioData, setAudioData] = useState(null);
  // Uploaded document URLs stored in parent so submit always has them (form can drop custom fields)
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadedOtherDocs, setUploadedOtherDocs] = useState({});

  const draftIdFromUrl = useMemo(() => {
    const raw = searchParams.get("draftId");
    return raw && String(raw).trim() ? String(raw).trim() : null;
  }, [searchParams]);

  const processOtherDocuments = (payload) => {
    const otherDocsList = form.getFieldValue("other_documents");
    if (!otherDocsList || !Array.isArray(otherDocsList) || otherDocsList.length === 0) return;
    const processedDocs = [];
    for (const file of otherDocsList) {
      const uid = file?.uid;
      const doc = uid ? uploadedOtherDocs[uid] : null;
      if (!doc?.fileUrl || !doc.fileUrl.startsWith("http")) {
        throw new Error("OTHER_DOCS_PENDING");
      }
      processedDocs.push({
        url: doc.fileUrl,
        fileName: doc.fileName || "file",
        mimeType: doc.mimeType || "application/octet-stream",
        size: doc.size || 0,
      });
    }
    if (processedDocs.length > 0) payload.other_documents = processedDocs;
  };

  const handleSubmit = async (values) => {
    // If parent provides onSubmit, use it
    if (onSubmit) {
      onSubmit(values, form);
      return;
    }

    setLoading(true);
    try {
      if (!values.village) {
        message.error("Please select village first");
        setLoading(false);
        return;
      }

      const uploadMode = values.uploadMode ?? "normal";
      const payload = {
        surveyType: values.surveyType,
        district: values.district,
        taluka: values.taluka,
        hobli: values.hobli,
        village: values.village,
        surveyNo: values.surveyNo,
      };

      if (values.others) payload.others = values.others;

      if (audioData?.fileUrl) {
        payload.audio = {
          url: audioData.fileUrl,
          fileUrl: audioData.fileUrl,
          fileName: audioData.fileName || "audio",
          mimeType: audioData.mimeType || "audio/mpeg",
          size: audioData.size || 0,
        };
      }

      if (uploadMode === "single") {
        // Single Upload Mode
        const singleDoc = uploadedDocs.singleUpload;
        if (!singleDoc?.fileUrl || !singleDoc.fileUrl.startsWith("http")) {
          message.error("Please upload a document first, or wait for upload to complete.");
          setLoading(false);
          return;
        }
        const docTypes = values.documentTypes ?? [];
        if (!Array.isArray(docTypes) || docTypes.length === 0) {
          message.error("Select at least one document type");
          setLoading(false);
          return;
        }
        payload.singleUpload = {
          url: singleDoc.fileUrl,
          fileName: singleDoc.fileName || "file",
          mimeType: singleDoc.mimeType || "application/octet-stream",
          size: singleDoc.size || 0,
        };
        DOCUMENT_TYPE_KEYS.forEach((key) => {
          payload[key] = docTypes.includes(key);
        });
        try {
          processOtherDocuments(payload);
        } catch {
          message.error("One or more other documents are not uploaded yet. Wait for upload to complete or remove and re-upload.");
          setLoading(false);
          return;
        }
      } else {
        // Normal Upload Mode
        for (const fieldName of DOCUMENT_FIELDS) {
          const fileList = form.getFieldValue(fieldName) || values[fieldName];
          const hasFile = fileList && Array.isArray(fileList) && fileList.length > 0;
          if (!hasFile) continue;
          const doc = uploadedDocs[fieldName];
          if (!doc?.fileUrl || !doc.fileUrl.startsWith("http")) {
            message.error(`Please wait for "${fieldName}" to finish uploading, or remove and re-upload it.`);
            setLoading(false);
            return;
          }
          payload[fieldName] = {
            url: doc.fileUrl,
            fileName: doc.fileName || "file",
            mimeType: doc.mimeType || "application/octet-stream",
            size: doc.size || 0,
          };
        }
        const hasMainDoc = MAIN_DOCUMENT_FIELDS.some((f) => payload[f] !== undefined);
        if (!hasMainDoc) {
          message.error("At least one main document is required (Moola Tippani, Atlas, or RR Pakkabook)");
          setLoading(false);
          return;
        }
        try {
          processOtherDocuments(payload);
        } catch {
          message.error("One or more other documents are not uploaded yet. Wait for upload to complete or remove and re-upload.");
          setLoading(false);
          return;
        }
      }

      console.log("Payload:", payload);
      const result = await createSketchUpload(payload);
      if (result.success) {
        message.success("Survey sketch uploaded successfully!");
        form.resetFields();
        setDraftId(null);
        setAudioData(null);
        setUploadedDocs({});
        setUploadedOtherDocs({});
        navigate("/dashboard/user");
      } else {
        message.error(result.message || "Failed to upload survey sketch");
      }
    } catch (error) {
      message.error(error.message || "Failed to upload survey sketch");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDraftId(null);
    setAudioData(null);
    setUploadedDocs({});
    setUploadedOtherDocs({});
    onCancel?.();
  };

  const handleDocumentUpload = (fieldName, data) => {
    setUploadedDocs((prev) => ({ ...prev, [fieldName]: data }));
  };
  const handleDocumentRemove = (fieldName) => {
    setUploadedDocs((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };
  const handleOtherDocumentUpload = (uid, data) => {
    setUploadedOtherDocs((prev) => ({ ...prev, [uid]: data }));
  };
  const handleOtherDocumentRemove = (uid) => {
    setUploadedOtherDocs((prev) => {
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const buildDraftPayload = (values) => {
    const payload = {};
    const setIf = (k, v) => {
      if (v !== undefined && v !== null && v !== "") payload[k] = v;
    };

    setIf("surveyType", values.surveyType);
    setIf("district", values.district);
    setIf("taluka", values.taluka);
    setIf("hobli", values.hobli);
    setIf("village", values.village);
    setIf("surveyNo", values.surveyNo);
    setIf("others", values.others);
    setIf("uploadMode", values.uploadMode ?? "normal");

    if (audioData?.fileUrl) {
      payload.audio = {
        url: audioData.fileUrl,
        fileUrl: audioData.fileUrl,
        fileName: audioData.fileName || "audio",
        mimeType: audioData.mimeType || "audio/mpeg",
        size: audioData.size || 0,
      };
    }

    const uploadMode = values.uploadMode ?? "normal";

    if (uploadMode === "single") {
      const singleMeta = uploadedDocs.singleUpload || toMeta(values.singleUpload?.[0]);
      if (singleMeta?.fileUrl) {
        payload.singleUpload = {
          url: singleMeta.fileUrl,
          fileName: singleMeta.fileName || "file",
          mimeType: singleMeta.mimeType || "application/octet-stream",
          size: singleMeta.size || 0,
        };
      }
      const docTypes = Array.isArray(values.documentTypes) ? values.documentTypes : [];
      if (docTypes.length > 0) {
        DOCUMENT_TYPE_KEYS.forEach((key) => {
          payload[key] = docTypes.includes(key);
        });
      }
    } else {
      for (const fieldName of DOCUMENT_FIELDS) {
        const meta = uploadedDocs[fieldName] || toMeta((values[fieldName] || [])[0]);
        if (meta?.fileUrl) {
          payload[fieldName] = {
            url: meta.fileUrl,
            fileName: meta.fileName || "file",
            mimeType: meta.mimeType || "application/octet-stream",
            size: meta.size || 0,
          };
        }
      }
    }

    const otherDocsList = values.other_documents;
    if (Array.isArray(otherDocsList) && otherDocsList.length > 0) {
      const processed = [];
      for (const file of otherDocsList) {
        const uid = file?.uid;
        const meta = (uid && uploadedOtherDocs[uid]) || toMeta(file);
        if (meta?.fileUrl && meta.fileUrl.startsWith("http")) {
          processed.push({
            url: meta.fileUrl,
            fileName: meta.fileName || "file",
            mimeType: meta.mimeType || "application/octet-stream",
            size: meta.size || 0,
          });
        }
      }
      if (processed.length > 0) payload.other_documents = processed;
    }

    return payload;
  };

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    try {
      const values = form.getFieldsValue(true);
      const payload = buildDraftPayload(values);
      if (!draftId) {
        const created = await createDraft(payload);
        const id = created?._id ?? created?.id;
        if (id) setDraftId(id);
        message.success("Draft saved");
      } else {
        await updateDraft(draftId, payload);
        message.success("Draft updated");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) message.error("No permission");
      else if (status === 404) message.error("Draft not found");
      else message.error(err.message || "Failed to save draft");
    } finally {
      setDraftSaving(false);
    }
  };

  useEffect(() => {
    if (!draftIdFromUrl) return;
    setDraftId(draftIdFromUrl);
    setDraftLoading(true);
    (async () => {
      try {
        const draft = await getDraftById(draftIdFromUrl);
        if (!draft) {
          message.error("Draft not found");
          return;
        }

        setPrefillEntities({
          district: draft.district ?? null,
          taluka: draft.taluka ?? null,
          hobli: draft.hobli ?? null,
          village: draft.village ?? null,
        });

        const uploadMode = draft.uploadMode ?? "normal";
        const nextValues = {
          uploadMode,
          surveyType: draft.surveyType,
          district: draft.district?._id ?? draft.district?.id ?? draft.district,
          taluka: draft.taluka?._id ?? draft.taluka?.id ?? draft.taluka,
          hobli: draft.hobli?._id ?? draft.hobli?.id ?? draft.hobli,
          village: draft.village?._id ?? draft.village?.id ?? draft.village,
          surveyNo: draft.surveyNo,
          others: draft.others,
        };

        if (uploadMode === "single") {
          const meta = toMeta(draft.singleUpload);
          const item = toFileListItem(meta, "draft-singleUpload");
          if (item) {
            nextValues.singleUpload = [item];
            setUploadedDocs((prev) => ({ ...prev, singleUpload: meta }));
          }
          const types = DOCUMENT_TYPE_KEYS.filter((k) => draft[k] === true);
          if (types.length > 0) nextValues.documentTypes = types;
        } else {
          const nextUploaded = {};
          for (const fieldName of DOCUMENT_FIELDS) {
            const source = draft?.documents?.[fieldName] ?? draft?.[fieldName];
            const meta = toMeta(source);
            const item = toFileListItem(meta, `draft-${fieldName}`);
            if (item) {
              nextValues[fieldName] = [item];
              nextUploaded[fieldName] = meta;
            }
          }
          if (Object.keys(nextUploaded).length > 0) {
            setUploadedDocs((prev) => ({ ...prev, ...nextUploaded }));
          }
        }

        if (draft.audio) {
          const meta = toMeta(draft.audio);
          if (meta?.fileUrl) {
            const audioValue = {
              fileUrl: meta.fileUrl,
              key: draft.audio?.key,
              fileName: meta.fileName,
              mimeType: meta.mimeType,
              size: meta.size,
            };
            setAudioData(audioValue);
            nextValues.audio = audioValue;
          }
        }

        const otherDocs = Array.isArray(draft.other_documents) ? draft.other_documents : [];
        if (otherDocs.length > 0) {
          const list = [];
          const otherMap = {};
          otherDocs.forEach((d, idx) => {
            const meta = toMeta(d);
            const uid = `draft-other-${idx}`;
            const item = toFileListItem(meta, uid);
            if (item) {
              list.push(item);
              otherMap[uid] = meta;
            }
          });
          if (list.length > 0) {
            nextValues.other_documents = list;
            setUploadedOtherDocs((prev) => ({ ...prev, ...otherMap }));
          }
        }

        form.setFieldsValue(nextValues);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 403) message.error("No permission");
        else if (status === 404) message.error("Draft not found");
        else message.error(err.message || "Failed to load draft");
      } finally {
        setDraftLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftIdFromUrl]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Back button - top left */}
        <div className="mb-4 sm:mb-6">
          <Button
            type="text"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={handleBack}
            className="flex items-center gap-1.5 pl-0 text-gray-600 hover:text-gray-900 hover:bg-transparent -ml-1"
            size="large"
          >
            Back
          </Button>
        </div>

        {/* Page heading - bilingual */}
        <h1 className="mb-6 text-xl font-semibold text-gray-900 sm:mb-8 sm:text-2xl md:text-3xl">
          Fill the details and upload the survey sketch / ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ ಮತ್ತು ಸರ್ವೆ ಸ್ಕೆಚ್ ಅಪ್ಲೋಡ್ ಮಾಡಿ
        </h1>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          initialValues={{ uploadMode: "normal" }}
          className="user-upload-form"
        >
          {draftLoading ? (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Loading draft...
            </div>
          ) : null}
          <div className="space-y-8 sm:space-y-10">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
              <SurveyInfo form={form} prefillEntities={prefillEntities} />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
              <UploadSurvey
                form={form}
                onAudioChange={setAudioData}
                onDocumentUpload={handleDocumentUpload}
                onDocumentRemove={handleDocumentRemove}
                onOtherDocumentUpload={handleOtherDocumentUpload}
                onOtherDocumentRemove={handleOtherDocumentRemove}
              />
            </section>
          </div>

          {/* Submit & Cancel - handled in parent */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:mt-10 sm:flex-row sm:justify-end sm:gap-4">
            <Button
              type="default"
              size="large"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              {cancelLabel}
            </Button>
            <Button
              type="default"
              size="large"
              onClick={handleSaveDraft}
              loading={draftSaving}
              disabled={draftSaving || draftLoading}
              className="w-full sm:w-auto"
            >
              Save Draft
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading || externalLoading}
              className="w-full sm:w-auto"
            >
              {submitLabel}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default UserUploadForm;
