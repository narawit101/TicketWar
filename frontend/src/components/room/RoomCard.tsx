"use client";

import React, { useState, useRef } from "react";
import { Room } from "@/types";
import { formatEventDate } from "@/lib/date";
import {
  Crown,
  Users,
  Calendar,
  MoreVertical,
  Edit3,
  Share2,
  Archive,
  ArchiveRestore,
  Trash2,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { RoomImageCarousel, CarouselSlide } from "./RoomImageCarousel";
import { ConfirmType } from "@/components/modals";
import { useClickOutside } from "@/lib/hooks";

interface RoomCardProps {
  room: Room;
  isBusy?: boolean;
  onEnterRoom: (roomId: string) => void;
  onEdit: (room: Room) => void;
  onShare: (room: Room) => void;
  onConfirmAction: (action: {
    isOpen: boolean;
    type: ConfirmType;
    roomId: string;
    roomTitle: string;
  }) => void;
  onOpenLightbox?: (slides: CarouselSlide[], initialIndex: number) => void;
  onOpenMembers?: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isBusy = false,
  onEnterRoom,
  onEdit,
  onShare,
  onConfirmAction,
  onOpenLightbox,
  onOpenMembers,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));

  const isLive = room.status === "ACTIVE";
  const isOwner = room.role === "OWNER";

  // Build carousel slides for lightbox expand
  const slides: CarouselSlide[] = [];
  if (room.bannerUrl) {
    slides.push({ url: room.bannerUrl, label: "โปสเตอร์", type: "banner" });
  }
  if (room.seatingPlanUrl) {
    slides.push({
      url: room.seatingPlanUrl,
      label: "ผังที่นั่ง",
      type: "seating",
    });
  }

  return (
    <div
      onClick={() => onEnterRoom(room.id)}
      className="card-spotify p-5 border border-[#222222] hover:border-[#383838] hover:bg-[#181818]/90 flex flex-col justify-between group transition-all relative cursor-pointer"
    >
      {/* Card Header: Role & Status Tags */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Role Tag */}
            {isOwner ? (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1f1f1f] text-zinc-300 border border-zinc-700/50 flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3 h-3 text-[#1ed760]" />
                {/* <span>เจ้าของห้อง</span> */}
              </span>
            ) : (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1f1f1f] text-zinc-400 border border-zinc-700/50 flex items-center gap-1.5 shadow-sm">
                <Users className="w-3 h-3 text-[#539df5]" />
                {/* <span>สมาชิก</span> */}
              </span>
            )}

            {/* Member Count Tag (clickable to view members) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMembers?.(room);
              }}
              className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1f1f1f] hover:bg-[#282828] text-zinc-300 hover:text-white border border-zinc-700/50 hover:border-zinc-500 flex items-center gap-1.5 shadow-sm transition cursor-pointer group/members"
              title="คลิกเพื่อดูสมาชิกในห้อง"
            >
              <Users className="w-3 h-3 text-[#1ed760] transition-colors" />
              <span className="text-xs">{room.memberCount} คน</span>
            </button>

            {/* Status Tag */}
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1f1f1f] text-zinc-300 border border-zinc-700/50 flex items-center gap-1.5 shadow-sm">
              {isLive ? (
                <CheckCircle2 className="w-3 h-3 text-[#1ed760]" />
              ) : (
                <Archive className="w-3 h-3 text-zinc-400" />
              )}
              <span className={isLive ? "text-zinc-200" : "text-zinc-400"}>
                {isLive ? "ใช้งาน" : "จัดเก็บ"}
              </span>
            </span>

            {/* Unread Message Pill Tag */}
            {typeof room.unreadCount === "number" && room.unreadCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-[#1ed760] border border-zinc-700/50 flex items-center gap-1.5 shadow-sm">
                <MessageSquare className="w-3 h-3 text-[#1ed760]" />
                <span>{room.unreadCount} ข้อความใหม่</span>
              </span>
            )}
          </div>
        </div>

        {/* Room Image Carousel (stops propagation to card click) */}
        <div onClick={(e) => e.stopPropagation()}>
          <RoomImageCarousel
            title={room.title}
            bannerUrl={room.bannerUrl}
            seatingPlanUrl={room.seatingPlanUrl}
            onExpand={
              onOpenLightbox && slides.length > 0
                ? (idx) => onOpenLightbox(slides, idx)
                : undefined
            }
          />
        </div>

        {/* Room Title with Hover Tooltip */}
        <div className="relative group/title mb-2">
          <h2
            className="text-base font-bold text-white tracking-tight group-hover:text-[#1ed760] transition-colors line-clamp-1"
            title={room.title}
          >
            {room.title}
          </h2>
          {/* Floating Tooltip */}
          <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 hidden group-hover/title:block z-40 max-w-xs px-2.5 py-1.5 text-xs font-medium text-white bg-[#181818] border border-[#333333] rounded-lg shadow-2xl backdrop-blur-md whitespace-normal wrap-break-words leading-snug animate-in fade-in zoom-in-95 duration-100">
            {room.title}
          </div>
        </div>

        {/* Room Metadata */}
        <div className="space-y-1 text-xs text-[#b3b3b3] mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#888888]" />
            <span>{formatEventDate(room.eventDate)}</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Enter Room & Consolidated Action Dropdown */}
      <div className="pt-3 border-t border-[#222222]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEnterRoom(room.id);
            }}
            className="flex-1 py-2.5 px-4 rounded-full bg-[#1ed760] hover:bg-[#1cd05a] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <span>เข้าห้อง</span>
            {/* {typeof room.unreadCount === "number" && room.unreadCount > 0 && (
              <span className="px-1.5 py-0.5 min-w-5 text-center bg-black/85 text-[#1ed760] text-[10px] font-black rounded-full border border-black/20 leading-none">
                {room.unreadCount > 99 ? "99+" : room.unreadCount}
              </span>
            )} */}
          </button>

          {/* Consolidated Action Dropdown */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-[#888888] hover:text-white border border-[#2c2c2c] transition cursor-pointer flex items-center justify-center shadow-sm"
              title="เมนูจัดการห้อง"
              aria-label="เมนูจัดการห้อง"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 bottom-full mb-1.5 w-48 bg-[#181818] border border-[#2c2c2c] rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150 text-left"
              >
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(room);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-white hover:bg-[#252525] flex items-center gap-2 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>แก้ไขข้อมูลห้อง</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onShare(room);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#b3b3b3] hover:text-white hover:bg-[#252525] flex items-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>แชร์</span>
                </button>

                {isOwner ? (
                  <>
                    <div className="my-1 border-t border-[#252525]" />
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmAction({
                          isOpen: true,
                          type: isLive ? "ARCHIVE" : "RESTORE",
                          roomId: room.id,
                          roomTitle: room.title,
                        });
                        setMenuOpen(false);
                      }}
                      disabled={isBusy}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#b3b3b3] hover:text-white hover:bg-[#252525] flex items-center gap-2 transition cursor-pointer"
                    >
                      {isLive ? (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>จัดเก็บ</span>
                        </>
                      ) : (
                        <>
                          <ArchiveRestore className="w-3.5 h-3.5 text-[#1ed760]" />
                          <span>เปิดใช้งานต่อ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onConfirmAction({
                          isOpen: true,
                          type: "DELETE",
                          roomId: room.id,
                          roomTitle: room.title,
                        });
                        setMenuOpen(false);
                      }}
                      disabled={isBusy}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#f3727f] hover:bg-[#f3727f]/10 flex items-center gap-2 transition cursor-pointer border-t border-[#252525]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบห้อง</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-1 border-t border-[#252525]" />
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmAction({
                          isOpen: true,
                          type: "LEAVE",
                          roomId: room.id,
                          roomTitle: room.title,
                        });
                        setMenuOpen(false);
                      }}
                      disabled={isBusy}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#f3727f] hover:bg-[#f3727f]/10 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ออกจากห้อง</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
