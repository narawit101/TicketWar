"use client";

import { useEffect } from "react";
import { Toaster, useToasterStore, toast } from "react-hot-toast";

const MAX_TOAST_LIMIT = 4;

export function LimitedToaster() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    // Filter only currently visible toasts
    const visibleToasts = toasts.filter((t) => t.visible);

    // If visible toasts exceed the limit, dismiss the oldest ones
    if (visibleToasts.length > MAX_TOAST_LIMIT) {
      const excessToasts = visibleToasts.slice(MAX_TOAST_LIMIT);
      excessToasts.forEach((t) => {
        toast.dismiss(t.id);
      });
    }
  }, [toasts]);

  return (
    <Toaster
      position="top-center"
      gutter={8}
      toastOptions={{
        style: {
          background: "#181818",
          color: "#ffffff",
          border: "1px solid #282828",
          borderRadius: "12px",
          fontSize: "13px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        },
        success: {
          iconTheme: {
            primary: "#1ed760",
            secondary: "#000000",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}

