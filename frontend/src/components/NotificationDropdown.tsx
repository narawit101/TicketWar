import React, { useState, useEffect, useRef, useCallback } from "react";
import { RoomInvitationItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Bell, Check, Calendar, Loader2, Music2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { useClickOutside } from "@/lib/hooks";
import { getSocket } from "@/lib/socket";
import { playNotificationChime } from "@/lib/audio";
import { toast } from "react-hot-toast";

export const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [invitations, setInvitations] = useState<RoomInvitationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setIsOpen(false));

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/invitations?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed to load user invitations:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch on mount / user change
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!user) return;
      try {
        const res = await fetch(`/api/invitations?userId=${user.id}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setInvitations(data.invitations || []);
        }
      } catch (err) {
        console.error("Failed to load user invitations:", err);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [user]);

  // Real-time socket listener for incoming invitations
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    // Make sure user is subscribed to personal room
    socket.emit("join_user", { userId: user.id });

    const handleNewInvitation = (newInv: RoomInvitationItem) => {
      // Play soft notification chime
      playNotificationChime();

      // Show rich Spotify toast
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-sm w-full bg-[#181818] border border-[#1ed760]/40 shadow-2xl rounded-2xl pointer-events-auto flex items-center p-3.5 gap-3 text-white`}
          >
            {/* <div className="w-10 h-10 rounded-xl bg-[#1ed760]/20 flex items-center justify-center text-[#1ed760] shrink-0 font-bold"></div> */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {newInv.inviterName} ชวนคุณเข้าห้อง
              </p>
              <p className="text-xs text-[#b3b3b3] truncate">
                {newInv.roomTitle}
              </p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setIsOpen(true);
              }}
              className="px-3 py-1.5 bg-[#1ed760] text-black font-bold text-xs rounded-full hover:bg-[#1cd05a] transition cursor-pointer shrink-0"
            >
              ดูคำเชิญ
            </button>
          </div>
        ),
        { duration: 5000 },
      );

      setInvitations((prev) => [
        newInv,
        ...prev.filter((i) => i.id !== newInv.id),
      ]);
    };

    const handleCancelInvitation = (data: { invitationId: string }) => {
      setInvitations((prev) => prev.filter((i) => i.id !== data.invitationId));
    };

    socket.on("room_invitation_received", handleNewInvitation);
    socket.on("room_invitation_canceled", handleCancelInvitation);

    return () => {
      socket.off("room_invitation_received", handleNewInvitation);
      socket.off("room_invitation_canceled", handleCancelInvitation);
    };
  }, [user]);

  const handleRespond = async (
    invitation: RoomInvitationItem,
    action: "ACCEPT" | "DECLINE",
  ) => {
    if (!user) return;
    try {
      setRespondingId(invitation.id);
      const res = await fetch(`/api/invitations/${invitation.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาดในการตอบรับคำเชิญ");
        return;
      }

      // Remove from list
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));

      const socket = getSocket();

      if (action === "ACCEPT") {
        toast.success(`เข้าร่วมห้อง "${invitation.roomTitle}" สำเร็จ!`);

        // Notify room members and inviter
        socket.emit("member_joined", {
          roomId: invitation.roomId,
          user: data.user,
          memberCount: data.memberCount,
          message: data.chatMessage,
        });

        if (data.chatMessage) {
          socket.emit("send_message", {
            roomId: invitation.roomId,
            message: data.chatMessage,
          });
        }

        socket.emit("room_invitation_responded", {
          inviterId: invitation.inviterId,
          roomId: invitation.roomId,
          member: data.user,
          status: "ACCEPTED",
        });

        setIsOpen(false);
        router.push(`/rooms/${invitation.roomId}`);
      } else {
        toast.success("ปฏิเสธคำเชิญเรียบร้อย");
        socket.emit("room_invitation_responded", {
          inviterId: invitation.inviterId,
          roomId: invitation.roomId,
          member: { id: user.id, name: user.name },
          status: "DECLINED",
        });
      }
    } catch (err) {
      console.error("Respond invitation error:", err);
      toast.error("ไม่สามารถดำเนินการได้");
    } finally {
      setRespondingId(null);
    }
  };

  const pendingCount = invitations.length;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) fetchInvitations();
        }}
        className="relative p-2 rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#252525] transition cursor-pointer focus:outline-none"
        aria-label="การแจ้งเตือนคำเชิญ"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {pendingCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4.5 h-4.5 px-1 bg-[#1ed760] text-black text-[10px] font-black rounded-full flex items-center justify-center animate-in zoom-in-75 shadow-md">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {/* Spotify Styled Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#1a1a1a] border border-[#2c2c2c] shadow-[0_12px_32px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-left">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#252525] bg-[#161616]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1ed760]" />
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                คำเชิญเข้าห้อง ({pendingCount})
              </h3>
            </div>
            {pendingCount > 0 && (
              <span className="text-[11px] text-[#1ed760] font-medium bg-[#1ed760]/10 px-2 py-0.5 rounded-full">
                รอตอบรับ
              </span>
            )}
          </div>

          {/* Body List */}
          <div className="max-h-84 overflow-y-auto p-2 space-y-2 divide-y divide-transparent">
            {loading && invitations.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#888888] flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-[#1ed760] animate-spin" />
                <span>กำลังโหลดการแจ้งเตือน...</span>
              </div>
            ) : invitations.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center mx-auto text-[#777777]">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#888888]">
                  ยังไม่มีคำเชิญเข้าห้องในขณะนี้
                </p>
              </div>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#333333] transition space-y-2.5"
                >
                  {/* Top row: Inviter info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        src={inv.inviterAvatarUrl}
                        name={inv.inviterName}
                        size="xs"
                      />
                      <span className="text-[11.5px] text-[#b3b3b3] truncate">
                        <strong className="text-white font-semibold">
                          {inv.inviterName}
                        </strong>{" "}
                        ชวนคุณเข้าร่วมห้องแชท
                      </span>
                    </div>
                  </div>

                  {/* Room Card Preview */}
                  <div className="flex items-center gap-3 bg-[#1c1c1c] p-2.5 rounded-xl border border-[#2a2a2a]">
                    {inv.roomBannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inv.roomBannerUrl}
                        alt={inv.roomTitle}
                        className="w-11 h-11 rounded-lg object-contain shrink-0 border border-white/5"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-[#252525] flex items-center justify-center text-[#1ed760] shrink-0">
                        <Music2 className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">
                        {inv.roomTitle}
                      </h4>
                      {inv.roomEventDate && (
                        <p className="text-[11px] text-[#888888] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#1ed760]" />
                          <span>
                            {new Date(inv.roomEventDate).toLocaleDateString(
                              "th-TH",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={respondingId === inv.id}
                      onClick={() => handleRespond(inv, "DECLINE")}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#888888] hover:text-[#f3727f] hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      ปฏิเสธ
                    </button>
                    <button
                      type="button"
                      disabled={respondingId === inv.id}
                      onClick={() => handleRespond(inv, "ACCEPT")}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#1ed760] hover:bg-[#1cd05a] text-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {respondingId === inv.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      )}
                      <span>เข้าห้อง</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
