"use client";

import { useState, useEffect, useCallback } from "react";
import { Room, RoomMemberItem, Message } from "@/types";
import { ConfirmType } from "@/components/modals";
import { getSocket } from "@/lib/socket";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface UseRoomSocketParams {
  roomId: string;
  userId?: string;
  currentUserName: string;
  room: Room | null;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setMembers: React.Dispatch<React.SetStateAction<RoomMemberItem[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  confirmModal: { isOpen: boolean; type: ConfirmType } | null;
  setConfirmModal: React.Dispatch<
    React.SetStateAction<{ isOpen: boolean; type: ConfirmType } | null>
  >;
  onAddChatMessage?: (
    text: string,
    imageUrl?: string,
    isShoutout?: boolean,
  ) => void;
  router: ReturnType<typeof useRouter>;
}

export function useRoomSocket({
  roomId,
  userId,
  currentUserName,
  room,
  setRoom,
  setMembers,
  setMessages,
  confirmModal,
  setConfirmModal,
  onAddChatMessage,
  router,
}: UseRoomSocketParams) {
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    socket.emit("join_room", {
      roomId,
      user: { id: userId, name: currentUserName },
    });

    const handleRoomStatusChanged = (data: {
      roomId: string;
      status: string;
    }) => {
      if (data.roomId === roomId) {
        if (data.status === "DELETED") {
          toast.error("ห้องนี้ถูกลบโดยเจ้าของห้องแล้ว");
          router.replace("/");
        } else {
          setRoom((prev) =>
            prev ? { ...prev, status: data.status as Room["status"] } : null,
          );
          toast(
            `ห้องเปลี่ยนสถานะเป็น: ${data.status === "ACTIVE" ? "ใช้งาน" : "จัดเก็บ"}`,
          );
        }
      }
    };

    const handleMemberJoined = async (data: {
      user?: { id: string; name: string };
      memberCount: number;
      message?: Message;
    }) => {
      setRoom((prev) =>
        prev ? { ...prev, memberCount: data.memberCount } : null,
      );

      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message?.id)) return prev;
          return [...prev, data.message!];
        });
      }

      try {
        const [mRes, msgRes] = await Promise.all([
          fetch(`/api/rooms/${roomId}/members`),
          !data.message
            ? fetch(`/api/rooms/${roomId}/messages`)
            : Promise.resolve(null),
        ]);
        if (mRes.ok) {
          const mData = await mRes.json();
          if (mData.members) setMembers(mData.members);
        }
        if (msgRes && msgRes.ok) {
          const msgData = await msgRes.json();
          if (msgData.messages) setMessages(msgData.messages);
        }
      } catch (err) {
        console.error("Failed to refresh members on join:", err);
      }
      if (data.user?.name && data.user.id !== userId) {
        toast(`${data.user.name} เข้าร่วมห้องแล้ว!`);
      }
    };

    const handleUserJoined = () => {
      // Intentionally silent on re-connect / page refresh
    };

    const handleMemberKicked = (data: {
      targetUserId: string;
      memberName: string;
      kickedBy: string;
      isSelfLeave?: boolean;
      message?: Message;
    }) => {
      if (data.targetUserId === userId) {
        socket.emit("leave_room", { roomId });
        if (!data.isSelfLeave) {
          toast.error("คุณถูกหัวห้องเตะออกจากห้องแล้ว");
        }
        router.replace("/");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.userId !== data.targetUserId));
      setRoom((prev) =>
        prev
          ? { ...prev, memberCount: Math.max(1, prev.memberCount - 1) }
          : null,
      );
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message?.id)) return prev;
          return [...prev, data.message!];
        });
      }
    };

    const handleRoomUpdated = (data: { room: Partial<Room> }) => {
      setRoom((prev) => (prev ? { ...prev, ...data.room } : null));
    };

    socket.on("room_status_changed", handleRoomStatusChanged);
    socket.on("room_updated", handleRoomUpdated);
    socket.on("member_joined", handleMemberJoined);
    socket.on("user_joined", handleUserJoined);
    socket.on("member_kicked", handleMemberKicked);

    return () => {
      socket.emit("leave_room", { roomId });
      socket.off("room_status_changed", handleRoomStatusChanged);
      socket.off("room_updated", handleRoomUpdated);
      socket.off("member_joined", handleMemberJoined);
      socket.off("user_joined", handleUserJoined);
      socket.off("member_kicked", handleMemberKicked);
    };
  }, [roomId, userId, currentUserName, router, setRoom, setMembers, setMessages]);

  const handleSaveRoom = useCallback(
    async (data: {
      id: string;
      title: string;
      eventDate: string;
      ticketUrl?: string | null;
      description?: string | null;
      bannerUrl?: string | null;
      seatingPlanUrl?: string | null;
    }) => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            eventDate: data.eventDate,
            ticketUrl: data.ticketUrl,
            description: data.description,
            bannerUrl: data.bannerUrl,
            seatingPlanUrl: data.seatingPlanUrl,
          }),
        });
        const result = await res.json();
        if (res.ok && result.room) {
          toast.success("บันทึกข้อมูลห้องเรียบร้อยแล้ว");
          setRoom((prev) => (prev ? { ...prev, ...result.room } : result.room));
          getSocket().emit("room_updated", { roomId, room: result.room });
          onAddChatMessage?.(
            `${currentUserName} อัปเดตข้อมูลห้องเรียบร้อย`,
            undefined,
            true,
          );
          return true;
        } else {
          toast.error(result.error || "ไม่สามารถบันทึกข้อมูลห้องได้");
          return false;
        }
      } catch (err) {
        console.error("Failed to update room:", err);
        toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลห้อง");
        return false;
      }
    },
    [roomId, currentUserName, onAddChatMessage, setRoom],
  );

  const handleKickMember = useCallback(
    async (targetUserId: string, memberName: string) => {
      if (!userId) return;
      try {
        const res = await fetch(
          `/api/rooms/${roomId}/members?userId=${targetUserId}&requesterId=${userId}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (res.ok) {
          setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
          setRoom((prev) =>
            prev
              ? { ...prev, memberCount: Math.max(1, prev.memberCount - 1) }
              : null,
          );
          getSocket().emit("member_kicked", {
            roomId,
            targetUserId,
            memberName,
            kickedBy: currentUserName,
            isSelfLeave: false,
            message: data.chatMessage,
          });
          toast.success(`ให้ ${memberName} ออกจากแชทเรียบร้อยแล้ว`);
        } else {
          toast.error(data.error || "ไม่สามารถให้ออกจากแชทได้");
        }
      } catch (err) {
        console.error("Failed to kick member:", err);
        toast.error("เกิดข้อผิดพลาดในการให้ออกจากแชท");
      }
    },
    [roomId, userId, currentUserName, setMembers, setRoom],
  );

  const handleExecuteStatusChange = useCallback(async () => {
    if (!userId || !room || !confirmModal) return;
    const { type } = confirmModal;

    if (type === "LEAVE") {
      setStatusActionLoading(true);
      try {
        const res = await fetch(
          `/api/rooms/${roomId}/members?userId=${userId}&requesterId=${userId}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "ไม่สามารถออกจากห้องได้");
        }
        getSocket().emit("member_kicked", {
          roomId,
          targetUserId: userId,
          memberName: currentUserName,
          kickedBy: currentUserName,
          isSelfLeave: true,
          message: data.chatMessage,
        });
        toast.success("ออกจากห้องเรียบร้อยแล้ว");
        router.replace("/");
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการออกจากห้อง",
        );
      } finally {
        setStatusActionLoading(false);
      }
      return;
    }

    const nextStatus: "ACTIVE" | "ARCHIVED" | "DELETED" =
      type === "ARCHIVE"
        ? "ARCHIVED"
        : type === "RESTORE"
          ? "ACTIVE"
          : "DELETED";

    setStatusActionLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถเปลี่ยนสถานะห้องได้");
      }

      if (nextStatus === "DELETED") {
        getSocket().emit("room_status_changed", { roomId, status: "DELETED" });
        toast.success("ลบห้องเรียบร้อยแล้ว");
        router.replace("/");
        return;
      }

      setRoom((prev) => (prev ? { ...prev, status: nextStatus } : null));
      getSocket().emit("room_status_changed", { roomId, status: nextStatus });
      toast.success(data.message || "อัปเดตสถานะห้องสำเร็จ");
      setConfirmModal(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setStatusActionLoading(false);
    }
  }, [
    userId,
    room,
    confirmModal,
    roomId,
    currentUserName,
    router,
    setRoom,
    setConfirmModal,
  ]);

  return {
    statusActionLoading,
    handleSaveRoom,
    handleKickMember,
    handleExecuteStatusChange,
  };
}
