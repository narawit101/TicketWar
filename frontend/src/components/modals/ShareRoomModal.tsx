import React, { useState } from "react";
import { X, Copy, Check, Link2, KeyRound } from "lucide-react";
import { toast } from "react-hot-toast";
import { RoomInviteSection } from "@/components/room";
import { useAuth } from "@/context/AuthContext";

interface ShareRoomModalProps {
  isOpen: boolean;
  room: {
    id: string;
    title: string;
    inviteCode: string;
    bannerUrl?: string | null;
    createdById?: string;
  } | null;
  isOwner?: boolean;
  onClose: () => void;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  room,
  isOwner,
  onClose,
}) => {
  const { user } = useAuth();
  const [copiedType, setCopiedType] = useState<"link" | "code" | null>(null);

  if (!isOpen || !room) return null;

  const effectiveIsOwner =
    isOwner !== undefined ? isOwner : room.createdById === user?.id;

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
        className="bg-[#181818] border border-[#282828] rounded-2xl w-full max-w-md min-h-80 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col custom-scrollbar "
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
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl text-[#1ed760] shrink-0 border border-[#1ed760]/20">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white text-sm">
                  ลิงก์คำเชิญ
                </div>
                <div className="text-xs text-[#888888] truncate">
                  ส่งลิงก์ให้เพื่อนกดเข้าร่วมห้องได้ทันที
                </div>
              </div>
            </div>

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

          {/* Option 2: รหัสห้อง (Room Code) */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl text-[#539df5] shrink-0 border border-[#539df5]/20">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white text-sm">รหัสห้อง</div>
                <div className="text-xs text-[#888888] truncate">
                  สำหรับนำไปกรอกเข้าร่วมห้องที่หน้าแรก
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                copyToClipboard(room.inviteCode, "code", "คัดลอกรหัสห้องแล้ว!")
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

          {/* Option 3: เชิญเพื่อนเข้าห้องโดยตรง */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626]">
            <RoomInviteSection
              roomId={room.id}
              currentUserId={user?.id}
              isOwner={effectiveIsOwner}
              label="เชิญเพื่อนร่วมห้องโดยตรง"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
