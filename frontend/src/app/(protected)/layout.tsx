/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Loader2, UserCog } from "lucide-react";
import Link from "next/link";
import { EditProfileModal } from "@/components/EditProfileModal";
import { Footer } from "@/components/Footer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#1ed760] animate-spin" />
          <p className="text-xs text-[#b3b3b3]">
            กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
          </p>
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
          className="flex items-center gap-2.5 hover:opacity-90 transition"
        >
          <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center font-bold text-black text-sm">
            TW
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Ticket<span className="text-[#1ed760]">War</span>
          </span>
        </Link>

        {/* Current User Profile Dropdown (Circle Avatar Only) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="rounded-full hover:scale-105 transition-transform cursor-pointer p-0.5 focus:outline-none"
            aria-label="เมนูผู้ใช้งาน"
            aria-expanded={isDropdownOpen}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-transparent hover:border-[#1ed760] transition-colors shadow-md"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#1ed760] text-black font-extrabold text-xs flex items-center justify-center border-2 border-transparent hover:border-white transition-colors shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {/* Spotify-styled Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1a1a1a] border border-[#282828] shadow-[0_8px_24px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-[#252525]">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#333333]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1ed760] text-black font-extrabold text-sm flex items-center justify-center shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[10.5px] text-[#888888] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsEditProfileOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-[#cbcbcb] hover:text-white hover:bg-[#252525] transition cursor-pointer"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-[#cbcbcb] hover:text-[#f3727f] hover:bg-[#2a1517] transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
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
