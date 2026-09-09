"use client";

import React from "react";
import { Archive, Disc, KeyRound, Plus, Search } from "lucide-react";

interface RoomEmptyStateProps {
  statusFilter: "ALL" | "ACTIVE" | "ARCHIVED";
  dateFilter: "ALL" | "UPCOMING" | "CUSTOM";
  customDate: string;
  ownershipTab: "ALL" | "MINE" | "JOINED";
  searchQuery?: string;
  onClearSearch?: () => void;
  onViewAllDates?: () => void;
  onResetFilters: () => void;
  onOpenJoin: () => void;
  onOpenCreate: () => void;
}

export const RoomEmptyState: React.FC<RoomEmptyStateProps> = ({
  statusFilter,
  dateFilter,
  customDate,
  ownershipTab,
  searchQuery,
  onClearSearch,
  onViewAllDates,
  onResetFilters,
  onOpenJoin,
  onOpenCreate,
}) => {
  const isSearchActive = !!searchQuery?.trim();
  const isCustomDate = dateFilter === "CUSTOM" || !!customDate;
  const isUpcomingOnly =
    dateFilter === "UPCOMING" &&
    !isCustomDate &&
    !isSearchActive &&
    statusFilter === "ALL";

  const isUserFilterActive =
    statusFilter !== "ARCHIVED" &&
    (statusFilter !== "ALL" || isCustomDate || isSearchActive);

  const getEmptyTitle = () => {
    if (isSearchActive)
      return `ไม่พบห้องแชทที่ตรงกับ "${searchQuery?.trim()}"`;
    if (statusFilter === "ARCHIVED") return "ไม่มีห้องในคลังจัดเก็บ";
    if (isCustomDate) return "ไม่พบห้องแชทที่ตรงกับวันที่เลือก";
    if (isUpcomingOnly) return "ไม่มีงานที่กำลังจะถึงเร็วๆ นี้";
    if (ownershipTab === "MINE") return "คุณยังไม่ได้สร้างห้องแชท";
    if (ownershipTab === "JOINED") return "คุณยังไม่ได้รับเชิญเข้าห้องใดๆ";
    return "ไม่พบห้องแชท";
  };

  return (
    <div className="py-16 px-4 card-spotify border border-[#222222] text-center max-w-lg mx-auto space-y-4">
      <div className="w-14 h-14 rounded-full bg-[#1f1f1f] text-[#888888] flex items-center justify-center mx-auto">
        {isSearchActive ? (
          <Search className="w-7 h-7 text-[#888888]" />
        ) : statusFilter === "ARCHIVED" ? (
          <Archive className="w-7 h-7 text-[#666666]" />
        ) : (
          <Disc className="w-7 h-7" />
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-white">{getEmptyTitle()}</h3>
        {!isSearchActive && !isUserFilterActive && !isUpcomingOnly && statusFilter !== "ARCHIVED" && (
          <p className="text-xs text-[#a0a0a0] max-w-sm mx-auto leading-relaxed mt-1.5">
            สร้างห้องสำหรับกดบัตร แล้วแชร์รหัสให้เพื่อนร่วมทีม เพื่อเริ่มแบ่งโซนและติดตามสถานะที่นั่งแบบเรียลไทม์
          </p>
        )}
        {isSearchActive ? (
          <button
            type="button"
            onClick={onClearSearch || onResetFilters}
            className="mt-2 text-xs text-[#1ed760] hover:underline font-semibold cursor-pointer inline-block"
          >
            ล้างคำค้นหา
          </button>
        ) : isUpcomingOnly ? (
          <button
            type="button"
            onClick={onViewAllDates || onResetFilters}
            className="mt-2 text-xs text-[#1ed760] hover:underline font-semibold cursor-pointer inline-block"
          >
            ดูห้องทั้งหมด
          </button>
        ) : isUserFilterActive ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-2 text-xs text-[#1ed760] hover:underline font-semibold cursor-pointer inline-block"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        ) : null}
      </div>

      {statusFilter !== "ARCHIVED" && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {ownershipTab !== "MINE" && (
            <button
              type="button"
              onClick={onOpenJoin}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#b3b3b3] hover:text-white border border-[#333333] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-[#1ed760]" />
                <span>เข้าร่วมด้วยรหัส</span>
              </div>
            </button>
          )}
          {ownershipTab !== "JOINED" && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="btn-pill btn-pill-green text-xs px-5 py-2 font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-black stroke-3" />
              <span>สร้างห้องใหม่</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
