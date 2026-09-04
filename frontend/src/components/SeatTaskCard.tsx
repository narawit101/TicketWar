"use client";

import React, { useState, useRef } from "react";
import { SeatTask, RoomMemberItem, TaskAssignee } from "@/types";
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  Calendar,
  Ticket,
  CheckCircle2,
  Check,
  User,
  UserPlus,
  Clock,
  Search,
  X,
} from "lucide-react";
import { formatThaiDate } from "@/lib/date";
import { useClickOutside } from "@/lib/hooks";
import { parseZoneLocations } from "@/lib/validation";

interface SeatTaskCardProps {
  task: SeatTask;
  members?: RoomMemberItem[];
  currentUserId?: string;
  currentUserName?: string;
  isMyTask?: boolean;
  onAssignTask?: (taskId: string, targetUser: TaskAssignee | null) => void;
  onStartPendingPayment?: (
    taskId: string,
    zoneType: "MAIN" | "BACKUP",
    zoneName: string,
    price: number,
  ) => void;
  onConfirmPayment?: (taskId: string, pendingId: string) => void;
  onDirectSecured?: (
    taskId: string,
    zoneType: "MAIN" | "BACKUP",
    zoneName: string,
  ) => void;
  onCancelPendingPayment?: (taskId: string, pendingId: string) => void;
  onDecrement: (taskId: string) => void;
  onEdit: (task: SeatTask) => void;
  onDelete?: (taskId: string) => void;
  isReadOnly?: boolean;
  onViewSeatingPlan?: () => void;
}

interface TicketSlot {
  index: number;
  status: "AVAILABLE" | "PENDING_PAYMENT" | "COMPLETED";
  zoneType?: "MAIN" | "BACKUP";
  zoneName?: string;
  assigneeName?: string;
  assigneeId?: string;
  pendingId?: string;
  price?: number;
}

