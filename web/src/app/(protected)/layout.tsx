"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Loader2, UserCog, RotateCw } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { EditProfileModal } from "@/components/modals";
import {
  Footer,
  Avatar,
  NotificationDropdown,
  TicketWarLogo,
} from "@/components/common";
import { useClickOutside } from "@/lib/hooks";
import { getSocket, useSocketStatus } from "@/lib/socket";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { status: socketStatus, reconnect } = useSocketStatus();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (user) {
      const socket = getSocket();
      socket.emit("join_user", { userId: user.id });
    }
  }, [user, loading, router]);

  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const statusLabel =
    socketStatus === "connected"
      ? "ออนไลน์"
      : socketStatus === "connecting"
        ? "กำลังเชื่อมต่อ"
        : "ออฟไลน์";

  const statusTooltip = `สถานะ: ${statusLabel}${socketStatus === "disconnected" ? " (คลิกเพื่อต่อใหม่)" : ""}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          {/* <p className="text-xs text-[#b3b3b3]">กำลังตรวจสอบ</p> */}
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
      {/* Universal Protected Topbar */}
      <header className="h-16 border-b border-[#252525] bg-[#121212] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <Link
          href="/"
          className="hover:opacity-90 transition inline-flex items-center"
        >
          <TicketWarLogo size={34} showText textSize="text-xl" />
        </Link>

        {/* Right Header Controls: Notification + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationDropdown />

          {/* Current User Profile Dropdown (Circle Avatar Only) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative rounded-full hover:scale-105 transition-transform cursor-pointer p-0.5 focus:outline-none"
              aria-label="เมนูผู้ใช้งาน"
              aria-expanded={isDropdownOpen}
              title={statusTooltip}
            >
              <Avatar
                src={user.avatarUrl}
                name={user.name}
                size="md"
                className="border-2 border-transparent hover:border-[#1ed760] transition-colors shadow-md"
              />
              {/* Discord/Slack style status dot */}
              <span
                className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#121212] transition-colors ${
                  socketStatus === "connected"
                    ? "bg-[#1ed760]"
                    : socketStatus === "connecting"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-rose-500"
                }`}
              />
            </button>

            {/* Spotify-styled Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#1a1a1a] border border-[#282828] shadow-[0_8px_24px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-[#252525]">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar src={user.avatarUrl} name={user.name} size="md" />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1a1a] ${
                          socketStatus === "connected"
                            ? "bg-[#1ed760]"
                            : socketStatus === "connecting"
                              ? "bg-amber-400 animate-pulse"
                              : "bg-rose-500"
                        }`}
                      />
                    </div>
                    <div className="overflow-hidden min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-bold text-white truncate leading-snug">
                        {user.name}
                      </p>
                      <p className="text-xs text-[#a0a0a0] truncate mt-0.5 font-normal">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Realtime Status Row with Retry Action */}
                  <div className="mt-3 pt-2.5 border-t border-[#252525]/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          socketStatus === "connected"
                            ? "bg-[#1ed760]"
                            : socketStatus === "connecting"
                              ? "bg-amber-400 animate-pulse"
                              : "bg-rose-500"
                        }`}
                      />
                      <span className="text-xs text-zinc-300 font-medium truncate">
                        {socketStatus === "connected"
                          ? "ออนไลน์"
                          : socketStatus === "connecting"
                            ? "กำลังเชื่อมต่อ..."
                            : "ออฟไลน์"}
                      </span>
                    </div>

                    {socketStatus !== "connected" && (
                      <button
                        type="button"
                        onClick={() => {
                          reconnect();
                          toast.success("กำลังพยายามเชื่อมต่อเซิร์ฟเวอร์ใหม่...");
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#252525] hover:bg-[#333333] text-zinc-200 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0 border border-zinc-700/60"
                        title="ลองเชื่อมต่อเซิร์ฟเวอร์ใหม่"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>ต่อใหม่</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsEditProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#d4d4d4] hover:text-white hover:bg-[#252525] transition cursor-pointer font-medium"
                  >
                    <UserCog className="w-4 h-4 text-[#1ed760]" />
                    <span>แก้ไขข้อมูลส่วนตัว</span>
                  </button>

                  <div className="h-px bg-[#252525] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#d4d4d4] hover:text-[#f3727f] hover:bg-[#2a1517] transition cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      {/* Protected Pages Content */}
      <main className="flex-1 w-full">{children}</main>

      {/* Minimal Footer */}
      <Footer />
    </div>
  );
}
