import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const COMPLETE_PROFILE_PATH = "/complete-profile";

export default function useProfileGuard() {
  const location = useLocation();
  const user = useSelector((state) => state.auth?.user);

  return useMemo(() => {
    const role = String(user?.role || "").toUpperCase();
    const isCad = role === "CAD" || role === "CAD_USER";
    const profileCompleted = Boolean(user?.profileCompleted);
    const onCompleteProfilePage = location.pathname === COMPLETE_PROFILE_PATH;

    if (isCad && !profileCompleted && !onCompleteProfilePage) {
      return COMPLETE_PROFILE_PATH;
    }

    if (isCad && profileCompleted && onCompleteProfilePage) {
      return "/dashboard/cad";
    }

    return null;
  }, [location.pathname, user?.profileCompleted, user?.role]);
}
