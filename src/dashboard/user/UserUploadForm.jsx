  import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, message } from "antd";
import { ArrowLeft } from "lucide-react";
import SurveyInfo from "./form/SurveyInfo";
import UploadSurvey from "./form/UploadSurvey";
import { createSketchUpload } from "../../services/surveyor/sketchUploadService.js";

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

const UserUploadForm = ({
  onSubmit,
  onCancel,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  loading: externalLoading = false,
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // Audio stored in parent so it is always available for payload (Ant Design form may omit object fields)
  const [audioData, setAudioData] = useState(null);
  // Uploaded document URLs stored in parent so submit always has them (form can drop custom fields)
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadedOtherDocs, setUploadedOtherDocs] = useState({});

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
          <div className="space-y-8 sm:space-y-10">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
              <SurveyInfo form={form} />
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
