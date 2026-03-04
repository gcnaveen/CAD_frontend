import React, { useState, useRef, useEffect } from "react";
import { Form, Upload, Input, message, Button, Typography, Space, Radio, Checkbox, Card } from "antd";
import { Upload as UploadIcon, Music, Mic, Square, Trash2, Upload as UploadIcon2 } from "lucide-react";
import { getImagePresignedUrl, getAudioPresignedUrl, deleteUploadedFile } from "../../../services/upload/upload.api.js";
import { uploadAudioToS3 } from "../../../services/upload/upload.service.js";
import { AUDIO_MAX_SIZE_BYTES } from "../../../services/upload/upload.constants.js";

const { TextArea } = Input;
const { Text } = Typography;

const UPLOAD_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg";
const UPLOAD_MAX_COUNT = 1;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const OTHER_DOCS_MAX_COUNT = 10; // Allow multiple files for other_documents

const UPLOAD_ROWS = [
  {
    name: "moolaTippani",
    labelEn: "Moola Tippani",
    labelKn: "ಮೂಲ ಟಿಪ್ಪಣಿ",
  },
  {
    name: "hissaTippani",
    labelEn: "Hissa Tippani",
    labelKn: "ಹಿಸ್ಸ ಟಿಪ್ಪಣಿ",
  },
  {
    name: "atlas",
    labelEn: "Atlas",
    labelKn: "ಅಟ್ಲಾಸ್",
  },
  {
    name: "rrPakkabook",
    labelEn: "RR Pakkabook",
    labelKn: "RR ಪಕ್ಕಬುಕ್",
  },
  {
    name: "kharabu",
    labelEn: "Kharabu",
    labelKn: "ಖರಾಬು ಉತಾರ್",
  },
];

const DOCUMENT_TYPE_CHECKBOXES = [
  { name: "is_originaltippani", labelEn: "Moola Tippani", labelKn: "ಮೂಲ ಟಿಪ್ಪಣಿ" },
  { name: "is_hissatippani", labelEn: "Hissa Tippani", labelKn: "ಹಿಸ್ಸ ಟಿಪ್ಪಣಿ" },
  { name: "is_atlas", labelEn: "Atlas", labelKn: "ಅಟ್ಲಾಸ್" },
  { name: "is_rrpakkabook", labelEn: "RR Pakkabook", labelKn: "RR ಪಕ್ಕಬುಕ್" },
  { name: "is_akarabandu", labelEn: "Akarabandu", labelKn: "ಆಕಾರಬಂದು" },
  { name: "is_kharabuttar", labelEn: "Kharab Utthar", labelKn: "ಖರಾಬ್ ಉತ್ತರ" },
  { name: "is_mulapatra", labelEn: "Moola Patra", labelKn: "ಮೂಲ ಪತ್ರ" },
];

