import apiClient from "../apiClient.js";

/**
 * End-user login (mobile + password)
 * POST /api/auth/login
 */
export async function userLogin(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/login", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "User login failed";
    throw new Error(message);
  }
}

/**
 * Surveyor forgot password - step 1 (send OTP to phone)
 * POST /api/auth/surveyor/forgot-password/start
 */
export async function surveyorForgotPasswordStart(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/surveyor/forgot-password/start", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to send OTP";
    throw new Error(message);
  }
}

/**
 * Surveyor forgot password - step 2 (verify OTP + set new password)
 * POST /api/auth/surveyor/forgot-password/reset
 */
export async function surveyorForgotPasswordReset(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/surveyor/forgot-password/reset", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to reset password";
    throw new Error(message);
  }
}

/**
 * Full profile (end users)
 * GET /api/auth/profile
 */
export async function getUserProfile() {
  try {
    const { data } = await apiClient.get("/api/auth/profile");
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to get profile";
    throw new Error(message);
  }
}

/**
 * Update profile (name, email)
 * PATCH /api/auth/profile
 */
export async function updateUserProfile(payload) {
  try {
    const { data } = await apiClient.patch("/api/auth/profile", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to update profile";
    throw new Error(message);
  }
}

/**
 * List all users (for super admin). Filter by role on the frontend.
 * GET /api/users
 * @deprecated Use getUsersByRole instead
 */
export async function getUsers() {
  try {
    const { data } = await apiClient.get("/api/users");
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to fetch users";
    throw new Error(message);
  }
}

/**
 * List users with query params (role, page, limit, status)
 * GET /api/users?role=ADMIN&page=1&limit=20&status=ACTIVE
 */
export async function getUsersByRole(params = {}) {
  try {
    const { data } = await apiClient.get("/api/users", { params });
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to fetch users";
    throw new Error(message);
  }
}

/**
 * Create user (with role: SURVEYOR | CAD, etc.)
 * POST /api/users
 */
export async function createUser(payload) {
  try {
    const { data } = await apiClient.post("/api/users", payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to create user";
    throw new Error(message);
  }
}

/**
 * Get user by id
 * GET /api/users/:id
 */
export async function getUserById(id) {
  try {
    const { data } = await apiClient.get(`/api/users/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to fetch user";
    throw new Error(message);
  }
}

/**
 * Update user by id
 * PATCH /api/users/:id
 */
export async function updateUser(id, payload) {
  try {
    const { data } = await apiClient.patch(`/api/users/${id}`, payload);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to update user";
    throw new Error(message);
  }
}

/**
 * Delete user by id
 * DELETE /api/users/:id
 */
export async function deleteUser(id) {
  try {
    const { data } = await apiClient.delete(`/api/users/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? "Failed to delete user";
    throw new Error(message);
  }
}
