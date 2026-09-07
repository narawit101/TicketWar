"use client";

import { useEffect } from "react";
import type { BeforeInstallPromptEvent } from "@/types";

// Extend Window interface to store deferred install prompt
declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export function PwaRegister() {
  useEffect(() => {
    // 1. Register Service Worker if supported
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered:", registration.scope);
          })
          .catch((error) => {
            console.warn("[PWA] Service Worker registration failed:", error);
          });
      });
    }

    // 2. Capture beforeinstallprompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("pwa:prompt-ready"));
    };

    const handleAppInstalled = () => {
      window.__pwaInstallPrompt = undefined;
      window.dispatchEvent(new CustomEvent("pwa:installed"));
      console.log("[PWA] TicketWar installed successfully");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
