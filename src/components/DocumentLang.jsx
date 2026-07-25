import { useEffect } from "react";
import { useSelector } from "react-redux";

/**
 * Keeps <html lang> in sync with the app locale (en / kn) for screen readers.
 */
export default function DocumentLang() {
  const lang = useSelector((state) => state.language?.lang || "en");

  useEffect(() => {
    document.documentElement.lang = lang === "kn" ? "kn" : "en";
  }, [lang]);

  return null;
}
