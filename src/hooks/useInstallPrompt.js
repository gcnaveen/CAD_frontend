import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Captures the PWA `beforeinstallprompt` event and exposes install controls.
 * @param {object} [options]
 * @param {() => void} [options.onInstalled] — Fired once when the app is installed (appinstalled).
 * @param {(outcome: 'accepted' | 'dismissed') => void} [options.onUserChoice] — After prompt(); user choice.
 */
export function useInstallPrompt(options = {}) {
  const { onInstalled, onUserChoice } = options;
  const onInstalledRef = useRef(onInstalled);
  const onUserChoiceRef = useRef(onUserChoice);

  useEffect(() => {
    onInstalledRef.current = onInstalled;
  }, [onInstalled]);

  useEffect(() => {
    onUserChoiceRef.current = onUserChoice;
  }, [onUserChoice]);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const deferredRef = useRef(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredRef.current = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      setInstalled(true);
      deferredRef.current = null;
      setDeferredPrompt(null);
      onInstalledRef.current?.();
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  const installApp = useCallback(async () => {
    const promptEvent = deferredRef.current;
    if (!promptEvent?.prompt) {
      return;
    }

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    onUserChoiceRef.current?.(outcome);

    deferredRef.current = null;
    setDeferredPrompt(null);
  }, []);

  const installable = Boolean(deferredPrompt) && !installed;

  return { installable, installApp, installed };
}
