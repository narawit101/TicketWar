import React from "react";
import { Room, SeatTask } from "@/types";
import { useRoomCountdown } from "./hooks/useRoomCountdown";
import { Image as ImageIcon } from "lucide-react";

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

  const countdown = useRoomCountdown({
    eventDate: room.eventDate,
    hasQueue: room.hasQueue,
    queueTime: room.queueTime,
    roomStatus: room.status,
  });

  const isFinal10s =
    countdown.status === "UPCOMING" &&
    countdown.secondsLeft !== null &&
    countdown.secondsLeft > 0 &&
    countdown.secondsLeft <= 10;

  const renderFinal10sOverlay = () => {
    if (!isFinal10s || countdown.secondsLeft === null) return null;

    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs pointer-events-none select-none transition-all duration-500">
        <div className="flex flex-col items-center gap-1">
          {/* <span className="text-xs sm:text-sm font-semibold tracking-wider text-amber-400 uppercase drop-shadow">
            {countdown.targetType === "QUEUE"
              ? "เตรียมพร้อมรันคิว"
              : "เตรียมพร้อมกดบัตร"}
          </span> */}
          <div
            key={countdown.secondsLeft}
            className={`text-8xl sm:text-9xl font-black font-mono tracking-tighter animate-tt-tick ${
              countdown.secondsLeft <= 3
                ? "text-[#1ed760] drop-shadow-[0_0_45px_rgba(30,215,96,0.7)]"
                : "text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.4)]"
            }`}
          >
            {countdown.secondsLeft}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Top Hero Poster Banner (Image or Placeholder) */}
      {room.bannerUrl ? (
        <div
          onClick={onOpenBanner}
          className="relative w-full h-52 sm:h-64 md:h-80 rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 group/banner cursor-pointer shadow-xl select-none shrink-0 flex flex-col justify-center items-center"
        >
          {/* Ambience Blurred Backdrop */}
          <div
            className={`absolute inset-0 bg-cover bg-center blur-2xl pointer-events-none transition-all duration-700 ${
              isFinal10s
                ? "opacity-15 scale-110"
                : "opacity-35 scale-110 group-hover/banner:scale-125"
            }`}
            style={{ backgroundImage: `url(${room.bannerUrl})` }}
          />
          {/* Main Crisp Banner Image - Fades/dims during final 10s */}
          <img
            src={room.bannerUrl}
            alt={`โปสเตอร์ ${room.title}`}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className={`relative z-10 w-full h-full object-contain transition-all duration-700 ${
              isFinal10s ? "opacity-20 blur-[1px]" : "opacity-100"
            }`}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none" />

          {/* ThaiTicket 10-Second Dramatic Center Overlay */}
          {renderFinal10sOverlay()}
        </div>
      ) : (
        /* Empty Poster Placeholder */
        <div className="relative w-full min-h-44 sm:min-h-52 rounded-2xl overflow-hidden border border-zinc-800 bg-[#151515] flex flex-col items-center justify-center p-6 text-center shadow-xl select-none shrink-0">
          <div
            className={`flex flex-col items-center justify-center gap-1.5 transition-opacity duration-500 ${
              isFinal10s ? "opacity-15" : "opacity-100"
            }`}
          >
            <div className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-300">
              ไม่มีรูปโปสเตอร์
            </span>
          </div>

          {/* ThaiTicket 10-Second Dramatic Center Overlay */}
          {renderFinal10sOverlay()}
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
