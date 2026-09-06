"use client";

import React from "react";
import { Archive, Disc, KeyRound, Plus } from "lucide-react";

interface RoomEmptyStateProps {
  statusFilter: "ALL" | "ACTIVE" | "ARCHIVED";
  dateFilter: "ALL" | "UPCOMING" | "CUSTOM";
  customDate: string;
  ownershipTab: "ALL" | "MINE" | "JOINED";
  onResetFilters: () => void;
  onOpenJoin: () => void;
  onOpenCreate: () => void;
}

export const RoomEmptyState: React.FC<RoomEmptyStateProps> = ({
  statusFilter,
  dateFilter,
  customDate,
  ownershipTab,
  onResetFilters,
  onOpenJoin,
  onOpenCreate,
}) => {
  const isFilterActive =
    statusFilter !== "ARCHIVED" &&
    (statusFilter !== "ALL" || dateFilter !== "ALL" || !!customDate);

  const getEmptyTitle = () => {
    if (statusFilter === "ARCHIVED") return "ไม่มีห้องในคลังจัดเก็บ";
    if (dateFilter !== "ALL" || customDate)
      return "ไม่พบห้องกดบัตรที่ตรงกับตัวกรอง";
    if (ownershipTab === "MINE") return "คุณยังไม่ได้สร้างห้องกดบัตร";
    if (ownershipTab === "JOINED") return "คุณยังไม่ได้รับเชิญเข้าห้องใดๆ";
    return "ไม่พบห้องกดบัตรในหมวดนี้";
  };

  return (
    <div className="py-16 px-4 card-spotify border border-[#222222] text-center max-w-lg mx-auto space-y-4">
      <div className="w-14 h-14 rounded-full bg-[#1f1f1f] text-[#888888] flex items-center justify-center mx-auto">
        {statusFilter === "ARCHIVED" ? (
          <Archive className="w-7 h-7 text-[#666666]" />
        ) : (
          <Disc className="w-7 h-7" />
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-white">{getEmptyTitle()}</h3>
        {isFilterActive && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-2 text-xs text-[#1ed760] hover:underline font-semibold cursor-pointer inline-block"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
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
