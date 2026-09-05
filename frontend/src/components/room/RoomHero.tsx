/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Room, SeatTask } from "@/types";

interface RoomHeroProps {
  room: Room;
  tasks: SeatTask[];
  onOpenBanner?: () => void;
}

export const RoomHero: React.FC<RoomHeroProps> = ({
  room,
  tasks,
  onOpenBanner,
}) => {
  const totalNeeded = tasks.reduce((acc, t) => acc + t.quantityNeeded, 0);
  const totalSecured = tasks.reduce((acc, t) => acc + t.quantitySecured, 0);
  const totalRemaining = Math.max(0, totalNeeded - totalSecured);

  return (
    <>
      {/* Top Hero Poster Banner (if available) */}
      {room.bannerUrl && (
        <div
          onClick={onOpenBanner}
          className="relative w-full h-44 sm:h-56 md:h-72 rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 group/banner cursor-pointer shadow-xl select-none shrink-0"
        >
          {/* Ambience Blurred Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-35 scale-110 pointer-events-none transition-transform duration-500 group-hover/banner:scale-125"
            style={{ backgroundImage: `url(${room.bannerUrl})` }}
          />
          {/* Main Crisp Banner Image */}
          <img
            src={room.bannerUrl}
            alt={`โปสเตอร์ ${room.title}`}
            className="relative z-10 w-full h-full object-contain transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 z-10 pointer-events-none" />
        </div>
      )}

      {/* Note / Description (หมายเหตุของงาน) */}
      {room.description && (
        <div className="shrink-0 bg-[#181818] border border-[#282828] rounded-2xl p-3.5 sm:p-4 shadow-md flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xl font-bold text-white flex items-center gap-1.5">
                หมายเหตุ
              </span>
            </div>
            <div className="max-h-28 sm:max-h-52 overflow-y-auto pr-1.5">
              <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed whitespace-pre-line wrap-break-word">
                {room.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full-Width Summary Bar (ใต้รูปโปสเตอร์) */}
      <div className="shrink-0 grid grid-cols-3 bg-[#181818] border border-[#282828] rounded-2xl py-3 px-2 sm:px-4 text-center shadow-lg">
        <div className="py-1">
          <span className="text-[#b3b3b3] text-xs font-medium block mb-1">
            จำนวนที่ต้องการ
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {totalNeeded}{" "}
            <span className="text-xs font-normal text-[#888888]">ใบ</span>
          </span>
        </div>
        <div className="border-x border-[#282828] py-1">
          <span className="text-[#b3b3b3] text-xs font-medium block mb-1">
            ได้แล้ว
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1ed760]">
            {totalSecured}{" "}
            <span className="text-xs font-normal text-[#888888]">ใบ</span>
          </span>
        </div>
        <div className="py-1">
          <span className="text-[#b3b3b3] text-xs font-medium block mb-1">
            ยังขาดอีก
          </span>
          <span
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              totalRemaining === 0 ? "text-[#1ed760]" : "text-white"
            }`}
          >
            {totalRemaining}{" "}
            <span className="text-xs font-normal text-[#888888]">ใบ</span>
          </span>
        </div>
      </div>
    </>
  );
};
