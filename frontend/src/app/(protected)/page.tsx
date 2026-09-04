"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Room } from "@/types";
import { Plus, KeyRound, Loader2 } from "lucide-react";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { EditRoomModal } from "@/components/EditRoomModal";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import { CarouselSlide } from "@/components/RoomImageCarousel";
import { ImageLightboxModal } from "@/components/ImageLightboxModal";
import { ShareRoomModal } from "@/components/ShareRoomModal";
import {
  ConfirmActionModal,
  ConfirmType,
} from "@/components/ConfirmActionModal";
import { RoomCard } from "@/components/RoomCard";
import { RoomFilters } from "@/components/RoomFilters";
import { RoomEmptyState } from "@/components/RoomEmptyState";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Tabs
  const [ownershipTab, setOwnershipTab] = useState<"ALL" | "MINE" | "JOINED">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "UPCOMING" | "CUSTOM">(
    "ALL",
  );
  const [customDate, setCustomDate] = useState<string>("");

  // Modals
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

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!user) return;
      try {
        const res = await fetch(`/api/rooms?userId=${user.id}`);
        const data = await res.json();
        if (!ignore && res.ok && data.rooms) {
          setRooms(data.rooms);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [user, refreshKey]);

  const refreshRooms = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Realtime Socket Lobby listener for dashboard rooms
  useEffect(() => {
    const socket = getSocket();
    socket.emit("join_lobby");

    const handleLobbyUpdate = () => {
      refreshRooms();
    };

    socket.on("lobby_room_created", handleLobbyUpdate);
    socket.on("lobby_room_updated", handleLobbyUpdate);

    return () => {
      socket.off("lobby_room_created", handleLobbyUpdate);
      socket.off("lobby_room_updated", handleLobbyUpdate);
    };
  }, [refreshRooms]);

  // Create room
  const handleCreateRoom = async (data: {
    title: string;
    eventDate: string;
    ticketUrl?: string;
    description?: string;
    bannerUrl?: string;
    seatingPlanUrl?: string;
  }) => {
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          eventDate: data.eventDate,
          ticketUrl: data.ticketUrl,
          description: data.description,
          bannerUrl: data.bannerUrl,
          seatingPlanUrl: data.seatingPlanUrl,
          createdById: user?.id,
        }),
      });
      const result = await res.json();
      if (res.ok && result.room) {
        toast.success(`สร้างห้อง "${result.room.title}" สำเร็จ!`);
        setIsCreateOpen(false);
        getSocket().emit("room_created", { room: result.room });
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
    id: string;
    title: string;
    eventDate: string;
    ticketUrl?: string | null;
    description?: string | null;
    bannerUrl?: string | null;
    seatingPlanUrl?: string | null;
  }) => {
    try {
      const res = await fetch(`/api/rooms/${data.id}`, {
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
        setRooms((prev) =>
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

    const nextStatus: "ACTIVE" | "ARCHIVED" | "DELETED" =
      type === "ARCHIVE"
        ? "ARCHIVED"
        : type === "RESTORE"
          ? "ACTIVE"
          : "DELETED";

    setActionLoadingId(roomId);
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
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
      } else {
        setRooms((prev) =>
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

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    // 1. Ownership tab
    if (ownershipTab === "MINE" && r.role !== "OWNER") return false;
    if (ownershipTab === "JOINED" && r.role !== "MEMBER") return false;

    // 2. Status filter
    if (statusFilter === "ACTIVE" && r.status !== "ACTIVE") return false;
    if (statusFilter === "ARCHIVED" && r.status !== "ARCHIVED") return false;

    // 3. Date filter
    if (dateFilter === "UPCOMING") {
      if (!r.eventDate) return false;
      const d = new Date(r.eventDate);
      if (isNaN(d.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) return false;
    } else if (dateFilter === "CUSTOM" && customDate) {
      if (!r.eventDate) return false;
      const d = new Date(r.eventDate);
      if (isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const roomDateStr = `${year}-${month}-${day}`;
      if (roomDateStr !== customDate) return false;
    }

    return true;
  });

  const myRoomsCount = rooms.filter((r) => r.role === "OWNER").length;
  const joinedRoomsCount = rooms.filter((r) => r.role === "MEMBER").length;

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setDateFilter("ALL");
    setCustomDate("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Header & Main CTA */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#252525]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            ห้องแชท
          </h1>
        </div>

        {/* Action Buttons: Join with Code & Create Room */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsJoinOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 rounded-full text-xs font-bold text-white bg-[#222222] hover:bg-[#2e2e2e] border border-[#333333] hover:border-[#555555] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#1ed760]" />
            <span>เข้าร่วมด้วยรหัส</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none btn-pill btn-pill-green text-xs px-4 py-2 gap-1.5 cursor-pointer font-bold shadow-lg flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-black stroke-3" />
            <span>สร้างห้องใหม่</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Controls */}
      <RoomFilters
        roomsCount={rooms.length}
        myRoomsCount={myRoomsCount}
        joinedRoomsCount={joinedRoomsCount}
        ownershipTab={ownershipTab}
        setOwnershipTab={setOwnershipTab}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
      />

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-[#1ed760] animate-spin" />
          <p className="text-xs text-[#888888]">กำลังโหลดห้องกดบัตรของคุณ...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRooms.length === 0 && (
        <RoomEmptyState
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          customDate={customDate}
          ownershipTab={ownershipTab}
          onResetFilters={handleResetFilters}
          onOpenJoin={() => setIsJoinOpen(true)}
          onOpenCreate={() => setIsCreateOpen(true)}
        />
      )}

      {/* Room Cards Grid */}
      {!loading && filteredRooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isBusy={actionLoadingId === room.id}
              onEnterRoom={(id) => router.push(`/rooms/${id}`)}
              onEdit={(targetRoom) => setEditingRoom(targetRoom)}
              onShare={(targetRoom) => setShareRoom(targetRoom)}
              onConfirmAction={(action) => setConfirmModal(action)}
              onOpenLightbox={(slides, initialIndex) =>
                setLightbox({
                  isOpen: true,
                  title: room.title,
                  slides,
                  initialIndex,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <EditRoomModal
        isOpen={!!editingRoom}
        room={editingRoom}
        onClose={() => setEditingRoom(null)}
        onSave={handleSaveRoom}
      />

      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSuccess={(roomId) => {
          router.push(`/rooms/${roomId}`);
        }}
      />

      {confirmModal && (
        <ConfirmActionModal
          isOpen={confirmModal.isOpen}
          type={confirmModal.type}
          roomTitle={confirmModal.roomTitle}
          onConfirm={executeConfirmedStatusChange}
          onClose={() => setConfirmModal(null)}
          loading={actionLoadingId === confirmModal.roomId}
        />
      )}

      {/* Unified Share Room Modal */}
      <ShareRoomModal
        isOpen={!!shareRoom}
        room={shareRoom}
        onClose={() => setShareRoom(null)}
      />

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightbox?.isOpen}
        title={lightbox?.title || ""}
        slides={lightbox?.slides || []}
        initialIndex={lightbox?.initialIndex || 0}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
