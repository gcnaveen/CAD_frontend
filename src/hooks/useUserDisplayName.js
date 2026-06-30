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

  const [displayName, setDisplayName] = useState(() => resolveUserNameOnly(null));

  useEffect(() => {
    const localName = resolveUserNameOnly(authUser);
    if (localName) {
      setDisplayName(localName);
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
        const fetchedName = getUserNameOnly(profileUser) || getUserDisplayName(profileUser);

        if (cancelled || !fetchedName) return;

        setDisplayName(fetchedName);
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
  }, [authUser, authRehydrated, dispatch, token]);

  const userName = displayName || "User";
  const userInitial = displayName ? getUserInitial(displayName) : "U";

  return { userName, userInitial, displayName };
}