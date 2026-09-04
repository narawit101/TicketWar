"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Plus,
  Archive,
  Users,
  ExternalLink,
  LogOut,
  LogIn,
} from "lucide-react";
import { Room } from "@/types";

interface NavbarProps {
  currentRoom: Room;
  currentUser: { id: string; name: string; email: string } | null;
  onOpenCreateTask: () => void;
  onOpenInviteModal: () => void;
  onToggleArchive: () => void;
  onOpenRoomList: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoom,
  currentUser,
  onOpenCreateTask,
  onOpenInviteModal,
  onToggleArchive,
  onOpenRoomList,
  onOpenAuth,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/join/${currentRoom.inviteCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="h-16 border-b border-[#252525] bg-[#121212] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Room info */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenRoomList}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left cursor-pointer"
          title="Switch Room"
        >
          {/* Spotify styled icon badge */}
          <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center font-bold text-black text-sm">
            TW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight hover:underline flex items-center gap-1">
                {currentRoom.title}
                <ExternalLink className="w-3.5 h-3.5 text-[#b3b3b3]" />
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentRoom.status === "ACTIVE"
                    ? "bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40"
                    : "bg-[#252525] text-[#b3b3b3]"
                }`}
              >
                {currentRoom.status === "ACTIVE"
                  ? "🔴 Live War"
                  : "📦 Archived"}
              </span>
            </div>
            <p className="text-[12px] text-[#b3b3b3]">
              {currentRoom.eventDate} • {currentRoom.memberCount} สมาชิกในห้อง
            </p>
          </div>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Copy Invite Link */}
        <button
          onClick={handleCopyLink}
          className="btn-pill btn-pill-dark text-xs px-3.5 py-1.5 gap-1.5 hidden sm:inline-flex cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[#1ed760]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "COPIED LINK!" : "COPY INVITE LINK"}
        </button>

        <button
          onClick={onOpenInviteModal}
          className="p-2 rounded-full hover:bg-[#1f1f1f] text-[#b3b3b3] hover:text-white transition sm:hidden cursor-pointer"
          title="Invite"
        >
          <Users className="w-5 h-5" />
        </button>

        {/* Add Seat Task */}
        {currentRoom.status === "ACTIVE" && (
          <button
            onClick={onOpenCreateTask}
            className="btn-pill btn-pill-green text-xs px-4 py-2 gap-1.5 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4 text-black stroke-3" />
            <span>เพิ่มที่นั่ง</span>
          </button>
        )}

        {/* Archive or Finish Room */}
        <button
          onClick={onToggleArchive}
          className="btn-pill bg-[#1f1f1f] hover:bg-[#252525] text-[#b3b3b3] hover:text-white border border-[#333333] text-xs px-3 py-1.5 gap-1.5 cursor-pointer"
          title={
            currentRoom.status === "ACTIVE"
              ? "จบงานและเก็บเข้าคลัง"
              : "เปิดห้องอีกครั้ง"
          }
        >
          <Archive className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {currentRoom.status === "ACTIVE"
              ? "จบงาน (ARCHIVE)"
              : "เปิดห้องต่อ"}
          </span>
        </button>

        {/* User Auth Section */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#252525]">
            <div
              className="w-8 h-8 rounded-full bg-[#1ed760] text-black font-extrabold text-xs flex items-center justify-center cursor-default"
              title={`${currentUser.name} (${currentUser.email})`}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-full hover:bg-[#252525] text-[#888888] hover:text-[#f3727f] transition cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-pill btn-pill-green text-xs px-4 py-2 gap-1.5 cursor-pointer font-bold shadow-md"
          >
            <LogIn className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>LOG IN</span>
          </button>
        )}
      </div>
    </header>
  );
};
