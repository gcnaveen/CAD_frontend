import apiClient from "../apiClient.js";

/**
 * Register Super Admin
 * POST /api/auth/superadmin/register
 */
export async function registerSuperAdmin(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/superadmin/register", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Bootstrap failed";
    throw new Error(message);
  }
}

/** @deprecated Use registerSuperAdmin */
export async function bootstrapSuperAdmin(payload) {
  return registerSuperAdmin(payload);
}

/**
 * Staff login (email + password)
 * POST /api/auth/login
 */
export async function staffLogin(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/login", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Staff login failed";
    throw new Error(message);
  }
}

/**
 * Current user (JWT payload)
 * GET /auth/me
 */
export async function getCurrentUser() {
  try {
    const { data } = await apiClient.get("/api/auth/me");
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to get current user";
    throw new Error(message);
  }
}

/**
 * Request OTP (registration)
 * POST /auth/signup/request-otp
 */
export async function requestOtp(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/signup/request-otp", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to request OTP";
    throw new Error(message);
  }
}

/**
 * Verify OTP + name, create user
 * POST /auth/signup/verify-otp
 */
export async function verifyOtp(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/signup/verify-otp", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to verify OTP";
    throw new Error(message);
  }
}

/**
 * Surveyor: Send OTP (start registration) – Step 1
 * POST /api/auth/surveyor/start
 * Payload: { phone, firstName, lastName }
 */
export async function surveyorStart(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/surveyor/start", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to send OTP";
    throw new Error(message);
  }
}

/**
 * Surveyor: Verify OTP – Step 2
 * POST /api/auth/surveyor/verify-otp
 * Payload: { phone, otp }
 */
export async function surveyorVerifyOtp(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/surveyor/verify-otp", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to verify OTP";
    throw new Error(message);
  }
}

/**
 * Surveyor: Complete registration – Step 3
 * POST /api/auth/surveyor/complete
 * Payload: { phone, password, district, taluka, category, surveyType }
 * surveyType: "LS" (Licensed) | "GS" (Government)
 */
export async function surveyorComplete(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/surveyor/complete", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Registration failed";
    throw new Error(message);
  }
}

/**
 * @deprecated Use surveyorStart, surveyorVerifyOtp, surveyorComplete instead
 */
export async function surveyourRequestOtp(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/surveyor/request-otp", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to request surveyor OTP";
    throw new Error(message);
  }
}

/**
 * @deprecated Use surveyorVerifyOtp instead
 */
export async function surveyourVerifyOtp(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/surveyor/verify-otp", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to verify surveyor OTP";
    throw new Error(message);
  }
}
