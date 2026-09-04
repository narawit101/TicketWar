"use client";

import React, { useState, useRef } from "react";
import { SeatTask } from "@/types";
import {
  Edit3,
  Calendar,
  Ticket,
  Plus,
  Minus,
  CheckCircle2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { formatThaiDate } from "@/lib/date";
import { useClickOutside } from "@/lib/hooks";

interface SeatTaskCardProps {
  task: SeatTask;
  currentUserName: string;
  onIncrement: (taskId: string) => void;
  onDecrement: (taskId: string) => void;
  onEdit: (task: SeatTask) => void;
  onDelete?: (taskId: string) => void;
  isReadOnly?: boolean;
}

export const SeatTaskCard: React.FC<SeatTaskCardProps> = ({
  task,
  onIncrement,
  onDecrement,
  onEdit,
  onDelete,
  isReadOnly = false,
}) => {
  const isComplete = task.quantitySecured >= task.quantityNeeded;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsMenuOpen(false));

  return (
    <div className="bg-[#181818] hover:bg-[#1e1e1e] border border-[#282828] rounded-2xl p-4 sm:p-4.5 transition-all shadow-md">
      {/* Header: Target Location + Actions (...) */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-base sm:text-lg text-[#1ed760] tracking-tight">
            {task.targetLocation}
          </span>
          {isComplete && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#1f1f1f] text-[#1ed760] border border-[#1ed760]/30 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ได้ครบแล้ว
            </span>
          )}
        </div>

        {!isReadOnly && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-[#282828] text-[#b3b3b3] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="จัดการรายการ"
              aria-label="จัดการรายการ"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-[#252525] border border-[#333333] rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit(task);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#b3b3b3] hover:text-white hover:bg-[#2e2e2e] flex items-center gap-2 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#888888]" />
                  <span>แก้ไข</span>
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#f3727f] hover:text-white hover:bg-[#f3727f]/15 flex items-center gap-2 transition cursor-pointer border-t border-[#333333]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบ</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date & Price */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-[#b3b3b3] mb-3">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#888888]" />
          {formatThaiDate(task.targetDate)}
        </span>
        <span className="flex items-center gap-1.5 font-bold text-[#1ed760]">
          <Ticket className="w-4 h-4 text-[#1ed760]" />
          {task.price.toLocaleString()} THB
        </span>
      </div>

      {/* Counter & Action Row */}
      <div className="bg-[#121212] p-3 sm:p-3.5 rounded-xl border border-[#282828] mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs sm:text-sm text-[#b3b3b3]">
            ต้องการ:{" "}
            <strong className="text-white font-bold">
              {task.quantityNeeded}
            </strong>{" "}
            ใบ
          </div>
          <div className="text-xs sm:text-sm mt-0.5">
            ได้แล้ว:{" "}
            <strong
              className={
                task.quantitySecured > 0
                  ? "text-[#1ed760] font-bold"
                  : "text-white font-bold"
              }
            >
              {task.quantitySecured}
            </strong>{" "}
            <span className="text-[#777777] text-xs">
              (ขาดอีก {Math.max(0, task.quantityNeeded - task.quantitySecured)}{" "}
              ใบ)
            </span>
          </div>
        </div>

        {/* Plus / Minus Buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDecrement(task.id)}
              disabled={task.quantitySecured <= 0}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#242424] hover:bg-[#303030] disabled:opacity-20 disabled:cursor-not-allowed text-[#b3b3b3] hover:text-white flex items-center justify-center transition cursor-pointer border border-[#333333]"
              title="ลด 1 ใบ (-1)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="font-bold text-sm px-1 text-white min-w-8 text-center">
              {task.quantitySecured}/{task.quantityNeeded}
            </span>

            <button
              onClick={() => onIncrement(task.id)}
              disabled={isComplete}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1ed760] hover:bg-[#1cd05a] disabled:opacity-20 disabled:cursor-not-allowed text-black font-bold flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
              title="กดได้ +1 ใบ"
            >
              <Plus className="w-4 h-4 text-black stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#282828] h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[#1ed760] transition-all duration-300"
          style={{
            width: `${Math.min(100, (task.quantitySecured / task.quantityNeeded) * 100)}%`,
          }}
        />
      </div>

      {/* Secured By Attribution (โดยใคร) */}
      {task.securedBy && task.securedBy.length > 0 && (
        <div className="text-xs text-[#b3b3b3] mb-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[#777777] shrink-0">โดย:</span>
          {task.securedBy.map((item, idx) => (
            <span
              key={idx}
              className="bg-[#1f1f1f] text-zinc-200 border border-[#2e2e2e] px-2.5 py-0.5 rounded-full font-medium text-xs"
            >
              {item.name} ({item.qty} ใบ)
            </span>
          ))}
        </div>
      )}

      {/* Remarks Note */}
      {task.note && (
        <div className="text-xs sm:text-sm bg-[#121212] text-zinc-300 p-3.5 rounded-xl border border-[#282828] space-y-1">
          <span className="text-[#888888] text-xs font-semibold block">
            หมายเหตุ:
          </span>
          <p className="leading-relaxed whitespace-pre-wrap wrap-break-word text-[#e0e0e0]">
            {task.note}
          </p>
        </div>
      )}
    </div>
  );
};
