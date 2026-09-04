"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { validatePassword } from "@/lib/validation";
import { toast } from "react-hot-toast";
import { TicketWarLogo } from "@/components/TicketWarLogo";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === "signup" && !name.trim()) {
      toast.error("กรุณากรอกชื่อที่แสดง");
      return;
    }

    if (!email.trim()) {
      toast.error("กรุณากรอกอีเมล");
      return;
    }

    if (!password) {
      toast.error("กรุณากรอกรหัสผ่าน");
      return;
    }

    if (tab === "signup") {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.error || "รหัสผ่านไม่ถูกต้อง");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        tab === "login"
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการทำรายการ");
      }

      toast.success(
        tab === "login" ? "เข้าสู่ระบบสำเร็จ!" : "สมัครสมาชิกสำเร็จ!",
      );

      login(data.user);
      router.push("/");
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
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      {/* Spotify Styled Auth Card */}
      <div className="bg-[#181818] border border-[#282828] w-full max-w-105 rounded-2xl sm:rounded-3xl modal-shadow p-8 sm:p-10 relative animate-in fade-in zoom-in-95 duration-200 text-center">
        {/* Brand Logo Header */}
        <div className="mb-8 flex items-center justify-center">
          <TicketWarLogo size={42} showText textSize="text-2xl sm:text-3xl" />
        </div>

        {/* Smooth Sliding Underline Tabs */}
        <div className="relative flex border-b border-[#2e2e2e] mb-7">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`w-1/2 pb-3 text-base sm:text-lg font-bold tracking-wide transition-colors cursor-pointer text-center ${
              tab === "login" ? "text-white" : "text-[#777777] hover:text-white"
            }`}
          >
            เข้าสู่ระบบ
          </button>

          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`w-1/2 pb-3 text-base sm:text-lg font-bold tracking-wide transition-colors cursor-pointer text-center ${
              tab === "signup"
                ? "text-white"
                : "text-[#777777] hover:text-white"
            }`}
          >
            สมัครสมาชิก
          </button>

          {/* Smooth Sliding Underline Indicator (GPU-accelerated transform) */}
          <span
            className={`absolute bottom-0 left-0 h-1 w-1/2 bg-white rounded-full transition-transform duration-300 ease-out pointer-events-none ${
              tab === "signup" ? "translate-x-full" : "translate-x-0"
            }`}
          />
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 sm:space-y-5 text-left"
        >
          {tab === "signup" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อที่แสดง"
                className="input-spotify w-full text-sm sm:text-base py-3.5 px-4 sm:px-5 rounded-xl bg-[#1f1f1f] text-white placeholder:text-[#777777]"
              />
            </div>
          )}

          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="อีเมล หรือ ชื่อผู้ใช้"
              className="input-spotify w-full text-sm sm:text-base py-3.5 px-4 sm:px-5 rounded-xl bg-[#1f1f1f] text-white placeholder:text-[#777777]"
            />
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                className="input-spotify w-full text-sm sm:text-base py-3.5 pl-4 sm:pl-5 pr-12 rounded-xl bg-[#1f1f1f] text-white placeholder:text-[#777777]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition cursor-pointer p-1"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {tab === "signup" && (
              <div className="mt-3 text-xs sm:text-sm text-[#888888] text-left space-y-1.5 bg-[#141414] p-3.5 sm:p-4 rounded-xl border border-[#282828] animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="font-semibold text-white/90 mb-1.5 text-xs sm:text-sm">
                  ข้อกำหนดรหัสผ่าน:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span
                    className={`flex items-center gap-1.5 transition-colors ${password.length >= 8 ? "text-[#1ed760] font-medium" : "text-[#777777]"}`}
                  >
                    <span className="text-sm font-bold">
                      {password.length >= 8 ? "✓" : "•"}
                    </span>{" "}
                    อย่างน้อย 8 ตัวอักษร
                  </span>
                  <span
                    className={`flex items-center gap-1.5 transition-colors ${/[A-Z]/.test(password) ? "text-[#1ed760] font-medium" : "text-[#777777]"}`}
                  >
                    <span className="text-sm font-bold">
                      {/[A-Z]/.test(password) ? "✓" : "•"}
                    </span>{" "}
                    ตัวพิมพ์ใหญ่ (A-Z)
                  </span>
                  <span
                    className={`flex items-center gap-1.5 transition-colors ${/[a-z]/.test(password) ? "text-[#1ed760] font-medium" : "text-[#777777]"}`}
                  >
                    <span className="text-sm font-bold">
                      {/[a-z]/.test(password) ? "✓" : "•"}
                    </span>{" "}
                    ตัวพิมพ์เล็ก (a-z)
                  </span>
                  <span
                    className={`flex items-center gap-1.5 transition-colors ${/[0-9]/.test(password) ? "text-[#1ed760] font-medium" : "text-[#777777]"}`}
                  >
                    <span className="text-sm font-bold">
                      {/[0-9]/.test(password) ? "✓" : "•"}
                    </span>{" "}
                    ตัวเลข (0-9)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-pill btn-pill-green w-full py-3.5 sm:py-4 text-sm sm:text-base tracking-wider cursor-pointer font-bold mt-3 sm:mt-4 flex items-center justify-center gap-2 shadow-lg shadow-[#1ed760]/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              <span>{tab === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
