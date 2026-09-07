import { useSyncExternalStore } from "react";

export function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function checkIsIOS(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function subscribePwaPrompt(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("pwa:prompt-ready", callback);
  window.addEventListener("pwa:installed", callback);
  return () => {
    window.removeEventListener("pwa:prompt-ready", callback);
    window.removeEventListener("pwa:installed", callback);
  };
}

function subscribeStandalone(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  window.addEventListener("pwa:installed", callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener("pwa:installed", callback);
  };
}

function subscribeEmpty() {
  return () => {};
}

export function usePwaStatus() {
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    checkIsStandalone,
    () => false
  );

  const isIOS = useSyncExternalStore(
    subscribeEmpty,
    checkIsIOS,
    () => false
  );

  const canInstall = useSyncExternalStore(
    subscribePwaPrompt,
    () => (typeof window !== "undefined" ? !!window.__pwaInstallPrompt : false),
    () => false
  );

  const triggerNativePrompt = async (): Promise<boolean> => {
    const promptEvent =
      typeof window !== "undefined" ? window.__pwaInstallPrompt : undefined;
    if (!promptEvent) return false;

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    window.__pwaInstallPrompt = undefined;
    window.dispatchEvent(new CustomEvent("pwa:installed"));
    return outcome === "accepted";
  };

  return {
    isStandalone,
    isIOS,
    canInstall,
    triggerNativePrompt,
  };
}
