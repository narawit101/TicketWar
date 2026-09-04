/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Message } from "@/types";
import {
  Send,
  Paperclip,
  Loader2,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Calendar,
  Clock,
  FileText,
  Download,
} from "lucide-react";
import { formatThaiDate } from "@/lib/date";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { toast } from "react-hot-toast";

const MAX_IMAGES = 10;

interface LiveChatProps {
  messages: Message[];
  currentUserName: string;
  currentUserAvatar?: string | null;
  currentUserId?: string;
  onSendMessage: (
    text: string,
    imageUrl?: string,
    isShoutout?: boolean,
  ) => Promise<void> | void;
  onEditMessage?: (messageId: string, newText: string) => Promise<void> | void;
  onDeleteMessage?: (messageId: string) => Promise<void> | void;
  isReadOnly?: boolean;
}

// ponytail: strip emojis from chat messages without external libs
const stripEmojis = (str: string) =>
  str.replace(
    /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    "",
  );

// 24-hour Thai time formatter for chat messages (e.g. 22:50 น.)
const formatChatTime = (timeStr?: string) => {
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

// ponytail: detect pdf via mime or file extension (ceiling: standard pdf formats; upgrade: pdf content sniffing)
const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

const isPdfUrl = (url?: string) =>
  !!url &&
  (url.startsWith("data:application/pdf") ||
    url.toLowerCase().includes(".pdf"));

// ponytail: extract original filename or clean fallback (no AI slop text)
const getPdfFileName = (msg: Message) => {
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

interface ChatDividerInfo {
  type: "date" | "time";
  label: string;
}

const parseMessageDate = (timeStr?: string): Date | null => {
  if (!timeStr) return null;

  // Try parsing ISO or RFC date string
  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) return d;

  // Try parsing time string like "22:50 น." or "10:50 PM"
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

  if (diffDays === 0) {
    return "วันนี้";
  }
  if (diffDays === 1) {
    return "เมื่อวาน";
  }
  return formatThaiDate(date);
};

const getChatDivider = (
  currentMsg: Message,
  prevMsg?: Message,
): ChatDividerInfo | null => {
  const currDate = parseMessageDate(currentMsg.createdAt);
  if (!currDate) return null;

  // First message in the chat always shows the date
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

  // Check if calendar date changed
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

  // Same day: check if time difference is at least 20 minutes
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

const renderMessageContent = (text: string, isMe: boolean) => {
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

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  currentUserName,
  currentUserAvatar,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  isReadOnly = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [isUploading] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  // Message action states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Pending media preview before sending (Max 10)
  const [pendingFiles, setPendingFiles] = useState<
    { dataUrl: string; name: string }[]
  >([]);

  // Lightbox full-size view state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Confirm delete modal state
  const [messageToDelete, setMessageToDelete] = useState<{
    id: string;
    text?: string;
    isImage?: boolean;
    isPdf?: boolean;
  } | null>(null);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);

  // Focus chat input on mount without scrolling the outer page
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Close active dropdown menu when clicking outside
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-chat-menu]")) return;
      setActiveMenuId(null);
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // Lightbox keyboard escape listener
  useEffect(() => {
    if (!lightboxUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]);

  // Handle user scroll event to detect whether viewing older messages
  const handleScroll = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
    isAtBottomRef.current = isBottom;

    if (isBottom) {
      setShowScrollBottom(false);
      setNewMessagesCount(0);
    } else {
      setShowScrollBottom(true);
    }
  };

  // Smart auto-scroll / unread tracker
  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;

    const isInitial =
      prevMessagesLengthRef.current === 0 && messages.length > 0;
    const hasAddedMessage = messages.length > prevMessagesLengthRef.current;

    if (isInitial || isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setShowScrollBottom(false);
      setNewMessagesCount(0);
    } else if (hasAddedMessage) {
      setShowScrollBottom(true);
      setNewMessagesCount(
        (prev) => prev + (messages.length - prevMessagesLengthRef.current),
      );
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
      setShowScrollBottom(false);
      setNewMessagesCount(0);
      isAtBottomRef.current = true;
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditText(msg.text || "");
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (msgId: string) => {
    const clean = stripEmojis(editText.trim());
    if (!clean) return;
    if (onEditMessage) {
      await onEditMessage(msgId, clean);
    }
    setEditingMessageId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDelete = async (msgId: string) => {
    setActiveMenuId(null);
    if (onDeleteMessage) {
      await onDeleteMessage(msgId);
    }
  };

  // ponytail: browser native blob download with fallback to direct link
  const handleDownloadFile = async (url: string, filename?: string) => {
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

  const addFiles = (newFiles: { dataUrl: string; name: string }[]) => {
    if (newFiles.length === 0) return;
    setPendingFiles((prev) => {
      const remainingSlots = MAX_IMAGES - prev.length;
      if (remainingSlots <= 0) {
        toast.error(`แนบไฟล์ได้สูงสุด ${MAX_IMAGES} ไฟล์`);
        return prev;
      }
      if (newFiles.length > remainingSlots) {
        toast(
          `แนบไฟล์ได้สูงสุด ${MAX_IMAGES} ไฟล์ (เพิ่มได้อีก ${remainingSlots} ไฟล์)`,
        );
      }
      const added = newFiles.slice(0, remainingSlots);
      return [...prev, ...added];
    });
    inputRef.current?.focus();
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = stripEmojis(inputText.trim());
    if (!cleanText && pendingFiles.length === 0) return;

    const filesToSend = [...pendingFiles];
    const textToSend = cleanText;

    // Clear input immediately for smooth UX
    setInputText("");
    setPendingFiles([]);

    // 1. Send text as separate message if user typed anything
    if (textToSend) {
      await onSendMessage(textToSend, undefined, false);
    }

    // 2. Send each file: for PDF, pass original file.name so it displays the filename
    for (const file of filesToSend) {
      const isPdf = isPdfUrl(file.dataUrl);
      await onSendMessage(isPdf ? file.name : "", file.dataUrl, false);
    }
  };

  // ponytail: unified file reader for pasted, picked, or dropped media (ceiling: local memory base64; upgrade: direct multipart stream)
  const readAndAddFiles = (files: File[]) => {
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") || isPdfFile(file),
    );
    if (validFiles.length === 0) return;

    const readers = validFiles.map((file) => {
      return new Promise<{ dataUrl: string; name: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            dataUrl: (event.target?.result as string) || "",
            name: file.name || (isPdfFile(file) ? "document.pdf" : "image.png"),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((items) => {
      const valid = items.filter((item) => Boolean(item.dataUrl));
      addFiles(valid);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    readAndAddFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files: File[] = [];
    if (e.clipboardData?.files?.length) {
      files.push(...Array.from(e.clipboardData.files));
    } else if (e.clipboardData?.items?.length) {
      for (const item of Array.from(e.clipboardData.items)) {
        if (item.type.startsWith("image/") || item.type === "application/pdf") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      readAndAddFiles(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.some((f) => f.type.startsWith("image/") || isPdfFile(f))) {
      e.preventDefault();
      readAndAddFiles(files);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative bg-zinc-900/70 border border-zinc-800/80 rounded-xl flex flex-col h-full min-h-0 overflow-hidden shadow-sm"
    >
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/90 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760]" />
          <h3 className="font-bold text-zinc-100 text-sm sm:text-base">
            ข้อความในห้อง
          </h3>
        </div>
        <span className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-md">
          {messages.length} ข้อความ
        </span>
      </div>

      {/* Messages Stream */}
      <div
        ref={chatBodyRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-zinc-500">
              ยังไม่มีข้อความ เริ่มต้นพูดคุยกันในห้องได้เลย
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : undefined;
            const divider = getChatDivider(msg, prevMsg);

            const isMe = currentUserId
              ? msg.userId === currentUserId
              : msg.userName === currentUserName;
            const avatar =
              msg.userAvatar || (isMe ? currentUserAvatar : undefined);
            const isEditing = editingMessageId === msg.id;

            return (
              <React.Fragment key={msg.id}>
                {divider && (
                  <div className="flex items-center justify-center my-2 select-none">
                    <div className="flex-1 h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
                    <div className="m-3 px-3 py-0.5 rounded-full bg-[#1e1e1e]/90 border border-zinc-700/50 text-[11px] font-medium text-zinc-400 shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
                      {divider.type === "date" ? (
                        <Calendar className="w-3 h-3 text-[#1ed760]" />
                      ) : (
                        <Clock className="w-3 h-3 text-zinc-400" />
                      )}
                      <span>{divider.label}</span>
                    </div>
                    <div className="flex-1 h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
                  </div>
                )}

                {msg.isShoutout ? (
                  /* System Event Notification (e.g. seat secured / paid / dropped) */
                  <div className="flex justify-center my-1.5">
                    <div className="bg-zinc-800/90 border border-zinc-700/60 rounded-full px-4 py-1.5 text-xs sm:text-[13px] text-zinc-200 flex items-center gap-2 shadow-sm text-center">
                      <span>{stripEmojis(msg.text || "")}</span>
                      <span className="text-[11px] text-zinc-500 ml-1 shrink-0">
                        {formatChatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex gap-2.5 group items-end ${
                      isMe ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* User Avatar - Only show for other members, hide for own messages */}
                    {!isMe &&
                      (avatar ? (
                        <img
                          src={avatar}
                          alt={msg.userName}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0 mb-1"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#252525] border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center shrink-0 mb-1">
                          {msg.userName.charAt(0).toUpperCase()}
                        </div>
                      ))}

                    {/* Message Bubble + Action dots container */}
                    <div
                      className={`flex items-center gap-1.5 min-w-0 max-w-[80%] ${
                        isMe ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex flex-col min-w-0 ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-zinc-300">
                            {isMe ? "คุณ" : msg.userName}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {formatChatTime(msg.createdAt)}
                          </span>
                        </div>

                        {/* Message Bubble or Edit Box */}
                        {isEditing ? (
                          <div className="bg-[#181818] border border-[#383838] rounded-2xl p-3 shadow-2xl min-w-60 sm:min-w-72.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                            <div className="flex items-center justify-between text-[11px] text-[#b3b3b3]">
                              <span className="font-semibold text-white">
                                แก้ไขข้อความ
                              </span>
                              {/* <span className="text-[10px] text-[#727272]">
                                Esc ยกเลิก
                              </span> */}
                            </div>
                            <input
                              type="text"
                              autoFocus
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(msg.id);
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              className=" w-full bg-[#242424] text-white placeholder:text-[#6a6a6a] border border-[#383838] focus:border-[#1ed760] focus:ring-1 focus:ring-[#1ed760] focus:outline-none rounded-lg px-3 py-2 text-xs sm:text-sm transition-colors"
                              placeholder="พิมพ์ข้อความใหม่..."
                            />
                            <div className="flex items-center justify-end gap-1.5 pt-0.5 mt-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3 py-1 rounded-full text-xs font-semibold text-[#b3b3b3] hover:text-white hover:bg-[#282828] transition cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                disabled={!editText.trim()}
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#1ed760] hover:bg-[#1cd05a] disabled:bg-[#282828] disabled:text-[#6a6a6a] text-black transition cursor-pointer shadow-md flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5 stroke-3" />
                                <span>บันทึก</span>
                              </button>
                            </div>
                          </div>
                        ) : msg.imageUrl ? (
                          /* Image or PDF Message */
                          <div className="space-y-1.5">
                            {msg.text && !isPdfUrl(msg.imageUrl) && (
                              <div
                                className={`rounded-2xl text-[13px] sm:text-sm leading-relaxed p-3 ${
                                  isMe
                                    ? "bg-[#1ed760] text-black font-medium shadow-sm"
                                    : "bg-[#242424] text-zinc-100 border border-[#333333]"
                                }`}
                              >
                                <p className="wrap-break-word">
                                  {renderMessageContent(msg.text, isMe)}
                                </p>
                              </div>
                            )}

                            {isPdfUrl(msg.imageUrl) ? (
                              <a
                                href={msg.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-2xl bg-[#1f1f1f] hover:bg-[#282828] border border-[#333333] hover:border-[#4d4d4d] transition-all group text-left min-w-55 max-w-sm shadow-md"
                              >
                                <div className="w-10 h-10 rounded-xl bg-[#282828] border border-[#383838] flex items-center justify-center shrink-0 group-hover:border-[#4d4d4d] transition-colors">
                                  <FileText className="w-5 h-5 text-zinc-200 group-hover:text-white transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#1ed760] transition-colors"
                                    title={getPdfFileName(msg)}
                                  >
                                    {getPdfFileName(msg)}
                                  </p>
                                  <p className="text-[11px] text-[#b3b3b3]">
                                    PDF
                                  </p>
                                </div>
                              </a>
                            ) : (
                              <div
                                onClick={() =>
                                  setLightboxUrl(msg.imageUrl || null)
                                }
                                className="rounded-2xl overflow-hidden border border-zinc-800 shadow-md cursor-pointer group/img relative inline-block max-w-full"
                              >
                                <img
                                  src={msg.imageUrl}
                                  alt="รูปภาพที่แนบ"
                                  className="w-full max-h-72 object-contain transition-transform duration-200 block rounded-2xl"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center pointer-events-none rounded-2xl" />
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Text Only Message */
                          <div
                            className={`rounded-2xl text-[13px] sm:text-sm leading-relaxed p-3 ${
                              isMe
                                ? "bg-[#1ed760] text-black font-medium shadow-sm"
                                : "bg-[#242424] text-zinc-100 border border-[#333333]"
                            }`}
                          >
                            <p className="wrap-break-word">
                              {renderMessageContent(msg.text || "", isMe)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Three Dots Button (Hover action) - Own messages or messages with attachment */}
                      {((isMe && !isReadOnly && !isEditing) ||
                        (!isReadOnly && !!msg.imageUrl)) && (
                        <div
                          data-chat-menu
                          className="relative self-center shrink-0"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId((prev) =>
                                prev === msg.id ? null : msg.id,
                              );
                            }}
                            className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer ${
                              activeMenuId === msg.id
                                ? "opacity-100 bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === msg.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 min-w-32.5 bg-[#181818] border border-[#383838] rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100"
                            >
                              {/* Download file/image option */}
                              {msg.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    const filename = isPdfUrl(msg.imageUrl)
                                      ? getPdfFileName(msg)
                                      : `image_${msg.id.slice(0, 8)}.png`;
                                    handleDownloadFile(msg.imageUrl!, filename);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded-lg transition text-left cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#b3b3b3]" />
                                  <span>ดาวน์โหลด</span>
                                </button>
                              )}

                              {/* If message has text and isMe, can edit */}
                              {isMe && msg.text && !msg.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded-lg transition text-left cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-[#b3b3b3]" />
                                  <span>แก้ไข</span>
                                </button>
                              )}

                              {/* Delete option (Only for isMe) */}
                              {isMe && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setMessageToDelete({
                                      id: msg.id,
                                      text: msg.text || undefined,
                                      isImage:
                                        !!msg.imageUrl &&
                                        !isPdfUrl(msg.imageUrl),
                                      isPdf:
                                        !!msg.imageUrl &&
                                        isPdfUrl(msg.imageUrl),
                                    });
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>ลบ</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Upload notice banner */}
      {isUploading && (
        <div className="bg-[#1ed760]/10 text-[#1ed760] text-xs px-4 py-1.5 border-t border-[#1ed760]/20 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>กำลังประมวลผลรูปภาพ...</span>
        </div>
      )}

      {/* Scroll to Bottom / New Message Floating Pill */}
      {showScrollBottom && (
        <div className="absolute bottom-16 inset-x-0 flex justify-center pointer-events-none z-20">
          <button
            type="button"
            onClick={scrollToBottom}
            className={`pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl animate-in fade-in slide-in-from-bottom-2 cursor-pointer ${
              newMessagesCount > 0
                ? "bg-[#1ed760] hover:bg-[#1cd05a] text-black"
                : "bg-[#242424] hover:bg-[#303030] text-white border border-[#383838]"
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5] " />
            <span>
              {newMessagesCount > 0
                ? `ข้อความใหม่ (${newMessagesCount})`
                : "ล่าสุด"}
            </span>
          </button>
        </div>
      )}

      {/* Pending Files Preview Strip (Max 10 files) */}
      {pendingFiles.length > 0 && (
        <div className="px-3.5 py-2.5 bg-[#181818] border-t border-[#282828] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150 shrink-0">
          <div className="flex items-center gap-2.5 overflow-x-auto py-1 pr-2 min-w-0 max-w-full">
            {pendingFiles.map((file, idx) => {
              const isPdf = isPdfUrl(file.dataUrl);
              return (
                <div key={idx} className="relative group shrink-0">
                  {isPdf ? (
                    <div
                      className="h-14 max-w-45 sm:max-w-55 px-3 rounded-xl border border-[#383838] bg-[#242424] flex items-center gap-2.5 shadow-md group-hover:border-[#4d4d4d] transition-colors"
                      title={file.name}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#1f1f1f] border border-[#333333] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-zinc-200" />
                      </div>
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-[#b3b3b3]">PDF</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={file.dataUrl}
                      alt={`พรีวิว ${idx + 1}`}
                      className="w-14 h-14 object-contain rounded-xl border border-[#383838] shadow-md bg-[#181818]"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) =>
                        prev.filter((_, i) => i !== idx),
                      )
                    }
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#181818] hover:bg-black text-white border border-[#4d4d4d] flex items-center justify-center transition cursor-pointer shadow-lg"
                    title="ยกเลิกไฟล์นี้"
                  >
                    <X className="w-3 h-3 stroke-3" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#b3b3b3] font-medium whitespace-nowrap">
              {pendingFiles.length}/10
            </span>
            <button
              type="button"
              onClick={() => setPendingFiles([])}
              className="text-xs text-[#b3b3b3] hover:text-white px-2 py-1 rounded-md hover:bg-[#282828] transition cursor-pointer whitespace-nowrap"
            >
              ลบทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      {!isReadOnly ? (
        <form
          onSubmit={handleSend}
          onPaste={handlePaste}
          className="shrink-0 p-3 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center gap-2"
        >
          {/* Paperclip file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*,application/pdf,.pdf"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-lg transition cursor-pointer relative ${
              pendingFiles.length > 0
                ? "text-[#1ed760] bg-[#1ed760]/10 hover:bg-[#1ed760]/20"
                : "text-[#b3b3b3] hover:text-white hover:bg-[#282828]"
            }`}
            title="แนบรูปภาพหรือไฟล์ PDF (สูงสุด 10 ไฟล์)"
          >
            <Paperclip className="w-4 h-4" />
            {pendingFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1ed760] text-black text-[10px] font-bold flex items-center justify-center shadow-md">
                {pendingFiles.length}
              </span>
            )}
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="พิมพ์ข้อความ หรือวางรูปภาพ / PDF"
            className="bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 focus:border-zinc-600 focus:outline-none rounded-lg px-3.5 py-2 text-xs sm:text-sm flex-1 transition-colors"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputText.trim() && pendingFiles.length === 0}
            className="p-2.5 bg-[#1ed760] hover:bg-[#1cd05a] disabled:bg-[#252525] disabled:text-[#666666] text-black font-bold rounded-full transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
            title="ส่งข้อความ"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      ) : (
        <div className="p-3 bg-zinc-950/80 text-center text-xs text-zinc-500 border-t border-zinc-800/80">
          ห้องนี้ถูกจัดเก็บเข้าคลังประวัติแล้ว (อ่านอย่างเดียว)
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-zoom-out select-none"
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadFile(lightboxUrl, `image_${Date.now()}.png`);
              }}
              className="p-2.5 rounded-full bg-[#181818] hover:bg-[#282828] text-white border border-[#383838] transition cursor-pointer shadow-xl"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="p-2.5 rounded-full bg-[#181818] hover:bg-[#282828] text-white border border-[#383838] transition cursor-pointer shadow-xl"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] flex items-center justify-center cursor-default"
          >
            <img
              src={lightboxUrl}
              alt="ภาพขยาย"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-150"
            />
          </div>
        </div>
      )}

      {/* Confirm Delete Message / Image Modal */}
      <ConfirmActionModal
        isOpen={!!messageToDelete}
        type="DELETE_MESSAGE"
        itemTitle={
          messageToDelete?.isPdf
            ? "เอกสาร PDF"
            : messageToDelete?.isImage
              ? "รูปภาพ"
              : messageToDelete?.text
                ? messageToDelete.text.slice(0, 35)
                : "ข้อความนี้"
        }
        onClose={() => setMessageToDelete(null)}
        onConfirm={() => {
          if (messageToDelete) {
            const id = messageToDelete.id;
            setMessageToDelete(null);
            handleDelete(id);
          }
        }}
      />
    </div>
  );
};
