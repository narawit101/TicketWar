import React from "react";
import { Message } from "@/types";
import { formatThaiDate } from "@/lib/date";

export const MAX_IMAGES = 10;
export const QUICK_REACTIONS = ["❤️", "😆", "😮", "😢", "😡", "👍"];
export const MAX_FILE_SIZE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB limit

// ponytail: strip emojis from chat messages without external libs
export const stripEmojis = (str: string) =>
  str.replace(
    /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    "",
  );

// 24-hour Thai time formatter for chat messages (e.g. 22:50 น.)
export const formatChatTime = (timeStr?: string) => {
  if (!timeStr) return "";

  if (timeStr.includes("น.")) return timeStr;

  // Convert 12-hour "10:50 PM" or "10:50 AM" to 24-hour Thai format
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const modifier = match[3].toUpperCase();
    if (modifier === "PM" && hour < 12) hour += 12;
    if (modifier === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute} น.`;
  }

  // Parse ISO date string
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return (
        d.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) + " น."
      );
    }
  } catch {}

  return timeStr;
};

// ponytail: detect pdf via mime or file extension
export const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export const isPdfUrl = (url?: string) =>
  !!url &&
  (url.startsWith("data:application/pdf") ||
    url.toLowerCase().includes(".pdf"));

// ponytail: extract original filename or clean fallback
export const getPdfFileName = (msg: Message) => {
  if (msg.text && msg.text.trim()) {
    return msg.text.trim();
  }
  if (msg.imageUrl) {
    try {
      const decoded = decodeURIComponent(msg.imageUrl);
      const filename = decoded.split("/").pop()?.split("?")[0];
      if (filename && filename.toLowerCase().endsWith(".pdf")) {
        return filename;
      }
    } catch {}
  }
  return "เอกสาร.pdf";
};

// 20 minutes gap triggers a time divider (like Messenger / Instagram)
const TIME_GAP_THRESHOLD_MS = 20 * 60 * 1000;

export interface ChatDividerInfo {
  type: "date" | "time";
  label: string;
}

export const parseMessageDate = (timeStr?: string): Date | null => {
  if (!timeStr) return null;

  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) return d;

  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM|\u0e19\.))?/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const modifier = match[3]?.toUpperCase();
    if (modifier === "PM" && hour < 12) hour += 12;
    if (modifier === "AM" && hour === 12) hour = 0;
    const today = new Date();
    today.setHours(hour, parseInt(minute, 10), 0, 0);
    return today;
  }

  return null;
};

// Format Messenger-style sent status ("ส่งแล้ว" -> "ส่งเมื่อ X นาทีที่แล้ว")
export const formatSentTime = (
  createdAt?: string,
  nowTimestamp = Date.now(),
): string => {
  const date = parseMessageDate(createdAt);
  if (!date) return "ส่งแล้ว";

  const diffMs = Math.max(0, nowTimestamp - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "ส่งแล้ว";
  }
  if (diffMinutes < 60) {
    return `ส่งเมื่อ ${diffMinutes} นาทีที่แล้ว`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `ส่งเมื่อ ${diffHours} ชั่วโมงที่แล้ว`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "ส่งเมื่อวานนี้";
  }
  if (diffDays < 7) {
    return `ส่งเมื่อ ${diffDays} วันที่แล้ว`;
  }

  return `ส่งเมื่อ ${formatThaiDate(date)}`;
};

const formatDateDividerLabel = (date: Date): string => {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const targetStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const diffDays = Math.round(
    (todayStart - targetStart) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "วันนี้";
  if (diffDays === 1) return "เมื่อวาน";
  return formatThaiDate(date);
};

export const getChatDivider = (
  currentMsg: Message,
  prevMsg?: Message,
): ChatDividerInfo | null => {
  const currDate = parseMessageDate(currentMsg.createdAt);
  if (!currDate) return null;

  if (!prevMsg) {
    return {
      type: "date",
      label: formatDateDividerLabel(currDate),
    };
  }

  const prevDate = parseMessageDate(prevMsg.createdAt);
  if (!prevDate) {
    return {
      type: "date",
      label: formatDateDividerLabel(currDate),
    };
  }

  const isDifferentDay =
    currDate.getFullYear() !== prevDate.getFullYear() ||
    currDate.getMonth() !== prevDate.getMonth() ||
    currDate.getDate() !== prevDate.getDate();

  if (isDifferentDay) {
    return {
      type: "date",
      label: formatDateDividerLabel(currDate),
    };
  }

  const diffMs = currDate.getTime() - prevDate.getTime();
  if (diffMs >= TIME_GAP_THRESHOLD_MS) {
    return {
      type: "time",
      label: formatChatTime(currentMsg.createdAt),
    };
  }

  return null;
};

// Match URLs (http, https, www)
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

export const extractFirstUrl = (text?: string): string | null => {
  if (!text) return null;
  const match = text.match(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/i);
  if (!match) return null;
  let url = match[0];
  url = url.replace(/[.,;!?)]+$/, "");
  return url.startsWith("http") ? url : `https://${url}`;
};

export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  try {
    const formatted = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(formatted);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null;
      }
    }
    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
  } catch {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : null;
  }
  return null;
};

export const renderMessageContent = (text: string, isMe: boolean) => {
  const clean = stripEmojis(text);
  if (!clean) return null;

  const parts = clean.split(URL_REGEX);

  return parts.map((part, idx) => {
    if (part.match(URL_REGEX)) {
      const href =
        part.startsWith("http://") || part.startsWith("https://")
          ? part
          : `https://${part}`;
      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`underline underline-offset-2 break-all transition cursor-pointer ${
            isMe
              ? "text-black hover:opacity-85 font-semibold decoration-black/70 hover:decoration-black"
              : "text-[#1ed760] hover:text-[#1cd05a] font-medium decoration-[#1ed760]/60 hover:decoration-[#1ed760]"
          }`}
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

// Browser native blob download with fallback to direct link
export const handleDownloadFile = async (url: string, filename?: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || (isPdfUrl(url) ? "document.pdf" : "image.png");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
};
