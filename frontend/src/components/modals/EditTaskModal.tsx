"use client";

import React, { useState } from "react";
import { SeatTask, SeatStatus, RoomMemberItem, TaskAssignee } from "@/types";
import {
  X,
  Trash2,
  Calendar,
  MapPin,
  Coins,
  Ticket,
  FileText,
  Loader2,
  Users,
  Check,
  ChevronDown,
} from "lucide-react";
import { formatThaiDate, toInputDateValue } from "@/lib/date";
import { parseZoneLocations } from "@/lib/validation";

interface EditTaskModalProps {
  isOpen: boolean;
  task?: SeatTask | null;
  members?: RoomMemberItem[];
  currentUserId?: string;
  currentUserName?: string;
  onClose: () => void;
  onSave: (
    taskData: Partial<SeatTask> & { assignees?: TaskAssignee[] },
  ) => Promise<boolean | void> | void;
  onDelete?: (taskId: string) => void;
}

interface EditTaskFormProps {
  task?: SeatTask | null;
  members?: RoomMemberItem[];
  currentUserId?: string;
  currentUserName?: string;
  onClose: () => void;
  onSave: (
    taskData: Partial<SeatTask> & { assignees?: TaskAssignee[] },
  ) => Promise<boolean | void> | void;
  onDelete?: (taskId: string) => void;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({
  task,
  members = [],
  onClose,
  onSave,
  onDelete,
}) => {
  const initialLocs = parseZoneLocations(
    task?.targetLocation ?? "",
    task?.backupLocation,
  );
  const [targetLocation, setTargetLocation] = useState(
    initialLocs.mainLocation,
  );
  const [backupLocation, setBackupLocation] = useState(
    initialLocs.backupLocation,
  );
  const [targetDate, setTargetDate] = useState<string>(
    task?.targetDate ? toInputDateValue(task.targetDate) : "",
  );
  const [price, setPrice] = useState<number | "">(task?.price ?? "");
  const [backupPrice, setBackupPrice] = useState<number | "">(
    task?.backupPrice ?? "",
  );
  const [quantityNeeded, setQuantityNeeded] = useState(
    task?.quantityNeeded ?? 1,
  );
  const [note, setNote] = useState(task?.note ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const status: SeatStatus = task?.status ?? "AVAILABLE";

  // Initial assignees (multi-assignee with fallback)
  const initialAssignees: TaskAssignee[] =
    task?.assignees && task.assignees.length > 0
      ? task.assignees
      : task?.assignee
        ? [task.assignee]
        : [];
  const [selectedAssignees, setSelectedAssignees] =
    useState<TaskAssignee[]>(initialAssignees);
  const [isAssigneesOpen, setIsAssigneesOpen] = useState(
    initialAssignees.length > 0,
  );

  const handleToggleAssignee = (member: { userId: string; name: string }) => {
    setSelectedAssignees((prev) => {
      const exists = prev.some(
        (a) => a.userId === member.userId || a.name === member.name,
      );
      if (exists) {
        return prev.filter(
          (a) => a.userId !== member.userId && a.name !== member.name,
        );
      } else {
        return [...prev, { userId: member.userId, name: member.name }];
      }
    });
  };

  const handleResetAndClose = () => {
    const resetLocs = parseZoneLocations(
      task?.targetLocation ?? "",
      task?.backupLocation,
    );
    setTargetLocation(resetLocs.mainLocation);
    setBackupLocation(resetLocs.backupLocation);
    setTargetDate(task?.targetDate ? toInputDateValue(task.targetDate) : "");
    setPrice(task?.price ?? "");
    setBackupPrice(task?.backupPrice ?? "");
    setQuantityNeeded(task?.quantityNeeded ?? 1);
    setNote(task?.note ?? "");
    setSelectedAssignees(initialAssignees);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLocation.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const result = await onSave({
        id: task?.id,
        targetLocation: targetLocation.trim(),
        backupLocation: backupLocation.trim() || null,
        targetDate,
        price: Number(price) || 0,
        backupPrice:
          backupPrice !== "" && backupPrice !== null
            ? Number(backupPrice)
            : null,
        quantityNeeded: Number(quantityNeeded) || 1,
        quantitySecured: task?.quantitySecured ?? 0,
        note: note.trim(),
        status,
        assignees: selectedAssignees,
      });
      if (result !== false) {
        handleResetAndClose();
      }
    } catch (err) {
      console.error("Save task error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {/* Target Location (Main Zone) */}
      <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2.5">
        <div className="text-xs font-bold text-[#1ed760] uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>โซนหลัก</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs text-zinc-300 mb-1 block">
              ชื่อโซน / แถว *
            </label>
            <input
              type="text"
              placeholder="เช่น VIP A, A1"
              required
              maxLength={50}
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[#1ed760] focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-300 mb-1  flex items-center gap-1">
              <Coins className="w-3 h-3 text-[#1ed760]" />
              <span>ราคาบัตรหลัก (บาท)</span>
            </label>
            <input
              type="number"
              min={0}
              max={999999}
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="เช่น 6500"
              className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-[#1ed760] focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Backup Location (Optional Backup Zone) */}
      <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl space-y-2.5">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>โซนสำรอง</span>
          </span>
          <span className="text-[11px] text-zinc-500 font-normal">
            ไม่บังคับ
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs text-zinc-300 mb-1 block">
              ชื่อโซน / แถว
            </label>
            <input
              type="text"
              placeholder="เช่น Zone B"
              maxLength={50}
              value={backupLocation}
              onChange={(e) => setBackupLocation(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400/60 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-300 mb-1  flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>ราคาบัตรสำรอง (บาท)</span>
            </label>
            <input
              type="number"
              min={0}
              max={999999}
              value={backupPrice}
              onChange={(e) =>
                setBackupPrice(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="เช่น 4500"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400/60 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Target Date */}
      <div>
        <label className="font-semibold text-zinc-200 mb-1.5 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#1ed760]" />
            <span>รอบการแสดง</span>
          </span>
          {targetDate && (
            <span className="text-xs text-emerald-400 font-normal">
              {formatThaiDate(targetDate)}
            </span>
          )}
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 rounded-lg px-3.5 py-2 text-sm transition-colors scheme-dark cursor-pointer"
        />
      </div>

      {/* Quantity Needed */}
      <div>
        <label className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5 text-sm">
          <Ticket className="w-4 h-4 text-[#1ed760]" />
          <span>จำนวนที่ต้องการ (ใบ) *</span>
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={quantityNeeded}
          onChange={(e) => setQuantityNeeded(Number(e.target.value))}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2 text-sm transition-colors"
        />
      </div>

      {/* Backup Note */}
      <div>
        <label className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5 text-sm">
          <FileText className="w-4 h-4 text-[#1ed760]" />
          <span>หมายเหตุ</span>
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder=""
          className="w-full min-h-50 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg p-3 text-sm leading-relaxed resize-y transition-colors font-sans"
        />
      </div>
      {/* Assignees Section (ไม่บังคับ - กดก่อนค่อยไหลลงมา) */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl overflow-hidden transition-all">
        {/* Accordion Header (Click to expand/collapse) */}
        <button
          type="button"
          onClick={() => setIsAssigneesOpen((prev) => !prev)}
          className="w-full p-3 flex items-center justify-between hover:bg-zinc-900/50 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-3.5 h-3.5 text-[#1ed760] shrink-0" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              ผู้รับผิดชอบงาน
            </span>
            <span className="text-[10px] text-zinc-500 font-normal lowercase">
              (ไม่บังคับ)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedAssignees.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30">
                {selectedAssignees.length} คน
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                isAssigneesOpen ? "rotate-180 text-white" : ""
              }`}
            />
          </div>
        </button>

        {/* Expandable Member Selection Body */}
        {isAssigneesOpen && (
          <div className="p-3 pt-0 space-y-2.5 border-t border-zinc-800/60 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Selected Assignees Chips */}
            {selectedAssignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedAssignees.map((a) => (
                  <span
                    key={a.userId || a.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#242424] text-white border border-[#3d3d3d] text-xs font-medium"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#1ed760] text-black font-bold text-[8px] flex items-center justify-center shrink-0">
                      {a.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="max-w-28 truncate">{a.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAssignee(a);
                      }}
                      className="w-3.5 h-3.5 rounded-full bg-[#f3727f]/20 hover:bg-[#f3727f] text-[#f3727f] hover:text-white flex items-center justify-center ml-0.5 cursor-pointer transition-colors shrink-0"
                      title={`ถอน ${a.name}`}
                    >
                      <X className="w-2.5 h-2.5 stroke-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Room Members Picker */}
            {members.length > 0 ? (
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar pt-1">
                {members.map((m) => {
                  const isSelected = selectedAssignees.some(
                    (a) => a.userId === m.userId || a.name === m.name,
                  );
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() =>
                        handleToggleAssignee({
                          userId: m.userId,
                          name: m.name,
                        })
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-[#1ed760]/10 border border-[#1ed760]/40 text-white"
                          : "bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate">{m.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#1ed760] shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500 italic px-1 pt-1">
                ยังไม่มีสมาชิกในห้อง
              </div>
            )}
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        {task && onDelete ? (
          <button
            type="button"
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
            title="ลบรายการนี้"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleResetAndClose}
            className="px-4 py-1.5 rounded-full bg-[#242424] hover:bg-[#303030] disabled:opacity-40 text-[#b3b3b3] hover:text-white border border-[#383838] text-sm font-semibold transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !targetLocation.trim()}
            className="px-5 py-1.5 rounded-full bg-[#1ed760] hover:bg-[#1cd05a] disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-bold transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-1.5"
          >
            {isSubmitting && (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            )}
            <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึก"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  task,
  members = [],
  currentUserId,
  currentUserName,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-xl shadow-2xl p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3.5">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {task ? "แก้ไขที่นั่ง" : "เพิ่มที่นั่ง"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <EditTaskForm
          key={task ? `task-${task.id}` : `new-task-${isOpen}`}
          task={task}
          members={members}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
