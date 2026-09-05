import React, { useEffect, useState, useCallback } from "react";
import { RoomInvitationItem } from "@/types";
import { Avatar, MemberRowSkeleton } from "@/components/common";
import { Trash2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { getSocket } from "@/lib/socket";

interface RoomInvitedListProps {
  roomId: string;
  isOwner?: boolean;
  currentUserId?: string;
  refreshTrigger?: number;
  className?: string;
}

export const RoomInvitedList: React.FC<RoomInvitedListProps> = ({
  roomId,
  isOwner = false,
  currentUserId,
  refreshTrigger = 0,
  className = "",
}) => {
  const [invitations, setInvitations] = useState<RoomInvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms/${roomId}/invitations`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!roomId) return;
      try {
        const res = await fetch(`/api/rooms/${roomId}/invitations`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setInvitations(data.invitations || []);
        }
      } catch (err) {
        console.error("Failed to load invitations:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [roomId, refreshTrigger]);

  // Listen for socket events to update invitations in real time
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (data: { roomId: string }) => {
      if (data?.roomId === roomId) {
        fetchInvitations();
      }
    };

    socket.on("room_invitation_update", handleUpdate);
    socket.on("member_joined", handleUpdate);

    return () => {
      socket.off("room_invitation_update", handleUpdate);
      socket.off("member_joined", handleUpdate);
    };
  }, [roomId, fetchInvitations]);

  const handleCancelInvitation = async (invitation: RoomInvitationItem) => {
    if (!currentUserId && !isOwner) return;
    try {
      setCancelingId(invitation.id);
      const requesterId = currentUserId || invitation.inviterId;
      const res = await fetch(
        `/api/rooms/${roomId}/invitations?invitationId=${invitation.id}&requesterId=${requesterId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        toast.success(
          `ยกเลิกคำเชิญของ ${invitation.inviteeName || "สมาชิก"} แล้ว`,
        );
        const socket = getSocket();
        socket.emit("cancel_room_invitation", {
          inviteeId: invitation.inviteeId,
          roomId,
          invitationId: invitation.id,
        });
        fetchInvitations();
      } else {
        const data = await res.json();
        toast.error(data.error || "ไม่สามารถยกเลิกคำเชิญได้");
      }
    } catch (err) {
      console.error("Cancel invitation error:", err);
      toast.error("เกิดข้อผิดพลาดในการยกเลิกคำเชิญ");
    } finally {
      setCancelingId(null);
    }
  };

  // Only show PENDING invitations (once accepted, user is a full room member shown in the main list)
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "PENDING",
  );

  return (
    <div className={`space-y-2 pt-1 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs sm:text-sm font-semibold text-[#888888] tracking-wider uppercase">
          {loading ? "รอตอบรับคำเชิญ" : `รอตอบรับคำเชิญ (${pendingInvitations.length})`}
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={fetchInvitations}
          className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#282828] transition cursor-pointer disabled:opacity-40"
          title="รีเฟรชคำเชิญ"
          aria-label="รีเฟรชคำเชิญ"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Invitations List */}
      <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
        {loading ? (
          <>
            <MemberRowSkeleton />
            <MemberRowSkeleton />
          </>
        ) : pendingInvitations.length === 0 ? (
          <div className="text-xs text-zinc-500 py-3 text-center bg-[#121212] rounded-xl border border-[#222222]">
            ไม่มีคำเชิญที่กำลังรอตอบรับ
          </div>
        ) : (
          pendingInvitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#121212] border border-[#282828] hover:border-[#383838] transition"
          >
            {/* User details */}
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <Avatar
                src={inv.inviteeAvatarUrl}
                name={inv.inviteeName || "Friend"}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-bold text-white truncate">
                  {inv.inviteeName || "ผู้ใช้งาน"}
                </p>
                <p className="text-xs sm:text-sm text-[#888888] block truncate mt-0.5">
                  {inv.inviteeEmail}
                </p>
              </div>
            </div>

            {/* Status and Action */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs sm:text-sm px-3 py-1 rounded-full font-semibold bg-[#1f1f1f] text-zinc-400 border border-zinc-700/60">
                รอตอบรับ
              </span>

              {/* Cancel invitation button (Only owner) */}
              {isOwner && (
                <button
                  type="button"
                  disabled={cancelingId === inv.id}
                  onClick={() => handleCancelInvitation(inv)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="ยกเลิกคำเชิญนี้"
                  aria-label="ยกเลิกคำเชิญ"
                >
                  {cancelingId === inv.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  );
};
