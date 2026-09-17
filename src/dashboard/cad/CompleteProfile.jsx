import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Progress,
  Row,
  Select,
  Space,
  Steps,
  Typography,
  Upload,
  message,
} from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { setCredentials } from "../../features/auth/authSlice";
import { updateUser } from "../../services/user/userService";
import {
  uploadImageToS3,
  uploadSurveyDocumentToS3,
} from "../../services/upload/upload.service";
import { deleteUploadedFile } from "../../services/upload/upload.api.js";
import { getUploadErrorMessage } from "../../services/upload/upload.errors.js";
import { cadBi, cadBiFmt } from "./cadBilingual";
import {
  ACCOUNT_NUMBER_REGEX,
  DOCUMENT_UPLOAD_ACCEPT,
  IFSC_REGEX,
  IMAGE_UPLOAD_ACCEPT,
  PHONE_REGEX,
  fileNameFromUrl,
  isDocumentUploadField,
  isWordDocumentFile,
  normalizeIndianPhone,
  resolveProfilePhotoUrl,
  resolveUserEmail,
  resolveUserPhone,
  sanitizeIfsc,
} from "./profileFormUtils.js";

const { Title, Text } = Typography;

const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "aadhaarPhotoUrl",
  "accountNumber",
  "accountHolderName",
  "bankName",
  "branchName",
  "ifscCode",
  "skills",
  "experienceYears",
];

const STEP_FIELD_MAP = [
  ["firstName", "lastName", "phone", "address"],
  ["aadhaarPhotoUrl"],
  ["accountNumber", "accountHolderName", "bankName", "branchName", "ifscCode"],
  [],
  ["skills", "experienceYears"],
  [],
];

const SKILL_OPTIONS = [
  "AutoCAD",
  "2D Drafting",
  "3D Modeling",
  "Land Survey Mapping",
  "Layout Design",
  "Civil Drafting",
];

const trimObject = (value) => {
  if (Array.isArray(value)) return value.map(trimObject);
  if (value && typeof value === "object") {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = trimObject(value[key]);
      return acc;
    }, {});
  }
  if (typeof value === "string") return value.trim();
  return value;
};

const hasAnyFormValue = (values) =>
  Object.entries(values || {}).some(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return hasAnyFormValue(value);
    if (typeof value === "string") return value.trim().length > 0;
    return value !== undefined && value !== null && value !== "";
  });

