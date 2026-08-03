import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import { normalizeRoleKey, ROLES } from "../constants/roles";

const COMPLETE_PROFILE_PATH = "/complete-profile";

export default function useProfileGuard() {
  const location = useLocation();
  const user = useSelector((state) => state.auth?.user);
  const sliceRole = useSelector((state) => state.auth?.role);

  return useMemo(() => {
    const role = normalizeRoleKey(sliceRole ?? user?.role);
    const isCad = role === ROLES.CAD || role === ROLES.CAD_USER;
    const profileCompleted = Boolean(user?.profileCompleted);
    const onCompleteProfilePage = location.pathname === COMPLETE_PROFILE_PATH;

    if (isCad && !profileCompleted && !onCompleteProfilePage) {
      return COMPLETE_PROFILE_PATH;
    }

    if (isCad && profileCompleted && onCompleteProfilePage) {
      return "/dashboard/cad";
    }

    return null;
  }, [location.pathname, sliceRole, user?.profileCompleted, user?.role]);
}
