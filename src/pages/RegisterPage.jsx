import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  Button,
  ConfigProvider,
  Radio,
  message as antdMessage,
} from "antd";
import {
  surveyorStart,
  surveyorVerifyOtp,
  surveyorComplete,
} from "../services/auth/authService.js";

// District & Taluka IDs (replace with your backend IDs)
const DISTRICT_TALUKA_CONFIG = {
  districts: [
    { id: "507f1f77bcf86cd799439012", name: "Bengaluru Urban" },
    { id: "507f1f77bcf86cd799439014", name: "Bengaluru Rural" },
    { id: "507f1f77bcf86cd799439015", name: "Mysuru" },
    { id: "507f1f77bcf86cd799439016", name: "Mangaluru" },
    { id: "507f1f77bcf86cd799439017", name: "Hubballi-Dharwad" },
    { id: "507f1f77bcf86cd799439018", name: "Belagavi" },
    { id: "507f1f77bcf86cd799439019", name: "Kalaburagi" },
  ],
  talukas: {
    "507f1f77bcf86cd799439012": [
      { id: "507f1f77bcf86cd799439013", name: "Bangalore North" },
      { id: "507f1f77bcf86cd799439020", name: "Bangalore South" },
      { id: "507f1f77bcf86cd799439021", name: "Anekal" },
    ],
    // Add talukas for other district IDs - replace with your backend IDs
  },
};

const darkTheme = {
  token: {
    colorBgContainer: "#27272a",
    colorBorder: "#3f3f46",
    colorPrimary: "#22d3ee",
    colorText: "#fafafa",
    colorTextPlaceholder: "#71717a",
    colorBgElevated: "#18181b",
    controlOutline: "rgba(34, 211, 238, 0.2)",
  },
  components: {
    Input: {
      activeBorderColor: "#22d3ee",
      hoverBorderColor: "#52525b",
    },
    Select: {
      optionSelectedBg: "rgba(34, 211, 238, 0.15)",
    },
    Button: {
      primaryColor: "#000",
    },
  },
};

const RegisterPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const selectedDistrictId = Form.useWatch("district", form);

  const getMobile = () => {
    const phone = form.getFieldValue("phone");
    return (phone || "").replace(/\D/g, "").slice(0, 10);
  };

  const handleRequestOtp = async () => {
    const firstName = form.getFieldValue("firstName")?.trim?.() ?? "";
    const lastName = form.getFieldValue("lastName")?.trim?.() ?? "";
    const phone = getMobile();
    if (!firstName) {
      antdMessage.error("Please enter your first name.");
      return;
    }
    if (!lastName) {
      antdMessage.error("Please enter your last name.");
      return;
    }
    if (phone.length < 10) {
      antdMessage.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setSendingOtp(true);
    try {
      await surveyorStart({
        phone,
        firstName,
        lastName,
      });
      setOtpSent(true);
      antdMessage.success("OTP sent successfully.");
    } catch (err) {
      antdMessage.error(err?.message ?? "Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const phone = getMobile();
    const otp = form.getFieldValue("otp")?.trim?.() ?? "";
    if (phone.length < 10) {
      antdMessage.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (otp.length < 4) {
      antdMessage.error("Please enter the OTP sent to your mobile.");
      return;
    }
    setVerifyingOtp(true);
    try {
      await surveyorVerifyOtp({ phone, otp });
      antdMessage.success("OTP verified successfully.");
      setIsOtpVerified(true);
      setStep(2);
    } catch (err) {
      antdMessage.error(err?.message ?? "OTP verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onFinishStep2 = async (values) => {
    const phone = getMobile();
    setIsLoading(true);
    try {
      await surveyorComplete({
        phone,
        password: values.password,
        district: values.district,
        taluka: values.taluk,
        category: "SURVEYOR",
        surveyType: values.surveyorType,
      });
      antdMessage.success("Registration successful. Please login.");
      navigate("/login", { replace: true });
    } catch (err) {
      antdMessage.error(err?.message ?? "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setStep(1);
    setOtpSent(false);
    setIsOtpVerified(false);
  };

  const onValuesChange = (changed) => {
    if ("district" in changed) {
      form.setFieldsValue({ taluk: undefined });
    }
  };

  const districtOptions = (DISTRICT_TALUKA_CONFIG.districts || []).map((d) => ({
    value: d.id,
    label: d.name,
  }));
  const talukOptions = selectedDistrictId
    ? (DISTRICT_TALUKA_CONFIG.talukas[selectedDistrictId] || []).map((t) => ({
        value: t.id,
        label: t.name,
      }))
    : [];

  return (
    <ConfigProvider theme={darkTheme}>
      <div className="min-h-screen bg-black py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

        <div className="relative w-full max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="h-34 sm:h-26 w-auto mx-auto mb-4 sm:mb-6 object-contain"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Join us to convert your sketches into CAD designs
            </p>
            {step === 1 && (
              <p className="text-cyan-400/90 text-xs sm:text-sm mt-1">
                Step 1: Enter details & verify OTP
              </p>
            )}
            {step === 2 && (
              <p className="text-cyan-400/90 text-xs sm:text-sm mt-1">
                Step 2: Set password & complete registration
              </p>
            )}
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => {
                if (step === 2 && isOtpVerified) {
                  onFinishStep2(values);
                }
              }}
              onValuesChange={onValuesChange}
              requiredMark={false}
              initialValues={{ state: "Karnataka" }}
              className="register-form"
            >
              {/* STEP 1: Name, Mobile, OTP */}
              {step === 1 && (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-base sm:text-lg font-semibold text-white border-b border-zinc-700 pb-2 mb-4 sm:mb-5">
                    Basic Details & OTP Verification
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <Form.Item
                      name="firstName"
                      label={
                        <span className="text-gray-300 text-sm">First Name</span>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Please enter your first name",
                        },
                      ]}
                      className="mb-0"
                    >
                      <Input
                        placeholder="Enter first name"
                        size="large"
                        className="rounded-lg"
                        disabled={isOtpVerified}
                      />
                    </Form.Item>
                    <Form.Item
                      name="lastName"
                      label={
                        <span className="text-gray-300 text-sm">Last Name</span>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Please enter your last name",
                        },
                      ]}
                      className="mb-0"
                    >
                      <Input
                        placeholder="Enter last name"
                        size="large"
                        className="rounded-lg"
                        disabled={isOtpVerified}
                      />
                    </Form.Item>
                    <Form.Item
                      name="phone"
                      label={
                        <span className="text-gray-300 text-sm">
                          Mobile Number
                        </span>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Please enter your mobile number",
                        },
                        {
                          validator: (_, value) => {
                            const digits = (value || "").replace(/\D/g, "");
                            if (digits.length !== 10) {
                              return Promise.reject(
                                new Error("Mobile must be 10 digits")
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      className="mb-0 sm:col-span-2"
                    >
                      <Input
                        placeholder="9876543210"
                        size="large"
                        className="rounded-lg"
                        addonBefore={
                          <span className="text-gray-400">+91</span>
                        }
                        maxLength={10}
                        disabled={isOtpVerified}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                          form.setFieldValue("phone", v);
                        }}
                      />
                    </Form.Item>

                    {otpSent && (
                      <>
                        <Form.Item
                          name="otp"
                          label={
                            <span className="text-gray-300 text-sm">
                              Enter OTP
                            </span>
                          }
                          rules={[
                            {
                              required: true,
                              message: "Please enter the OTP sent to your mobile",
                            },
                            {
                              min: 4,
                              message: "Enter a valid OTP",
                            },
                          ]}
                          className="mb-0 sm:col-span-2"
                        >
                          <Input
                            placeholder="Enter OTP"
                            size="large"
                            className="rounded-lg"
                            maxLength={8}
                            disabled={isOtpVerified}
                          />
                        </Form.Item>
                        {!isOtpVerified && (
                          <div className="flex flex-wrap gap-2 sm:col-span-2">
                            <Button
                              type="primary"
                              size="large"
                              loading={verifyingOtp}
                              onClick={handleVerifyOtp}
                              className="rounded-xl bg-cyan-500 hover:!bg-cyan-400 !text-black font-semibold border-0 shadow-lg shadow-cyan-500/25"
                            >
                              {verifyingOtp ? "Verifying..." : "Verify OTP"}
                            </Button>
                            <Button
                              size="large"
                              loading={sendingOtp}
                              onClick={handleRequestOtp}
                              className="rounded-xl border-zinc-600 text-gray-300 hover:!border-zinc-500 hover:!text-white hover:!bg-zinc-800"
                            >
                              {sendingOtp ? "Sending..." : "Resend OTP"}
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {!otpSent && !isOtpVerified && (
                      <div className="sm:col-span-2">
                        <Button
                          type="primary"
                          size="large"
                          loading={sendingOtp}
                          onClick={handleRequestOtp}
                          className="w-full sm:w-auto rounded-xl bg-cyan-500 hover:!bg-cyan-400 !text-black font-semibold border-0 shadow-lg shadow-cyan-500/25"
                        >
                          {sendingOtp ? "Sending OTP..." : "Send OTP"}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="default"
                      size="large"
                      onClick={handleCancel}
                      className="rounded-xl border-zinc-600 text-gray-300 hover:!border-zinc-500 hover:!text-white hover:!bg-zinc-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Remaining fields (only after OTP verified) */}
              {step === 2 && isOtpVerified && (
                <>
                  <div className="mb-6 sm:mb-8">
                    <h2 className="text-base sm:text-lg font-semibold text-white border-b border-zinc-700 pb-2 mb-4 sm:mb-5">
                      Complete Your Profile
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <Form.Item
                        name="password"
                        label={
                          <span className="text-gray-300 text-sm">
                            Password
                          </span>
                        }
                        rules={[
                          {
                            required: true,
                            message: "Please enter password",
                          },
                          {
                            min: 6,
                            message: "Password must be at least 6 characters",
                          },
                        ]}
                        className="mb-0"
                      >
                        <Input.Password
                          placeholder="Enter password"
                          size="large"
                          className="rounded-lg"
                        />
                      </Form.Item>
                      <Form.Item
                        name="confirmPassword"
                        label={
                          <span className="text-gray-300 text-sm">
                            Confirm Password
                          </span>
                        }
                        dependencies={["password"]}
                        rules={[
                          {
                            required: true,
                            message: "Please confirm password",
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (
                                !value ||
                                getFieldValue("password") === value
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error("Passwords do not match")
                              );
                            },
                          }),
                        ]}
                        className="mb-0"
                      >
                        <Input.Password
                          placeholder="Confirm password"
                          size="large"
                          className="rounded-lg"
                        />
                      </Form.Item>

                      <Form.Item
                        name="surveyorType"
                        label={
                          <span className="text-gray-300 text-sm">
                            Surveyor Type
                          </span>
                        }
                        rules={[
                          {
                            required: true,
                            message: "Please select your surveyor type",
                          },
                        ]}
                        className="mb-0 sm:col-span-2"
                      >
                        <Radio.Group className="text-gray-300">
                          <Radio value="LS">Licensed Surveyor</Radio>
                          <Radio value="GS">Government Surveyor</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="mb-6 sm:mb-8">
                    <h2 className="text-base sm:text-lg font-semibold text-white border-b border-zinc-700 pb-2 mb-4 sm:mb-5">
                      Location Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <Form.Item
                        name="state"
                        label={
                          <span className="text-gray-300 text-sm">State</span>
                        }
                        rules={[
                          {
                            required: true,
                            message: "Please select state",
                          },
                        ]}
                        className="mb-0"
                      >
                        <Input size="large" disabled value="Karnataka" />
                      </Form.Item>
                      <Form.Item
                        name="district"
                        label={
                          <span className="text-gray-300 text-sm">
                            District
                          </span>
                        }
                        rules={[
                          {
                            required: true,
                            message: "Please select district",
                          },
                        ]}
                        className="mb-0"
                      >
                        <Select
                          placeholder="Select district"
                          size="large"
                          className="w-full rounded-lg register-select"
                          allowClear
                          options={districtOptions}
                        />
                      </Form.Item>
                      <Form.Item
                        name="taluk"
                        label={
                          <span className="text-gray-300 text-sm">Taluk</span>
                        }
                        rules={[
                          {
                            required: true,
                            message: "Please select taluk",
                          },
                        ]}
                        className="mb-0"
                        dependencies={["district"]}
                      >
                        <Select
                          placeholder={
                            selectedDistrictId
                              ? "Select taluk"
                              : "Select district first"
                          }
                          size="large"
                          className="w-full rounded-lg register-select"
                          allowClear
                          disabled={!selectedDistrictId}
                          options={talukOptions}
                        />
                      </Form.Item>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
                    <Button
                      type="default"
                      size="large"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12 rounded-xl border-zinc-600 text-gray-300 hover:!border-zinc-500 hover:!text-white hover:!bg-zinc-800"
                    >
                      Back
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={isLoading}
                      className="flex-1 h-12 rounded-xl bg-cyan-500 hover:!bg-cyan-400 !text-black font-semibold border-0 shadow-lg shadow-cyan-500/25"
                    >
                      {isLoading ? "Registering..." : "Register"}
                    </Button>
                  </div>
                </>
              )}
            </Form>
          </div>

          <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>

          <p className="text-center text-sm text-gray-400 pt-2">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Login here
            </a>
          </p>
        </div>
      </div>

      <style>{`
        .register-form .ant-input,
        .register-form .ant-select-selector,
        .register-form .ant-input-affix-wrapper {
          border-radius: 0.5rem !important;
          background: #27272a !important;
          border-color: #3f3f46 !important;
          color: #fafafa !important;
        }
        .register-form .ant-input::placeholder,
        .register-form .ant-select-selection-placeholder {
          color: #71717a !important;
        }
        .register-form .ant-input:hover,
        .register-form .ant-select-selector:hover,
        .register-form .ant-input-affix-wrapper:hover {
          border-color: #52525b !important;
        }
        .register-form .ant-input:focus,
        .register-form .ant-input-focused,
        .register-form .ant-select-focused .ant-select-selector {
          border-color: #22d3ee !important;
          box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2) !important;
        }
        .register-form .ant-form-item-label > label {
          color: #d4d4d8 !important;
        }
        .register-form .ant-form-item-explain-error {
          color: #f87171 !important;
        }
        .register-select.ant-select-single.ant-select-open .ant-select-selector {
          border-color: #22d3ee !important;
        }
        .register-form .ant-input-group-addon {
          background: #27272a !important;
          border-color: #3f3f46 !important;
          color: #a1a1aa !important;
          border-radius: 0.5rem 0 0 0.5rem !important;
        }
        @media (max-width: 640px) {
          .register-form .ant-form-item {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </ConfigProvider>
  );
};

export default RegisterPage;
