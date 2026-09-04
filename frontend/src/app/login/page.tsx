"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { validatePassword } from "@/lib/validation";
import { toast } from "react-hot-toast";

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

      setTimeout(() => {
        login(data.user);
        router.push("/");
      }, 600);
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
      <div className="bg-[#181818] border border-[#252525] w-full max-w-[400px] rounded-2xl modal-shadow p-8 relative animate-in fade-in zoom-in-95 duration-200 text-center">
        {/* Brand Logo Header */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#1ed760] flex items-center justify-center font-bold text-black text-sm">
            TW
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Ticket<span className="text-[#1ed760]">War</span>
          </h1>
        </div>

        {/* Smooth Sliding Underline Tabs */}
        <div className="relative flex border-b border-[#252525] mb-6">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`w-1/2 pb-2.5 text-sm font-bold tracking-wide transition-colors cursor-pointer text-center ${
              tab === "login" ? "text-white" : "text-[#777777] hover:text-white"
            }`}
          >
            เข้าสู่ระบบ
          </button>

          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`w-1/2 pb-2.5 text-sm font-bold tracking-wide transition-colors cursor-pointer text-center ${
              tab === "signup" ? "text-white" : "text-[#777777] hover:text-white"
            }`}
          >
            สมัครสมาชิก
          </button>

          {/* Smooth Sliding Underline Indicator (GPU-accelerated transform) */}
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-1/2 bg-white rounded-full transition-transform duration-300 ease-out pointer-events-none ${
              tab === "signup" ? "translate-x-full" : "translate-x-0"
            }`}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
          {tab === "signup" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อที่แสดง"
                className="input-spotify w-full text-xs py-3 px-4 rounded-lg bg-[#1f1f1f] text-white"
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
              className="input-spotify w-full text-xs py-3 px-4 rounded-lg bg-[#1f1f1f] text-white"
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
                className="input-spotify w-full text-xs py-3 pl-4 pr-10 rounded-lg bg-[#1f1f1f] text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition cursor-pointer p-1"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {tab === "signup" && (
              <div className="mt-2 text-[11px] text-[#888888] text-left space-y-1 bg-[#141414] p-2.5 rounded-lg border border-[#252525] animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="font-semibold text-white/80 mb-1">ข้อกำหนดรหัสผ่าน:</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className={`flex items-center gap-1.5 transition-colors ${password.length >= 8 ? "text-[#1ed760] font-medium" : "text-[#666666]"}`}>
                    <span>{password.length >= 8 ? "✓" : "•"}</span> อย่างน้อย 8 ตัวอักษร
                  </span>
                  <span className={`flex items-center gap-1.5 transition-colors ${/[A-Z]/.test(password) ? "text-[#1ed760] font-medium" : "text-[#666666]"}`}>
                    <span>{/[A-Z]/.test(password) ? "✓" : "•"}</span> ตัวพิมพ์ใหญ่ (A-Z)
                  </span>
                  <span className={`flex items-center gap-1.5 transition-colors ${/[a-z]/.test(password) ? "text-[#1ed760] font-medium" : "text-[#666666]"}`}>
                    <span>{/[a-z]/.test(password) ? "✓" : "•"}</span> ตัวพิมพ์เล็ก (a-z)
                  </span>
                  <span className={`flex items-center gap-1.5 transition-colors ${/[0-9]/.test(password) ? "text-[#1ed760] font-medium" : "text-[#666666]"}`}>
                    <span>{/[0-9]/.test(password) ? "✓" : "•"}</span> ตัวเลข (0-9)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-pill btn-pill-green w-full py-3 text-xs tracking-wider cursor-pointer font-bold mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
