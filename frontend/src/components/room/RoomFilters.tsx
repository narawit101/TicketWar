"use client";

import React from "react";
import { Crown, Users, Archive, X, CheckCircle2 } from "lucide-react";

interface RoomFiltersProps {
  roomsCount: number;
  myRoomsCount: number;
  joinedRoomsCount: number;
  ownershipTab: "ALL" | "MINE" | "JOINED";
  setOwnershipTab: (tab: "ALL" | "MINE" | "JOINED") => void;
  statusFilter: "ALL" | "ACTIVE" | "ARCHIVED";
  setStatusFilter: (status: "ALL" | "ACTIVE" | "ARCHIVED") => void;
  dateFilter: "ALL" | "UPCOMING" | "CUSTOM";
  setDateFilter: (filter: "ALL" | "UPCOMING" | "CUSTOM") => void;
  customDate: string;
  setCustomDate: (date: string) => void;
}

export const RoomFilters: React.FC<RoomFiltersProps> = ({
  roomsCount,
  myRoomsCount,
  joinedRoomsCount,
  ownershipTab,
  setOwnershipTab,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  customDate,
  setCustomDate,
}) => {
  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3.5 pt-1 w-full min-w-0">
      {/* Ownership Tabs */}
      <div className="flex items-center overflow-x-auto no-scrollbar max-w-full bg-[#181818] p-1 rounded-xl border border-[#252525] text-xs shrink-0">
        <button
          type="button"
          onClick={() => setOwnershipTab("ALL")}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            ownershipTab === "ALL"
              ? "bg-[#282828] text-white shadow-sm"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <span className="whitespace-nowrap">ทั้งหมด</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#121212] text-[#888888]">
            {roomsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOwnershipTab("MINE")}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            ownershipTab === "MINE"
              ? "bg-[#282828] text-white shadow-sm"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <Crown className="w-3 h-3 text-[#1ed760] shrink-0" />
          <span className="whitespace-nowrap">ห้องของฉัน</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#121212] text-[#888888]">
            {myRoomsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOwnershipTab("JOINED")}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            ownershipTab === "JOINED"
              ? "bg-[#282828] text-white shadow-sm"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <Users className="w-3 h-3 text-[#539df5] shrink-0" />
          <span className="whitespace-nowrap">ที่ได้รับเชิญ</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#121212] text-[#888888]">
            {joinedRoomsCount}
          </span>
        </button>
      </div>

      {/* Filter Controls: Status Pills & Date Filter Pills/Picker */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs w-full xl:w-auto min-w-0">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#252525] shrink-0 overflow-x-auto no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              statusFilter === "ALL"
                ? "bg-[#282828] text-white shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            สถานะทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              statusFilter === "ACTIVE"
                ? "bg-[#282828] text-white shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1ed760] shrink-0" />
            <span className="whitespace-nowrap">ใช้งาน</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ARCHIVED");
              if (dateFilter === "UPCOMING") {
                setDateFilter("ALL");
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              statusFilter === "ARCHIVED"
                ? "bg-[#282828] text-white shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <Archive className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">จัดเก็บ</span>
          </button>
        </div>

        {/* Date Filter Pills & Picker */}
        <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#252525] shrink-0 overflow-x-auto no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => {
              setDateFilter("ALL");
              setCustomDate("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              dateFilter === "ALL" && !customDate
                ? "bg-[#282828] text-white shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            วันทั้งหมด
          </button>
          {statusFilter !== "ARCHIVED" && (
            <button
              type="button"
              onClick={() => {
                setDateFilter("UPCOMING");
                setCustomDate("");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                dateFilter === "UPCOMING" && !customDate
                  ? "bg-[#282828] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              เร็วๆ นี้
            </button>
          )}

          {/* Custom Date Input Picker */}
          <div className="relative flex items-center pl-0.5 shrink-0">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                if (e.target.value) {
                  setDateFilter("CUSTOM");
                } else {
                  setDateFilter("ALL");
                }
              }}
              className={`bg-[#222222] text-xs rounded-lg px-2.5 py-1 border transition cursor-pointer focus:outline-none scheme-dark shrink-0 ${
                customDate
                  ? "border-[#1ed760] text-[#1ed760] font-semibold"
                  : "border-[#333333] hover:border-[#555555] text-[#b3b3b3]"
              }`}
              title="เลือกวันที่ระบุ"
            />
            {customDate && (
              <button
                type="button"
                onClick={() => {
                  setCustomDate("");
                  setDateFilter("ALL");
                }}
                className="ml-1 p-1 rounded-md text-[#888888] hover:text-white hover:bg-[#282828] transition cursor-pointer shrink-0"
                title="ล้างวันที่เลือก"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
