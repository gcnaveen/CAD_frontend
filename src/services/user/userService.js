import apiClient from "../apiClient.js";
import { getApiErrorMessage } from "../../utils/apiErrorMessage.js";

/**
 * End-user login (mobile + password)
 * POST /api/auth/login
 */
export async function userLogin(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/login", payload);
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "User login failed"));
  }
}

/** @deprecated Import from authService.js */
export { surveyorForgotPasswordStart, surveyorForgotPasswordReset } from "../auth/authService.js";

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

function unwrapEnrollmentPayload(body) {
  const root = body?.data ?? body;
  if (!root || typeof root !== "object") return {};
  return root.invite ?? root.enrollment ?? root;
}

/**
 * One-time enrollment invite for staff/operators (CAD, ADMIN).
 * Does not set or return a password — user chooses credentials via the link (M-04).
 * POST /api/users/enrollment-invite
 *
 * @param {{ role: string, email: string, firstName?: string, lastName?: string, cadCenter?: string }} payload
 * @returns {Promise<{ enrollmentUrl: string, expiresAt?: string, email?: string, userId?: string }>}
 */
export async function createEnrollmentInvite(payload) {
  try {
    const { data } = await apiClient.post("/api/users/enrollment-invite", payload);
    const invite = unwrapEnrollmentPayload(data);
    const enrollmentUrl =
      invite.enrollmentUrl ??
      invite.inviteUrl ??
      invite.url ??
      invite.link ??
      null;
    if (!enrollmentUrl) {
      throw new Error("Enrollment invite created but no link was returned");
    }
    return {
      enrollmentUrl: String(enrollmentUrl),
      expiresAt: invite.expiresAt ?? invite.expires ?? null,
      email: invite.email ?? payload.email,
      userId: invite.userId ?? invite.id ?? invite._id ?? null,
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create enrollment invite"));
  }
}

/**
 * Complete enrollment with one-time token (set password).
 * POST /api/auth/enrollment/complete
 * @param {{ token: string, password: string }} payload
 */
export async function completeEnrollment(payload) {
  try {
    const { data } = await apiClient.post("/api/auth/enrollment/complete", payload);
    return data?.data ?? data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to complete enrollment"));
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
