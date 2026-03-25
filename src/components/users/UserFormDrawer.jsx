import React, { useEffect, useState } from "react";
import { Drawer, Form, Input, Button, Space, Typography, Select, Spin, message } from "antd";
import { useSelector } from "react-redux";
import { createUser, updateUser, getUserById } from "../../services/user/userService.js";
import { getDistricts } from "../../services/masters/districtService.js";
import { getTalukasByDistrict } from "../../services/masters/talukaService.js";
import { getCadCenters } from "../../services/masters/cadcenterservice.js";

const { Title } = Typography;

const SURVEY_TYPE_OPTIONS = [
  { value: "LS", label: "Licensed Surveyor (LS)" },
  { value: "GS", label: "Government Surveyor (GS)" },
];

function normalizeList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

const UserFormDrawer = ({ open, onClose, mode, role, userId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [cadCenters, setCadCenters] = useState([]);
  const [districtsLoaded, setDistrictsLoaded] = useState(false);
  const [userRole, setUserRole] = useState(role);
  
  // Get current user role from Redux
  const currentUserRole = useSelector((state) => state.auth?.role) || (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored)?.role : null;
    } catch {
      return null;
    }
  })();

  const selectedDistrict = Form.useWatch("district", form);
  const isEditMode = mode === "edit";
  const isSurveyor = userRole === "SURVEYOR";
  const isCad = userRole === "CAD";
  const isAdmin = userRole === "ADMIN";

  // Load districts for SURVEYOR role
  useEffect(() => {
    if (isSurveyor) {
      getDistricts()
        .then((res) => {
          const districtsList = normalizeList(res);
          setDistricts(districtsList);
          setDistrictsLoaded(true);
        })
        .catch(() => {
          setDistricts([]);
          setDistrictsLoaded(true);
        });
    }
  }, [isSurveyor]);

  // Load CAD centers for CAD role
  useEffect(() => {
    if (isCad) {
      getCadCenters()
        .then((res) => setCadCenters(normalizeList(res)))
        .catch(() => setCadCenters([]));
    }
  }, [isCad]);

  // Load talukas when district changes
  useEffect(() => {
    if (selectedDistrict && isSurveyor) {
      getTalukasByDistrict(selectedDistrict)
        .then((res) => setTalukas(normalizeList(res)))
        .catch(() => setTalukas([]));
    } else {
      setTalukas([]);
    }
  }, [selectedDistrict, isSurveyor]);

  // Fetch user details in edit mode
  useEffect(() => {
    if (isEditMode && userId && open) {
      setFetchingUser(true);
      
      // Helper function to set form values after user data is loaded
      const setFormValues = (user, districtsList = [], talukasList = []) => {
        setUserRole(user.role);
        
        // Handle both nested structure (name.first) and flattened structure
        const firstName = user.name?.first ?? "";
        const lastName = user.name?.last ?? "";
        const email = user.auth?.email ?? "";
        const phone = user.auth?.phone ?? "";
        
        const formValues = {
          firstName,
          lastName,
          email,
          phone,
        };

        // Handle SURVEYOR specific fields
        if (user.role === "SURVEYOR") {
          const districtValue = user.surveyorProfile?.district ?? user.district;
          const talukaValue = user.surveyorProfile?.taluka ?? user.taluka;
          const category = user.surveyorProfile?.category ?? "SURVEYOR";
          const surveyType = user.surveyorProfile?.surveyType ?? "";

          // Resolve district name to ID if needed
          let districtId = districtValue;
          if (districtValue && typeof districtValue === "string" && !districtValue.match(/^[0-9a-fA-F]{24}$/)) {
            const district = districtsList.find((d) => d.name === districtValue);
            if (district) {
              districtId = district._id ?? district.id;
            }
          }

          formValues.district = districtId;
          formValues.category = category;
          formValues.surveyType = surveyType;

          // Resolve taluka name to ID if needed
          if (talukaValue && districtId) {
            let talukaId = talukaValue;
            if (typeof talukaValue === "string" && !talukaValue.match(/^[0-9a-fA-F]{24}$/)) {
              const taluka = talukasList.find((t) => t.name === talukaValue);
              if (taluka) {
                talukaId = taluka._id ?? taluka.id;
              }
            }
            formValues.taluka = talukaId;
          }

          form.setFieldsValue(formValues);
        } else if (user.role === "CAD") {
          // Handle CAD specific fields
          const cadCenter = user.cadProfile?.cadCenter ?? user.cadCenter;
          formValues.cadCenter = cadCenter;
          form.setFieldsValue(formValues);
        } else {
          form.setFieldsValue(formValues);
        }
      };

      // Fetch user data
      Promise.all([
        getUserById(userId),
        isSurveyor && districtsLoaded ? Promise.resolve(districts) : isSurveyor ? getDistricts().then((res) => normalizeList(res)) : Promise.resolve([])
      ])
        .then(([userRes, districtsList]) => {
          const user = userRes?.data?.user ?? userRes?.data ?? userRes;
          
          // Update districts state if needed
          if (isSurveyor && districtsList.length > 0 && districts.length === 0) {
            setDistricts(districtsList);
            setDistrictsLoaded(true);
          }

          // If SURVEYOR and has district, load talukas
          if (user.role === "SURVEYOR" && user.surveyorProfile?.district) {
            const districtValue = user.surveyorProfile.district ?? user.district;
            let districtId = districtValue;
            
            // Resolve district name to ID
            if (districtValue && typeof districtValue === "string" && !districtValue.match(/^[0-9a-fA-F]{24}$/)) {
              const district = districtsList.find((d) => d.name === districtValue);
              if (district) {
                districtId = district._id ?? district.id;
              }
            }

            if (districtId) {
              getTalukasByDistrict(districtId)
                .then((res) => {
                  const talukasList = normalizeList(res);
                  setTalukas(talukasList);
                  setFormValues(user, districtsList, talukasList);
                })
                .catch(() => {
                  setFormValues(user, districtsList, []);
                });
            } else {
              setFormValues(user, districtsList, []);
            }
          } else {
            setFormValues(user, districtsList, []);
          }
        })
        .catch((err) => {
          message.error(err.message || "Failed to load user details");
          onClose();
        })
        .finally(() => {
          setFetchingUser(false);
        });
    } else if (!isEditMode && open) {
      // Reset form for add mode
      form.resetFields();
      setUserRole(role);
    }
  }, [isEditMode, userId, open, form, isSurveyor, districts, districtsLoaded, role, onClose]);

  const handleSubmit = async (values) => {
    // Prevent ADMIN from creating/editing ADMIN users
    if ((role === "ADMIN" || userRole === "ADMIN") && currentUserRole === "ADMIN") {
      message.error("You do not have permission to create or edit admin users.");
      return;
    }
    
    setLoading(true);
    try {
      if (isEditMode) {
        // Edit mode - prepare payload based on role
        const payload = {
          firstName: values.firstName,
          lastName: values.lastName || undefined,
        };

        if (isSurveyor) {
          payload.phone = values.phone;
          payload.category = values.category || "SURVEYOR";
          payload.surveyType = values.surveyType;

          // Resolve district ID to name
          if (values.district) {
            try {
              const district = districts.find((d) => (d._id ?? d.id) === values.district);
              if (district?.name) {
                payload.district = district.name;
              } else {
                payload.district = values.district;
              }
            } catch {
              payload.district = values.district;
            }
          }

          // Resolve taluka ID to name
          if (values.taluka && values.district) {
            try {
              const taluka = talukas.find((t) => (t._id ?? t.id) === values.taluka);
              if (taluka?.name) {
                payload.taluka = taluka.name;
              } else {
                payload.taluka = values.taluka;
              }
            } catch {
              payload.taluka = values.taluka;
            }
          }
        } else if (isCad || isAdmin) {
          payload.email = values.email;
          if (isCad) {
            payload.cadCenter = values.cadCenter || undefined;
          }
        }

        await updateUser(userId, payload);
        message.success("User updated successfully");
      } else {
        // Add mode - prepare payload based on role
        const payload = {
          role: role,
          firstName: values.firstName,
          lastName: values.lastName || undefined,
          password: values.password,
          status: "ACTIVE",
        };

        if (isSurveyor) {
          payload.phone = values.phone;
        } else if (isCad || isAdmin) {
          payload.email = values.email;
          if (isCad) {
            payload.cadCenter = values.cadCenter || undefined;
          }
        }

        await createUser(payload);
        message.success("User created successfully");
      }

      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(err.message || `Failed to ${isEditMode ? "update" : "create"} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const getTitle = () => {
    if (isEditMode) {
      return `Edit ${userRole === "SURVEYOR" ? "Surveyor" : userRole === "CAD" ? "CAD" : "Admin"} User`;
    }
    return `Add ${role === "SURVEYOR" ? "Surveyor" : role === "CAD" ? "CAD" : "Admin"} User`;
  };

  return (
    <Drawer
      title={getTitle()}
      placement="right"
      size="large"
      onClose={handleCancel}
      open={open}
      destroyOnClose
      footer={null}
    >
      <Spin spinning={fetchingUser}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            district: undefined,
            taluka: undefined,
            category: "SURVEYOR",
            surveyType: "",
            cadCenter: undefined,
          }}
        >
          {/* Role field - disabled/read-only */}
          <Form.Item label="Role">
            <Input disabled value={isEditMode ? userRole : role} />
          </Form.Item>

          {/* First Name */}
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: "Please enter first name" },
              { min: 2, message: "First name must be at least 2 characters" },
            ]}
          >
            <Input placeholder="Enter first name" size="large" />
          </Form.Item>

          {/* Last Name */}
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ min: 2, message: "Last name must be at least 2 characters" }]}
          >
            <Input placeholder="Enter last name (optional)" size="large" />
          </Form.Item>

          {/* Email - for ADMIN and CAD */}
          {(isAdmin || isCad) && (
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="Enter email address" size="large" type="email" />
            </Form.Item>
          )}

          {/* Phone - for SURVEYOR */}
          {isSurveyor && (
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: "Please enter phone number" },
                {
                  pattern: /^[\d\s\-+()]{10,}$/,
                  message: "Please enter a valid phone number",
                },
              ]}
            >
              <Input placeholder="Enter phone number" size="large" />
            </Form.Item>
          )}

          {/* Password - only in add mode */}
          {!isEditMode && (
            <>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please enter password" },
                  { pattern: /^\d{4}$/, message: "Password must be exactly 4 digits" },
                ]}
              >
                <Input.Password placeholder="Enter 4-digit numeric password" size="large" inputMode="numeric" maxLength={4} />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm 4-digit password" size="large" inputMode="numeric" maxLength={4} />
              </Form.Item>
            </>
          )}

          {/* CAD Center - for CAD role */}
          {isCad && (
            <Form.Item name="cadCenter" label="CAD Center">
              <Select
                placeholder="Select CAD center (optional)"
                size="large"
                allowClear
                showSearch
                optionFilterProp="label"
                options={cadCenters.map((c) => ({
                  value: c._id ?? c.id,
                  label: c.name ?? c.cadCenterName ?? "-",
                }))}
              />
            </Form.Item>
          )}

          {/* SURVEYOR specific fields */}
          {isSurveyor && (
            <>
              <Form.Item
                name="district"
                label="District"
                rules={[{ required: true, message: "Please select district" }]}
              >
                <Select
                  placeholder="Select district"
                  size="large"
                  showSearch
                  optionFilterProp="label"
                  disabled={!districtsLoaded}
                  options={districts.map((d) => ({
                    value: d._id ?? d.id,
                    label: d.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="taluka"
                label="Taluka"
                rules={[{ required: true, message: "Please select taluka" }]}
              >
                <Select
                  placeholder="Select taluka"
                  size="large"
                  showSearch
                  optionFilterProp="label"
                  disabled={!selectedDistrict}
                  options={talukas.map((t) => ({
                    value: t._id ?? t.id,
                    label: t.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: "Please select category" }]}
              >
                <Select
                  placeholder="Select category"
                  size="large"
                  options={[{ value: "SURVEYOR", label: "Surveyor" }]}
                />
              </Form.Item>

              <Form.Item
                name="surveyType"
                label="Survey Type"
                rules={[{ required: true, message: "Please select survey type" }]}
              >
                <Select
                  placeholder="Select survey type"
                  size="large"
                  options={SURVEY_TYPE_OPTIONS}
                />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
            <Space size="middle">
              <Button type="primary" htmlType="submit" size="large" loading={loading}>
                {isEditMode ? "Update" : "Create"}
              </Button>
              <Button size="large" onClick={handleCancel}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default UserFormDrawer;
