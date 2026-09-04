"use client";

import React, { useState } from "react";
import { X, Copy, Check, QrCode } from "lucide-react";
import { Room } from "@/types";

interface InviteModalProps {
  isOpen: boolean;
  room: Room;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  room,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || "");
  const inviteUrl = `${origin}/join/${room.inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            แชร์ลิงก์เชิญเพื่อน
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-3.5 rounded-xl inline-block mx-auto mb-3 shadow-md">
          <QrCode className="w-32 h-32 text-zinc-900 mx-auto" />
        </div>

        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          ส่งลิงก์นี้ให้เพื่อนเพื่อเข้ามาดูและช่วยอัปเดตสถานะที่นั่งร่วมกัน
        </p>

        {/* Link Box */}
        <div className="bg-zinc-950 p-1.5 pl-3 rounded-xl border border-zinc-800 flex items-center justify-between gap-2 mb-4">
          <span className="text-xs text-[#1ed760] font-mono truncate">
            {inviteUrl}
          </span>
          <button
            onClick={handleCopy}
            className="px-4 py-1.5 rounded-full bg-[#1ed760] hover:bg-[#1cd05a] text-black text-xs font-bold cursor-pointer whitespace-nowrap transition-all flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
          </button>
        </div>

        {/* <button
          onClick={onClose}
          className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition cursor-pointer"
        >
          ปิดหน้าต่าง
        </button> */}
      </div>
    </div>
  );
};
