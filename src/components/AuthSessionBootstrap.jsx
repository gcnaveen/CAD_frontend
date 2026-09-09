import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { startSessionRestore } from "../features/auth/sessionRestore.js";

/**
 * Restores the tab session after a browser refresh (M-02).
 * Dedupe and the restore itself live in sessionRestore.js so StrictMode's
 * double mount cannot cancel or duplicate an in-flight restore.
 */
export default function AuthSessionBootstrap({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    void startSessionRestore(dispatch);
  }, [dispatch]);

  return children;
}
