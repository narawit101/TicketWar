/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { getSocket } from "@/lib/socket";
import {
  Calendar,
  Users,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface RoomPreview {
  id: string;
  title: string;
  bannerUrl?: string;
  seatingPlanUrl?: string;
  eventDate?: string;
  status: string;
  inviteCode: string;
  ownerName: string;
  memberCount: number;
}

const formatEventDate = (dateStr?: string) => {
  if (!dateStr || dateStr === "วันแสดงที่กำหนด" || dateStr === "เร็วๆ นี้") {
    return dateStr || "ยังไม่ระบุวัน";
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return (
      d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " น."
    );
  } catch {
    return dateStr;
  }
};

export default function JoinRoomByLinkPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const code = Array.isArray(params?.code) ? params.code[0] : params?.code;

  const [room, setRoom] = useState<RoomPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);

  // Manual code input toggle
  const [isManualInput, setIsManualInput] = useState(false);
  const [customCode, setCustomCode] = useState("");

  // Fetch Room Preview & Check Membership
  useEffect(() => {
    if (!code || authLoading) return;
    let ignore = false;

    async function fetchPreview() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const url = user
          ? `/api/rooms/join?code=${encodeURIComponent(String(code))}&userId=${encodeURIComponent(user.id)}`
          : `/api/rooms/join?code=${encodeURIComponent(String(code))}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!ignore) {
          if (res.ok && data.room) {
            setRoom(data.room);
            setIsAlreadyMember(Boolean(data.isMember));
          } else {
            setErrorMsg(data.error || "ไม่พบห้องนี้ หรือรหัสห้องไม่ถูกต้อง");
          }
        }
      } catch (err) {
        console.error("Failed to load room preview:", err);
        if (!ignore) setErrorMsg("เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchPreview();
    return () => {
      ignore = true;
    };
  }, [code, user, authLoading]);

  // Handle Confirmed Join
  const handleConfirmJoin = async (targetCode: string) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนเข้าร่วมห้อง");
      router.push("/login");
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: targetCode,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถเข้าร่วมห้องได้");
      }

      toast.success(`เข้าร่วมห้อง "${data.roomTitle}" สำเร็จ!`);
      getSocket().emit("member_joined", {
        roomId: data.roomId,
        user: data.user || { id: user.id, name: user.name, email: user.email },
        memberCount: data.memberCount || (room?.memberCount || 1) + 1,
      });
      router.replace(`/rooms/${data.roomId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("เกิดข้อผิดพลาดในการเข้าร่วมห้อง");
      }
      setJoining(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-[#181818] border border-[#252525] rounded-2xl p-8 max-w-sm w-full space-y-3">
          <Loader2 className="w-8 h-8 text-[#1ed760] animate-spin mx-auto" />
          <h2 className="text-sm font-bold text-white">
            กำลังตรวจสอบคำเชิญ...
          </h2>
        </div>
      </div>
    );
  }

  // If Room Not Found or Invalid Code
  if (errorMsg || !room) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-[#181818] border border-[#252525] rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#e91429]/15 text-[#ff4b5a] flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              ไม่พบห้อง หรือลิงก์หมดอายุ
            </h2>
            <p className="text-xs text-[#888888] mt-1">
              {errorMsg || "รหัสคำเชิญนี้ไม่ถูกต้อง หรือห้องนี้อาจถูกลบไปแล้ว"}
            </p>
          </div>

          {/* Form to enter a different code */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customCode.trim()) {
                router.push(`/join/${customCode.trim()}`);
              }
            }}
            className="space-y-3 pt-2 text-left"
          >
            <label className="text-[11px] font-semibold text-[#b3b3b3] block">
              ต้องการกรอกรหัสเชิญอื่น?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="วางรหัส เช่น cly9..."
                className="input-spotify flex-1 text-xs py-2 px-3 rounded-lg bg-[#1f1f1f] text-white font-mono"
              />
              <button
                type="submit"
                disabled={!customCode.trim()}
                className="btn-pill btn-pill-green text-xs px-4 py-2 font-bold cursor-pointer disabled:opacity-50"
              >
                ค้นหา
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-[#252525]">
            <Link
              href="/"
              className="text-xs text-[#888888] hover:text-white transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าแรก</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4">
      <div className="bg-[#181818] border border-[#282828] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 text-left">
        {/* Poster Header (if available) */}
        {room.bannerUrl ? (
          <div className="relative w-full h-44 bg-[#141414]">
            <img
              src={room.bannerUrl}
              alt={room.title}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#181818] via-[#181818]/40 to-transparent" />
          </div>
        ) : (
          <div className="h-4 bg-linear-to-r from-[#1ed760] to-[#539df5]" />
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-[#1ed760] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isAlreadyMember
                ? "คุณเป็นสมาชิกห้องนี้อยู่แล้ว"
                : "คำเชิญเข้าร่วมห้องแชท"}
            </span>
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {room.title}
            </h1>
            <p className="text-xs text-[#888888] mt-1">
              สร้างโดย{" "}
              <span className="text-white font-medium">{room.ownerName}</span>
            </p>
          </div>

          {/* Room Metadata Badges */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#b3b3b3]">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#1ed760]" />
              <span>{formatEventDate(room.eventDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#888888]">
              <Users className="w-3.5 h-3.5 text-[#539df5]" />
              <span>สมาชิกในห้อง: {room.memberCount} คน</span>
            </div>
          </div>

          {/* Action Buttons: Confirm Join vs Cancel */}
          <div className="pt-2 space-y-2.5">
            {isAlreadyMember ? (
              <button
                onClick={() => router.push(`/rooms/${room.id}`)}
                className="w-full btn-pill btn-pill-green py-3 text-xs font-bold gap-2 cursor-pointer flex items-center justify-center shadow-lg"
              >
                <span>เข้าสู่ห้อง</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            ) : (
              <button
                onClick={() => code && handleConfirmJoin(String(code))}
                disabled={joining}
                className="w-full btn-pill btn-pill-green py-3 text-xs font-bold gap-2 cursor-pointer flex items-center justify-center shadow-lg"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>กำลังบันทึกเข้าร่วมห้อง...</span>
                  </>
                ) : (
                  <>
                    <span>ยืนยันเข้าร่วมห้อง</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => router.push("/")}
              disabled={joining}
              className="w-full py-2.5 text-xs text-[#888888] hover:text-white transition font-semibold cursor-pointer text-center"
            >
              ยกเลิก (กลับหน้าแรก)
            </button>
          </div>

          {/* Toggle manual code entry */}
          <div className="pt-2 border-t border-[#252525] text-center">
            {isManualInput ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customCode.trim()) {
                    router.push(`/join/${customCode.trim()}`);
                  }
                }}
                className="flex gap-2 pt-1"
              >
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="รหัสห้องอื่น..."
                  className="input-spotify flex-1 text-xs py-1.5 px-3 rounded-lg bg-[#1f1f1f] text-white font-mono"
                />
                <button
                  type="submit"
                  disabled={!customCode.trim()}
                  className="btn-pill btn-pill-dark text-xs px-3 py-1.5 font-bold cursor-pointer"
                >
                  ไป
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsManualInput(true)}
                className="text-[11px] text-[#777777] hover:text-[#1ed760] transition cursor-pointer"
              >
                หรือใส่รหัสเชิญห้องอื่น
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
