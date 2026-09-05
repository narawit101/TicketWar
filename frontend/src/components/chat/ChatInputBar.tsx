/* eslint-disable @next/next/no-img-element */
import React, { useRef, useEffect, useState } from "react";
import { ReplyToMessage } from "@/types";
import {
  Send,
  Paperclip,
  CornerUpLeft,
  FileText,
  X,
  Globe,
} from "lucide-react";
import {
  isPdfUrl,
  isPdfFile,
  MAX_IMAGES,
  MAX_FILE_SIZE_BYTES,
  stripEmojis,
  extractFirstUrl,
} from "./chatUtils";
import { toast } from "react-hot-toast";
import { fetchLinkPreview, LinkPreviewData } from "./LinkPreviewCard";

interface ChatInputBarProps {
  isReadOnly?: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  pendingFiles: { dataUrl: string; name: string }[];
  setPendingFiles: React.Dispatch<
    React.SetStateAction<{ dataUrl: string; name: string }[]>
  >;
  replyingTo: ReplyToMessage | null;
  onCancelReply: () => void;
  onSendMessage: (
    text: string,
    imageUrl?: string,
    isShoutout?: boolean,
    replyTo?: ReplyToMessage | null,
  ) => Promise<void> | void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onScrollToBottom: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  isReadOnly = false,
  inputText,
  setInputText,
  pendingFiles,
  setPendingFiles,
  replyingTo,
  onCancelReply,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onScrollToBottom,
  inputRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Link preview states while typing (Messenger style)
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);

  // Auto-detect link in input and fetch preview data with debounce
  useEffect(() => {
    const url = extractFirstUrl(inputText);
    let isCurrent = true;

    const timer = setTimeout(async () => {
      if (!url || url === dismissedUrl) {
        if (isCurrent) setPreviewData(null);
        return;
      }

      const data = await fetchLinkPreview(url);
      if (isCurrent) {
        if (data && (data.title || data.image)) {
          setPreviewData(data);
        } else {
          setPreviewData(null);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [inputText, dismissedUrl]);

  // Auto-resize textarea height as user types
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = "auto";
    const maxHeight = 128;

    if (!inputText) {
      el.style.overflowY = "hidden";
      return;
    }

    if (el.scrollHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${el.scrollHeight}px`;
      el.style.overflowY = "hidden";
    }
  }, [inputText, inputRef]);

  // Handle input text change and trigger typing indicator with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!onTypingStart) return;

    onTypingStart();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop?.();
    }, 2000);
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

  const readAndAddFiles = (files: File[]) => {
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/") && !isPdfFile(file)) continue;
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          `ไฟล์ "${file.name}" มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 3.5 MB)`,
        );
        continue;
      }
      validFiles.push(file);
    }
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = stripEmojis(inputText.trim());
    if (!cleanText && pendingFiles.length === 0) return;

    const filesToSend = [...pendingFiles];
    const textToSend = cleanText;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTypingStop?.();

    // Clear input and reset height immediately for smooth UX
    setInputText("");
    setPendingFiles([]);
    setPreviewData(null);
    setDismissedUrl(null);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.overflowY = "hidden";
    }
    onScrollToBottom();

    const replyToSend = replyingTo;
    onCancelReply();

    // 1. Send text as separate message if user typed anything
    if (textToSend) {
      onSendMessage(textToSend, undefined, false, replyToSend);
    }

    // 2. Send each file concurrently: for PDF, pass original file.name so it displays the filename
    for (const file of filesToSend) {
      const isPdf = isPdfUrl(file.dataUrl);
      onSendMessage(isPdf ? file.name : "", file.dataUrl, false, replyToSend);
    }
  };

  return (
    <React.Fragment>
      {/* Replying Preview Bar */}
      {replyingTo && (
        <div className="px-3.5 py-2 bg-[#181818] border-t border-[#282828] flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <CornerUpLeft className="w-4 h-4 text-[#1ed760] shrink-0" />

            {/* Thumbnail preview if replying to image or pdf */}
            {replyingTo.imageUrl &&
              (isPdfUrl(replyingTo.imageUrl) ? (
                <div className="w-9 h-9 rounded-lg bg-[#242424] border border-[#383838] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-zinc-300" />
                </div>
              ) : (
                <img
                  src={replyingTo.imageUrl}
                  alt="พรีวิว"
                  className="w-9 h-9 rounded-lg object-cover border border-[#383838] shrink-0 bg-[#242424]"
                />
              ))}

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#1ed760] leading-none mb-1">
                กำลังตอบกลับ {replyingTo.userName}
              </p>
              {replyingTo.text ? (
                <p className="text-xs text-zinc-300 truncate">
                  {replyingTo.text}
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  {isPdfUrl(replyingTo.imageUrl) ? "เอกสาร PDF" : "รูปภาพ"}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#282828] transition cursor-pointer shrink-0"
            title="ยกเลิกตอบกลับ"
          >
            <X className="w-3.5 h-3.5" />
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

      {/* Link Preview Bar (Messenger-style above input bar) */}
      {previewData && (
        <div className="px-3.5 py-2.5 bg-[#181818] border-t border-[#282828] flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Thumbnail */}
            {previewData.image ? (
              <img
                src={previewData.image}
                alt={previewData.title || "พรีวิวลิงก์"}
                className="w-12 h-12 rounded-lg object-cover border border-[#383838] shrink-0 bg-[#242424]"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#242424] border border-[#383838] flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-[#1ed760]" />
              </div>
            )}

            {/* Title / Description / Domain */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <h4 className="text-xs sm:text-[13px] font-bold text-white truncate leading-tight">
                {previewData.title || previewData.url}
              </h4>
              {previewData.description && (
                <p className="text-[11px] text-zinc-400 truncate leading-tight">
                  {previewData.description}
                </p>
              )}
              <p className="text-[10px] text-zinc-500 truncate leading-tight font-medium">
                {(() => {
                  try {
                    return new URL(previewData.url).hostname.replace(
                      /^www\./,
                      "",
                    );
                  } catch {
                    return previewData.siteName || "link";
                  }
                })()}
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => {
              setDismissedUrl(previewData.url);
              setPreviewData(null);
            }}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#282828] transition cursor-pointer shrink-0"
            title="ยกเลิกพรีวิวลิงก์"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
                ? "text-[#1ed760]"
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

          {/* Text input (auto-expanding textarea with Shift+Enter support) */}
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                if (e.nativeEvent.isComposing) return;
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="พิมพ์ข้อความ หรือวางรูป / PDF"
            className="bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 focus:border-zinc-600 focus:outline-none rounded-xl px-3.5 py-2 text-xs sm:text-sm flex-1 transition-all resize-none max-h-32 min-h-9.5 overflow-y-hidden leading-relaxed custom-scrollbar"
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
    </React.Fragment>
  );
};
