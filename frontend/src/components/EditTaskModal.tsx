"use client";

import React, { useState } from "react";
import { SeatTask, SeatStatus } from "@/types";
import {
  X,
  Trash2,
  Calendar,
  MapPin,
  Coins,
  Ticket,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { formatThaiDate, toInputDateValue } from "@/lib/date";

interface EditTaskModalProps {
  isOpen: boolean;
  task?: SeatTask | null;
  onClose: () => void;
  onSave: (taskData: Partial<SeatTask>) => void;
  onDelete?: (taskId: string) => void;
}

interface EditTaskFormProps {
  task?: SeatTask | null;
  onClose: () => void;
  onSave: (taskData: Partial<SeatTask>) => void;
  onDelete?: (taskId: string) => void;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({
  task,
  onClose,
  onSave,
  onDelete,
}) => {
  const [targetLocation, setTargetLocation] = useState(
    task?.targetLocation ?? "",
  );
  const [targetDate, setTargetDate] = useState<string>(
    task?.targetDate ? toInputDateValue(task.targetDate) : "",
  );
  const [price, setPrice] = useState<number | "">(task?.price ?? "");
  const [quantityNeeded, setQuantityNeeded] = useState(
    task?.quantityNeeded ?? 1,
  );
  const [quantitySecured, setQuantitySecured] = useState(
    task?.quantitySecured ?? 0,
  );
  const [note, setNote] = useState(task?.note ?? "");
  const status: SeatStatus = task?.status ?? "AVAILABLE";

  const handleResetAndClose = () => {
    setTargetLocation(task?.targetLocation ?? "");
    setTargetDate(task?.targetDate ? toInputDateValue(task.targetDate) : "");
    setPrice(task?.price ?? "");
    setQuantityNeeded(task?.quantityNeeded ?? 1);
    setQuantitySecured(task?.quantitySecured ?? 0);
    setNote(task?.note ?? "");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLocation.trim()) return;

    onSave({
      id: task?.id,
      targetLocation: targetLocation.trim(),
      targetDate,
      price: Number(price) || 0,
      quantityNeeded: Number(quantityNeeded) || 1,
      quantitySecured: Number(quantitySecured) || 0,
      note: note.trim(),
      status,
    });
    handleResetAndClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {/* Target Location */}
      <div>
        <label className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5 text-sm">
          <MapPin className="w-4 h-4 text-[#1ed760]" />
          <span>โซน / แถว / ราคา *</span>
        </label>
        <input
          type="text"
          placeholder="A1"
          required
          maxLength={50}
          value={targetLocation}
          onChange={(e) => setTargetLocation(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2.5 text-sm transition-colors"
        />
      </div>

      {/* Target Date & Price */}
      <div className="grid grid-cols-2 gap-3">
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
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 rounded-lg px-3.5 py-2.5 text-sm transition-colors scheme-dark cursor-pointer"
          />
        </div>
        <div>
          <label className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5 text-sm">
            <Coins className="w-4 h-4 text-[#1ed760]" />
            <span>ราคาบัตร (บาท)</span>
          </label>
          <input
            type="number"
            min={0}
            max={999999}
            value={price}
            onChange={(e) =>
              setPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="เช่น 5500"
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2.5 text-sm transition-colors"
          />
        </div>
      </div>

      {/* Quantities: Needed & (Secured if editing) */}
      <div className={task ? "grid grid-cols-2 gap-3" : ""}>
        <div>
          <label className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5 text-sm">
            <Ticket className="w-4 h-4 text-[#1ed760]" />
            <span>จำนวนที่ต้องการ (ใบ) *</span>
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={quantityNeeded}
            onChange={(e) => setQuantityNeeded(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2.5 text-sm transition-colors"
          />
        </div>
        {task && (
          <div>
            <label className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
              <span>จำนวนที่ได้แล้ว (ใบ)</span>
            </label>
            <input
              type="number"
              min={0}
              max={quantityNeeded}
              value={quantitySecured}
              onChange={(e) => setQuantitySecured(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3.5 py-2.5 text-sm transition-colors"
            />
          </div>
        )}
      </div>

      {/* Backup Note */}
      <div>
        <label className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5 text-sm">
          <FileText className="w-4 h-4 text-[#1ed760]" />
          <span>หมายเหตุ</span>
        </label>
        <textarea
          rows={5}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full min-h-36 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-100 placeholder:text-zinc-500 rounded-lg p-3.5 text-sm leading-relaxed resize-y transition-colors font-sans"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        {task && onDelete ? (
          <button
            type="button"
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
            className="p-2.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
            title="ลบรายการนี้"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-5 py-2 rounded-full bg-[#242424] hover:bg-[#303030] text-[#b3b3b3] hover:text-white border border-[#383838] text-sm font-semibold transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-full bg-[#1ed760] hover:bg-[#1cd05a] text-black text-sm font-bold transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            บันทึก
          </button>
        </div>
      </div>
    </form>
  );
};

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 mb-4">
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
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
