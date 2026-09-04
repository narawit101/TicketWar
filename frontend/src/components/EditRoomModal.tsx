/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Calendar,
  Image as ImageIcon,
  Map as MapIcon,
  UploadCloud,
  Trash2,
  Loader2,
  ExternalLink,
  FileText,
  Music,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Room } from "@/types";

interface EditRoomModalProps {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
  onSave: (data: {
    id: string;
    title: string;
    eventDate: string;
    ticketUrl?: string | null;
    description?: string | null;
    bannerUrl?: string | null;
    seatingPlanUrl?: string | null;
  }) => Promise<void> | void;
}

const toInputDateTime = (dateStr?: string | null) => {
  if (!dateStr || dateStr === "วันแสดงที่กำหนด" || dateStr === "เร็วๆ นี้")
    return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
};

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  room,
  onClose,
  onSave,
}) => {
  if (!isOpen || !room) return null;
  return <EditRoomDialog key={room.id} room={room} onClose={onClose} onSave={onSave} />;
};

const EditRoomDialog: React.FC<{
  room: Room;
  onClose: () => void;
  onSave: (data: {
    id: string;
    title: string;
    eventDate: string;
    ticketUrl?: string | null;
    description?: string | null;
    bannerUrl?: string | null;
    seatingPlanUrl?: string | null;
  }) => Promise<void> | void;
}> = ({ room, onClose, onSave }) => {
  const [title, setTitle] = useState(room.title || "");
  const [eventDate, setEventDate] = useState(toInputDateTime(room.eventDate));
  const [ticketUrl, setTicketUrl] = useState(room.ticketUrl || "");
  const [description, setDescription] = useState(room.description || "");

  // Poster banner state
  const [posterMode, setPosterMode] = useState<"upload" | "url">("upload");
  const [posterData, setPosterData] = useState<string>(room.bannerUrl || "");
  const [posterUrlInput, setPosterUrlInput] = useState<string>(
    room.bannerUrl || "",
  );
  const posterFileRef = useRef<HTMLInputElement>(null);

  // Seating plan state
  const [seatingMode, setSeatingMode] = useState<"upload" | "url">("upload");
  const [seatingData, setSeatingData] = useState<string>(
    room.seatingPlanUrl || "",
  );
  const [seatingUrlInput, setSeatingUrlInput] = useState<string>(
    room.seatingPlanUrl || "",
  );
  const seatingFileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);


  // Compress image helper via HTML5 Canvas
  const processImageFile = (
    file: File,
    maxDim: number,
    onSuccess: (dataUrl: string) => void,
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ขนาดไฟล์รูปภาพต้องไม่เกิน 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          onSuccess(compressed);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePosterFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, 1200, (data) => setPosterData(data));
    }
  };

  const handleSeatingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, 1600, (data) => setSeatingData(data));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่องานคอนเสิร์ต");
      return;
    }

    const finalBanner =
      posterMode === "upload"
        ? posterData || null
        : posterUrlInput.trim() || null;

    const finalSeating =
      seatingMode === "upload"
        ? seatingData || null
        : seatingUrlInput.trim() || null;

    setLoading(true);
    try {
      await onSave({
        id: room.id,
        title: title.trim(),
        eventDate: eventDate || "",
        ticketUrl: ticketUrl.trim() || null,
        description: description.trim() || null,
        bannerUrl: finalBanner,
        seatingPlanUrl: finalSeating,
      });
      onClose();
    } catch (err: unknown) {
      console.error("Save room error:", err);
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-[#282828] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252525] bg-[#1a1a1a]">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            แก้ไขข้อมูลห้องกดบัตร
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#252525] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto text-sm flex-1"
        >
          {/* 1. Concert Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-200 flex items-center gap-1.5 text-sm">
              <Music className="w-4 h-4 text-[#1ed760]" />
              <span>
                ชื่องานคอนเสิร์ต / อีเวนต์{" "}
                <span className="text-[#f3727f]">*</span>
              </span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Coldplay Music of the Spheres Tour"
              className="input-spotify w-full text-sm py-2.5 px-3.5 rounded-lg bg-[#1f1f1f] text-white"
            />
          </div>

          {/* 2. Event Date & Time */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-200 flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-[#1ed760]" />
              วันแสดง / วันเวลากดบัตร (ไม่บังคับ)
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="input-spotify w-full text-sm py-2.5 px-3.5 rounded-lg bg-[#1f1f1f] text-white scheme-dark"
            />
          </div>

          {/* 3. Ticket / Official Website URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-200 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-[#1ed760]" />
                <span>ลิงก์เว็บกดบัตร / เว็บหลัก (ไม่บังคับ)</span>
              </span>
            </label>
            <input
              type="url"
              maxLength={500}
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              placeholder="เช่น https://www.thaiticketmajor.com/..."
              className="input-spotify w-full text-sm py-2.5 px-3.5 rounded-lg bg-[#1f1f1f] text-white placeholder:text-zinc-500"
            />
          </div>

          {/* 4. Room Note / Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-200 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#1ed760]" />
                <span>หมายเหตุของงาน (ไม่บังคับ)</span>
              </span>
            </label>
            <textarea
              rows={2}
              maxLength={800}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น กติกาการกดบัตร"
              className="min-h-40 input-spotify w-full text-sm py-2.5 px-3.5 rounded-lg bg-[#1f1f1f] text-white placeholder:text-zinc-500 resize-none leading-relaxed"
            />
          </div>

          {/* 3. Concert Poster Banner */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs sm:text-sm text-[#b3b3b3] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#1ed760]" />
                รูปโปสเตอร์คอนเสิร์ต (ไม่บังคับ)
              </span>

              {/* Mode Tabs */}
              <div className="flex items-center bg-[#1f1f1f] p-0.5 rounded-lg border border-[#333333]">
                <button
                  type="button"
                  onClick={() => setPosterMode("upload")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    posterMode === "upload"
                      ? "bg-[#333333] text-white"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  อัปโหลด
                </button>
                <button
                  type="button"
                  onClick={() => setPosterMode("url")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    posterMode === "url"
                      ? "bg-[#333333] text-white"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  ลิงก์ URL
                </button>
              </div>
            </div>

            {posterMode === "upload" ? (
              <div>
                {posterData ? (
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#1a1a1a] border border-[#282828]">
                    <img
                      src={posterData}
                      alt="Poster Preview"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl border border-[#383838] shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white font-semibold block truncate">
                        รูปโปสเตอร์ปัจจุบัน
                      </span>
                      <span className="text-xs text-[#888888] mt-0.5 block">
                        พร้อมแสดงในห้องกดบัตร
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPosterData("");
                        if (posterFileRef.current)
                          posterFileRef.current.value = "";
                      }}
                      className="p-2 rounded-lg text-[#888888] hover:text-[#f3727f] hover:bg-[#f3727f]/10 transition cursor-pointer"
                      title="ลบรูปภาพ"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => posterFileRef.current?.click()}
                    className="border border-dashed border-[#333333] hover:border-[#1ed760]/60 rounded-xl p-4.5 text-center cursor-pointer transition bg-[#191919] hover:bg-[#202020]"
                  >
                    <UploadCloud className="w-6 h-6 text-[#888888] mx-auto mb-1.5" />
                    <span className="text-xs sm:text-sm text-[#b3b3b3] font-medium block">
                      คลิกเพื่อเลือกไฟล์รูปโปสเตอร์
                    </span>
                    <span className="text-[11px] text-[#777777] mt-0.5 block">
                      รองรับ JPG, PNG, WebP (ย่อขนาดอัตโนมัติ)
                    </span>
                    <input
                      ref={posterFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePosterFile}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  maxLength={1000}
                  value={posterUrlInput}
                  onChange={(e) => setPosterUrlInput(e.target.value)}
                  placeholder="https://example.com/poster.jpg"
                  className="input-spotify w-full text-xs sm:text-sm py-2 px-3 rounded-lg bg-[#1f1f1f] text-white"
                />
              </div>
            )}
          </div>

          {/* 4. Seating Plan Map */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs sm:text-sm text-[#b3b3b3] flex items-center gap-1.5">
                <MapIcon className="w-4 h-4 text-[#539df5]" />
                รูปผังที่นั่งคอนเสิร์ต (ไม่บังคับ)
              </span>

              {/* Mode Tabs */}
              <div className="flex items-center bg-[#1f1f1f] p-0.5 rounded-lg border border-[#333333]">
                <button
                  type="button"
                  onClick={() => setSeatingMode("upload")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    seatingMode === "upload"
                      ? "bg-[#333333] text-white"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  อัปโหลด
                </button>
                <button
                  type="button"
                  onClick={() => setSeatingMode("url")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    seatingMode === "url"
                      ? "bg-[#333333] text-white"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  ลิงก์ URL
                </button>
              </div>
            </div>

            {seatingMode === "upload" ? (
              <div>
                {seatingData ? (
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#1a1a1a] border border-[#282828]">
                    <img
                      src={seatingData}
                      alt="Seating Plan Preview"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl border border-[#383838] shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white font-semibold block truncate">
                        รูปผังที่นั่งปัจจุบัน
                      </span>
                      <span className="text-xs text-[#888888] mt-0.5 block">
                        พร้อมแสดงในห้องกดบัตร
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSeatingData("");
                        if (seatingFileRef.current)
                          seatingFileRef.current.value = "";
                      }}
                      className="p-2 rounded-lg text-[#888888] hover:text-[#f3727f] hover:bg-[#f3727f]/10 transition cursor-pointer"
                      title="ลบรูปผังที่นั่ง"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => seatingFileRef.current?.click()}
                    className="border border-dashed border-[#333333] hover:border-[#539df5]/60 rounded-xl p-4.5 text-center cursor-pointer transition bg-[#191919] hover:bg-[#202020]"
                  >
                    <UploadCloud className="w-6 h-6 text-[#888888] mx-auto mb-1.5" />
                    <span className="text-xs sm:text-sm text-[#b3b3b3] font-medium block">
                      คลิกเพื่อเลือกไฟล์รูปผังที่นั่ง
                    </span>
                    <span className="text-[11px] text-[#777777] mt-0.5 block">
                      รองรับ JPG, PNG, WebP (ย่อขนาดอัตโนมัติ)
                    </span>
                    <input
                      ref={seatingFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSeatingFile}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  maxLength={1000}
                  value={seatingUrlInput}
                  onChange={(e) => setSeatingUrlInput(e.target.value)}
                  placeholder="https://example.com/seating-plan.jpg"
                  className="input-spotify w-full text-xs py-2 px-3 rounded-lg bg-[#1f1f1f] text-white"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#252525]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-[#b3b3b3] hover:text-white bg-[#242424] hover:bg-[#303030] border border-[#383838] transition cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#1ed760] hover:bg-[#1cd05a] text-black font-bold rounded-full text-sm cursor-pointer flex items-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึกการแก้ไข</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
