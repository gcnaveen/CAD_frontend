import { getStoredAccessToken } from "../../utils/authToken.js";
import { getApiErrorMessage } from "../../utils/apiErrorMessage.js";

/**
 * Geo master-data writes (district/taluka/hobli/village) require
 * Authorization: Bearer <accessToken> and SUPER_ADMIN.
 * GETs stay public — do not use this config on list/detail calls.
 */
export function masterWriteAuthConfig() {
  const token = getStoredAccessToken();
  if (!token) {
    throw new Error("Your session expired. Please sign in again.");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

/** Map write failures to clear session vs permission messages. */
export function handleMasterWriteError(error, fallbackMessage) {
  const status = error?.response?.status;
  if (status === 401) {
    throw new Error(
      getApiErrorMessage(error, "Your session expired. Please sign in again.")
    );
  }
  if (status === 403) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Insufficient permissions. Only Super Admin can create or edit geo master data."
      )
    );
  }
  throw new Error(getApiErrorMessage(error, fallbackMessage));
}