const UploadSurvey = ({
  form,
  onAudioChange,
  onDocumentUpload,
  onDocumentRemove,
  onOtherDocumentUpload,
  onOtherDocumentRemove,
}) => {
  const [uploading, setUploading] = useState({});
  const [_deleting, setDeleting] = useState({});
  const [uploadingAudio, setUploadingAudio] = useState(false);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [_audioChunks, setAudioChunks] = useState([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  
  const village = Form.useWatch("village", form);
  const audioField = Form.useWatch("audio", form);
  const uploadMode = Form.useWatch("uploadMode", form) ?? "normal";

  // Determine if file is audio based on MIME type
  const isAudioFile = (file) => {
    const audioTypes = ["audio/", "audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/ogg", "audio/mp4", "audio/x-m4a"];
    return audioTypes.some(type => file.type?.startsWith(type) || file.type === type);
  };

  // Determine if file is image based on MIME type
  const isImageFile = (file) => {
    const imageTypes = ["image/"];
    return imageTypes.some(type => file.type?.startsWith(type));
  };

  const handleUpload = async (file, fieldName) => {
    // When beforeUpload is called, 'file' IS the File object
    // We need to preserve it even if upload fails
    const fileObj = file instanceof File ? file : (file.originFileObj instanceof File ? file.originFileObj : file);
    
    if (!village) {
      message.warning("Please select village first");
      // Still preserve the File object in form so it can be uploaded later
      const currentValue = form.getFieldValue(fieldName) || [];
      const existingFile = currentValue.find((f) => f.uid === file.uid || f.name === file.name);
      if (!existingFile || !existingFile.originFileObj) {
        form.setFieldValue(fieldName, [
          ...currentValue.filter((f) => f.uid !== file.uid && f.name !== file.name),
          {
            uid: file.uid || `rc-upload-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            status: "error",
            originFileObj: fileObj instanceof File ? fileObj : file, // Preserve File object
          },
        ]);
      }
      return false;
    }

    // For other_documents, allow larger files (25MB for audio, 10MB for images/docs)
    const maxSize = isAudioFile(file) ? AUDIO_MAX_SIZE_BYTES : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024;
      message.error(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }

    setUploading((prev) => ({ ...prev, [fieldName]: true }));

    try {
      // Use the actual File object for upload
      const actualFile = fileObj instanceof File ? fileObj : file;
      
      // Choose API endpoint based on file type
      let result;
      if (isAudioFile(actualFile)) {
        result = await getAudioPresignedUrl({
          fileName: actualFile.name,
          contentType: actualFile.type,
          entityId: village,
        });
      } else {
        result = await getImagePresignedUrl({
          fileName: actualFile.name,
          contentType: actualFile.type,
          entityId: village,
        });
      }
      
      const responseData = result?.data ?? result;
      const { uploadUrl, fileUrl, key } = responseData;
      
      if (!uploadUrl || !fileUrl) {
        throw new Error("Failed to get upload URL");
      }

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: actualFile,
        headers: { "Content-Type": actualFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      // Store file info in form (fileUrl and metadata)
      const currentValue = form.getFieldValue(fieldName) || [];
      const fileUid = file.uid || `rc-upload-${Date.now()}-${Math.random()}`;
      const fileMeta = {
        fileUrl,
        fileName: file.name || actualFile.name,
        mimeType: file.type || actualFile.type,
        size: file.size || actualFile.size,
      };

      form.setFieldValue(fieldName, [
        ...currentValue.filter((f) => f.uid !== file.uid && f.name !== file.name),
        {
          uid: fileUid,
          name: file.name || actualFile.name,
          url: fileUrl,
          fileUrl,
          key: key,
          fileName: fileMeta.fileName,
          mimeType: fileMeta.mimeType,
          size: fileMeta.size,
          status: "done",
          percent: 100,
          originFileObj: actualFile instanceof File ? actualFile : fileObj,
        },
      ]);

      // Notify parent so submit can use URL even if form drops it
      if (fieldName === "other_documents") {
        onOtherDocumentUpload?.(fileUid, fileMeta);
      } else {
        onDocumentUpload?.(fieldName, fileMeta);
      }

      message.success(`${fieldName} uploaded successfully`);
      return false; // Prevent default upload
    } catch (error) {
      message.error(error.message || `Failed to upload ${fieldName}`);
      return false;
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleRemove = async (file, fieldName) => {
    // Get current fileList from form so we have fileUrl/key (Ant Design may pass minimal file to onRemove)
    const fileList = form.getFieldValue(fieldName) || [];
    const existing = Array.isArray(fileList)
      ? fileList.find((f) => f.uid === file.uid || f.name === file.name)
      : null;
    const target = existing || file;
    const fileUrl = target?.fileUrl || target?.url;
    const key = target?.key;

    // Clear parent-stored URL so submit doesn't use it
    if (fieldName === "other_documents") {
      onOtherDocumentRemove?.(file.uid || target?.uid);
    } else {
      onDocumentRemove?.(fieldName);
    }

    // Always call delete API when file was uploaded to S3 (has fileUrl or key) so S3 is cleared
    if (fileUrl || key) {
      setDeleting((prev) => ({ ...prev, [fieldName]: true }));
      try {
        const deletePayload = fileUrl ? { fileUrl } : { key };
        await deleteUploadedFile(deletePayload);
        message.success("File removed from form and storage");
      } catch (error) {
        console.error("Failed to delete file from S3:", error);
        message.warning("File removed from form. Storage delete failed – you may need to remove it manually.");
      } finally {
        setDeleting((prev) => ({ ...prev, [fieldName]: false }));
      }
    }
    return true; // Allow removal from form
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported MIME type
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/mp4";
        if (!MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = ""; // Browser will choose default
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      });

      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setAudioChunks([]);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      message.error("Failed to access microphone. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Upload recorded audio into "audio" field
  const handleUploadRecordedAudio = async () => {
    if (!audioBlob) {
      message.warning("No recording to upload");
      return;
    }

    if (!village) {
      message.warning("Please select village first");
      return;
    }

    setUploadingAudio(true);

    try {
      const mimeType = audioBlob.type || "audio/webm";
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
        type: mimeType,
      });

      const { fileUrl, key } = await uploadAudioToS3(audioFile, village);

      const audioValue = {
        fileUrl,
        key,
        fileName: audioFile.name,
        mimeType: audioFile.type,
        size: audioFile.size,
      };
      form.setFieldsValue({ audio: audioValue });
      onAudioChange?.(audioValue);

      message.success("Audio uploaded successfully");
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    } catch (error) {
      console.error("Failed to upload audio:", error);
      message.error(error.message || "Failed to upload audio");
    } finally {
      setUploadingAudio(false);
    }
  };

  // Remove audio from form and S3
  const handleDeleteAudio = async () => {
    const audioData = form.getFieldValue("audio");
    if (audioData?.fileUrl || audioData?.key) {
      try {
        const deletePayload = audioData.fileUrl ? { fileUrl: audioData.fileUrl } : { key: audioData.key };
        await deleteUploadedFile(deletePayload);
        message.success("Audio deleted from storage");
      } catch (error) {
        console.error("Failed to delete audio from S3:", error);
        message.warning("Audio removed from form but may still exist in storage");
      }
    }

    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    form.setFieldsValue({ audio: null });
    onAudioChange?.(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Merge incoming fileList with existing form value so fileUrl/url/key are never lost (Ant Design can overwrite with normalized list)
  const getMergeFileListValue = (fieldName) => (e) => {
    const nextList = Array.isArray(e) ? e : (e?.fileList ?? []);
    const prevList = form.getFieldValue(fieldName) || [];
    return nextList.map((file) => {
      const prev = prevList.find((f) => f.uid === file.uid || f.name === file.name);
      if (prev && (prev.fileUrl || prev.url)) {
        return {
          ...file,
          fileUrl: prev.fileUrl || prev.url,
          url: prev.url || prev.fileUrl,
          key: prev.key,
          fileName: prev.fileName ?? file.name,
          mimeType: prev.mimeType ?? file.type,
        };
      }
      return file;
    });
  };

  // File picker audio upload -> store in "audio" field
  const handleAudioFileUpload = async (file) => {
    if (!village) {
      message.warning("Please select village first");
      return false;
    }

    if (file.size > AUDIO_MAX_SIZE_BYTES) {
      message.error(`Audio file size must be less than ${AUDIO_MAX_SIZE_BYTES / 1024 / 1024}MB`);
      return false;
    }

    setUploadingAudio(true);

    try {
      const actualFile = file instanceof File ? file : (file.originFileObj instanceof File ? file.originFileObj : file);

      if (!(actualFile instanceof File)) {
        throw new Error("Invalid file object");
      }

      const { fileUrl, key } = await uploadAudioToS3(actualFile, village);

      const audioValue = {
        fileUrl,
        key,
        fileName: actualFile.name,
        mimeType: actualFile.type,
        size: actualFile.size,
      };
      form.setFieldsValue({ audio: audioValue });
      onAudioChange?.(audioValue);

      message.success("Audio uploaded successfully");
      return false; // Prevent default upload
    } catch (error) {
      console.error("Failed to upload audio:", error);
      message.error(error.message || "Failed to upload audio");
      return false;
    } finally {
      setUploadingAudio(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="mb-4 text-base font-semibold text-gray-800 sm:mb-5 sm:text-lg md:text-xl">
        Upload the survey records / ಸರ್ವೆ ದಾಖಲೆಗಳನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ
      </h2>
      <div className="upload-survey-form space-y-4 sm:space-y-5">
        {/* Upload Mode Selector */}
        <Form.Item
          name="uploadMode"
          label={
            <span className="font-medium text-gray-700">
              Upload Mode / ಅಪ್ಲೋಡ್ ಮಾದರಿ
            </span>
          }
          initialValue="normal"
        >
          <Radio.Group size="large" optionType="button" buttonStyle="solid">
            <Radio.Button value="single">Single Upload</Radio.Button>
            <Radio.Button value="normal">Normal Upload</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {uploadMode === "single" ? (
          /* Single Upload Mode */
          <Card size="small" className="border-gray-200 bg-gray-50/30">
            <div className="space-y-4 sm:space-y-5">
              <Form.Item
                name="singleUpload"
                label={
                  <span className="font-medium text-gray-700">
                    Upload Document / ದಾಖಲೆ ಅಪ್ಲೋಡ್ ಮಾಡಿ
                  </span>
                }
                rules={[{ required: true, message: "Please upload a document" }]}
                valuePropName="fileList"
                getValueFromEvent={getMergeFileListValue("singleUpload")}
              >
                <Upload
                  name="singleUpload"
                  listType="picture-card"
                  maxCount={1}
                  accept={UPLOAD_ACCEPT}
                  beforeUpload={(file) => handleUpload(file, "singleUpload")}
                  onRemove={(file) => handleRemove(file, "singleUpload")}
                  showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                  className="upload-survey-item"
                >
                  <div className="flex flex-col items-center gap-1 py-2">
                    <UploadIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {uploading.singleUpload ? "Uploading..." : "Upload"}
                    </span>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-medium text-gray-700">
                    Document Type / ದಾಖಲೆ ಪ್ರಕಾರ
                  </span>
                }
                required
              >
                <Form.Item
                  name="documentTypes"
                  noStyle
                  rules={[
                    {
                      validator: (_, value) => {
                        const checked = Array.isArray(value) ? value : [];
                        if (checked.length === 0) {
                          return Promise.reject(new Error("Select at least one document type"));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Checkbox.Group className="w-full">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {DOCUMENT_TYPE_CHECKBOXES.map(({ name, labelEn, labelKn }) => (
                        <Checkbox key={name} value={name} className="font-normal">
                          {labelEn} / {labelKn}
                        </Checkbox>
                      ))}
                    </div>
                  </Checkbox.Group>
                </Form.Item>
              </Form.Item>
            </div>
          </Card>
        ) : (
          /* Normal Upload Mode */
          <Card size="small" className="border-gray-200 bg-gray-50/30">
            <div className="space-y-4 sm:space-y-5">
              {UPLOAD_ROWS.map(({ name, labelEn, labelKn }) => (
                <Form.Item
                  key={name}
                  name={name}
                  label={
                    <span className="font-medium text-gray-700">
                      {labelEn} / {labelKn}
                    </span>
                  }
                  valuePropName="fileList"
                  getValueFromEvent={getMergeFileListValue(name)}
                >
                  <Upload
                    name={name}
                    listType="picture-card"
                    maxCount={UPLOAD_MAX_COUNT}
                    accept={UPLOAD_ACCEPT}
                    beforeUpload={(file) => handleUpload(file, name)}
                    onRemove={(file) => handleRemove(file, name)}
                    showUploadList={{
                      showPreviewIcon: true,
                      showRemoveIcon: true,
                    }}
                    className="upload-survey-item"
                  >
                    <div className="flex flex-col items-center gap-1 py-2">
                      <UploadIcon className="h-5 w-5 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        {uploading[name] ? "Uploading..." : "Upload"}
                      </span>
                    </div>
                  </Upload>
                </Form.Item>
              ))}
            </div>
          </Card>
        )}

        {/* Others - text only (shared) */}
        <Form.Item
          name="others"
          label={
            <span className="font-medium text-gray-700">Others / ಇತರೆ</span>
          }
        >
          <TextArea
            rows={3}
            placeholder="If joint flat, provide all survey no. details"
            size="large"
            className="w-full resize-none"
          />
        </Form.Item>

        {/* Audio - Form.Item registers field so values.audio is included on submit (object value) */}
        <Form.Item name="audio" noStyle>
          <div style={{ display: "none" }} aria-hidden />
        </Form.Item>
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <div className="mb-3">
            <Text className="text-sm font-medium text-gray-700">
              Audio (Optional) / ಆಡಿಯೋ (ಐಚ್ಛಿಕ)
            </Text>
          </div>
          <div className="space-y-3">
            {!isRecording && !audioBlob && !audioField && (
              <Space wrap>
                <Button
                  type="primary"
                  icon={<Mic className="h-4 w-4" />}
                  onClick={startRecording}
                  size="large"
                >
                  Start Recording
                </Button>
                <Upload
                  accept={AUDIO_ACCEPT}
                  showUploadList={false}
                  beforeUpload={(file) => handleAudioFileUpload(file)}
                >
                  <Button icon={<UploadIcon className="h-4 w-4" />} size="large">
                    Upload audio file
                  </Button>
                </Upload>
              </Space>
            )}

            {isRecording && (
              <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                    <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                  </div>
                  <div>
                    <Text strong className="text-red-700">Recording...</Text>
                    <div className="text-sm text-red-600">{formatTime(recordingTime)}</div>
                  </div>
                </div>
                <Button
                  type="primary"
                  danger
                  icon={<Square className="h-4 w-4" />}
                  onClick={stopRecording}
                  size="large"
                >
                  Stop
                </Button>
              </div>
            )}

            {audioBlob && audioUrl && !audioField && (
              <div className="space-y-3">
                <div className="rounded-lg bg-white p-3">
                  <audio controls src={audioUrl} className="w-full" />
                </div>
                <Space className="w-full" size="middle">
                  <Button
                    type="primary"
                    icon={<UploadIcon2 className="h-4 w-4" />}
                    onClick={handleUploadRecordedAudio}
                    loading={uploadingAudio}
                    disabled={uploadingAudio}
                    className="flex-1"
                  >
                    Upload Audio
                  </Button>
                  <Button
                    danger
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={handleDeleteAudio}
                    disabled={uploadingAudio}
                  >
                    Delete Recording
                  </Button>
                </Space>
              </div>
            )}

            {audioField && (
              <div className="rounded-lg bg-green-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <Text strong className="text-green-700">Audio uploaded</Text>
                    <div className="text-xs text-green-600">{audioField.fileName}</div>
                  </div>
                  <Button
                    danger
                    size="small"
                    icon={<Trash2 className="h-3 w-3" />}
                    onClick={handleDeleteAudio}
                  >
                    Remove
                  </Button>
                </div>
                {audioField.fileUrl && (
                  <audio controls src={audioField.fileUrl} className="w-full" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Other Documents Field - Optional Multi-file Upload */}
        <Form.Item
          name="other_documents"
          label={
            <span className="font-medium text-gray-700">
              Other Documents (Optional) / ಇತರೆ ದಾಖಲೆಗಳು (ಐಚ್ಛಿಕ)
            </span>
          }
          valuePropName="fileList"
          getValueFromEvent={getMergeFileListValue("other_documents")}
        >
          <Upload
            name="other_documents"
            listType="text"
            maxCount={OTHER_DOCS_MAX_COUNT}
            accept={`${UPLOAD_ACCEPT},${AUDIO_ACCEPT}`}
            beforeUpload={(file) => handleUpload(file, "other_documents")}
            onRemove={(file) => handleRemove(file, "other_documents")}
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
            }}
            className="upload-other-docs"
          >
            <Button icon={<UploadIcon className="h-4 w-4" />} size="large">
              Upload Documents (Images, PDFs, Audio)
            </Button>
          </Upload>
        </Form.Item>
      </div>
    </div>
  );
};

export default UploadSurvey;
