import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  Upload,
  message,
} from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { setCredentials } from "../../features/auth/authSlice";
import { getUserById, updateUser } from "../../services/user/userService";
import {
  uploadImageToS3,
  uploadSurveyDocumentToS3,
} from "../../services/upload/upload.service";
import { deleteUploadedFile } from "../../services/upload/upload.api.js";
import { getUploadErrorMessage } from "../../services/upload/upload.errors.js";
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
  resolveUserEmail,
  sanitizeIfsc,
} from "../../dashboard/cad/profileFormUtils.js";

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

const removeUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export default function EditProfile() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth || {});
  const user = auth.user || {};
  const userId = user?._id;
  const lockedEmail = resolveUserEmail(user);

  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState({});
  const [formVersion, setFormVersion] = useState(0);

  const bumpForm = () => setFormVersion((prev) => prev + 1);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        message.error("Failed to fetch profile");
        setFetching(false);
        return;
      }

      setFetching(true);
      try {
        const response = await getUserById(userId);
        const data = response?.data?.user || response?.user || response?.data || response || {};
        const email =
          resolveUserEmail(data) || resolveUserEmail(data.personalDetails) || lockedEmail;

        form.setFieldsValue({
          firstName: data.personalDetails?.firstName ?? data?.firstName ?? "",
          lastName: data.personalDetails?.lastName ?? data?.lastName ?? "",
          phone: normalizeIndianPhone(
            data.personalDetails?.phone ?? data.auth?.phone ?? data.phone ?? ""
          ),
          email,
          address: data.personalDetails?.address ?? "",
          profilePhotoUrl: data.personalDetails?.profilePhotoUrl ?? "",
          aadhaarPhotoUrl: data.kycDetails?.aadhaarPhotoUrl ?? "",
          accountNumber: data.bankDetails?.accountNumber ?? "",
          accountHolderName: data.bankDetails?.accountHolderName ?? "",
          bankName: data.bankDetails?.bankName ?? "",
          branchName: data.bankDetails?.branchName ?? "",
          ifscCode: sanitizeIfsc(data.bankDetails?.ifscCode ?? ""),
          upiId: data.upiDetails?.upiId ?? "",
          skills: data.professionalDetails?.skills || [],
          experienceYears: data.professionalDetails?.experienceYears,
          resumeUrl: data.professionalDetails?.resumeUrl ?? "",
          addressProofUrl: data.documents?.addressProofUrl ?? "",
        });
        bumpForm();
      } catch (error) {
        const msg = error?.response?.data?.message || error?.message || "Failed to fetch profile";
        message.error(msg);
      } finally {
        setFetching(false);
      }
    };

    fetchUser();
  }, [form, lockedEmail, userId]);

  const isFormReadyForSubmit = useMemo(() => {
    void formVersion;
    const values = form.getFieldsValue(true);
    const requiredOk = REQUIRED_FIELDS.every((name) => {
      const value = values?.[name];
      if (name === "skills") return Array.isArray(value) && value.length > 0;
      if (name === "experienceYears")
        return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 50;
      if (typeof value === "string") return value.trim().length > 0;
      return value !== undefined && value !== null && value !== "";
    });
    const ifscOk = IFSC_REGEX.test(sanitizeIfsc(values?.ifscCode));
    const accountOk = ACCOUNT_NUMBER_REGEX.test(String(values?.accountNumber || "").trim());
    const phoneOk = PHONE_REGEX.test(normalizeIndianPhone(values?.phone));
    return requiredOk && ifscOk && accountOk && phoneOk;
  }, [form, formVersion]);

  const uploadFieldFile = async (fieldName, file) => {
    const fileObj =
      file instanceof File
        ? file
        : file?.originFileObj instanceof File
          ? file.originFileObj
          : file;
    if (!fileObj || !userId) return false;

    if (isDocumentUploadField(fieldName) && isWordDocumentFile(fileObj)) {
      message.warning("Word files are not supported. Save as PDF and upload.");
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
      message.success("File uploaded successfully");
    } catch (error) {
      message.error(getUploadErrorMessage(error) || "Upload failed");
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

  const renderUpload = (name, label, { required = false, kind = "image" } = {}) => {
    const value = form.getFieldValue(name);
    const accept = kind === "document" ? DOCUMENT_UPLOAD_ACCEPT : IMAGE_UPLOAD_ACCEPT;
    const showPhoto = kind === "photo" && Boolean(value);
    return (
      <Form.Item
        label={label}
        name={name}
        extra={kind === "document" ? "PDF, JPG, or PNG" : undefined}
        rules={required ? [{ required: true, message: `${label} is required` }] : []}
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
              disabled={Boolean(uploading[name]) || !userId}
            >
              <Button icon={<UploadOutlined />} loading={Boolean(uploading[name])}>
                {value ? "Replace file" : "Upload file"}
              </Button>
            </Upload>
            {value ? (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteFile(name)}
                disabled={Boolean(uploading[name])}
              >
                Delete
              </Button>
            ) : null}
          </Space>
          {value ? (
            <a href={value} target="_blank" rel="noreferrer">
              {kind === "document" ? fileNameFromUrl(value) : "Preview uploaded file"}
            </a>
          ) : null}
        </Space>
      </Form.Item>
    );
  };

  const handleSubmit = async () => {
    if (updating || !isFormReadyForSubmit) return;
    if (!userId) {
      message.error("Failed to update profile");
      return;
    }

    setUpdating(true);
    try {
      await form.validateFields(REQUIRED_FIELDS);
      const values = trimObject(form.getFieldsValue(true));
      const skills = Array.isArray(values.skills) ? values.skills : [];
      const experienceYears = Number(values.experienceYears);
      const email = lockedEmail || values.email;

      const payload = removeUndefined({
        personalDetails: removeUndefined({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: normalizeIndianPhone(values.phone),
          email,
          address: values.address,
          profilePhotoUrl: values.profilePhotoUrl || "",
        }),
        kycDetails: removeUndefined({
          aadhaarPhotoUrl: values.aadhaarPhotoUrl,
        }),
        bankDetails: removeUndefined({
          accountNumber: values.accountNumber,
          accountHolderName: values.accountHolderName,
          bankName: values.bankName,
          branchName: values.branchName,
          ifscCode: sanitizeIfsc(values.ifscCode),
        }),
        upiDetails: removeUndefined({
          upiId: values.upiId || "",
        }),
        professionalDetails: removeUndefined({
          skills,
          experienceYears,
          resumeUrl: values.resumeUrl || "",
        }),
        documents: removeUndefined({
          addressProofUrl: values.addressProofUrl || "",
        }),
      });

      const response = await updateUser(userId, payload);
      const updatedUser = response?.data?.user || response?.user || response?.data || {};

      dispatch(
        setCredentials({
          token: auth?.token,
          user: {
            ...user,
            ...updatedUser,
          },
        })
      );

      message.success("Profile updated successfully");
    } catch (error) {
      const validationError = Array.isArray(error?.response?.data?.errors)
        ? error.response.data.errors[0]?.message
        : "";
      const msg = validationError || error?.response?.data?.message || "Failed to update profile";
      message.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", paddingBottom: 24 }}>
      <Card>
        <Space direction="vertical" size={6} style={{ width: "100%", marginBottom: 20 }}>
          <Title level={3} style={{ marginBottom: 0 }}>
            Edit Profile
          </Title>
          <Text type="secondary">Update your details and save changes.</Text>
        </Space>

        <Form form={form} layout="vertical" onValuesChange={bumpForm}>
          <Title level={5}>Personal Details</Title>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: "Last name is required" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[
                  { required: true, message: "Phone is required" },
                  { pattern: PHONE_REGEX, message: "Enter a valid 10-digit mobile number" },
                ]}
              >
                <Input
                  addonBefore="+91"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  onChange={(event) => {
                    form.setFieldValue("phone", normalizeIndianPhone(event?.target?.value));
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Email" name="email" extra="Email cannot be edited">
                <Input disabled readOnly placeholder={lockedEmail || "Email"} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: "Address is required" }]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24}>{renderUpload("profilePhotoUrl", "Profile Photo", { kind: "photo" })}</Col>
          </Row>

          <Divider />
          <Title level={5}>KYC</Title>
          <Row gutter={[12, 12]}>
            <Col xs={24}>
              {renderUpload("aadhaarPhotoUrl", "Aadhaar Photo", { required: true, kind: "image" })}
            </Col>
          </Row>

          <Divider />
          <Title level={5}>Bank Details</Title>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Account Number"
                name="accountNumber"
                rules={[
                  { required: true, message: "Account number is required" },
                  { pattern: ACCOUNT_NUMBER_REGEX, message: "Account number must be numeric" },
                ]}
              >
                <Input
                  onChange={(event) => {
                    form.setFieldValue(
                      "accountNumber",
                      String(event?.target?.value || "").replace(/\D/g, "")
                    );
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Account Holder Name"
                name="accountHolderName"
                rules={[{ required: true, message: "Account holder name is required" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Bank Name"
                name="bankName"
                rules={[{ required: true, message: "Bank name is required" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Branch Name"
                name="branchName"
                rules={[{ required: true, message: "Branch name is required" }]}
              >
                <Input />
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
                <Input
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                  onChange={(event) => {
                    form.setFieldValue("ifscCode", sanitizeIfsc(event?.target?.value));
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Title level={5}>UPI</Title>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item label="UPI ID" name="upiId">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Title level={5}>Professional Details</Title>
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
                      const years = Number(value);
                      if (!Number.isFinite(years) || years < 0 || years > 50) {
                        return Promise.reject(new Error("Experience must be between 0 and 50"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber min={0} max={50} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24}>{renderUpload("resumeUrl", "Resume", { kind: "document" })}</Col>
          </Row>

          <Divider />
          <Title level={5}>Documents</Title>
          <Row gutter={[12, 12]}>
            <Col xs={24}>{renderUpload("addressProofUrl", "Address Proof", { kind: "document" })}</Col>
          </Row>

          <div style={{ marginTop: 20 }}>
            <Space>
              <Button onClick={() => navigate(-1)} disabled={updating}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={updating || Object.values(uploading).some(Boolean)}
                disabled={updating || !isFormReadyForSubmit || Object.values(uploading).some(Boolean)}
              >
                Save Changes
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}
