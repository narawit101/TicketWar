/* eslint-disable @next/next/no-img-element */
import React, { useState, useMemo, useEffect } from "react";
import { Message } from "@/types";
import {
  Images,
  FileText,
  Download,
  X,
  MessageSquare,
  Calendar,
} from "lucide-react";
import {
  formatChatTime,
  getPdfFileName,
  getOptimizedCloudinaryThumbnail,
} from "./chatUtils";
import { MediaGridSkeleton, FileRowSkeleton } from "@/components/common";

interface ChatMediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  roomPhotos?: Message[];
  roomFiles?: Message[];
  onSelectPhoto: (url: string) => void;
  onDownloadFile: (url: string, filename?: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

const getGroupDateKey = (dateStr?: string) => {
  if (!dateStr) return "ไม่ระบุวันที่";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "ไม่ระบุวันที่";

  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const dateFormatted = d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (isToday) return `วันนี้ (${dateFormatted})`;
  if (isYesterday) return `เมื่อวานนี้ (${dateFormatted})`;
  return dateFormatted;
};

export const ChatMediaGalleryModal: React.FC<ChatMediaGalleryModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomPhotos = [],
  roomFiles = [],
  onSelectPhoto,
  onDownloadFile,
  onScrollToMessage,
}) => {
  const [mediaTab, setMediaTab] = useState<"photos" | "files">("photos");
  const [photos, setPhotos] = useState<Message[]>([]);
  const [files, setFiles] = useState<Message[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [hasMoreFiles, setHasMoreFiles] = useState(false);
  const [photosCursor, setPhotosCursor] = useState<string | null>(null);
  const [filesCursor, setFilesCursor] = useState<string | null>(null);
  const [hasFetchedPhotos, setHasFetchedPhotos] = useState(false);
  const [hasFetchedFiles, setHasFetchedFiles] = useState(false);

  // Synchronize state when roomId changes (React pattern: adjusting state on prop change)
  const [prevRoomId, setPrevRoomId] = useState(roomId);
  if (roomId !== prevRoomId) {
    setPrevRoomId(roomId);
    setPhotos([]);
    setFiles([]);
    setHasFetchedPhotos(false);
    setHasFetchedFiles(false);
    setPhotosCursor(null);
    setFilesCursor(null);
  }

  // Fetch photos / files asynchronously when modal is opened
  useEffect(() => {
    if (!isOpen || !roomId) return;
    let cancelled = false;

    if (mediaTab === "photos" && !hasFetchedPhotos) {
      fetch(`/api/rooms/${roomId}/media?type=photos&limit=30`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch photos");
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
          setPhotos(data.items || []);
          setHasMorePhotos(Boolean(data.hasMore));
          setPhotosCursor(data.nextCursor || null);
          setHasFetchedPhotos(true);
        })
        .catch((err) => {
          console.error("Photos fetch error:", err);
        });
    } else if (mediaTab === "files" && !hasFetchedFiles) {
      fetch(`/api/rooms/${roomId}/media?type=files&limit=30`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch files");
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
          setFiles(data.items || []);
          setHasMoreFiles(Boolean(data.hasMore));
          setFilesCursor(data.nextCursor || null);
          setHasFetchedFiles(true);
        })
        .catch((err) => {
          console.error("Files fetch error:", err);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, roomId, mediaTab, hasFetchedPhotos, hasFetchedFiles]);

  const handleLoadMore = async (type: "photos" | "files") => {
    if (!roomId || loadingMore) return;
    const currentCursor = type === "photos" ? photosCursor : filesCursor;
    if (!currentCursor) return;

    setLoadingMore(true);
    try {
      const url = new URL(`/api/rooms/${roomId}/media`, window.location.origin);
      url.searchParams.set("type", type);
      url.searchParams.set("limit", "30");
      url.searchParams.set("cursor", currentCursor);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Failed to load more ${type}`);
      const data = await res.json();

      if (type === "photos") {
        setPhotos((prev) => [...prev, ...(data.items || [])]);
        setHasMorePhotos(Boolean(data.hasMore));
        setPhotosCursor(data.nextCursor || null);
      } else {
        setFiles((prev) => [...prev, ...(data.items || [])]);
        setHasMoreFiles(Boolean(data.hasMore));
        setFilesCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error(`Error loading more ${type}:`, err);
    } finally {
      setLoadingMore(false);
    }
  };

  const activePhotos = roomId ? photos : roomPhotos;
  const activeFiles = roomId ? files : roomFiles;

  // Group photos by Day & Month (newest first)
  const groupedPhotos = useMemo(() => {
    const groups: { dateKey: string; items: Message[] }[] = [];
    const map = new Map<string, Message[]>();

    const sorted = [...activePhotos].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    sorted.forEach((item) => {
      const key = getGroupDateKey(item.createdAt);
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ dateKey: key, items: map.get(key)! });
      }
      map.get(key)!.push(item);
    });

    return groups;
  }, [activePhotos]);

  // Group files by Day & Month (newest first)
  const groupedFiles = useMemo(() => {
    const groups: { dateKey: string; items: Message[] }[] = [];
    const map = new Map<string, Message[]>();

    const sorted = [...activeFiles].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    sorted.forEach((item) => {
      const key = getGroupDateKey(item.createdAt);
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ dateKey: key, items: map.get(key)! });
      }
      map.get(key)!.push(item);
    });

    return groups;
  }, [activeFiles]);

  if (!isOpen) return null;

  const isPhotosLoading = roomId ? !hasFetchedPhotos : false;
  const isFilesLoading = roomId ? !hasFetchedFiles : false;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1e1e1e] border border-[#333333] rounded-2xl w-full max-w-4xl lg:max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] bg-[#181818] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#242424] flex items-center justify-center border border-[#333333]">
              <Images className="w-4 h-4 text-[#1ed760]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                ไฟล์และสื่อในห้อง
              </h3>
              <p className="text-xs text-zinc-400">
                แยกตามวัน เดือน ที่อัปโหลดในห้องแชท
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-[#282828] transition cursor-pointer"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#2d2d2d] px-6 shrink-0 bg-[#161616]">
          <button
            type="button"
            onClick={() => setMediaTab("photos")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              mediaTab === "photos"
                ? "border-[#1ed760] text-[#1ed760]"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <span>รูปภาพ</span>
            {!isPhotosLoading && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#262626] text-zinc-300 font-medium">
                {activePhotos.length}
                {hasMorePhotos ? "+" : ""}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMediaTab("files")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              mediaTab === "files"
                ? "border-[#1ed760] text-[#1ed760]"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <span>ไฟล์เอกสาร</span>
            {!isFilesLoading && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#262626] text-zinc-300 font-medium">
                {activeFiles.length}
                {hasMoreFiles ? "+" : ""}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 max-h-[75vh]">
          {mediaTab === "photos" ? (
            isPhotosLoading ? (
              <div className="space-y-4">
                <div className="h-5 w-32 bg-[#252525] rounded animate-pulse" />
                <MediaGridSkeleton count={10} />
              </div>
            ) : groupedPhotos.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-zinc-400 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#242424] border border-[#333333] flex items-center justify-center">
                  <Images className="w-7 h-7 text-zinc-500 stroke-[1.5]" />
                </div>
                <p className="text-sm font-medium">ยังไม่มีรูปภาพในห้องนี้</p>
              </div>
            ) : (
              <>
                {groupedPhotos.map(({ dateKey, items }) => (
                  <div key={dateKey} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1ed760]" />
                        <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          {dateKey}
                        </h4>
                      </div>
                      <span className="text-xs text-zinc-400 font-medium bg-[#242424] px-2.5 py-0.5 rounded-full border border-zinc-800">
                        {items.length} รูป
                      </span>
                    </div>

                    {/* Photo Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.imageUrl) {
                              onSelectPhoto(item.imageUrl);
                            }
                          }}
                          className="aspect-square rounded-xl overflow-hidden bg-[#141414] border border-[#2e2e2e] relative group cursor-pointer shadow-md transition-all"
                          title="คลิกเพื่อดูภาพขนาดเต็ม"
                        >
                          <img
                            src={getOptimizedCloudinaryThumbnail(item.imageUrl)}
                            alt="รูปในห้อง"
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.imageUrl) {
                                    onDownloadFile(
                                      item.imageUrl,
                                      `photo-${item.id}.jpg`,
                                    );
                                  }
                                }}
                                className="p-1.5 rounded-md bg-black/70 hover:bg-[#1ed760] text-white hover:text-black transition cursor-pointer shadow-md"
                                title="ดาวน์โหลดรูป"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {onScrollToMessage && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                    onScrollToMessage(item.id);
                                  }}
                                  className="p-1.5 rounded-md bg-black/70 hover:bg-[#1ed760] text-white hover:text-black transition cursor-pointer shadow-md"
                                  title="ไปยังข้อความในแชท"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="pointer-events-none">
                              <p className="text-[11px] text-white font-medium truncate">
                                {item.userName}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {formatChatTime(item.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Load More Photos Button */}
                {hasMorePhotos && (
                  <div className="pt-2 pb-4 flex justify-center">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => handleLoadMore("photos")}
                      className="px-5 py-2.5 rounded-xl bg-[#242424] hover:bg-[#2d2d2d] text-zinc-300 hover:text-white border border-[#333333] transition text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      <span>โหลดรูปภาพเพิ่มเติม</span>
                    </button>
                  </div>
                )}
              </>
            )
          ) : isFilesLoading ? (
            <div className="space-y-3">
              <div className="h-5 w-32 bg-[#252525] rounded animate-pulse" />
              {Array.from({ length: 5 }).map((_, i) => (
                <FileRowSkeleton key={i} />
              ))}
            </div>
          ) : groupedFiles.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-zinc-400 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#242424] border border-[#333333] flex items-center justify-center">
                <FileText className="w-7 h-7 text-zinc-500 stroke-[1.5]" />
              </div>
              <p className="text-sm font-medium">ยังไม่มีไฟล์เอกสารในห้องนี้</p>
            </div>
          ) : (
            <>
              {groupedFiles.map(({ dateKey, items }) => (
                <div key={dateKey} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#1ed760]" />
                      <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                        {dateKey}
                      </h4>
                    </div>
                    <span className="text-xs text-zinc-400 font-medium bg-[#242424] px-2.5 py-0.5 rounded-full border border-zinc-800">
                      {items.length} ไฟล์
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => {
                      const filename = getPdfFileName(item);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#161616] hover:bg-[#202020] border border-[#2e2e2e] hover:border-[#444] transition group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3">
                            <div className="w-11 h-11 rounded-xl bg-[#222222] border border-[#383838] flex items-center justify-center shrink-0 transition-colors">
                              <FileText className="w-5 h-5 text-zinc-200 transition-colors" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-xs sm:text-sm font-semibold text-white truncate"
                                title={filename}
                              >
                                {filename}
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                {item.userName} •{" "}
                                {formatChatTime(item.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {onScrollToMessage && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onScrollToMessage(item.id);
                                }}
                                className="p-2 rounded-lg bg-[#252525] hover:bg-[#333333] text-zinc-400 hover:text-white transition cursor-pointer shadow-sm"
                                title="ไปยังข้อความในแชท"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                item.imageUrl &&
                                onDownloadFile(item.imageUrl, filename)
                              }
                              className="px-3 py-2 rounded-lg bg-[#252525] hover:bg-[#333333] text-zinc-300 hover:text-white transition cursor-pointer shadow-sm flex items-center gap-1.5 text-xs font-semibold"
                              title="ดาวน์โหลดไฟล์"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                ดาวน์โหลด
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Load More Files Button */}
              {hasMoreFiles && (
                <div className="pt-2 pb-4 flex justify-center">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => handleLoadMore("files")}
                    className="px-5 py-2.5 rounded-xl bg-[#242424] hover:bg-[#2d2d2d] text-zinc-300 hover:text-white border border-[#333333] transition text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>โหลดไฟล์เพิ่มเติม</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
