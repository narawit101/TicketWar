"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Room } from "@/types";

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
import {
  Plus,
  KeyRound,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  ArrowRight,
  Loader2,
  Disc,
  Crown,
  Users,
  Edit3,
  MoreVertical,
  Share2,
  X,
} from "lucide-react";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { EditRoomModal } from "@/components/EditRoomModal";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import {
  RoomImageCarousel,
  CarouselSlide,
} from "@/components/RoomImageCarousel";
import { ImageLightboxModal } from "@/components/ImageLightboxModal";
import { ShareRoomModal } from "@/components/ShareRoomModal";
import {
  ConfirmActionModal,
  ConfirmType,
} from "@/components/ConfirmActionModal";
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
  const [openMenuRoomId, setOpenMenuRoomId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Close card action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".room-actions-menu")) {
        setOpenMenuRoomId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: ConfirmType;
    roomId: string;
    roomTitle: string;
  } | null>(null);

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

  // Execute confirmed status change (Archive / Restore / Delete)
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Header & Main CTA */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#252525]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            ห้องแชท
          </h1>
          {/* <p className="text-xs text-[#888888] mt-1">
            ศูนย์รวมห้อง War Room ประสานงานกดบัตร วางแผนที่นั่ง และแบ่งหน้าที่กันในทีม
          </p> */}
        </div>

        {/* Action Buttons: Join with Code & Create Room */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 rounded-full text-xs font-bold text-white bg-[#222222] hover:bg-[#2e2e2e] border border-[#333333] hover:border-[#555555] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#1ed760]" />
            <span>เข้าร่วมด้วยรหัส</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none btn-pill btn-pill-green text-xs px-4 py-2 gap-1.5 cursor-pointer font-bold shadow-lg flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-black stroke-3" />
            <span>สร้างห้องใหม่</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Controls: Ownership Tabs & Status Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        {/* Ownership Tabs */}
        <div className="flex items-center bg-[#181818] p-1 rounded-xl border border-[#252525] text-xs">
          <button
            onClick={() => setOwnershipTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              ownershipTab === "ALL"
                ? "bg-[#282828] text-white shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <span>ทั้งหมด</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#121212] text-[#888888]">
              {rooms.length}
            </span>
          </button>

          <button
            onClick={() => setOwnershipTab("MINE")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              ownershipTab === "MINE"
                ? "bg-[#282828] text-white shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <Crown className="w-3 h-3 text-[#1ed760]" />
            <span>ห้องของฉัน</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#121212] text-[#888888]">
              {myRoomsCount}
            </span>
          </button>

          <button
            onClick={() => setOwnershipTab("JOINED")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              ownershipTab === "JOINED"
                ? "bg-[#282828] text-white shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <Users className="w-3 h-3 text-[#539df5]" />
            <span>ที่ได้รับเชิญ</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#121212] text-[#888888]">
              {joinedRoomsCount}
            </span>
          </button>
        </div>

        {/* Filter Controls: Status Pills & Date Filter Pills/Picker */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs w-full sm:w-auto">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#252525]">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-[#282828] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              สถานะทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "ACTIVE"
                  ? "bg-[#282828] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760]" />
              <span>ใช้งานอยู่</span>
            </button>
            <button
              onClick={() => {
                setStatusFilter("ARCHIVED");
                if (dateFilter === "UPCOMING") {
                  setDateFilter("ALL");
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "ARCHIVED"
                  ? "bg-[#282828] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>จัดเก็บ</span>
            </button>
          </div>

          {/* Date Filter Pills & Picker */}
          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#252525]">
            <button
              onClick={() => {
                setDateFilter("ALL");
                setCustomDate("");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                dateFilter === "ALL" && !customDate
                  ? "bg-[#282828] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              วันทั้งหมด
            </button>
            {statusFilter !== "ARCHIVED" && (
              <button
                onClick={() => {
                  setDateFilter("UPCOMING");
                  setCustomDate("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dateFilter === "UPCOMING" && !customDate
                    ? "bg-[#282828] text-white shadow-sm"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                เร็วๆ นี้
              </button>
            )}

            {/* Custom Date Input Picker */}
            <div className="relative flex items-center pl-0.5">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  if (e.target.value) {
                    setDateFilter("CUSTOM");
                  } else {
                    setDateFilter("ALL");
                  }
                }}
                className={`bg-[#222222] text-xs rounded-lg px-2.5 py-1 border transition cursor-pointer focus:outline-none scheme-dark ${
                  customDate
                    ? "border-[#1ed760] text-[#1ed760] font-semibold"
                    : "border-[#333333] hover:border-[#555555] text-[#b3b3b3]"
                }`}
                title="เลือกวันที่ระบุ"
              />
              {customDate && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomDate("");
                    setDateFilter("ALL");
                  }}
                  className="ml-1 p-1 rounded-md text-[#888888] hover:text-white hover:bg-[#282828] transition cursor-pointer"
                  title="ล้างวันที่เลือก"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-[#1ed760] animate-spin" />
          <p className="text-xs text-[#888888]">กำลังโหลดห้องกดบัตรของคุณ...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRooms.length === 0 && (
        <div className="py-16 px-4 card-spotify border border-[#222222] text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#1f1f1f] text-[#888888] flex items-center justify-center mx-auto">
            {statusFilter === "ARCHIVED" ? (
              <Archive className="w-7 h-7 text-[#666666]" />
            ) : (
              <Disc className="w-7 h-7" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {statusFilter === "ARCHIVED"
                ? "ไม่มีห้องที่จัดเก็บ"
                : dateFilter !== "ALL" || customDate
                  ? "ไม่พบห้องกดบัตรที่ตรงกับตัวกรอง"
                  : ownershipTab === "MINE"
                    ? "คุณยังไม่ได้สร้างห้องกดบัตร"
                    : ownershipTab === "JOINED"
                      ? "คุณยังไม่ได้รับเชิญเข้าห้องใดๆ"
                      : "ไม่พบห้องกดบัตรในหมวดนี้"}
            </h3>
            {statusFilter !== "ARCHIVED" &&
              (statusFilter !== "ALL" ||
                dateFilter !== "ALL" ||
                customDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setDateFilter("ALL");
                    setCustomDate("");
                  }}
                  className="mt-2 text-xs text-[#1ed760] hover:underline font-semibold cursor-pointer inline-block"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
          </div>
          {statusFilter !== "ARCHIVED" && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsJoinOpen(true)}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#b3b3b3] hover:text-white border border-[#333333] transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>เข้าร่วมด้วยรหัส</span>
                </div>
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="btn-pill btn-pill-green text-xs px-5 py-2 font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-black stroke-3" />
                <span>สร้างห้องใหม่</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Room Cards Grid */}
      {!loading && filteredRooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const isLive = room.status === "ACTIVE";
            const isOwner = room.role === "OWNER";
            const isBusy = actionLoadingId === room.id;

            return (
              <div
                key={room.id}
                onClick={() => router.push(`/rooms/${room.id}`)}
                className="card-spotify p-5 border border-[#222222] hover:border-[#383838] hover:bg-[#181818]/90 flex flex-col justify-between group transition-all relative cursor-pointer"
              >
                {/* Card Header: Role & Status Tags */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Role Tag */}
                      {isOwner ? (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1f1f1f] text-zinc-300 border border-zinc-700/50 flex items-center gap-1.5 shadow-sm">
                          <Crown className="w-3 h-3 text-[#1ed760]" />
                          <span>เจ้าของห้อง</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1f1f1f] text-zinc-400 border border-zinc-700/50 flex items-center gap-1.5 shadow-sm">
                          <Users className="w-3 h-3 text-zinc-400" />
                          <span>สมาชิก</span>
                        </span>
                      )}

                      {/* Status Tag */}
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1f1f1f] text-zinc-300 border border-zinc-700/50 flex items-center gap-1.5 shadow-sm">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLive ? "bg-[#1ed760]" : "bg-zinc-500"
                          }`}
                        />
                        <span
                          className={isLive ? "text-zinc-200" : "text-zinc-400"}
                        >
                          {isLive ? "ใช้งานอยู่" : "จัดเก็บ"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Room Image Carousel (IG-style with slide) */}
                  <RoomImageCarousel
                    title={room.title}
                    bannerUrl={room.bannerUrl}
                    seatingPlanUrl={room.seatingPlanUrl}
                  />

                  {/* Room Title with Hover Tooltip */}
                  <div className="relative group/title mb-2">
                    <h2
                      className="text-base font-bold text-white tracking-tight group-hover:text-[#1ed760] transition-colors line-clamp-1"
                      title={room.title}
                    >
                      {room.title}
                    </h2>
                    {/* Floating Tooltip */}
                    <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 hidden group-hover/title:block z-40 max-w-xs px-2.5 py-1.5 text-xs font-medium text-white bg-[#181818] border border-[#333333] rounded-lg shadow-2xl backdrop-blur-md whitespace-normal wrap-break-word leading-snug animate-in fade-in zoom-in-95 duration-100">
                      {room.title}
                    </div>
                  </div>

                  {/* Room Metadata */}
                  <div className="space-y-1 text-xs text-[#b3b3b3] mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                      <span>{formatEventDate(room.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#777777]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.memberCount} คน
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Enter Room & Consolidated Action Dropdown */}
                <div className="pt-3 border-t border-[#222222]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/rooms/${room.id}`);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-full bg-[#1ed760] hover:bg-[#1cd05a] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                    >
                      <span>เข้าสู่ห้อง</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {/* Consolidated Action Dropdown */}
                    <div className="relative room-actions-menu shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuRoomId((prev) =>
                            prev === room.id ? null : room.id,
                          );
                        }}
                        className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-[#888888] hover:text-white border border-[#2c2c2c] transition cursor-pointer flex items-center justify-center shadow-sm"
                        title="เมนูจัดการห้อง"
                        aria-label="เมนูจัดการห้อง"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuRoomId === room.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-full mb-1.5 w-48 bg-[#181818] border border-[#2c2c2c] rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150 text-left"
                        >
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRoom(room);
                                setOpenMenuRoomId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-white hover:bg-[#252525] flex items-center gap-2 transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#1ed760]" />
                              <span>แก้ไขข้อมูลห้อง</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShareRoom(room);
                              setOpenMenuRoomId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-[#b3b3b3] hover:text-white hover:bg-[#252525] flex items-center gap-2 transition cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#1ed760]" />
                            <span>แชร์ </span>
                          </button>

                          {isOwner ? (
                            <>
                              <div className="my-1 border-t border-[#252525]" />
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    type: isLive ? "ARCHIVE" : "RESTORE",
                                    roomId: room.id,
                                    roomTitle: room.title,
                                  });
                                  setOpenMenuRoomId(null);
                                }}
                                disabled={isBusy}
                                className="w-full text-left px-3.5 py-2 text-xs text-[#b3b3b3] hover:text-white hover:bg-[#252525] flex items-center gap-2 transition cursor-pointer"
                              >
                                {isLive ? (
                                  <>
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>จัดเก็บ</span>
                                  </>
                                ) : (
                                  <>
                                    <ArchiveRestore className="w-3.5 h-3.5 text-[#1ed760]" />
                                    <span>เปิดใช้งานต่อ</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    type: "DELETE",
                                    roomId: room.id,
                                    roomTitle: room.title,
                                  });
                                  setOpenMenuRoomId(null);
                                }}
                                disabled={isBusy}
                                className="w-full text-left px-3.5 py-2 text-xs text-[#f3727f] hover:bg-[#f3727f]/10 flex items-center gap-2 transition cursor-pointer border-t border-[#252525]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบห้อง</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="my-1 border-t border-[#252525]" />
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    type: "LEAVE",
                                    roomId: room.id,
                                    roomTitle: room.title,
                                  });
                                  setOpenMenuRoomId(null);
                                }}
                                disabled={isBusy}
                                className="w-full text-left px-3.5 py-2 text-xs text-[#f3727f] hover:bg-[#f3727f]/10 flex items-center gap-2 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ออกจากห้อง</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
