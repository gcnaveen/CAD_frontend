import { USER_KEY } from "../config/axiosInstance";

export function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readPersistedAuthUser() {
  try {
    const raw = localStorage.getItem("persist:auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user) return null;
    return typeof parsed.user === "string" ? JSON.parse(parsed.user) : parsed.user;
  } catch {
    return null;
  }
}

export function getUserDisplayName(user) {
  const nameOnly = getUserNameOnly(user);
  if (nameOnly) return nameOnly;
  return user?.auth?.phone || user?.auth?.email || user?.email || "";
}

export function getUserNameOnly(user) {
  if (!user) return "";
  if (typeof user === "string") {
    try {
      return getUserNameOnly(JSON.parse(user));
    } catch {
      return user.trim();
    }
  }
  if (typeof user.name === "string" && user.name.trim()) {
    return user.name.trim();
  }

  const first =
    user.name?.first ??
    user.personalDetails?.firstName ??
    user.firstName ??
    "";
  const last =
    user.name?.last ??
    user.personalDetails?.lastName ??
    user.lastName ??
    "";
  return [first, last]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ")
    .trim();
}

export function resolveUserDisplayName(authUser) {
  const candidates = [
    authUser,
    readStoredUser(),
    readPersistedAuthUser(),
  ];

  for (const candidate of candidates) {
    const name = getUserNameOnly(candidate);
    if (name) return name;
  }

  const legacy = localStorage.getItem("userName")?.trim();
  if (legacy) return legacy;

  for (const candidate of candidates) {
    const fallback = getUserDisplayName(candidate);
    if (fallback) return fallback;
  }

  return "";
}

/** Name only — never phone/email. Use for avatars and greetings. */
export function resolveUserNameOnly(authUser) {
  const candidates = [authUser, readStoredUser(), readPersistedAuthUser()];

  for (const candidate of candidates) {
    const name = getUserNameOnly(candidate);
    if (name) return name;
  }

  return localStorage.getItem("userName")?.trim() || "";
}

export function getUserInitial(displayName) {
  const letter = displayName?.trim()?.charAt(0);
  return letter ? letter.toUpperCase() : "U";
}