export const SeatTaskCard: React.FC<SeatTaskCardProps> = ({
  task,
  members = [],
  currentUserId,
  currentUserName,
  isMyTask = false,
  onAssignTask,
  onStartPendingPayment,
  onConfirmPayment,
  onDirectSecured,
  onCancelPendingPayment,
  onDecrement,
  onEdit,
  onDelete,
  isReadOnly = false,
  onViewSeatingPlan,
}) => {
  const pendingList = task.pendingPayments || [];
  const securedList = task.securedBy || [];

  const { mainLocation, backupLocation } = parseZoneLocations(
    task.targetLocation,
    task.backupLocation,
  );

  const isBackupRecord = (item: { zoneType?: string; zoneName?: string }) => {
    if (item.zoneType === "BACKUP") return true;
    if (item.zoneType === "MAIN") return false;
    const name = (item.zoneName || "").trim();
    if (!name) return false;
    if (name.includes("สำรอง")) return true;
    if (
      backupLocation &&
      (name === backupLocation ||
        name.includes(backupLocation) ||
        backupLocation.includes(name))
    ) {
      return true;
    }
    if (
      task.backupLocation &&
      (name === task.backupLocation ||
        name.includes(task.backupLocation) ||
        task.backupLocation.includes(name))
    ) {
      return true;
    }
    return false;
  };

  const isComplete = task.quantitySecured >= task.quantityNeeded;

  // Header 3-dot menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setIsMenuOpen(false));

  // ClickUp status popup state for ticket index: 1..N
  const [activeSlotMenu, setActiveSlotMenu] = useState<number | null>(null);
  const slotPopupRef = useRef<HTMLDivElement>(null);
  useClickOutside(slotPopupRef, () => setActiveSlotMenu(null));

  // Assignee picker popup state
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const assigneePopupRef = useRef<HTMLDivElement>(null);
  useClickOutside(assigneePopupRef, () => {
    setIsAssigneeMenuOpen(false);
    setAssigneeSearch("");
  });

  // Current assignees (multi-assignee support with fallback)
  const currentAssignees: TaskAssignee[] =
    task.assignees && task.assignees.length > 0
      ? task.assignees
      : task.assignee
        ? [task.assignee]
        : [];

  // Build vertical slots for each needed ticket ("เอายาวลงมา")
  const slots: TicketSlot[] = [];

  // 1. Add Secured Tickets
  securedList
    .filter((s) => !s.isAssignee)
    .forEach((s) => {
      const qty = s.qty || 1;
      const isBackup = isBackupRecord(s);
      const zType = s.zoneType || (isBackup ? "BACKUP" : "MAIN");
      const zName =
        s.zoneName ||
        (zType === "BACKUP" ? backupLocation || "โซนสำรอง" : mainLocation);
      for (let i = 0; i < qty; i++) {
        slots.push({
          index: slots.length + 1,
          status: "COMPLETED",
          zoneType: zType,
          zoneName: zName,
          assigneeName: s.name,
          assigneeId: s.userId,
          price:
            zType === "BACKUP" ? task.backupPrice || task.price : task.price,
        });
      }
    });

  // 2. Add Pending Payment Tickets
  pendingList.forEach((p) => {
    const isBackup = isBackupRecord(p);
    const zType = p.zoneType || (isBackup ? "BACKUP" : "MAIN");
    const zName =
      p.zoneName ||
      (zType === "BACKUP" ? backupLocation || "โซนสำรอง" : mainLocation);
    slots.push({
      index: slots.length + 1,
      status: "PENDING_PAYMENT",
      zoneType: zType,
      zoneName: zName,
      assigneeName: p.name,
      assigneeId: p.userId,
      pendingId: p.id,
      price: p.price,
    });
  });

  // 3. Fill remaining slots up to quantityNeeded
  const totalSlotsNeeded = Math.max(task.quantityNeeded, slots.length);
  while (slots.length < totalSlotsNeeded) {
    slots.push({
      index: slots.length + 1,
      status: "AVAILABLE",
    });
  }

  // Filter members for assignee popup
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(assigneeSearch.toLowerCase().trim()),
  );

  // Handle status and zone selection for this specific ticket row
  const handleSelectSlotStatus = (
    slot: TicketSlot,
    targetStatus:
      | "AVAILABLE"
      | "PENDING_MAIN"
      | "PENDING_BACKUP"
      | "COMPLETED_MAIN"
      | "COMPLETED_BACKUP",
  ) => {
    setActiveSlotMenu(null);
    if (isReadOnly) return;

    if (targetStatus === "AVAILABLE") {
      if (slot.status === "PENDING_PAYMENT" && slot.pendingId) {
        onCancelPendingPayment?.(task.id, slot.pendingId);
      } else if (slot.status === "COMPLETED") {
        onDecrement(task.id);
      }
      return;
    }

    if (targetStatus === "PENDING_MAIN") {
      if (slot.status === "PENDING_PAYMENT" && slot.zoneType === "MAIN") return;
      if (slot.status === "PENDING_PAYMENT" && slot.pendingId) {
        onCancelPendingPayment?.(task.id, slot.pendingId);
      } else if (slot.status === "COMPLETED") {
        onDecrement(task.id);
      }
      onStartPendingPayment?.(task.id, "MAIN", mainLocation, task.price);
      return;
    }

    if (targetStatus === "PENDING_BACKUP") {
      if (!backupLocation) return;
      if (slot.status === "PENDING_PAYMENT" && slot.zoneType === "BACKUP")
        return;
      if (slot.status === "PENDING_PAYMENT" && slot.pendingId) {
        onCancelPendingPayment?.(task.id, slot.pendingId);
      } else if (slot.status === "COMPLETED") {
        onDecrement(task.id);
      }
      onStartPendingPayment?.(
        task.id,
        "BACKUP",
        backupLocation,
        task.backupPrice || task.price,
      );
      return;
    }

    if (targetStatus === "COMPLETED_MAIN") {
      if (slot.status === "COMPLETED" && slot.zoneType === "MAIN") return;
      if (slot.status === "PENDING_PAYMENT" && slot.pendingId) {
        onConfirmPayment?.(task.id, slot.pendingId);
      } else {
        if (onDirectSecured) {
          onDirectSecured(task.id, "MAIN", mainLocation);
        } else {
          onStartPendingPayment?.(task.id, "MAIN", mainLocation, task.price);
        }
      }
      return;
    }

    if (targetStatus === "COMPLETED_BACKUP") {
      if (!backupLocation) return;
      if (slot.status === "COMPLETED" && slot.zoneType === "BACKUP") return;
      if (slot.status === "PENDING_PAYMENT" && slot.pendingId) {
        onConfirmPayment?.(task.id, slot.pendingId);
      } else {
        if (onDirectSecured) {
          onDirectSecured(task.id, "BACKUP", backupLocation);
        } else {
          onStartPendingPayment?.(
            task.id,
            "BACKUP",
            backupLocation,
            task.backupPrice || task.price,
          );
        }
      }
      return;
    }
  };

  return (
    <div
      className={`bg-[#181818] hover:bg-[#1a1a1a] rounded-2xl p-4 sm:p-4.5 transition-all relative ${
        isMyTask
          ? "border-2 border-[#1ed760]/70 shadow-[0_0_15px_rgba(30,215,96,0.12)]"
          : "border border-[#282828] shadow-md"
      }`}
    >
      {/* Top Header: Date • Quantity Needed (Left), Completed / My Task Badge & Menu (...) (Right) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-md ">
            <Calendar className="w-3.5 h-3.5 text-[#888888]" />
            <span>{formatThaiDate(task.targetDate)}</span>
            <span className="text-[#666666]">•</span>
            <span className="font-semibold text-white">
              {task.quantityNeeded} ใบ
            </span>
          </span>

          {isMyTask && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-transparent text-[#1ed760] border border-[#1ed760]/40 flex items-center gap-1 shrink-0">
              <User className="w-3 h-3" />
              <span>งานของฉัน</span>
            </span>
          )}

          {isComplete && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-transparent text-[#1ed760]  inline-flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ได้ครบแล้ว
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* ClickUp-Style Multi-Assignee Button */}
          {!isReadOnly && (
            <div className="relative" ref={assigneePopupRef}>
              <button
                type="button"
                onClick={() => setIsAssigneeMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  currentAssignees.length > 0
                    ? "bg-[#252525] text-white border-[#444444] hover:border-[#666666]"
                    : "bg-[#1f1f1f] text-[#888888] hover:text-white border-dashed border-[#444444] hover:border-[#666666]"
                }`}
                title={
                  currentAssignees.length > 0
                    ? `ผู้รับผิดชอบ (${currentAssignees.length} คน): ${currentAssignees.map((a) => a.name).join(", ")} (คลิกเพื่อแก้ไข)`
                    : "มอบหมายงานนี้ให้สมาชิกในห้อง"
                }
              >
                {currentAssignees.length === 0 ? (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>มอบหมาย</span>
                  </>
                ) : currentAssignees.length === 1 ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-[#1ed760] text-black font-bold text-[9px] flex items-center justify-center shrink-0">
                      {currentAssignees[0].name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium max-w-24 truncate">
                      {currentAssignees[0].name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                      {currentAssignees.slice(0, 3).map((a, idx) => (
                        <div
                          key={a.userId || idx}
                          className="w-4 h-4 rounded-full bg-[#1ed760] text-black font-bold text-[8px] flex items-center justify-center border border-[#252525] shrink-0"
                          title={a.name}
                        >
                          {a.name.slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="font-medium text-xs text-[#e0e0e0]">
                      {currentAssignees.length} คน
                    </span>
                  </>
                )}
              </button>

              {/* ClickUp-Style Assignee Selection Popover */}
              {isAssigneeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1a] border border-[#383838] rounded-xl shadow-2xl p-2.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                  {/* Selected Assignees List (matching ClickUp screenshot) */}
                  {currentAssignees.length > 0 && (
                    <div className="mb-2 pb-2 border-b border-[#282828]">
                      <div className="px-1 text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>ผู้รับผิดชอบ ({currentAssignees.length})</span>
                        <button
                          type="button"
                          onClick={() => onAssignTask?.(task.id, null)}
                          className="text-[10px] text-[#f3727f] hover:underline normal-case font-normal cursor-pointer"
                        >
                          ล้างทั้งหมด
                        </button>
                      </div>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                        {currentAssignees.map((assignee) => {
                          const isMe =
                            (currentUserId &&
                              assignee.userId === currentUserId) ||
                            (currentUserName &&
                              assignee.name === currentUserName);

                          return (
                            <div
                              key={assignee.userId || assignee.name}
                              className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#222222] hover:bg-[#282828] transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Avatar with ClickUp red (x) badge */}
                                <div className="relative shrink-0">
                                  <div className="w-5 h-5 rounded-full bg-[#333333] text-white border border-[#4a4a4a] flex items-center justify-center text-[9px] font-bold">
                                    {assignee.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAssignTask?.(task.id, assignee)
                                    }
                                    title={`ถอน ${assignee.name}`}
                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#f3727f] hover:bg-[#ff4d5e] text-white flex items-center justify-center shadow cursor-pointer transition-transform active:scale-90"
                                  >
                                    <X className="w-2 h-2 stroke-3" />
                                  </button>
                                </div>
                                <span className="text-white font-medium truncate text-xs">
                                  {assignee.name}{" "}
                                  {isMe && (
                                    <span className="text-[#888888] text-[10px]">
                                      (ฉัน)
                                    </span>
                                  )}
                                </span>
                              </div>
                              {/* <button
                                type="button"
                                onClick={() => onAssignTask?.(task.id, assignee)}
                                className="text-[#777777] hover:text-[#f3727f] text-[10px] cursor-pointer"
                              >
                                ถอน
                              </button> */}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Search input */}
                  {members.length > 4 && (
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-[#666666] absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อสมาชิก..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333333] rounded-lg pl-7 pr-2 py-1 text-xs text-white focus:outline-none focus:border-[#1ed760]"
                      />
                    </div>
                  )}

                  {/* Members list */}
                  <div className="px-1 text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-1">
                    สมาชิกในห้อง
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-0.5 pr-0.5">
                    {filteredMembers.length === 0 ? (
                      <div className="px-2 py-2 text-center text-[#666666] text-xs">
                        ไม่พบสมาชิก
                      </div>
                    ) : (
                      filteredMembers.map((m) => {
                        const isAssigned = currentAssignees.some(
                          (a) => a.userId === m.userId || a.name === m.name,
                        );

                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => {
                              // Multi-assign toggle without closing popover
                              onAssignTask?.(task.id, {
                                userId: m.userId,
                                name: m.name,
                              });
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors text-left ${
                              isAssigned
                                ? "bg-[#1ed760]/10 text-white hover:bg-[#1ed760]/20"
                                : "hover:bg-[#282828] text-[#cccccc] hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-[#2a2a2a] text-[#b3b3b3] border border-[#3d3d3d] flex items-center justify-center text-[10px] font-bold shrink-0">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium truncate text-xs">
                                {m.name}
                              </span>
                            </div>
                            {isAssigned && (
                              <Check className="w-3.5 h-3.5 text-[#1ed760] shrink-0 stroke-[2.5]" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Done button */}
                  <div className="mt-2 pt-2 border-t border-[#2a2a2a] flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAssigneeMenuOpen(false)}
                      className="px-3 py-1 bg-[#282828] hover:bg-[#333333] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                    >
                      เสร็จสิ้น
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3-Dot Manage Menu */}
          {!isReadOnly && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="p-1 rounded-full text-[#888888] hover:text-white hover:bg-[#282828] transition-colors cursor-pointer"
                title="จัดการรายการ"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-[#202020] border border-[#333333] rounded-xl shadow-xl py-1 z-20 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(task);
                    }}
                    className="w-full px-3 py-2 text-left text-zinc-200 hover:bg-[#282828] hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>แก้ไขที่นั่ง</span>
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(task.id);
                      }}
                      className="w-full px-3 py-2 text-left text-[#f3727f] hover:bg-[#f3727f]/10 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Target Zones Box (Inverted Dark Surface for Target Specifications) */}
      <div className="bg-[#121212] border border-[#262626] rounded-xl p-2.5 mb-2.5 space-y-1.5">
        {/* Table Column Headers (โซนเป้าหมาย / ราคา) */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#777777] uppercase tracking-wider px-0.5 mb-0.5">
          <span>โซนเป้าหมาย</span>
          <span>ราคา</span>
        </div>

        {/* Main Zone */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#1ed760] shrink-0" />
            <span className="text-[#1ed760] font-bold shrink-0">หลัก:</span>
            {onViewSeatingPlan ? (
              <button
                type="button"
                onClick={onViewSeatingPlan}
                className="text-white font-bold hover:underline cursor-pointer truncate"
                title="คลิกเพื่อเปิดดูผังที่นั่ง"
              >
                {mainLocation}
              </button>
            ) : (
              <strong className="text-white font-bold truncate">
                {mainLocation}
              </strong>
            )}
          </div>
          <div className="flex items-center gap-1 text-zinc-300 font-mono font-semibold text-xs sm:text-sm shrink-0">
            <Ticket className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-base">{task.price.toLocaleString()} THB</span>
          </div>
        </div>

        {/* Backup Zone (if exists) */}
        {backupLocation && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1f1f1f]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#ffa42b] shrink-0" />
              <span className="text-[#ffa42b] font-bold shrink-0">สำรอง:</span>
              {onViewSeatingPlan ? (
                <button
                  type="button"
                  onClick={onViewSeatingPlan}
                  className="text-white font-bold hover:underline cursor-pointer truncate"
                  title="คลิกเพื่อเปิดดูผังที่นั่ง"
                >
                  {backupLocation}
                </button>
              ) : (
                <strong className="text-white font-bold truncate">
                  {backupLocation}
                </strong>
              )}
            </div>
            <div className="flex items-center gap-1 text-zinc-300 font-mono font-semibold text-xs sm:text-sm shrink-0">
              <Ticket className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-base">
                {(task.backupPrice || task.price).toLocaleString()} THB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Vertical Ticket Rows ("เอายาวลงมา") */}
      <div className="space-y-1.5">
        {slots.map((slot) => {
          const isMenuTarget = activeSlotMenu === slot.index;
          const hasZone = !!slot.zoneName;
          const isBackup = slot.zoneType === "BACKUP";
          const displayPrice =
            slot.price ||
            (isBackup ? task.backupPrice || task.price : task.price);

          return (
            <div
              key={slot.index}
              onClick={() =>
                !isReadOnly &&
                setActiveSlotMenu(isMenuTarget ? null : slot.index)
              }
              className={`relative bg-[#212121]/80 hover:bg-[#262626] border transition-all px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer select-none group shadow-sm ${
                isMenuTarget
                  ? "border-[#555555] bg-[#262626] ring-1 ring-white/10"
                  : "border-[#303030] hover:border-[#444444]"
              }`}
            >
              {/* Left: Status Circle (O) + Zone Name (or "ใบที่ X") */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* ClickUp Status Circle (O) - Normal yellow/amber with full icon, no glow */}
                <div className="relative inline-flex items-center shrink-0">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0"
                    title={`ใบที่ ${slot.index}: ${
                      slot.status === "COMPLETED"
                        ? "สำเร็จ (ได้บัตรแล้ว)"
                        : slot.status === "PENDING_PAYMENT"
                          ? "รอชำระเงิน"
                          : "ว่าง (คลิกเพื่อเลือกหลัก/สำรอง)"
                    }`}
                  >
                    {slot.status === "COMPLETED" ? (
                      <span className="w-5 h-5 rounded-full bg-[#1ed760] text-black flex items-center justify-center font-bold">
                        <Check className="w-3 h-3 stroke-3" />
                      </span>
                    ) : slot.status === "PENDING_PAYMENT" ? (
                      <span className="w-5 h-5 rounded-full bg-[#ffa42b] text-black flex items-center justify-center font-bold">
                        <Clock className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-dashed border-[#666666] group-hover:border-white transition-colors" />
                    )}
                  </div>

                  {/* ClickUp Status Menu Popover */}
                  {isMenuTarget && (
                    <div
                      ref={slotPopupRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-[#181818] border border-[#383838] rounded-xl shadow-2xl p-2 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 cursor-default"
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#2a2a2a]">
                        <span className="px-2 py-0.5 bg-[#252525] text-white rounded font-bold text-[11px]">
                          Status
                        </span>
                        <span className="text-[11px] text-[#777777] font-medium">
                          ใบที่ {slot.index}
                        </span>
                      </div>

                      {/* Option 1: TO DO (ว่าง) */}
                      <div className="mb-2">
                        <div className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider px-2 py-0.5 mb-0.5">
                          Not started
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectSlotStatus(slot, "AVAILABLE")
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#262626] flex items-center justify-between cursor-pointer transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-[#777777] inline-block shrink-0" />
                            <span className="text-zinc-200 font-medium">
                              TO DO (ว่าง)
                            </span>
                          </div>
                          {slot.status === "AVAILABLE" ? (
                            <Check className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                          ) : (
                            <span className="w-3.5 shrink-0" />
                          )}
                        </button>
                      </div>

                      {/* Option 2: รอชำระเงิน (Active) */}
                      <div className="mb-2">
                        <div className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider px-2 py-0.5 mb-0.5">
                          Active (รอชำระเงิน)
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectSlotStatus(slot, "PENDING_MAIN")
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#262626] flex items-center justify-between cursor-pointer transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <span className="w-4 h-4 rounded-full bg-[#ffa42b] text-black inline-flex items-center justify-center shrink-0">
                              <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                            </span>
                            <span className="text-zinc-200 font-medium truncate">
                              หลัก: {mainLocation}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                              <Ticket className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span>{task.price.toLocaleString()} THB</span>
                            </div>
                            {slot.status === "PENDING_PAYMENT" &&
                            slot.zoneType !== "BACKUP" ? (
                              <Check className="w-3.5 h-3.5 text-[#ffa42b] shrink-0" />
                            ) : (
                              <span className="w-3.5 shrink-0" />
                            )}
                          </div>
                        </button>
                        {backupLocation && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectSlotStatus(slot, "PENDING_BACKUP")
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#262626] flex items-center justify-between cursor-pointer transition-colors text-left mt-0.5"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <span className="w-4 h-4 rounded-full bg-[#ffa42b] text-black inline-flex items-center justify-center shrink-0">
                                <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                              </span>
                              <span className="text-zinc-200 font-medium truncate">
                                สำรอง: {backupLocation}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                                <Ticket className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>{(task.backupPrice || task.price).toLocaleString()} THB</span>
                              </div>
                              {slot.status === "PENDING_PAYMENT" &&
                              slot.zoneType === "BACKUP" ? (
                                <Check className="w-3.5 h-3.5 text-[#ffa42b] shrink-0" />
                              ) : (
                                <span className="w-3.5 shrink-0" />
                              )}
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Option 3: สำเร็จ (Done) */}
                      <div>
                        <div className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider px-2 py-0.5 mb-0.5">
                          Done (สำเร็จ)
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectSlotStatus(slot, "COMPLETED_MAIN")
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#262626] flex items-center justify-between cursor-pointer transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <span className="w-4 h-4 rounded-full bg-[#1ed760] text-black inline-flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-3" />
                            </span>
                            <span className="text-zinc-200 font-medium truncate">
                              หลัก: {mainLocation}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                              <Ticket className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span>{task.price.toLocaleString()} THB</span>
                            </div>
                            {slot.status === "COMPLETED" &&
                            slot.zoneType !== "BACKUP" ? (
                              <Check className="w-3.5 h-3.5 text-[#1ed760] shrink-0" />
                            ) : (
                              <span className="w-3.5 shrink-0" />
                            )}
                          </div>
                        </button>
                        {backupLocation && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectSlotStatus(slot, "COMPLETED_BACKUP")
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#262626] flex items-center justify-between cursor-pointer transition-colors text-left mt-0.5"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <span className="w-4 h-4 rounded-full bg-[#1ed760] text-black inline-flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-3" />
                              </span>
                              <span className="text-zinc-200 font-medium truncate">
                                สำรอง: {backupLocation}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                                <Ticket className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>{(task.backupPrice || task.price).toLocaleString()} THB</span>
                              </div>
                              {slot.status === "COMPLETED" &&
                              slot.zoneType === "BACKUP" ? (
                                <Check className="w-3.5 h-3.5 text-[#1ed760] shrink-0" />
                              ) : (
                                <span className="w-3.5 shrink-0" />
                              )}
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <span
                    className={`font-bold text-base sm:text-md group-hover:underline underline-offset-4 tracking-tight transition-colors truncate block max-w-full ${
                      hasZone ? "text-white" : "text-[#777777]"
                    }`}
                    title="คลิกเพื่อเลือกสถานะหรือโซน"
                  >
                    {hasZone ? slot.zoneName : `ใบที่ ${slot.index}`}
                  </span>
                </div>
              </div>

              {/* Right: Assignee & Price */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Assignee (only show if someone secured/booked it) */}
                {slot.assigneeName && (
                  <div
                    className="flex items-center gap-1 text-xs text-[#d0d0d0] bg-[#222222] border border-[#333333] px-2 py-0.5 rounded-full font-medium"
                    title={`ผู้จอง: ${slot.assigneeName}`}
                  >
                    <User className="w-3 h-3 text-[#888888]" />
                    <span className="truncate max-w-20 sm:max-w-28">
                      {slot.assigneeName}
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-1 font-semibold text-sm sm:text-base font-mono text-zinc-300">
                  <Ticket className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{displayPrice.toLocaleString()} THB</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remarks Note (if exists) */}
      {task.note && (
        <div className="bg-[#141414] text-zinc-200 p-2.5 rounded-xl border border-[#282828] mt-2.5 space-y-1">
          <p className="text-[#888888] font-bold text-xs flex items-center gap-1">
            <span>หมายเหตุ:</span>
          </p>
          <p className="text-md leading-relaxed text-zinc-300 whitespace-pre-line wrap-break-word">
            {task.note}
          </p>
        </div>
      )}
    </div>
  );
};
