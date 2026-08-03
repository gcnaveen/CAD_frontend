import { logout } from "../features/auth/authSlice.js";

export async function performFullLogout(dispatch) {
  try {
    const { logoutSession } = await import("../services/auth/authService.js");
    await logoutSession();
  } catch {
    /* ignore */
  }
  dispatch(logout());
}
