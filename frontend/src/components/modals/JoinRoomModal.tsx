/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import {
  X,
  Loader2,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { getSocket } from "@/lib/socket";
import { formatEventDate } from "@/lib/date";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

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

// Helper to extract invite code from link or text
function extractInviteCode(input: string): string {
  const trimmed = input.trim();
  const joinMatch = trimmed.match(/\/join\/([a-zA-Z0-9_-]+)/);
  if (joinMatch && joinMatch[1]) {
    return joinMatch[1];
  }
  return trimmed;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;
  return <JoinRoomDialog onClose={onClose} onSuccess={onSuccess} />;
};

const JoinRoomDialog: React.FC<{
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  // Preview state if room is found and user is not yet a member
  const [previewRoom, setPreviewRoom] = useState<RoomPreview | null>(null);

  // Step 1: Handle Search / Check membership
  const handleCheckRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = extractInviteCode(inputVal);

    if (!cleanCode) {
      toast.error("กรุณากรอกรหัสคำเชิญหรือวางลิงก์ห้อง");
      return;
    }

    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนดำเนินการ");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/rooms/join?code=${encodeURIComponent(cleanCode)}&userId=${encodeURIComponent(user.id)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่พบห้องนี้ หรือรหัส/ลิงก์ไม่ถูกต้อง");
      }

      // If user is ALREADY a member -> enter room directly!
      if (data.isMember) {
        toast.success(
          `คุณเป็นสมาชิกห้อง "${data.room.title}" อยู่แล้ว กำลังพาเข้าห้อง...`,
        );
        onClose();
        onSuccess(data.room.id);
        return;
      }

      // If user is NOT yet a member -> show Confirmation Step!
      setPreviewRoom(data.room);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("เกิดข้อผิดพลาดในการตรวจสอบห้อง");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Join and save to room_members in DB
  const handleConfirmJoin = async () => {
    if (!previewRoom || !user) return;

    setJoining(true);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: previewRoom.inviteCode,
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
        user: { id: user.id, name: user.name },
        memberCount: (previewRoom.memberCount || 1) + 1,
        message: data.chatMessage,
      });
      onClose();
      onSuccess(data.roomId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("เกิดข้อผิดพลาดในการเข้าร่วมห้อง");
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#181818] border border-[#252525] w-full max-w-md rounded-2xl modal-shadow overflow-hidden relative animate-in zoom-in-95 duration-150 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading || joining}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#252525] transition cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Input Code or Link */}
        {!previewRoom ? (
          <div className="p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  เข้าร่วมห้องกดบัตร
                </h2>
                <p className="text-sm text-[#b3b3b3]">
                  วางลิงก์คำเชิญ หรือกรอกรหัสห้อง 8 หลัก
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckRoom} noValidate className="space-y-4">
              <div>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="วางลิงก์ หรือใส่รหัสห้อง"
                  autoFocus
                  className="input-spotify w-full text-sm py-3 px-3.5 rounded-lg bg-[#1f1f1f] text-white font-sans focus:border-[#1ed760]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2 rounded-full text-sm font-bold text-[#b3b3b3] hover:text-white border border-[#333333] hover:border-[#555555] transition cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={loading || !inputVal.trim()}
                  className="btn-pill btn-pill-green px-5 py-2 text-sm font-bold tracking-wider cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>กำลังตรวจสอบ...</span>
                    </>
                  ) : (
                    <>
                      <span>ตรวจสอบห้อง</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 2: Confirmation Modal (User is not yet a member) */
          <div>
            {/* Poster Header */}
            {previewRoom.bannerUrl ? (
              <div className="relative w-full h-36 bg-[#141414]">
                <img
                  src={previewRoom.bannerUrl}
                  alt={previewRoom.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#181818] via-[#181818]/40 to-transparent" />
              </div>
            ) : (
              <div className="h-3 bg-linear-to-r from-[#1ed760] to-[#539df5]" />
            )}

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#1ed760] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ยังไม่ได้เป็นสมาชิกในห้องนี้</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {previewRoom.title}
                </h3>
                <p className="text-sm text-[#888888] mt-0.5">
                  สร้างโดย{" "}
                  <span className="text-white font-medium">
                    {previewRoom.ownerName}
                  </span>
                </p>
              </div>

              {/* Room details */}
              <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-2 text-sm text-[#b3b3b3]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1ed760]" />
                  <span>{formatEventDate(previewRoom.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#888888]">
                  <Users className="w-4 h-4 text-[#539df5]" />
                  <span>สมาชิกในห้อง: {previewRoom.memberCount} คน</span>
                </div>
              </div>

              <p className="text-sm text-[#b3b3b3] pt-1">
                คุณต้องการเข้าร่วมห้องกดบัตรนี้เพื่อทำงานร่วมกับทีมใช่หรือไม่?
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#252525]">
                <button
                  type="button"
                  onClick={() => setPreviewRoom(null)}
                  disabled={joining}
                  className="px-5 py-2 rounded-full text-sm font-bold text-[#b3b3b3] hover:text-white border border-[#333333] hover:border-[#555555] transition cursor-pointer"
                >
                  ย้อนกลับ
                </button>

                <button
                  type="button"
                  onClick={handleConfirmJoin}
                  disabled={joining}
                  className="btn-pill btn-pill-green px-5 py-2 text-sm font-bold tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  {joining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>กำลังบันทึกเข้าร่วม...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black stroke-2" />
                      <span>ยืนยันเข้าร่วมห้อง</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
