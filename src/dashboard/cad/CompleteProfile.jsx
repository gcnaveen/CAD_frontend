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
    console.log("VALUES:", values);
console.log("IFSC VALID:", IFSC_REGEX.test(values?.ifscCode || ""));
console.log("ACCOUNT VALID:", ACCOUNT_NUMBER_REGEX.test(values?.accountNumber || ""));
console.log("ERRORS:", form.getFieldsError(fields));
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
      message.success("File uploaded successfully");
    } catch (error) {
      message.error(error?.message || "Upload failed");
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
      message.error("Failed to update profile");
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

      message.success("Profile completed successfully");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const validationError = Array.isArray(error?.response?.data?.errors)
        ? error.response.data.errors[0]?.message
        : "";
      const msg =
        validationError ||
        error?.response?.data?.message ||
        "Failed to update profile";
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
        rules={required ? [{ required: true, message: `${label} is required` }] : []}
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
              {value ? "Replace file" : "Upload file"}
            </Button>
          </Upload>
          {value ? (
            <a href={value} target="_blank" rel="noreferrer">
              Preview uploaded file
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
            Complete Your Profile
          </Title>
          <Text type="secondary">
            Step {currentStep + 1}/6 - Finish required details to continue using the CAD portal.
          </Text>
          <Progress percent={progressPercent} size="small" showInfo={false} />
        </Space>

        <Steps
          current={currentStep}
          size="small"
          responsive
          style={{ marginTop: 16, marginBottom: 20 }}
          items={[
            { title: "Personal" },
            { title: "KYC" },
            { title: "Bank" },
            { title: "UPI" },
            { title: "Professional" },
            { title: "Documents" },
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
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: "First name is required" }]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: "Last name is required" }]}
                >
                  <Input placeholder="Enter last name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[{ required: true, message: "Phone is required" }]}
                >
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Email" name="email">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Address"
                  name="address"
                  rules={[{ required: true, message: "Address is required" }]}
                >
                  <Input.TextArea rows={3} placeholder="Enter address" />
                </Form.Item>
              </Col>
              <Col xs={24}>{renderUpload("profilePhotoUrl", "Profile Photo", false)}</Col>
            </Row>
          ) : null}

          {currentStep === 1 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24}>{renderUpload("aadhaarPhotoUrl", "Aadhaar Photo", true)}</Col>
            </Row>
          ) : null}

          {currentStep === 2 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Account Number"
                  name="accountNumber"
                  rules={[
                    { required: true, message: "Account number is required" },
                    {
                      pattern: ACCOUNT_NUMBER_REGEX,
                      message: "Account number must contain numbers only",
                    },
                  ]}
                >
                  <Input placeholder="Enter account number" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Account Holder Name"
                  name="accountHolderName"
                  rules={[{ required: true, message: "Account holder name is required" }]}
                >
                  <Input placeholder="Enter account holder name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Bank Name" name="bankName">
                  <Input placeholder="Enter bank name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Branch Name" name="branchName">
                  <Input placeholder="Enter branch name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="IFSC Code"
                  name="ifscCode"
                  rules={[
                    { required: true, message: "IFSC code is required" },
                    { pattern: IFSC_REGEX, message: "Enter a valid IFSC code" },
                  ]}
                >
                  <Input placeholder="e.g. SBIN0001234" />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {currentStep === 3 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item label="UPI ID" name="upiId">
                  <Input placeholder="name@bank" />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {currentStep === 4 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24}>
                <Form.Item
                  label="Skills"
                  name="skills"
                  rules={[{ required: true, message: "Select at least one skill" }]}
                >
                  <Select mode="tags" options={SKILL_OPTIONS.map((s) => ({ label: s, value: s }))} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Experience (Years)"
                  name="experienceYears"
                  rules={[
                    { required: true, message: "Experience is required" },
                    {
                      validator: (_, value) => {
                        if (value === undefined || value === null || value === "") {
                          return Promise.reject(new Error("Experience is required"));
                        }
                        const years = Number(value);
                        if (!Number.isFinite(years) || years < 0 || years > 50) {
                          return Promise.reject(
                            new Error("Experience must be between 0 and 50")
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber min={0} max={50} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24}>{renderUpload("resumeUrl", "Resume", false)}</Col>
            </Row>
          ) : null}

          {currentStep === 5 ? (
            <Row gutter={[12, 12]}>
              <Col xs={24}>{renderUpload("addressProofUrl", "Address Proof", false)}</Col>
              {isDraftDirty ? (
                <Col xs={24}>
                  <Text type="secondary">Draft auto-save enabled for this form.</Text>
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
              Back
            </Button>
            {currentStep < 5 ? (
              <Button type="primary" onClick={handleNext} disabled={!isCurrentStepValid()}>
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                loading={submitting}
                onClick={handleSubmit}
                disabled={!isFormReadyForSubmit || submitting}
              >
                Submit Profile
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}
