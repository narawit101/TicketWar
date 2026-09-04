"use client";

import React from "react";
import {
  Archive,
  ArchiveRestore,
  Trash2,
  X,
  Loader2,
  LogOut,
} from "lucide-react";

export type ConfirmType =
  | "ARCHIVE"
  | "RESTORE"
  | "DELETE"
  | "LEAVE"
  | "DELETE_TASK"
  | "DELETE_MESSAGE";

interface ConfirmActionModalProps {
  isOpen: boolean;
  type: ConfirmType;
  roomTitle?: string;
  itemTitle?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  loading?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  type,
  roomTitle = "",
  itemTitle = "",
  onConfirm,
  onClose,
  loading = false,
}) => {
  if (!isOpen) return null;

  const config = {
    DELETE: {
      title: "ยืนยันการลบห้อง",
      desc: `คุณแน่ใจหรือไม่ว่าต้องการลบห้อง "${roomTitle}" อย่างถาวร? ข้อมูลแชทและที่นั่งทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้`,
      confirmBtn: "ลบห้อง",
      btnClass: "bg-rose-600 hover:bg-rose-500 text-white border-transparent",
      icon: <Trash2 className="w-5 h-5 text-rose-400" />,
      iconBg: "bg-rose-500/10 border border-rose-500/20",
    },
    DELETE_TASK: {
      title: "ยืนยันการลบที่นั่ง",
      desc: `คุณแน่ใจหรือไม่ว่าต้องการลบที่นั่ง "${itemTitle || "รายการนี้"}"? ข้อมูลนี้จะถูกลบออกและไม่สามารถกู้คืนได้`,
      confirmBtn: "ลบที่นั่ง",
      btnClass: "bg-rose-600 hover:bg-rose-500 text-white border-transparent",
      icon: <Trash2 className="w-5 h-5 text-rose-400" />,
      iconBg: "bg-rose-500/10 border border-rose-500/20",
    },
    DELETE_MESSAGE: {
      title: itemTitle?.includes("รูปภาพ")
        ? "ยืนยันการลบรูปภาพ"
        : "ยืนยันการลบข้อความ",
      desc: itemTitle?.includes("รูปภาพ")
        ? "คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้? ข้อมูลจะถูกลบออกจากห้องอย่างถาวร"
        : `คุณแน่ใจหรือไม่ว่าต้องการลบข้อความ "${itemTitle || "นี้"}"? ข้อมูลจะถูกลบออกจากห้องอย่างถาวร`,
      confirmBtn: itemTitle?.includes("รูปภาพ") ? "ลบรูปภาพ" : "ลบข้อความ",
      btnClass:
        "bg-rose-600 hover:bg-rose-500 text-white font-bold border-transparent",
      icon: <Trash2 className="w-5 h-5 text-rose-400" />,
      iconBg: "bg-rose-500/10 border border-rose-500/20",
    },
    ARCHIVE: {
      title: "เปลี่ยนสถานะห้องเป็นจัดเก็บ",
      desc: `คุณต้องการเปลี่ยนสถานะห้อง "${roomTitle}" เป็นจัดเก็บใช่หรือไม่? ห้องจะเปลี่ยนเป็นสถานะอ่านอย่างเดียว (ไม่สามารถกดรับที่นั่งหรือส่งข้อความเพิ่มได้)`,
      confirmBtn: "จัดเก็บ",
      btnClass:
        "bg-[#242424] hover:bg-[#303030] text-zinc-200 border border-[#383838]",
      icon: <Archive className="w-5 h-5 text-zinc-300" />,
      iconBg: "bg-zinc-800 border border-zinc-700/50",
    },
    RESTORE: {
      title: "เปิดใช้งานห้องต่อ",
      desc: `คุณต้องการนำห้อง "${roomTitle}" กลับใช้งานต่อใช่หรือไม่? สมาชิกทุกคนจะสามารถกดบัตรและพูดคุยได้ตามปกติ`,
      confirmBtn: "เปิดใช้งานต่อ",
      btnClass:
        "bg-[#1ed760] hover:bg-[#1cd05a] text-black font-bold border-transparent",
      icon: <ArchiveRestore className="w-5 h-5 text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    },
    LEAVE: {
      title: "ยืนยันการออกจากห้อง",
      desc: `คุณต้องการออกจากห้อง "${roomTitle}" ใช่หรือไม่? หากต้องการกลับเข้าห้องอีกครั้งจะต้องใช้ลิงก์เชิญ`,
      confirmBtn: "ออกจากห้อง",
      btnClass:
        "bg-[#f3727f] hover:bg-[#e11d48] text-white font-bold border-transparent",
      icon: <LogOut className="w-5 h-5 text-rose-400" />,
      iconBg: "bg-rose-500/10 border border-rose-500/20",
    },
  }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 relative shadow-2xl animate-in zoom-in-95 duration-150 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-3">
          <div
            className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}
          >
            {config.icon}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {config.title}
          </h2>
        </div>

        {/* Description */}
        <p className="text-sm text-[#b3b3b3] leading-relaxed mb-6">
          {config.desc}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#282828]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-full text-sm font-semibold text-[#b3b3b3] hover:text-white bg-[#242424] hover:bg-[#303030] border border-[#383838] transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-md hover:scale-[1.02] active:scale-[0.98] ${config.btnClass}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              <span>{config.confirmBtn}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
