import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, message } from "antd";
import { ArrowLeft } from "lucide-react";
import SurveyInfo from "./form/SurveyInfo";
import UploadSurvey from "./form/UploadSurvey";
import { createSketchUpload } from "../../services/surveyor/sketchUploadService.js";
import { getImagePresignedUrl } from "../../services/upload/upload.api.js";

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

  // Helper function to upload a file that hasn't been uploaded yet
  const uploadFileIfNeeded = async (file, fieldName, villageId) => {
    // If file already has fileUrl, return it
    if (file?.fileUrl || file?.url) {
      const existingUrl = file.fileUrl || file.url;
      if (existingUrl && existingUrl.startsWith("http")) {
        return existingUrl;
      }
    }

    // Get the actual File object - Ant Design stores it in originFileObj
    // When beforeUpload returns false, the file parameter IS the File object
    // When file is from fileList, it's in originFileObj
    let actualFile = null;
    
    if (file instanceof File) {
      actualFile = file;
    } else if (file.originFileObj instanceof File) {
      actualFile = file.originFileObj;
    } else if (file.originFileObj && typeof file.originFileObj === 'object') {
      // Sometimes Ant Design wraps it, try to get the actual File
      actualFile = file.originFileObj;
    }
    
    // Check if we have a valid File object
    if (!actualFile || !(actualFile instanceof File)) {
      // If we don't have the File object, the file can't be uploaded
      // This happens when file was added but upload failed or village wasn't selected
      throw new Error(`Please remove and re-upload ${fieldName}. The file data is missing.`);
    }

    // Get presigned URL
    const fileName = actualFile.name;
    const contentType = actualFile.type || "application/octet-stream";
    
    const result = await getImagePresignedUrl({
      fileName,
      contentType,
      entityId: villageId,
    });
    const responseData = result?.data ?? result;
    const { uploadUrl, fileUrl, key } = responseData;

    if (!uploadUrl || !fileUrl) {
      throw new Error(`Failed to get upload URL for ${fieldName}`);
    }

    // Upload file to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: actualFile,
      headers: { "Content-Type": contentType },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${fieldName} to S3`);
    }

    // Update form with fileUrl - preserve all file properties
    const currentValue = form.getFieldValue(fieldName) || [];
    form.setFieldValue(fieldName, [
      ...currentValue.filter((f) => f.uid !== file.uid),
      {
        ...file,
        uid: file.uid,
        name: file.name || actualFile.name,
        url: fileUrl,
        fileUrl,
        key: key,
        fileName: file.fileName || actualFile.name,
        mimeType: file.mimeType || actualFile.type,
        size: file.size || actualFile.size,
        status: "done",
        originFileObj: actualFile,
        percent: 100,
      },
    ]);

    return fileUrl;
  };

  const handleSubmit = async (values) => {
    // If parent provides onSubmit, use it
    if (onSubmit) {
      onSubmit(values, form);
      return;
    }

    // Otherwise, handle submission internally
    setLoading(true);
    try {
      // Validate village is selected (needed for uploads)
      if (!values.village) {
        message.error("Please select village first");
        setLoading(false);
        return;
      }

      // Extract file URLs from form values
      const documentFields = [
        "moolaTippani",
        "hissaTippani",
        "atlas",
        "rrPakkabook",
        "kharabu",
      ];

      const payload = {
        surveyType: values.surveyType,
        district: values.district,
        taluka: values.taluka,
        hobli: values.hobli,
        village: values.village,
        surveyNo: values.surveyNo,
      };

      // Others: text only
      if (values.others) {
        payload.others = values.others;
      }

      // Audio: from parent state (set by UploadSurvey via onAudioChange). Send both url and fileUrl so backend can persist.
      if (audioData?.fileUrl) {
        payload.audio = {
          url: audioData.fileUrl,
          fileUrl: audioData.fileUrl,
          fileName: audioData.fileName || "audio",
          mimeType: audioData.mimeType || "audio/mpeg",
          size: audioData.size || 0,
        };
      }

      // Process document fields - upload files that haven't been uploaded yet
      for (const fieldName of documentFields) {
        const fileList = form.getFieldValue(fieldName) || values[fieldName];
        
        if (fileList && Array.isArray(fileList) && fileList.length > 0) {
          const file = fileList[0];
          let fileUrl = file?.fileUrl || file?.url;
          
          // If file doesn't have fileUrl, upload it now
          if (!fileUrl || !fileUrl.startsWith("http")) {
            try {
              const hideLoading = message.loading({ content: `Uploading ${fieldName}...`, key: `upload-${fieldName}`, duration: 0 });
              fileUrl = await uploadFileIfNeeded(file, fieldName, values.village);
              hideLoading();
              message.success({ content: `${fieldName} uploaded`, key: `upload-${fieldName}`, duration: 2 });
            } catch (error) {
              message.error({ content: `Failed to upload ${fieldName}: ${error.message}`, key: `upload-${fieldName}`, duration: 4 });
              setLoading(false);
              return;
            }
          }
          
          // Add to payload if we have a valid fileUrl
          if (fileUrl && fileUrl.startsWith("http")) {
            payload[fieldName] = {
              url: fileUrl,
              fileName: file.fileName || file.name || "file",
              mimeType: file.mimeType || file.type || "application/octet-stream",
              size: file.size || 0,
            };
          }
        }
      }

      // Process other_documents - optional multi-file upload
      const otherDocsList = form.getFieldValue("other_documents") || values.other_documents;
      if (otherDocsList && Array.isArray(otherDocsList) && otherDocsList.length > 0) {
        const processedDocs = [];
        
        for (const file of otherDocsList) {
          let fileUrl = file?.fileUrl || file?.url;
          
          // If file doesn't have fileUrl, upload it now
          if (!fileUrl || !fileUrl.startsWith("http")) {
            try {
              const hideLoading = message.loading({ content: `Uploading other document...`, key: `upload-other-doc-${file.uid}`, duration: 0 });
              fileUrl = await uploadFileIfNeeded(file, "other_documents", values.village);
              hideLoading();
              message.success({ content: `Document uploaded`, key: `upload-other-doc-${file.uid}`, duration: 2 });
            } catch (error) {
              message.error({ content: `Failed to upload document: ${error.message}`, key: `upload-other-doc-${file.uid}`, duration: 4 });
              setLoading(false);
              return;
            }
          }
          
          // Add to processed docs if we have a valid fileUrl
          if (fileUrl && fileUrl.startsWith("http")) {
            // Format as object with metadata
            processedDocs.push({
              url: fileUrl,
              fileName: file.fileName || file.name || "file",
              mimeType: file.mimeType || file.type || "application/octet-stream",
              size: file.size || 0,
            });
          }
        }
        
        if (processedDocs.length > 0) {
          payload.other_documents = processedDocs;
        }
      }

      // Validate at least one document is uploaded
      const uploadedFields = documentFields.filter((field) => payload[field] !== undefined);
      const hasDocument = uploadedFields.length > 0;
      
      if (!hasDocument) {
        message.error("Please upload at least one document");
        setLoading(false);
        return;
      }
      const result = await createSketchUpload(payload);
      if (result.success) {
        message.success("Survey sketch uploaded successfully!");
        form.resetFields();
        setAudioData(null);
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
    onCancel?.();
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
          className="user-upload-form"
        >
          <div className="space-y-8 sm:space-y-10">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
              <SurveyInfo form={form} />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
              <UploadSurvey form={form} onAudioChange={setAudioData} />
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
