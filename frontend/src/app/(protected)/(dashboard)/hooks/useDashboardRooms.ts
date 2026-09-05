"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Room, RoomMemberItem } from "@/types";
import { ConfirmType } from "@/components/modals";
import { CarouselSlide } from "@/components/room";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { getSocket } from "@/lib/socket";
import { toInputDateTime } from "@/lib/date";

import useSWR from "swr";

const roomsFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
};

export function useDashboardRooms() {
  const { user } = useAuth();

  const swrKey = user?.id ? `/api/rooms?userId=${user.id}` : null;
  const { data, isLoading, mutate } = useSWR<{ rooms: Room[] }>(
    swrKey,
    roomsFetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2500,
    },
  );

  const rooms = useMemo(() => data?.rooms || [], [data?.rooms]);
  const loading = !data && isLoading;
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const updateRooms = useCallback(
    (updater: (prev: Room[]) => Room[]) => {
      mutate(
        (current) => {
          if (!current) return current;
          return { ...current, rooms: updater(current.rooms || []) };
        },
        { revalidate: false },
      );
    },
    [mutate],
  );

  const refreshRooms = useCallback(() => {
    mutate();
  }, [mutate]);

  // Filters
  const [ownershipTab, setOwnershipTab] = useState<"ALL" | "MINE" | "JOINED">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "UPCOMING" | "CUSTOM">(
    "UPCOMING",
  );
  const [customDate, setCustomDate] = useState<string>("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [shareRoom, setShareRoom] = useState<Room | null>(null);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    title: string;
    slides: CarouselSlide[];
    initialIndex: number;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: ConfirmType;
    roomId: string;
    roomTitle: string;
  } | null>(null);
  const [membersModalRoom, setMembersModalRoom] = useState<Room | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Realtime Socket Lobby listener
  useEffect(() => {
    const socket = getSocket();

    const joinLobbyRooms = () => {
      socket.emit("join_lobby");
      if (user?.id) {
        socket.emit("join_user", { userId: user.id });
      }
    };

    joinLobbyRooms();
    socket.on("connect", joinLobbyRooms);

    const handleLobbyUpdate = () => {
      refreshRooms();
    };

    const handleRoomMessage = ({
      roomId,
      senderId,
    }: {
      roomId: string;
      senderId?: string;
    }) => {
      // Don't count own messages as unread
      if (senderId && user?.id && senderId === user.id) return;

      updateRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, unreadCount: (r.unreadCount || 0) + 1 }
            : r,
        ),
      );
    };

    const handleRoomRead = ({ roomId }: { roomId: string }) => {
      updateRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)),
      );
    };

    socket.on("lobby_room_created", handleLobbyUpdate);
    socket.on("lobby_room_updated", handleLobbyUpdate);
    socket.on("lobby_room_message", handleRoomMessage);
    socket.on("lobby_room_read", handleRoomRead);

    return () => {
      socket.off("connect", joinLobbyRooms);
      socket.off("lobby_room_created", handleLobbyUpdate);
      socket.off("lobby_room_updated", handleLobbyUpdate);
      socket.off("lobby_room_message", handleRoomMessage);
      socket.off("lobby_room_read", handleRoomRead);
    };
  }, [user?.id, refreshRooms, updateRooms]);

  // Create room
  const handleCreateRoom = async (data: {
    title: string;
    eventDate: string;
    hasQueue?: boolean;
    queueTime?: string | null;
    ticketUrl?: string | null;
    description?: string | null;
    bannerUrl?: string | null;
    seatingPlanUrl?: string | null;
    invitedUserIds?: string[];
  }) => {
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          eventDate: data.eventDate,
          hasQueue: data.hasQueue,
          queueTime: data.queueTime,
          ticketUrl: data.ticketUrl,
          description: data.description,
          bannerUrl: data.bannerUrl,
          seatingPlanUrl: data.seatingPlanUrl,
          createdById: user?.id,
          invitedUserIds: data.invitedUserIds,
        }),
      });
      const result = await res.json();
      if (res.ok && result.room) {
        toast.success(`สร้างห้อง "${result.room.title}" สำเร็จ!`);
        setIsCreateOpen(false);
        const socket = getSocket();
        socket.emit("room_created", { room: result.room });

        if (Array.isArray(result.invitations)) {
          result.invitations.forEach((inv: { inviteeId: string }) => {
            socket.emit("send_room_invitation", {
              inviteeId: inv.inviteeId,
              invitation: inv,
            });
          });
        }

        refreshRooms();
      } else {
        toast.error(result.error || "ไม่สามารถสร้างห้องได้");
      }
    } catch (err) {
      console.error("Failed to create room:", err);
      toast.error("เกิดข้อผิดพลาดในการสร้างห้อง");
    }
  };

  // Edit room
  const handleSaveRoom = async (data: {
    id?: string;
    title: string;
    eventDate: string;
    hasQueue?: boolean;
    queueTime?: string | null;
    ticketUrl?: string | null;
    description?: string | null;
    bannerUrl?: string | null;
    seatingPlanUrl?: string | null;
  }) => {
    if (!data.id) return;
    try {
      const res = await fetch(`/api/rooms/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          eventDate: data.eventDate,
          hasQueue: data.hasQueue,
          queueTime: data.queueTime,
          ticketUrl: data.ticketUrl,
          description: data.description,
          bannerUrl: data.bannerUrl,
          seatingPlanUrl: data.seatingPlanUrl,
        }),
      });
      const result = await res.json();
      if (res.ok && result.room) {
        toast.success("บันทึกข้อมูลห้องเรียบร้อยแล้ว");
        updateRooms((prev) =>
          prev.map((r) => (r.id === data.id ? { ...r, ...result.room } : r)),
        );
        getSocket().emit("room_updated", {
          roomId: data.id,
          room: result.room,
        });
        setEditingRoom(null);
      } else {
        toast.error(result.error || "ไม่สามารถบันทึกข้อมูลห้องได้");
      }
    } catch (err) {
      console.error("Failed to update room:", err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลห้อง");
    }
  };

  // Execute confirmed status change (Archive / Restore / Delete / Leave)
  const executeConfirmedStatusChange = async () => {
    if (!user || !confirmModal) return;
    const { roomId, type } = confirmModal;

    setActionLoadingId(roomId);

    if (type === "LEAVE") {
      try {
        const res = await fetch(
          `/api/rooms/${roomId}/members?userId=${user.id}&requesterId=${user.id}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "ไม่สามารถออกจากห้องได้");
        }
        toast.success("คุณได้ออกจากห้องแล้ว");
        updateRooms((prev) => prev.filter((r) => r.id !== roomId));
        getSocket().emit("member_kicked", {
          roomId,
          targetUserId: user.id,
          memberName: user.name || "สมาชิก",
          kickedBy: user.name || "สมาชิก",
          isSelfLeave: true,
          message: data.chatMessage,
        });
        setConfirmModal(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    const nextStatus: "ACTIVE" | "ARCHIVED" | "DELETED" =
      type === "ARCHIVE"
        ? "ARCHIVED"
        : type === "RESTORE"
          ? "ACTIVE"
          : "DELETED";

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

      toast.success(data.message || "อัปเดตสถานะสำเร็จ");

      if (nextStatus === "DELETED") {
        updateRooms((prev) => prev.filter((r) => r.id !== roomId));
      } else {
        updateRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, status: nextStatus } : r)),
        );
      }
      getSocket().emit("room_status_changed", { roomId, status: nextStatus });
      setConfirmModal(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered rooms calculation
  const filteredRooms = useMemo(() => {
    // ponytail: compare YYYY-MM-DD in Bangkok timezone so today's events stay visible all day
    const todayStr = toInputDateTime(new Date()).split("T")[0];

    const result = rooms.filter((r) => {
      // 1. Ownership tab
      if (ownershipTab === "MINE" && r.role !== "OWNER") return false;
      if (ownershipTab === "JOINED" && r.role !== "MEMBER") return false;

      // 2. Status filter: normal view hides archived rooms, archived view shows only archived
      if (statusFilter !== "ARCHIVED" && r.status === "ARCHIVED") return false;
      if (statusFilter === "ARCHIVED" && r.status !== "ARCHIVED") return false;

      // 3. Date filter
      if (dateFilter === "UPCOMING") {
        if (r.eventDate) {
          const roomDateStr = toInputDateTime(r.eventDate).split("T")[0];
          // Hide past dates (before today)
          if (roomDateStr && roomDateStr < todayStr) return false;
        }
      } else if (dateFilter === "CUSTOM" && customDate) {
        if (!r.eventDate) return false;
        const roomDateStr = toInputDateTime(r.eventDate).split("T")[0];
        if (roomDateStr !== customDate) return false;
      }

      return true;
    });

    // ponytail: เรียงตามวันที่จัดงานจากน้อยไปมาก (Ascending: 1 -> 2 -> 3...) ทั้งหมด โดยห้องที่ไม่มีวันที่จัดงานนำไปไว้ท้ายสุด
    return result.sort((a, b) => {
      if (a.eventDate && b.eventDate) {
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      }
      if (a.eventDate && !b.eventDate) return -1;
      if (!a.eventDate && b.eventDate) return 1;
      return 0;
    });
  }, [rooms, ownershipTab, statusFilter, dateFilter, customDate]);

  const activeRoomsCount = useMemo(
    () =>
      rooms.filter((r) =>
        statusFilter === "ARCHIVED"
          ? r.status === "ARCHIVED"
          : r.status !== "ARCHIVED",
      ).length,
    [rooms, statusFilter],
  );

  const myRoomsCount = useMemo(
    () =>
      rooms.filter(
        (r) =>
          r.role === "OWNER" &&
          (statusFilter === "ARCHIVED"
            ? r.status === "ARCHIVED"
            : r.status !== "ARCHIVED"),
      ).length,
    [rooms, statusFilter],
  );
  const joinedRoomsCount = useMemo(
    () =>
      rooms.filter(
        (r) =>
          r.role === "MEMBER" &&
          (statusFilter === "ARCHIVED"
            ? r.status === "ARCHIVED"
            : r.status !== "ARCHIVED"),
      ).length,
    [rooms, statusFilter],
  );

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setCustomDate("");
    if (dateFilter === "UPCOMING" && statusFilter === "ALL" && !customDate) {
      setDateFilter("ALL");
    } else {
      setDateFilter("UPCOMING");
    }
  };

  const markRoomAsRead = useCallback(
    (roomId: string) => {
      updateRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)),
      );
    },
    [updateRooms],
  );

  const handleOpenMembers = useCallback(async (room: Room) => {
    setMembersModalRoom(room);
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/members?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (res.ok && data.members) {
        setRoomMembers(data.members);
      }
    } catch (err) {
      console.error("Failed to load room members:", err);
      toast.error("ไม่สามารถโหลดรายชื่อสมาชิกได้");
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (!membersModalRoom?.id) return;
    const socket = getSocket();
    const handleRefresh = (data?: { roomId?: string }) => {
      if (!data?.roomId || data.roomId === membersModalRoom.id) {
        fetch(`/api/rooms/${membersModalRoom.id}/members?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        })
          .then((res) => res.json())
          .then((mData) => {
            if (mData.members) setRoomMembers(mData.members);
          })
          .catch(() => {});
      }
    };

    socket.on("member_joined", handleRefresh);
    socket.on("room_invitation_update", handleRefresh);
    return () => {
      socket.off("member_joined", handleRefresh);
      socket.off("room_invitation_update", handleRefresh);
    };
  }, [membersModalRoom?.id]);

  const handleKickMember = useCallback(
    async (targetUserId: string, memberName: string) => {
      if (!membersModalRoom || !user) return;
      try {
        const res = await fetch(
          `/api/rooms/${membersModalRoom.id}/members?userId=${targetUserId}&requesterId=${user.id}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "ไม่สามารถนำสมาชิกออกจากห้องได้");
        }

        setRoomMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
        updateRooms((prev) =>
          prev.map((r) =>
            r.id === membersModalRoom.id
              ? { ...r, memberCount: Math.max(1, r.memberCount - 1) }
              : r,
          ),
        );

        getSocket().emit("member_kicked", {
          roomId: membersModalRoom.id,
          targetUserId,
          memberName,
          kickedBy: user.name || "เจ้าของห้อง",
          isSelfLeave: false,
          message: data.chatMessage,
        });

        toast.success(`นำคุณ ${memberName} ออกจากห้องเรียบร้อยแล้ว`);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการนำสมาชิกออก",
        );
      }
    },
    [membersModalRoom, user, updateRooms],
  );

  return {
    rooms,
    loading,
    actionLoadingId,
    ownershipTab,
    setOwnershipTab,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    customDate,
    setCustomDate,
    isCreateOpen,
    setIsCreateOpen,
    isJoinOpen,
    setIsJoinOpen,
    editingRoom,
    setEditingRoom,
    shareRoom,
    setShareRoom,
    lightbox,
    setLightbox,
    confirmModal,
    setConfirmModal,
    membersModalRoom,
    setMembersModalRoom,
    roomMembers,
    loadingMembers,
    handleOpenMembers,
    handleKickMember,
    handleCreateRoom,
    handleSaveRoom,
    executeConfirmedStatusChange,
    handleResetFilters,
    markRoomAsRead,
    filteredRooms,
    activeRoomsCount,
    myRoomsCount,
    joinedRoomsCount,
  };
}
