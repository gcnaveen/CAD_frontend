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
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../../features/auth/authSlice";
import { updateUser } from "../../services/user/userService";
import { uploadImageToS3 } from "../../services/upload/upload.service";
import { cadBi, cadBiFmt } from "./cadBilingual";

const { Title, Text } = Typography;

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const ACCOUNT_NUMBER_REGEX = /^\d+$/;
const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "aadhaarPhotoUrl",
  "accountNumber",
  "accountHolderName",
  "ifscCode",
  "skills",
  "experienceYears",
];

const STEP_FIELD_MAP = [
  ["firstName", "lastName", "phone", "address"],
  ["aadhaarPhotoUrl"],
  ["accountNumber", "accountHolderName", "ifscCode"],
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
  const user = auth.user || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState({});
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  const userId = user?._id;
  const draftKey = `cad_complete_profile_draft_${userId || "unknown"}`;
  const progressPercent = Math.round(((currentStep + 1) / 6) * 100);

  useEffect(() => {
    const defaultValues = {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      email: user?.email || "",
      address: user?.address || "",
      profilePhotoUrl: user?.profilePhotoUrl || "",
      aadhaarPhotoUrl: user?.aadhaarPhotoUrl || "",
      accountNumber: user?.accountNumber || user?.bankDetails?.accountNumber || "",
      accountHolderName:
        user?.accountHolderName || user?.bankDetails?.accountHolderName || "",
      bankName: user?.bankName || user?.bankDetails?.bankName || "",
      branchName: user?.branchName || user?.bankDetails?.branchName || "",
      ifscCode: user?.ifscCode || user?.bankDetails?.ifscCode || "",
      upiId: user?.upiId || "",
      skills: Array.isArray(user?.skills) ? user.skills : [],
      experienceYears:
        user?.experienceYears ??
        user?.yearsOfExperience ??
        (Number.isFinite(Number(user?.yearsOfExperience))
          ? Number(user?.yearsOfExperience)
          : undefined),
      resumeUrl: user?.resumeUrl || "",
      addressProofUrl: user?.addressProofUrl || "",
    };

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) {
        form.setFieldsValue(defaultValues);
        return;
      }
      const draft = JSON.parse(raw);
      form.setFieldsValue({ ...defaultValues, ...draft });
      setIsDraftDirty(true);
    } catch {
      form.setFieldsValue(defaultValues);
    }
  }, [draftKey, form, user]);

  const isFieldFilled = (name, values) => {
    const value = values?.[name];
    if (name === "skills") return Array.isArray(value) && value.length > 0;
    if (name === "experienceYears")
      return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 50;
    if (typeof value === "string") return value.trim().length > 0;
    return value !== undefined && value !== null && value !== "";
  };

  const isFormReadyForSubmit = useMemo(() => {
    const values = form.getFieldsValue(true);
    const requiredOk = REQUIRED_FIELDS.every((fieldName) =>
      isFieldFilled(fieldName, values)
    );
    const ifscOk = IFSC_REGEX.test(String(values?.ifscCode || "").trim());
    const accountOk = ACCOUNT_NUMBER_REGEX.test(String(values?.accountNumber || "").trim());
    return requiredOk && ifscOk && accountOk;
  }, [form, currentStep, uploading, submitting]);

  const isCurrentStepValid = () => {
    const values = form.getFieldsValue(true);
    const fields = STEP_FIELD_MAP[currentStep] || [];

    const requiredOk = fields.every((fieldName) => isFieldFilled(fieldName, values));
    if (!requiredOk) return false;

    if (currentStep === 2) {
      if (!IFSC_REGEX.test(String(values?.ifscCode || "").trim())) return false;
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

    setUploading((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const { fileUrl } = await uploadImageToS3(fileObj, String(userId));
      form.setFieldValue(fieldName, fileUrl);
      message.success(cadBi.profile.fileUploaded);
    } catch (error) {
      message.error(error?.message || cadBi.profile.uploadFailed);
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
    return false;
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
    try {
      localStorage.setItem(draftKey, JSON.stringify(values));
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
          phone: values.phone,
          email: values.email,
          address: values.address,
          profilePhotoUrl: values.profilePhotoUrl || "",
        },
        kycDetails: {
          aadhaarPhotoUrl: values.aadhaarPhotoUrl,
        },
        bankDetails: {
          accountNumber: values.accountNumber,
          accountHolderName: values.accountHolderName,
          bankName: values.bankName || "",
          branchName: values.branchName || "",
          ifscCode: values.ifscCode,
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
      navigate("/dashboard", { replace: true });
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

  const renderUpload = (name, label, required = false) => {
    const value = form.getFieldValue(name);
    return (
      <Form.Item
        label={label}
        name={name}
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
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => uploadFieldFile(name, file)}
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            disabled={Boolean(uploading[name])}
          >
            <Button icon={<UploadOutlined />} loading={Boolean(uploading[name])}>
              {value ? cadBi.profile.replaceFile : cadBi.profile.uploadFile}
            </Button>
          </Upload>
          {value ? (
            <a href={value} target="_blank" rel="noreferrer">
              {cadBi.profile.previewFile}
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
          initialValues={{ email: user?.email || "", skills: [] }}
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
                  rules={[{ required: true, message: cadBi.profile.rules.phone }]}
                >
                  <Input placeholder={cadBi.profile.placeholders.phone} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={cadBi.profile.email} name="email">
                  <Input disabled />
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
              <Col xs={24}>{renderUpload("profilePhotoUrl", cadBi.profile.profilePhoto, false)}</Col>
            </Row>
          ) : null}

          {currentStep === 1 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24}>{renderUpload("aadhaarPhotoUrl", cadBi.profile.aadhaarPhoto, true)}</Col>
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
                  <Input placeholder={cadBi.profile.placeholders.accountNumber} />
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
                <Form.Item label={cadBi.profile.bankName} name="bankName">
                  <Input placeholder={cadBi.profile.placeholders.bankName} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={cadBi.profile.branchName} name="branchName">
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
                  <Input placeholder={cadBi.profile.placeholders.ifsc} />
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
              <Col xs={24}>{renderUpload("resumeUrl", cadBi.profile.resume, false)}</Col>
            </Row>
          ) : null}

          {currentStep === 5 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24}>{renderUpload("addressProofUrl", cadBi.profile.addressProof, false)}</Col>
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
              <Button type="primary" onClick={handleNext} disabled={!isCurrentStepValid()}>
                {cadBi.profile.next}
              </Button>
            ) : (
              <Button
                type="primary"
                loading={submitting}
                onClick={handleSubmit}
                disabled={!isFormReadyForSubmit || submitting}
              >
                {cadBi.profile.submitProfile}
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}
