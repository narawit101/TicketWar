import React, { useState, useRef } from "react";
import Link from "next/link";
import { Room } from "@/types";
import { formatEventDate, getQueueText } from "@/lib/date";
import { useClickOutside } from "@/lib/hooks";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Users,
  MoreHorizontal,
  Edit3,
  Share2,
  Archive,
  ArchiveRestore,
  Trash2,
  LogOut,
} from "lucide-react";

interface RoomHeaderProps {
  room: Room;
  isOwner: boolean;
  memberCount: number;
  onOpenMembers: () => void;
  onOpenEditRoom: () => void;
  onOpenShare: () => void;
  onConfirmStatusChange: (
    type: "ARCHIVE" | "RESTORE" | "DELETE" | "LEAVE",
  ) => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  isOwner,
  memberCount,
  onOpenMembers,
  onOpenEditRoom,
  onOpenShare,
  onConfirmStatusChange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsMenuOpen(false));

  return (
    <div className="sticky top-16 z-20 bg-[#121212]/95 backdrop-blur-md -mx-4 md:-mx-6 px-4 md:px-6 py-3.5 border-b border-zinc-800/80 shrink-0 flex items-start justify-between gap-2.5 sm:gap-4 transition-all">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* Back button */}
        <Link
          href="/"
          className="p-1.5 sm:p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors shrink-0 mt-0.5"
          title="กลับหน้ารวมห้อง"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Title & External Ticket Link */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="font-bold text-zinc-100 text-base sm:text-xl md:text-2xl tracking-tight truncate sm:line-clamp-2"
              title={room.title}
            >
              {room.title}
            </div>
            {room.ticketUrl && (
              <a
                href={
                  room.ticketUrl.startsWith("http")
                    ? room.ticketUrl
                    : `https://${room.ticketUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 sm:p-1.5 rounded-full bg-[#1f1f1f] hover:bg-[#282828] text-[#1ed760] hover:text-[#1cd05a] transition-all inline-flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                title="เปิดเว็บไซต์กดบัตร / เว็บหลัก"
                aria-label="เปิดเว็บไซต์กดบัตร / เว็บหลัก"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1ed760]" />
              </a>
            )}
          </div>

          {/* Sub-info: Status & Date */}
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap text-xs sm:text-sm text-zinc-300 font-medium">
            <div className="inline-flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0" />
              <span>วันกดบัตร:</span>
              <span className="text-zinc-100 font-semibold">
                {formatEventDate(room.eventDate)}
              </span>
            </div>

            <div className="inline-flex items-center gap-1 shrink-0">
              <span className="text-zinc-500">•</span>
              <span
                className={
                  room.hasQueue
                    ? "text-[#1ed760] font-bold"
                    : "text-zinc-400 font-medium"
                }
              >
                {getQueueText(room.hasQueue, room.queueTime)}
              </span>
            </div>

            {room.status !== "ACTIVE" && (
              <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#181818] border border-[#282828] text-[11px] sm:text-xs font-semibold text-zinc-400 shrink-0">
                <Archive className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>จัดเก็บ</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Tools: Members Button & Management */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-0.5">
        {/* Members Button */}
        <button
          onClick={onOpenMembers}
          className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs gap-1.5 sm:gap-2 flex items-center font-medium transition cursor-pointer shadow-sm shrink-0"
          title={`ดูสมาชิกในห้อง (${memberCount} คน)`}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0" />
          <span>
            <span className="hidden sm:inline">สมาชิก </span>({memberCount})
          </span>
        </button>

        {/* Dropdown Menu (...) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition cursor-pointer flex items-center justify-center shadow-sm"
            title="เมนูเพิ่มเติม"
            aria-label="เมนูเพิ่มเติม"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              {isOwner && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenEditRoom();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/70 flex items-center gap-2 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>แก้ไขข้อมูลห้อง</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenShare();
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/70 flex items-center gap-2 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#1ed760]" />
                <span>แชร์</span>
              </button>

              {isOwner && (
                <>
                  <div className="my-1 border-t border-zinc-800/70" />
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onConfirmStatusChange(
                        room.status === "ACTIVE" ? "ARCHIVE" : "RESTORE",
                      );
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/70 flex items-center gap-2 transition cursor-pointer"
                  >
                    {room.status === "ACTIVE" ? (
                      <>
                        <Archive className="w-3.5 h-3.5 text-zinc-400" />
                        <span>จัดเก็บ</span>
                      </>
                    ) : (
                      <>
                        <ArchiveRestore className="w-3.5 h-3.5 text-emerald-400" />
                        <span>เปิดใช้งานต่อ</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onConfirmStatusChange("DELETE");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition cursor-pointer border-t border-zinc-800/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบห้อง</span>
                  </button>
                </>
              )}

              {!isOwner && (
                <>
                  <div className="my-1 border-t border-zinc-800/70" />
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onConfirmStatusChange("LEAVE");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากห้อง</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
