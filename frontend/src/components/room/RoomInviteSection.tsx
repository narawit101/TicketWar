import React, { useState } from "react";
import { SearchUserResult } from "@/types";
import { UserInviteInput } from "./UserInviteInput";
import { RoomInvitedList } from "./RoomInvitedList";
import { Loader2, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { getSocket } from "@/lib/socket";

interface RoomInviteSectionProps {
  roomId: string;
  currentUserId?: string;
  isOwner?: boolean;
  className?: string;
  label?: string;
}

export const RoomInviteSection: React.FC<RoomInviteSectionProps> = ({
  roomId,
  currentUserId,
  isOwner = false,
  className = "",
  label = "เชิญเพื่อนเข้าร่วมห้อง",
}) => {
  const [invitedUsers, setInvitedUsers] = useState<SearchUserResult[]>([]);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSendInvitations = async () => {
    if (invitedUsers.length === 0 || !roomId || !currentUserId) return;
    try {
      setSendingInvites(true);
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          inviterId: currentUserId,
          inviteeIds: invitedUsers.map((u) => u.id),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`ส่งคำเชิญเรียบร้อยแล้ว (${invitedUsers.length} คน)`);
        const socket = getSocket();
        if (Array.isArray(data.invitations)) {
          data.invitations.forEach((inv: { inviteeId: string }) => {
            socket.emit("send_room_invitation", {
              inviteeId: inv.inviteeId,
              invitation: inv,
            });
          });
        }
        if (data.chatMessage) {
          socket.emit("send_room_invitation_chat", {
            roomId,
            message: data.chatMessage,
          });
        }
        setInvitedUsers([]);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(data.error || "ไม่สามารถส่งคำเชิญได้");
      }
    } catch (err) {
      console.error("Send invitations error:", err);
      toast.error("เกิดข้อผิดพลาดในการส่งคำเชิญ");
    } finally {
      setSendingInvites(false);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#b3b3b3]">{label}</label>
      </div>

      <UserInviteInput
        selectedUsers={invitedUsers}
        onChange={setInvitedUsers}
        roomId={roomId}
        currentUserId={currentUserId}
        placeholder="พิมพ์ @email หรือชื่อเพื่อนเพื่อเชิญ..."
      />

      {/* Pending invitations list */}
      <RoomInvitedList
        roomId={roomId}
        isOwner={isOwner}
        currentUserId={currentUserId}
        refreshTrigger={refreshTrigger}
      />
      {invitedUsers.length > 0 && (
        <button
          type="button"
          disabled={sendingInvites}
          onClick={handleSendInvitations}
          className="px-3.5 py-1 bg-[#1ed760] hover:bg-[#1cd05a] text-black text-xs font-bold rounded-full transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {sendingInvites ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          <span>ส่งคำเชิญ ({invitedUsers.length})</span>
        </button>
      )}
    </div>
  );
};
