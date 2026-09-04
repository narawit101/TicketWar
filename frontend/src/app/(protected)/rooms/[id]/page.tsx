/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoomSeatTasksList } from "@/components/RoomSeatTasksList";
import { LiveChat } from "@/components/LiveChat";
import { EditTaskModal } from "@/components/EditTaskModal";
import { ShareRoomModal } from "@/components/ShareRoomModal";
import { ImageLightboxModal } from "@/components/ImageLightboxModal";
import { CarouselSlide } from "@/components/RoomImageCarousel";
import {
  ConfirmActionModal,
  ConfirmType,
} from "@/components/ConfirmActionModal";
import { MembersModal } from "@/components/MembersModal";
import { EditRoomModal } from "@/components/EditRoomModal";
import { RoomHero } from "@/components/RoomHero";
import { RoomHeader } from "@/components/RoomHeader";
import { Room, SeatTask, Message, SeatStatus, RoomMemberItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { getSocket } from "@/lib/socket";
import { playSoundAlert } from "@/lib/audio";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.id as string) || "";
  const { user } = useAuth();
  const currentUserName = user?.name || "Member";

  const [room, setRoom] = useState<Room | null>(null);
  const [tasks, setTasks] = useState<SeatTask[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SeatTask | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: ConfirmType;
  } | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    location: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [members, setMembers] = useState<RoomMemberItem[]>([]);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);

  // Fetch Room, Tasks, and Messages from real DB with strict membership verification
  useEffect(() => {
    if (!roomId || !user?.id) return;
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/rooms/${roomId}?userId=${user?.id}`);
        const data = await res.json();

        if (res.status === 403 || data.notMember) {
          toast.error("คุณไม่ได้เป็นสมาชิกในห้องนี้ หรือถูกนำออกจากห้องแล้ว");
          router.replace("/");
          return;
        }

        if (!ignore && res.ok) {
          // Double check membership
          const isMember =
            data.room?.createdById === user?.id ||
            (data.members || []).some(
              (m: { userId: string }) => m.userId === user?.id,
            );

          if (!isMember) {
            toast.error("คุณไม่ได้เป็นสมาชิกในห้องนี้ หรือถูกนำออกจากห้องแล้ว");
            router.replace("/");
            return;
          }

          setRoom(data.room);
          setTasks(data.tasks || []);
          setMessages(data.messages || []);
          setHasMoreMessages(
            data.hasMoreMessages ?? data.messages?.length === 50,
          );
          setMembers(data.members || data.room?.members || []);
        } else if (!res.ok) {
          toast.error(data.error || "ไม่พบห้องนี้");
          router.replace("/");
        }
      } catch (err) {
        console.error("Failed to load room data:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [roomId, user?.id, router]);

  // Realtime Socket.IO Connection & Events
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    // 1. Join War Room Channel
    socket.emit("join_room", {
      roomId,
      user: { id: user?.id, name: currentUserName },
    });

    // 2. Realtime Chat Messages
    const handleNewMessage = (incomingMsg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) return prev;
        return [...prev, incomingMsg];
      });
      if (incomingMsg.isShoutout) {
        playSoundAlert("alert");
      }
    };

    // 3. Shoutout Alert
    const handleShoutout = () => {
      playSoundAlert("alert");
    };

    // 4. Seat Task Status Updated (by other teammates)
    const handleSeatStatusUpdated = (data: {
      taskId: string;
      status: SeatStatus;
      quantitySecured?: number;
      securedBy?: Array<{
        userId: string;
        name: string;
        qty: number;
        at: string;
      }>;
      note?: string;
      targetLocation?: string;
      targetDate?: string;
      price?: number;
      quantityNeeded?: number;
      task?: SeatTask;
      updatedBy?: string;
      updatedAt?: string;
    }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === data.taskId
            ? {
                ...t,
                ...(data.task || {}),
                status: data.status,
                quantitySecured:
                  data.quantitySecured !== undefined
                    ? data.quantitySecured
                    : t.quantitySecured,
                securedBy:
                  data.securedBy !== undefined ? data.securedBy : t.securedBy,
                note:
                  data.note !== undefined
                    ? data.note
                    : data.task?.note !== undefined
                      ? data.task.note
                      : t.note,
                targetLocation:
                  data.targetLocation ||
                  data.task?.targetLocation ||
                  t.targetLocation,
                targetDate:
                  data.targetDate || data.task?.targetDate || t.targetDate,
                price:
                  data.price !== undefined
                    ? data.price
                    : data.task?.price !== undefined
                      ? data.task.price
                      : t.price,
                quantityNeeded:
                  data.quantityNeeded !== undefined
                    ? data.quantityNeeded
                    : data.task?.quantityNeeded !== undefined
                      ? data.task.quantityNeeded
                      : t.quantityNeeded,
                lastUpdatedBy: data.updatedBy || t.lastUpdatedBy,
                lastUpdatedAt: data.updatedAt || "เมื่อสักครู่",
              }
            : t,
        ),
      );
    };

    // 5. New Seat Task Created
    const handleTaskCreated = (newTask: SeatTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
      toast(`มีที่นั่งใหม่: ${newTask.targetLocation}`, { icon: "🎯" });
    };

    // 6. Seat Task Deleted
    const handleTaskDeleted = (deletedTaskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== deletedTaskId));
    };

    // 7. Room Status Changed (Archived / Live / Deleted)
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
            `ห้องเปลี่ยนสถานะเป็น: ${data.status === "ACTIVE" ? "ใช้งานอยู่" : "จัดเก็บ"}`,
          );
        }
      }
    };

    // 8. New Member Joined
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
      if (data.user?.name && data.user.id !== user?.id) {
        toast(`${data.user.name} เข้าร่วมห้องแล้ว!`);
      }
    };

    // 9. Existing Member Reconnected / Re-entered Room (no spam in chat)
    const handleUserJoined = () => {
      // Intentionally silent on re-connect / page refresh
    };

    // 10. Member Kicked or Left
    const handleMemberKicked = (data: {
      targetUserId: string;
      memberName: string;
      kickedBy: string;
      isSelfLeave?: boolean;
      message?: Message;
    }) => {
      if (data.targetUserId === user?.id) {
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

    // 11. Room Details Updated (Title, Poster, Seating Plan, Date)
    const handleRoomUpdated = (data: { room: Partial<Room> }) => {
      setRoom((prev) => (prev ? { ...prev, ...data.room } : null));
    };

    // 12. Chat Message Deleted
    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    // 13. Chat Message Edited
    const handleMessageUpdated = (updatedMsg: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)),
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("shoutout_alert", handleShoutout);
    socket.on("seat_status_updated", handleSeatStatusUpdated);
    socket.on("task_created", handleTaskCreated);
    socket.on("task_deleted", handleTaskDeleted);
    socket.on("room_status_changed", handleRoomStatusChanged);
    socket.on("room_updated", handleRoomUpdated);
    socket.on("member_joined", handleMemberJoined);
    socket.on("user_joined", handleUserJoined);
    socket.on("member_kicked", handleMemberKicked);

    return () => {
      socket.emit("leave_room", { roomId });
      socket.off("new_message", handleNewMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("shoutout_alert", handleShoutout);
      socket.off("seat_status_updated", handleSeatStatusUpdated);
      socket.off("task_created", handleTaskCreated);
      socket.off("task_deleted", handleTaskDeleted);
      socket.off("room_status_changed", handleRoomStatusChanged);
      socket.off("room_updated", handleRoomUpdated);
      socket.off("member_joined", handleMemberJoined);
      socket.off("user_joined", handleUserJoined);
      socket.off("member_kicked", handleMemberKicked);
    };
  }, [roomId, user?.id, currentUserName, router]);

  const isReadOnly = room?.status === "ARCHIVED";
  const isOwner = !!(room && user && room.createdById === user.id);

  const handleSaveRoom = async (data: {
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
        handleAddChatMessage(
          `${currentUserName} อัปเดตข้อมูลห้องเรียบร้อย`,
          undefined,
          true,
        );
        setIsEditRoomOpen(false);
      } else {
        toast.error(result.error || "ไม่สามารถบันทึกข้อมูลห้องได้");
      }
    } catch (err) {
      console.error("Failed to update room:", err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลห้อง");
    }
  };

  const handleKickMember = async (targetUserId: string, memberName: string) => {
    if (!user) return;
    try {
      const res = await fetch(
        `/api/rooms/${roomId}/members?userId=${targetUserId}&requesterId=${user.id}`,
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
  };

  const handleExecuteStatusChange = async () => {
    if (!user || !room || !confirmModal) return;
    const { type } = confirmModal;

    if (type === "LEAVE") {
      setActionLoading(true);
      try {
        const res = await fetch(
          `/api/rooms/${roomId}/members?userId=${user.id}&requesterId=${user.id}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "ไม่สามารถออกจากห้องได้");
        }
        getSocket().emit("member_kicked", {
          roomId,
          targetUserId: user.id,
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
        setActionLoading(false);
      }
      return;
    }

    const nextStatus: "ACTIVE" | "ARCHIVED" | "DELETED" =
      type === "ARCHIVE"
        ? "ARCHIVED"
        : type === "RESTORE"
          ? "ACTIVE"
          : "DELETED";

    setActionLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          userId: user.id,
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
      setActionLoading(false);
    }
  };

  // Action: Increment (+1 ได้บัตรเพิ่ม)
  const handleIncrement = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.quantitySecured >= target.quantityNeeded) return;

    playSoundAlert("success");
    const nextSecured = target.quantitySecured + 1;
    const nextStatus: SeatStatus =
      nextSecured >= target.quantityNeeded ? "COMPLETED" : "AVAILABLE";

    const existingIndex = (target.securedBy || []).findIndex(
      (s) => s.userId === user?.id || s.name === currentUserName,
    );
    const updatedSecuredBy = [...(target.securedBy || [])];
    if (existingIndex >= 0) {
      updatedSecuredBy[existingIndex] = {
        ...updatedSecuredBy[existingIndex],
        qty: updatedSecuredBy[existingIndex].qty + 1,
        at:
          new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + " น.",
      };
    } else {
      updatedSecuredBy.push({
        userId: user?.id || `user-${currentUserName.toLowerCase()}`,
        name: currentUserName,
        qty: 1,
        at:
          new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + " น.",
      });
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              quantitySecured: nextSecured,
              status: nextStatus,
              securedBy: updatedSecuredBy,
              lastUpdatedBy: currentUserName,
              lastUpdatedAt: "เมื่อสักครู่",
            }
          : t,
      ),
    );

    getSocket().emit("update_seat_status", {
      roomId,
      taskId,
      status: nextStatus,
      quantitySecured: nextSecured,
      securedBy: updatedSecuredBy,
      updatedBy: currentUserName,
    });

    // Auto-post system notification into Live Chat
    const isNowFull = nextSecured >= target.quantityNeeded;
    const incrementMsg = isNowFull
      ? `${currentUserName} กด ${target.targetLocation} ครบแล้ว! (${nextSecured}/${target.quantityNeeded})`
      : `${currentUserName} กด ${target.targetLocation} ได้ +1 ใบ (${nextSecured}/${target.quantityNeeded})`;

    handleAddChatMessage(incrementMsg, undefined, true);

    try {
      await fetch(`/api/rooms/${roomId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: nextStatus,
          quantitySecured: nextSecured,
          securedBy: updatedSecuredBy,
          lastUpdatedById: user?.id,
        }),
      });
    } catch (err) {
      console.error("Failed to save increment in DB:", err);
    }
  };

  // Action: Decrement (-1 ลดยอด/ยกเลิก)
  const handleDecrement = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.quantitySecured <= 0) return;

    playSoundAlert("warning");
    const nextSecured = target.quantitySecured - 1;
    const nextStatus: SeatStatus =
      nextSecured >= target.quantityNeeded ? "COMPLETED" : "AVAILABLE";

    const updatedSecuredBy = [...(target.securedBy || [])];
    const existingIndex = updatedSecuredBy.findIndex(
      (s) => s.userId === user?.id || s.name === currentUserName,
    );
    if (existingIndex >= 0) {
      if (updatedSecuredBy[existingIndex].qty > 1) {
        updatedSecuredBy[existingIndex] = {
          ...updatedSecuredBy[existingIndex],
          qty: updatedSecuredBy[existingIndex].qty - 1,
        };
      } else {
        updatedSecuredBy.splice(existingIndex, 1);
      }
    } else if (updatedSecuredBy.length > 0) {
      const lastIndex = updatedSecuredBy.length - 1;
      if (updatedSecuredBy[lastIndex].qty > 1) {
        updatedSecuredBy[lastIndex] = {
          ...updatedSecuredBy[lastIndex],
          qty: updatedSecuredBy[lastIndex].qty - 1,
        };
      } else {
        updatedSecuredBy.pop();
      }
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              quantitySecured: nextSecured,
              status: nextStatus,
              securedBy: updatedSecuredBy,
              lastUpdatedBy: currentUserName,
              lastUpdatedAt: "เมื่อสักครู่",
            }
          : t,
      ),
    );

    getSocket().emit("update_seat_status", {
      roomId,
      taskId,
      status: nextStatus,
      quantitySecured: nextSecured,
      securedBy: updatedSecuredBy,
      updatedBy: currentUserName,
    });

    // Auto-post system notification into Live Chat
    const decrementMsg = `${currentUserName} ยกเลิก ${target.targetLocation} 1 ใบ (เหลือ ${nextSecured}/${target.quantityNeeded})`;
    handleAddChatMessage(decrementMsg, undefined, true);

    try {
      await fetch(`/api/rooms/${roomId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: nextStatus,
          quantitySecured: nextSecured,
          securedBy: updatedSecuredBy,
          lastUpdatedById: user?.id,
        }),
      });
    } catch (err) {
      console.error("Failed to save decrement in DB:", err);
    }
  };

  const handleSaveTask = async (taskData: Partial<SeatTask>) => {
    try {
      if (taskData.id) {
        // Edit existing
        const res = await fetch(`/api/rooms/${roomId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: taskData.id,
            status: taskData.status,
            quantitySecured: taskData.quantitySecured,
            targetLocation: taskData.targetLocation,
            targetDate: taskData.targetDate,
            price: taskData.price,
            quantityNeeded: taskData.quantityNeeded,
            note: taskData.note,
            lastUpdatedById: user?.id,
          }),
        });
        const result = await res.json();
        if (res.ok && result.task) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskData.id ? result.task : t)),
          );
          getSocket().emit("update_seat_status", {
            roomId,
            taskId: result.task.id,
            status: result.task.status,
            quantitySecured: result.task.quantitySecured,
            securedBy: result.task.securedBy,
            note: result.task.note,
            targetLocation: result.task.targetLocation,
            targetDate: result.task.targetDate,
            price: result.task.price,
            quantityNeeded: result.task.quantityNeeded,
            task: result.task,
            updatedBy: currentUserName,
          });
          toast.success("บันทึกการแก้ไขที่นั่งเรียบร้อยแล้ว");
          handleAddChatMessage(
            `${currentUserName} แก้ไขที่นั่ง ${result.task.targetLocation}`,
            undefined,
            true,
          );
        }
      } else {
        // Create new task in DB
        const res = await fetch(`/api/rooms/${roomId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetLocation: taskData.targetLocation,
            targetDate: taskData.targetDate,
            price: taskData.price,
            quantityNeeded: taskData.quantityNeeded,
            quantitySecured: taskData.quantitySecured,
            note: taskData.note,
            status: taskData.status || "AVAILABLE",
            lastUpdatedById: user?.id,
          }),
        });
        const result = await res.json();
        if (res.ok && result.task) {
          setTasks((prev) => [result.task, ...prev]);
          getSocket().emit("task_created", { roomId, task: result.task });
          handleAddChatMessage(
            `${currentUserName} เพิ่มที่นั่ง ${result.task.targetLocation} (${result.task.quantityNeeded} ใบ)`,
            undefined,
            true,
          );
        }
      }
    } catch (err) {
      console.error("Failed to save task:", err);
    }
  };

  const requestDeleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    setTaskToDelete({
      id: taskId,
      location: target?.targetLocation || "ที่นั่งนี้",
    });
  };

  const handleExecuteDeleteTask = async () => {
    if (!taskToDelete) return;
    const { id: taskId } = taskToDelete;
    setActionLoading(true);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    getSocket().emit("task_deleted", { roomId, taskId });
    try {
      await fetch(`/api/rooms/${roomId}/tasks?taskId=${taskId}`, {
        method: "DELETE",
      });
      handleAddChatMessage(
        `${currentUserName} ลบที่นั่ง ${taskToDelete.location}`,
        undefined,
        true,
      );
      toast.success("ลบที่นั่งเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Failed to delete task from DB:", err);
      toast.error("เกิดข้อผิดพลาดในการลบที่นั่ง");
    } finally {
      setActionLoading(false);
      setTaskToDelete(null);
    }
  };

  const handleAddChatMessage = async (
    text: string,
    imageUrl?: string,
    isShoutout?: boolean,
  ) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          text,
          imageUrl,
          isShoutout,
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        getSocket().emit("send_message", { roomId, message: data.message });
        if (isShoutout) {
          getSocket().emit("send_shoutout", {
            roomId,
            shoutout: { tag: "ALERT" },
          });
        }
      }
    } catch (err) {
      console.error("Failed to save and send chat message:", err);
      toast.error("ไม่สามารถส่งข้อความได้");
    }
  };

  const handleEditChatMessage = async (messageId: string, text: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          userId: user.id,
          text,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, ...data.message } : m)),
        );
        getSocket().emit("edit_message", { roomId, message: data.message });
        toast.success("แก้ไขข้อความแล้ว");
      } else {
        toast.error(data.error || "ไม่สามารถแก้ไขข้อความได้");
      }
    } catch (err) {
      console.error("Failed to edit chat message:", err);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อความ");
    }
  };

  const handleDeleteChatMessage = async (messageId: string) => {
    if (!user) return;
    try {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      getSocket().emit("delete_message", { roomId, messageId });

      const res = await fetch(
        `/api/rooms/${roomId}/messages?messageId=${messageId}&userId=${user.id}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        toast.success("ลบเรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Failed to delete chat message:", err);
      toast.error("เกิดข้อผิดพลาดในการลบข้อความ");
    }
  };

  // ponytail: fetch older messages on demand without page reload
  const handleLoadMoreMessages = async () => {
    if (isLoadingMoreMessages || !hasMoreMessages || messages.length === 0)
      return;
    const oldestMsg = messages[0];
    if (!oldestMsg) return;

    try {
      setIsLoadingMoreMessages(true);
      const res = await fetch(
        `/api/rooms/${roomId}/messages?cursor=${oldestMsg.id}&limit=50`,
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOldMsgs = data.messages.filter(
            (m: Message) => !existingIds.has(m.id),
          );
          return [...newOldMsgs, ...prev];
        });
        setHasMoreMessages(Boolean(data.hasMore));
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        <p className="text-xs text-zinc-400">กำลังโหลดข้อมูลห้อง...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">
          ไม่พบห้องนี้ในระบบ
        </h2>
        <Link
          href="/"
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg inline-block transition-colors"
        >
          กลับสู่หน้ารวมห้อง
        </Link>
      </div>
    );
  }

  const roomSlides: CarouselSlide[] = [];
  if (room.bannerUrl) {
    roomSlides.push({ url: room.bannerUrl, label: "โปสเตอร์", type: "banner" });
  }
  if (room.seatingPlanUrl) {
    roomSlides.push({
      url: room.seatingPlanUrl,
      label: "ผังที่นั่ง",
      type: "seating",
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 min-h-[calc(100vh-64px)] flex flex-col gap-5 overflow-y-auto">
      {/* Top Bar: Back, Title, Status, Date & Right Tools */}
      <RoomHeader
        room={room}
        isOwner={isOwner}
        memberCount={members.length || room.memberCount}
        onOpenMembers={() => setIsMembersModalOpen(true)}
        onOpenEditRoom={() => setIsEditRoomOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onConfirmStatusChange={(type) =>
          setConfirmModal({ isOpen: true, type })
        }
      />

      {/* Hero: Poster Banner, Description, and Summary Bar */}
      <RoomHero
        room={room}
        tasks={tasks}
        onOpenBanner={() => {
          const bannerIdx = roomSlides.findIndex((s) => s.type === "banner");
          if (bannerIdx !== -1) setLightboxIndex(bannerIdx);
        }}
      />

      {/* Main 2-Column Split (Left: Seat Tasks 30%, Right: Live Chat 70%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-stretch lg:h-195">
        {/* Left Column: Seat Tasks (3 cols = 30%) */}
        <RoomSeatTasksList
          tasks={tasks}
          currentUserName={currentUserName}
          isReadOnly={isReadOnly}
          onAddTask={() => {
            setEditingTask(null);
            setIsEditModalOpen(true);
          }}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onEditTask={(t) => {
            setEditingTask(t);
            setIsEditModalOpen(true);
          }}
          onDeleteTask={requestDeleteTask}
        />

        {/* Right Column: Full-Height Live Chat (7 cols = 70%) */}
        <div className="lg:col-span-7 h-150 sm:h-170 lg:h-full flex flex-col min-h-0 overflow-hidden">
          <LiveChat
            messages={messages}
            currentUserName={currentUserName}
            currentUserAvatar={user?.avatarUrl}
            currentUserId={user?.id}
            onSendMessage={handleAddChatMessage}
            onEditMessage={handleEditChatMessage}
            onDeleteMessage={handleDeleteChatMessage}
            isReadOnly={isReadOnly}
            hasMoreMessages={hasMoreMessages}
            onLoadMoreMessages={handleLoadMoreMessages}
            isLoadingMore={isLoadingMoreMessages}
          />
        </div>
      </div>

      {/* Bottom Large Seating Plan (Full-Width, Just like Ticketing Sites) */}
      {room.seatingPlanUrl && (
        <div className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-xl space-y-3.5 shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>ผังที่นั่งคอนเสิร์ต</span>
                </h2>
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              const planIdx = roomSlides.findIndex((s) => s.type === "seating");
              if (planIdx !== -1) setLightboxIndex(planIdx);
            }}
            className="relative w-full rounded-xl overflow-hidden bg-zinc-950/90 border border-zinc-800/60 flex items-center justify-center p-3 sm:p-8 cursor-pointer group/plan select-none"
          >
            <img
              src={room.seatingPlanUrl}
              alt={`ผังที่นั่ง ${room.title}`}
              className="max-h-162.5 w-auto max-w-full object-contain rounded-lg transition-transform duration-200 "
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <EditRoomModal
        isOpen={isEditRoomOpen}
        room={room}
        onClose={() => setIsEditRoomOpen(false)}
        onSave={handleSaveRoom}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        task={editingTask}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={(taskId) => {
          setIsEditModalOpen(false);
          requestDeleteTask(taskId);
        }}
      />

      {/* Unified Share Room Modal */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        room={room}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Image Lightbox Modal for Poster and Seating Plan */}
      <ImageLightboxModal
        isOpen={lightboxIndex !== null}
        title={room.title}
        slides={roomSlides}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />

      {confirmModal && room && (
        <ConfirmActionModal
          isOpen={confirmModal.isOpen}
          type={confirmModal.type}
          roomTitle={room.title}
          onConfirm={handleExecuteStatusChange}
          onClose={() => setConfirmModal(null)}
          loading={actionLoading}
        />
      )}

      {taskToDelete && (
        <ConfirmActionModal
          isOpen={!!taskToDelete}
          type="DELETE_TASK"
          itemTitle={taskToDelete.location}
          onConfirm={handleExecuteDeleteTask}
          onClose={() => setTaskToDelete(null)}
          loading={actionLoading}
        />
      )}

      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={members}
        roomId={roomId}
        currentUserId={user?.id}
        isOwner={isOwner}
        onKickMember={handleKickMember}
      />
    </div>
  );
}
