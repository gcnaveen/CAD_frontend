import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { getUserProfile } from "../services/user/userService";
import {
  getUserDisplayName,
  getUserInitial,
  getUserNameOnly,
  resolveUserNameOnly,
} from "../utils/userDisplayName";

export function useUserDisplayName() {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth?.user);
  const token = useSelector((s) => s.auth?.token);
  const authRehydrated = useSelector((s) => s.auth?._persist?.rehydrated);

  const localName = resolveUserNameOnly(authUser);
  const [fetchedName, setFetchedName] = useState(null);

  useEffect(() => {
    if (localName) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await getUserProfile();
        const profileUser =
          response?.data?.user ??
          response?.user ??
          response?.data ??
          response;
        const name = getUserNameOnly(profileUser) || getUserDisplayName(profileUser);

        if (cancelled || !name) return;

        setFetchedName(name);
        dispatch(
          setCredentials({
            token,
            user: { ...(authUser || {}), ...profileUser },
          })
        );
      } catch {
        // Keep whatever we already resolved locally
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [localName, authUser, authRehydrated, dispatch, token]);

  const displayName = localName || fetchedName || resolveUserNameOnly(null);
  const userName = displayName || "User";
  const userInitial = displayName ? getUserInitial(displayName) : "U";

  return { userName, userInitial, displayName };
}
