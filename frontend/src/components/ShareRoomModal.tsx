"use client";

import React, { useState } from "react";
import { X, Copy, Check, Link2, KeyRound } from "lucide-react";
import { toast } from "react-hot-toast";

interface ShareRoomModalProps {
  isOpen: boolean;
  room: {
    id: string;
    title: string;
    inviteCode: string;
    bannerUrl?: string | null;
  } | null;
  onClose: () => void;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  room,
  onClose,
}) => {
  const [copiedType, setCopiedType] = useState<"link" | "code" | null>(null);

  if (!isOpen || !room) return null;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";
  const inviteUrl = `${origin}/join/${room.inviteCode}`;

  const copyToClipboard = (
    text: string,
    type: "link" | "code",
    successLabel: string,
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success(successLabel);
    setTimeout(() => setCopiedType(null), 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#181818] border border-[#282828] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252525] bg-[#1a1a1a]">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              เชิญเพื่อนเข้าร่วมห้อง
            </h2>
            <p className="text-xs sm:text-sm text-[#b3b3b3] truncate max-w-70">
              {room.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#252525] transition cursor-pointer shrink-0"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 text-sm">
          {/* Option 1: ลิงก์เชิญ (Invite Link) */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2 text-sm">
                <Link2 className="w-4 h-4 text-[#1ed760]" />
                ลิงก์คำเชิญ (กดเข้าได้ทันที)
              </span>
              <span className="text-xs text-[#1ed760] font-medium bg-[#1ed760]/10 px-2 py-0.5 rounded-full">
                แนะนำ
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#1f1f1f] p-2 pl-3.5 rounded-xl border border-[#333333]">
              <span className="text-xs sm:text-sm text-[#1ed760] font-mono truncate flex-1 select-all">
                {inviteUrl}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(inviteUrl, "link", "คัดลอกลิงก์คำเชิญแล้ว!")
                }
                className="px-4 py-2 bg-[#1ed760] hover:bg-[#1cd05a] text-black font-bold text-sm rounded-full transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm hover:scale-105 active:scale-95"
              >
                {copiedType === "link" ? (
                  <>
                    <Check className="w-4 h-4 stroke-3" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-3" />
                    <span>คัดลอกลิงก์</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 2: รหัสห้อง (Room Code) */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2 text-sm">
                <KeyRound className="w-4 h-4 text-[#539df5]" />
                เฉพาะรหัสห้อง (Room Code)
              </span>
              <span className="text-xs text-[#888888]">
                สำหรับกรอกในหน้าแรก
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#1f1f1f] p-2 pl-3.5 rounded-xl border border-[#333333]">
              <span className="text-sm font-mono text-white font-bold tracking-wider truncate flex-1 select-all">
                {room.inviteCode}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    room.inviteCode,
                    "code",
                    "คัดลอกรหัสห้องแล้ว!",
                  )
                }
                className="px-4 py-2 bg-[#282828] hover:bg-[#333333] text-white font-bold text-sm rounded-full transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm border border-[#404040] hover:scale-105 active:scale-95"
              >
                {copiedType === "code" ? (
                  <>
                    <Check className="w-4 h-4 stroke-3 text-[#1ed760]" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-3" />
                    <span>คัดลอกรหัส</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