export default function CompleteProfile() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth || {});
  const user = useMemo(() => auth.user || {}, [auth.user]);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState({});
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  const userId = user?._id;
  const draftKey = `cad_complete_profile_draft_${userId || "unknown"}`;
  const progressPercent = Math.round(((currentStep + 1) / 6) * 100);
  const lockedEmail = resolveUserEmail(user);
  const bumpForm = () => setFormVersion((prev) => prev + 1);

  useEffect(() => {
    const defaultValues = {
      firstName: user?.firstName || user?.personalDetails?.firstName || "",
      lastName: user?.lastName || user?.personalDetails?.lastName || "",
      phone: resolveUserPhone(user),
      email: lockedEmail,
      address: user?.address || user?.personalDetails?.address || "",
      profilePhotoUrl: resolveProfilePhotoUrl(user),
      aadhaarPhotoUrl: user?.aadhaarPhotoUrl || user?.kycDetails?.aadhaarPhotoUrl || "",
      accountNumber: user?.accountNumber || user?.bankDetails?.accountNumber || "",
      accountHolderName:
        user?.accountHolderName || user?.bankDetails?.accountHolderName || "",
      bankName: user?.bankName || user?.bankDetails?.bankName || "",
      branchName: user?.branchName || user?.bankDetails?.branchName || "",
      ifscCode: sanitizeIfsc(user?.ifscCode || user?.bankDetails?.ifscCode || ""),
      upiId: user?.upiId || user?.upiDetails?.upiId || "",
      skills: Array.isArray(user?.skills)
        ? user.skills
        : Array.isArray(user?.professionalDetails?.skills)
          ? user.professionalDetails.skills
          : [],
      experienceYears:
        user?.experienceYears ??
        user?.yearsOfExperience ??
        user?.professionalDetails?.experienceYears ??
        (Number.isFinite(Number(user?.yearsOfExperience))
          ? Number(user?.yearsOfExperience)
          : undefined),
      resumeUrl: user?.resumeUrl || user?.professionalDetails?.resumeUrl || "",
      addressProofUrl: user?.addressProofUrl || user?.documents?.addressProofUrl || "",
    };

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) {
        form.setFieldsValue(defaultValues);
        return;
      }
      const draft = JSON.parse(raw);
      const merged = { ...defaultValues, ...draft, email: lockedEmail };
      if (merged.phone) merged.phone = normalizeIndianPhone(merged.phone);
      if (merged.ifscCode) merged.ifscCode = sanitizeIfsc(merged.ifscCode);
      form.setFieldsValue(merged);
      setIsDraftDirty(true);
    } catch {
      form.setFieldsValue(defaultValues);
    }
  }, [draftKey, form, lockedEmail, user]);

  const isFieldFilled = (name, values) => {
    const value = values?.[name];
    if (name === "skills") return Array.isArray(value) && value.length > 0;
    if (name === "experienceYears")
      return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 50;
    if (typeof value === "string") return value.trim().length > 0;
    return value !== undefined && value !== null && value !== "";
  };

  const isFormReadyForSubmit = useMemo(() => {
    void formVersion;
    const values = form.getFieldsValue(true);
    const requiredOk = REQUIRED_FIELDS.every((fieldName) =>
      isFieldFilled(fieldName, values)
    );
    const ifscOk = IFSC_REGEX.test(sanitizeIfsc(values?.ifscCode));
    const accountOk = ACCOUNT_NUMBER_REGEX.test(String(values?.accountNumber || "").trim());
    const phoneOk = PHONE_REGEX.test(normalizeIndianPhone(values?.phone));
    return requiredOk && ifscOk && accountOk && phoneOk;
  }, [form, formVersion]);

  const isCurrentStepValid = () => {
    if (Object.values(uploading).some(Boolean)) return false;
    const values = form.getFieldsValue(true);
    const fields = STEP_FIELD_MAP[currentStep] || [];

    const requiredOk = fields.every((fieldName) => isFieldFilled(fieldName, values));
    if (!requiredOk) return false;

    if (currentStep === 0) {
      if (!PHONE_REGEX.test(normalizeIndianPhone(values?.phone))) return false;
    }
    if (currentStep === 2) {
      if (!IFSC_REGEX.test(sanitizeIfsc(values?.ifscCode))) return false;
      if (!ACCOUNT_NUMBER_REGEX.test(String(values?.accountNumber || "").trim())) return false;
    }
    if (currentStep === 4) {
      const years = Number(values?.experienceYears);
      if (!Number.isFinite(years) || years < 0 || years > 50) return false;
    }

    const errors = form.getFieldsError(fields);
    return !errors.some((fieldError) => fieldError.errors?.length);
  };

  const uploadFieldFile = async (fieldName, file) => {
    const fileObj =
      file instanceof File
        ? file
        : file?.originFileObj instanceof File
          ? file.originFileObj
          : file;
    if (!fileObj) return false;

    if (isDocumentUploadField(fieldName) && isWordDocumentFile(fileObj)) {
      message.warning(cadBi.profile.wordNotSupported);
      return false;
    }

    setUploading((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const upload = isDocumentUploadField(fieldName)
        ? uploadSurveyDocumentToS3
        : uploadImageToS3;
      const { fileUrl } = await upload(fileObj, String(userId));
      form.setFieldValue(fieldName, fileUrl);
      bumpForm();
      message.success(cadBi.profile.fileUploaded);
    } catch (error) {
      message.error(getUploadErrorMessage(error) || cadBi.profile.uploadFailed);
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
    return false;
  };

  const handleDeleteFile = async (fieldName) => {
    const fileUrl = form.getFieldValue(fieldName);
    if (fileUrl) {
      try {
        await deleteUploadedFile({ fileUrl });
      } catch {
        /* still clear the form field */
      }
    }
    form.setFieldValue(fieldName, "");
    bumpForm();
  };

  useEffect(() => {
    const onBeforeUnload = (event) => {
      const values = form.getFieldsValue(true);
      if (!submitting && hasAnyFormValue(values) && !isFormReadyForSubmit) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [form, isFormReadyForSubmit, submitting]);

  const onValuesChange = () => {
    const values = form.getFieldsValue(true);
    bumpForm();
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ...values, email: lockedEmail }));
      setIsDraftDirty(true);
    } catch {
      // ignore localStorage write errors
    }
  };

  const handleNext = async () => {
    try {
      await form.validateFields(STEP_FIELD_MAP[currentStep] || []);
      if (!isCurrentStepValid()) return;
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    } catch {
      // antd will show field-level errors
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (submitting || !isFormReadyForSubmit) return;
    if (!userId) {
      message.error(cadBi.profile.noUserId);
      return;
    }

    setSubmitting(true);
    try {
      await form.validateFields(REQUIRED_FIELDS);
      const rawValues = form.getFieldsValue(true);
      const values = trimObject(rawValues);
      const skills = Array.isArray(values.skills) ? values.skills : [];
      const experienceYears = Number(values.experienceYears);

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        status: "ACTIVE",
        personalDetails: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: normalizeIndianPhone(values.phone),
          email: lockedEmail || values.email,
          address: values.address,
          profilePhotoUrl: values.profilePhotoUrl || "",
        },
        kycDetails: {
          aadhaarPhotoUrl: values.aadhaarPhotoUrl,
        },
        bankDetails: {
          accountNumber: values.accountNumber,
          accountHolderName: values.accountHolderName,
          bankName: values.bankName,
          branchName: values.branchName,
          ifscCode: sanitizeIfsc(values.ifscCode),
        },
        upiDetails: {
          upiId: values.upiId || "",
        },
        professionalDetails: {
          skills,
          experienceYears,
          resumeUrl: values.resumeUrl || "",
        },
        documents: {
          addressProofUrl: values.addressProofUrl || "",
        },
        profileCompleted: true,
      };

      const response = await updateUser(userId, payload);
      const updatedUser =
        response?.data?.user ||
        response?.user ||
        response?.data ||
        ({
          ...user,
          ...payload,
          role: user?.role,
        });

      dispatch(
        setCredentials({
          token: auth?.token,
          user: { ...user, ...updatedUser, profileCompleted: true },
        })
      );
      localStorage.removeItem(draftKey);
      setIsDraftDirty(false);

      message.success(cadBi.profile.profileCompleted);
      navigate("/dashboard/cad", { replace: true });
    } catch (error) {
      const validationError = Array.isArray(error?.response?.data?.errors)
        ? error.response.data.errors[0]?.message
        : "";
      const msg =
        validationError ||
        error?.response?.data?.message ||
        cadBi.profile.profileUpdateFail;
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderUpload = (name, label, { required = false, kind = "image" } = {}) => {
    const value = form.getFieldValue(name);
    const accept = kind === "document" ? DOCUMENT_UPLOAD_ACCEPT : IMAGE_UPLOAD_ACCEPT;
    const showPhoto = kind === "photo" && Boolean(value);
    return (
      <Form.Item
        label={label}
        name={name}
        extra={kind === "document" ? cadBi.profile.documentHint : undefined}
        rules={
          required
            ? [
                {
                  required: true,
                  message: cadBiFmt(cadBi.profile.rules.fieldRequired, { label }),
                },
              ]
            : []
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {showPhoto ? (
            <img
              src={value}
              alt=""
              style={{
                width: 96,
                height: 96,
                objectFit: "cover",
                borderRadius: 12,
                border: "1px solid #f0f0f0",
              }}
            />
          ) : null}
          {kind === "image" && value ? (
            <img
              src={value}
              alt=""
              style={{
                maxWidth: 220,
                maxHeight: 140,
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid #f0f0f0",
              }}
            />
          ) : null}
          <Space wrap>
            <Upload
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => uploadFieldFile(name, file)}
              accept={accept}
              disabled={Boolean(uploading[name])}
            >
              <Button icon={<UploadOutlined />} loading={Boolean(uploading[name])}>
                {value ? cadBi.profile.replaceFile : cadBi.profile.uploadFile}
              </Button>
            </Upload>
            {value ? (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteFile(name)}
                disabled={Boolean(uploading[name])}
              >
                {cadBi.profile.deleteFile}
              </Button>
            ) : null}
          </Space>
          {value ? (
            <a href={value} target="_blank" rel="noreferrer">
              {kind === "document" ? fileNameFromUrl(value) : cadBi.profile.previewFile}
            </a>
          ) : null}
        </Space>
      </Form.Item>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: 16 }}>
      <Card
        style={{
          maxWidth: 980,
          margin: "0 auto",
          borderRadius: 12,
          minHeight: "calc(100vh - 32px)",
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{ display: "flex", flexDirection: "column", flex: 1, paddingBottom: 96 }}
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Title level={3} style={{ marginBottom: 0 }}>
            {cadBi.profile.pageTitle}
          </Title>
          <Text type="secondary">
            {cadBiFmt(cadBi.profile.stepLine, { c: currentStep + 1 })}
          </Text>
          <Progress percent={progressPercent} size="small" showInfo={false} />
        </Space>

        <Steps
          current={currentStep}
          size="small"
          responsive
          style={{ marginTop: 16, marginBottom: 20 }}
          items={[
            { title: cadBi.profile.steps.personal },
            { title: cadBi.profile.steps.kyc },
            { title: cadBi.profile.steps.bank },
            { title: cadBi.profile.steps.upi },
            { title: cadBi.profile.steps.professional },
            { title: cadBi.profile.steps.documents },
          ]}
        />

        <Form
          form={form}
          layout="vertical"
          onValuesChange={onValuesChange}
          initialValues={{ email: lockedEmail, skills: [] }}
          style={{ flex: 1 }}
        >
          {currentStep === 0 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.firstName}
                  name="firstName"
                  rules={[{ required: true, message: cadBi.profile.rules.firstName }]}
                >
                  <Input placeholder={cadBi.profile.placeholders.firstName} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.lastName}
                  name="lastName"
                  rules={[{ required: true, message: cadBi.profile.rules.lastName }]}
                >
                  <Input placeholder={cadBi.profile.placeholders.lastName} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.phone}
                  name="phone"
                  rules={[
                    { required: true, message: cadBi.profile.rules.phone },
                    { pattern: PHONE_REGEX, message: cadBi.profile.rules.phoneInvalid },
                  ]}
                >
                  <Input
                    addonBefore="+91"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder={cadBi.profile.placeholders.phone}
                    onChange={(event) => {
                      form.setFieldValue("phone", normalizeIndianPhone(event?.target?.value));
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.email}
                  name="email"
                  extra={cadBi.profile.emailLocked}
                >
                  <Input disabled readOnly placeholder={lockedEmail || cadBi.profile.email} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label={cadBi.profile.address}
                  name="address"
                  rules={[{ required: true, message: cadBi.profile.rules.address }]}
                >
                  <Input.TextArea rows={3} placeholder={cadBi.profile.placeholders.address} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                {renderUpload("profilePhotoUrl", cadBi.profile.profilePhoto, { kind: "photo" })}
              </Col>
            </Row>
          ) : null}

          {currentStep === 1 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24}>
                {renderUpload("aadhaarPhotoUrl", cadBi.profile.aadhaarPhoto, {
                  required: true,
                  kind: "image",
                })}
              </Col>
            </Row>
          ) : null}

          {currentStep === 2 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.accountNumber}
                  name="accountNumber"
                  rules={[
                    { required: true, message: cadBi.profile.rules.accountNumber },
                    {
                      pattern: ACCOUNT_NUMBER_REGEX,
                      message: cadBi.profile.rules.accountNumberPattern,
                    },
                  ]}
                >
                  <Input
                    placeholder={cadBi.profile.placeholders.accountNumber}
                    onChange={(event) => {
                      const digitsOnly = String(event?.target?.value || "").replace(/\D/g, "");
                      form.setFieldValue("accountNumber", digitsOnly);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.accountHolderName}
                  name="accountHolderName"
                  rules={[{ required: true, message: cadBi.profile.rules.accountHolder }]}
                >
                  <Input placeholder={cadBi.profile.placeholders.accountHolderName} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.bankName}
                  name="bankName"
                  rules={[{ required: true, message: cadBi.profile.rules.bankName }]}
                >
                  <Input placeholder={cadBi.profile.placeholders.bankName} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.branchName}
                  name="branchName"
                  rules={[{ required: true, message: cadBi.profile.rules.branchName }]}
                >
                  <Input placeholder={cadBi.profile.placeholders.branchName} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.ifscCode}
                  name="ifscCode"
                  rules={[
                    { required: true, message: cadBi.profile.rules.ifscRequired },
                    { pattern: IFSC_REGEX, message: cadBi.profile.rules.ifscInvalid },
                  ]}
                >
                  <Input
                    placeholder={cadBi.profile.placeholders.ifsc}
                    maxLength={11}
                    onChange={(event) => {
                      form.setFieldValue("ifscCode", sanitizeIfsc(event?.target?.value));
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {currentStep === 3 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item label={cadBi.profile.upiId} name="upiId">
                  <Input placeholder={cadBi.profile.placeholders.upi} />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {currentStep === 4 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24}>
                <Form.Item
                  label={cadBi.profile.skills}
                  name="skills"
                  rules={[{ required: true, message: cadBi.profile.rules.skills }]}
                >
                  <Select mode="tags" options={SKILL_OPTIONS.map((s) => ({ label: s, value: s }))} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={cadBi.profile.experienceYears}
                  name="experienceYears"
                  rules={[
                    { required: true, message: cadBi.profile.rules.experienceRequired },
                    {
                      validator: (_, value) => {
                        if (value === undefined || value === null || value === "") {
                          return Promise.reject(new Error(cadBi.profile.rules.experienceRequired));
                        }
                        const years = Number(value);
                        if (!Number.isFinite(years) || years < 0 || years > 50) {
                          return Promise.reject(new Error(cadBi.profile.rules.experienceRange));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber min={0} max={50} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                {renderUpload("resumeUrl", cadBi.profile.resume, { kind: "document" })}
              </Col>
            </Row>
          ) : null}

          {currentStep === 5 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24}>
                {renderUpload("addressProofUrl", cadBi.profile.addressProof, { kind: "document" })}
              </Col>
              {isDraftDirty ? (
                <Col xs={24}>
                  <Text type="secondary">{cadBi.profile.draftSave}</Text>
                </Col>
              ) : null}
            </Row>
          ) : null}
        </Form>

        <div
          style={{
            position: "sticky",
            bottom: 0,
            marginTop: 20,
            background: "#fff",
            borderTop: "1px solid #f0f0f0",
            paddingTop: 12,
          }}
        >
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={handleBack} disabled={currentStep === 0 || submitting}>
              {cadBi.profile.back}
            </Button>
            {currentStep < 5 ? (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={!isCurrentStepValid()}
                loading={Object.values(uploading).some(Boolean)}
              >
                {Object.values(uploading).some(Boolean) ? "Uploading…" : cadBi.profile.next}
              </Button>
            ) : (
              <Button
                type="primary"
                loading={submitting || Object.values(uploading).some(Boolean)}
                onClick={handleSubmit}
                disabled={!isFormReadyForSubmit || submitting || Object.values(uploading).some(Boolean)}
              >
                {Object.values(uploading).some(Boolean) ? "Uploading…" : cadBi.profile.submitProfile}
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}
