"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { validatePassword } from "@/lib/validation";
import { toast } from "react-hot-toast";
import { Avatar } from "./Avatar";
import {
  X,
  Camera,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Trash2,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;
  return <EditProfileDialog onClose={onClose} />;
};

const EditProfileDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl || null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCancel = () => {
    onClose();
  };

  if (!user) return null;

  // Handle image upload & client-side compression to lightweight base64 DataURL
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดรูปภาพต้องไม่เกิน 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarUrl(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("กรุณากรอกชื่อที่แสดง");
      return;
    }

    // If new password entered, validate it
    if (newPassword) {
      const passwordCheck = validatePassword(newPassword);
      if (!passwordCheck.isValid) {
        toast.error(passwordCheck.error || "รหัสผ่านใหม่ไม่ถูกต้อง");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: trimmedName,
          avatarUrl,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }

      // Update AuthContext & localStorage
      updateUser({
        name: data.user.name,
        avatarUrl: data.user.avatarUrl,
      });

      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#181818] border border-[#252525] w-full max-w-md rounded-2xl modal-shadow p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-left my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#252525] transition cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[#1ed760]" />
            แก้ไขข้อมูลส่วนตัว
          </h2>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {/* Avatar Change Section */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#141414] border border-[#222222]">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar
                src={avatarUrl}
                name={name || user.name}
                size="xl"
                className="border-2 border-[#1ed760]/60 shadow-lg"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold">เปลี่ยนรูป</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-[#1ed760] hover:underline cursor-pointer"
              >
                อัปโหลดรูปภาพใหม่
              </button>

              {avatarUrl && (
                <>
                  <span className="text-[#444444]">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-[#888888] hover:text-[#f3727f] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบรูปโปรไฟล์
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold text-zinc-200 mb-1.5">
              ชื่อที่แสดง
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="กรอกชื่อของคุณ"
              className="input-spotify w-full text-sm py-2.5 px-3.5 rounded-lg bg-[#1f1f1f] text-white"
            />
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-zinc-200">
                อีเมล
              </label>
              <span className="text-xs text-[#888888] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> ไม่สามารถเปลี่ยนแปลงได้
              </span>
            </div>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full text-sm py-2.5 px-3.5 rounded-lg bg-[#181818] border border-[#272727] text-[#777777] cursor-not-allowed select-none"
            />
          </div>

          {/* Password Change Section (Directly visible, no accordion) */}
          <div className="pt-3 border-t border-[#252525] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                เปลี่ยนรหัสผ่านใหม่
              </span>
              <span className="text-xs text-[#888888]">
                (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
              </span>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-1.5">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ (หากต้องการเปลี่ยน)"
                  className="input-spotify w-full text-sm py-2.5 pl-3.5 pr-10 rounded-lg bg-[#1f1f1f] text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition cursor-pointer p-1"
                >
                  {showNewPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Real-time Checklist when user is typing new password */}
              {newPassword && (
                <div className="mt-2 text-[11px] text-[#888888] space-y-1 bg-[#141414] p-2.5 rounded-lg border border-[#252525] animate-in fade-in slide-in-from-top-2 duration-150">
                  <p className="font-semibold text-white/80 mb-1">
                    ข้อกำหนดรหัสผ่านใหม่:
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span
                      className={`flex items-center gap-1.5 transition-colors ${newPassword.length >= 8 ? "text-[#1ed760] font-medium" : "text-[#666666]"}`}
                    >
                      <span>{newPassword.length >= 8 ? "✓" : "•"}</span>{" "}
                      อย่างน้อย 8 ตัวอักษร
                    </span>
                    <span
                      className={`flex items-center gap-1.5 transition-colors ${/[A-Z]/.test(newPassword) ? "text-[#1ed760] font-medium" : "text-[#666666]"}`}
                    >
                      <span>{/[A-Z]/.test(newPassword) ? "✓" : "•"}</span>{" "}
                      ตัวพิมพ์ใหญ่ (A-Z)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 transition-colors ${/[a-z]/.test(newPassword) ? "text-[#1ed760] font-medium" : "text-[#666666]"}`}
                    >
                      <span>{/[a-z]/.test(newPassword) ? "✓" : "•"}</span>{" "}
                      ตัวพิมพ์เล็ก (a-z)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 transition-colors ${/[0-9]/.test(newPassword) ? "text-[#1ed760] font-medium" : "text-[#666666]"}`}
                    >
                      <span>{/[0-9]/.test(newPassword) ? "✓" : "•"}</span>{" "}
                      ตัวเลข (0-9)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-1.5">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="input-spotify w-full text-sm py-2.5 pl-3.5 pr-10 rounded-lg bg-[#1f1f1f] text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition cursor-pointer p-1"
                >
                  {showConfirmPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-[#f3727f] mt-1">
                  รหัสผ่านไม่ตรงกัน
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-[#b3b3b3] hover:text-white border border-[#333333] hover:border-[#555555] transition cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-pill btn-pill-green px-6 py-2.5 text-sm font-bold tracking-wider cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึกข้อมูล</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
