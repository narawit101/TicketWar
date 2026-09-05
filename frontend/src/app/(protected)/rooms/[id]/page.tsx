/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  RoomSeatTasksList,
  RoomHero,
  RoomHeader,
  CarouselSlide,
} from "@/components/room";
import { LiveChat } from "@/components/chat";
import { ConfirmType } from "@/components/modals";
import { Room, SeatTask, RoomMemberItem } from "@/types";
import { useAuth } from "@/context/AuthContext";

import { useRoomChat } from "./hooks/useRoomChat";
import { useRoomTasks } from "./hooks/useRoomTasks";
import { useRoomSocket } from "./hooks/useRoomSocket";
import { RoomModals } from "./components/RoomModals";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.id as string) || "";
  const { user } = useAuth();
  const currentUserName = user?.name || "Member";

  // Core Room & Members State
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Visibility States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SeatTask | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: ConfirmType;
  } | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // 1. Live Chat Domain Hook
  const chat = useRoomChat({
    roomId,
    userId: user?.id,
    currentUserName,
    currentUserAvatar: user?.avatarUrl || undefined,
  });

  // 2. Seat Tasks Domain Hook (with chat notification callback)
  const taskDomain = useRoomTasks({
    roomId,
    userId: user?.id,
    currentUserName,
    onAddChatMessage: chat.handleAddChatMessage,
  });

  const { setPinnedMessage, setMessages, setHasMoreMessages } = chat;
  const { setTasks } = taskDomain;

  // 3. Room Channel & Lifecycle Socket Hook
  const roomSocket = useRoomSocket({
    roomId,
    userId: user?.id,
    currentUserName,
    room,
    setRoom,
    setMembers,
    setMessages,
    confirmModal,
    setConfirmModal,
    onAddChatMessage: chat.handleAddChatMessage,
    router,
  });

  // Initial Fetch: Room, Tasks, Messages, and Membership Verification
  useEffect(() => {
    if (!roomId || !user?.id) return;
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(`/api/rooms/${roomId}?userId=${user?.id}`);
        const data = await res.json();
        if (ignore) return;

        if (res.status === 403 || data.notMember) {
          toast.error("คุณไม่ได้เป็นสมาชิกในห้องนี้ หรือถูกนำออกจากห้องแล้ว", {
            id: "room-forbidden",
          });
          router.replace("/");
          return;
        }

        if (res.ok) {
          const isMember =
            data.room?.createdById === user?.id ||
            (data.members || []).some(
              (m: { userId: string }) => m.userId === user?.id,
            );

          if (!isMember) {
            toast.error(
              "คุณไม่ได้เป็นสมาชิกในห้องนี้ หรือถูกนำออกจากห้องแล้ว",
              { id: "room-forbidden" },
            );
            router.replace("/");
            return;
          }

          setRoom(data.room);
          setPinnedMessage(data.room?.pinnedMessage || null);
          setTasks(data.tasks || []);
          setMessages(data.messages || []);
          setHasMoreMessages(
            data.hasMoreMessages ?? data.messages?.length === 50,
          );
          setMembers(data.members || data.room?.members || []);
        } else {
          toast.error(data.error || "ไม่พบห้องนี้ในระบบ", {
            id: "room-not-found",
          });
          router.replace("/");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load room data:", err);
        }
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
  }, [
    roomId,
    user?.id,
    router,
    setPinnedMessage,
    setTasks,
    setMessages,
    setHasMoreMessages,
  ]);

  // Set document title to concert / room title
  useEffect(() => {
    if (room?.title) {
      document.title = `${room.title} | TicketWar`;
    } else {
      document.title = "TicketWar";
    }
    return () => {
      document.title = "TicketWar";
    };
  }, [room?.title]);

  const isReadOnly = room?.status === "ARCHIVED";
  const isOwner = !!(room && user && room.createdById === user.id);

  const roomSlides: CarouselSlide[] = [];
  if (room?.bannerUrl) {
    roomSlides.push({ url: room.bannerUrl, label: "โปสเตอร์", type: "banner" });
  }
  if (room?.seatingPlanUrl) {
    roomSlides.push({
      url: room.seatingPlanUrl,
      label: "ผังที่นั่ง",
      type: "seating",
    });
  }

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
        tasks={taskDomain.tasks}
        onOpenBanner={() => {
          const bannerIdx = roomSlides.findIndex((s) => s.type === "banner");
          if (bannerIdx !== -1) setLightboxIndex(bannerIdx);
        }}
      />

      {/* Main 2-Column Split (Left: Seat Tasks 40%, Right: Live Chat 60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-stretch lg:h-195">
        {/* Left Column: Seat Tasks (4 cols = 40%) */}
        <RoomSeatTasksList
          tasks={taskDomain.tasks}
          members={members}
          currentUserId={user?.id}
          currentUserName={currentUserName}
          isReadOnly={isReadOnly}
          onAddTask={() => {
            setEditingTask(null);
            setIsEditModalOpen(true);
          }}
          onAssignTask={taskDomain.handleAssignTask}
          onStartPendingPayment={taskDomain.handleStartPendingPayment}
          onConfirmPayment={taskDomain.handleConfirmPayment}
          onDirectSecured={taskDomain.handleDirectSecured}
          onCancelPendingPayment={taskDomain.handleCancelPendingPayment}
          onDecrement={taskDomain.handleDecrement}
          onEditTask={(t) => {
            setEditingTask(t);
            setIsEditModalOpen(true);
          }}
          onDeleteTask={taskDomain.requestDeleteTask}
          onViewSeatingPlan={() => {
            const planIdx = roomSlides.findIndex((s) => s.type === "seating");
            if (planIdx !== -1) {
              setLightboxIndex(planIdx);
            } else {
              toast("ห้องนี้ไม่มีรูปผังที่นั่ง", { icon: "ℹ️" });
            }
          }}
        />

        {/* Right Column: Full-Height Live Chat (6 cols = 60%) */}
        <div className="lg:col-span-6 h-150 sm:h-170 lg:h-full flex flex-col min-h-0 overflow-hidden">
          <LiveChat
            messages={chat.messages}
            currentUserName={currentUserName}
            currentUserAvatar={user?.avatarUrl}
            currentUserId={user?.id}
            pinnedMessage={chat.pinnedMessage}
            onPinMessage={chat.handlePinMessage}
            onToggleReaction={chat.handleToggleReaction}
            onSendMessage={chat.handleAddChatMessage}
            onEditMessage={chat.handleEditChatMessage}
            onDeleteMessage={chat.handleDeleteChatMessage}
            isReadOnly={isReadOnly}
            hasMoreMessages={chat.hasMoreMessages}
            onLoadMoreMessages={chat.handleLoadMoreMessages}
            isLoadingMore={chat.isLoadingMoreMessages}
            roomMembers={members}
            typingUsers={chat.typingUsers}
            readReceipts={chat.readReceipts}
            onTypingStart={chat.handleTypingStart}
            onTypingStop={chat.handleTypingStop}
            onMarkRead={chat.handleMarkRead}
          />
        </div>
      </div>

      {/* Bottom Large Seating Plan */}
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
              className="max-h-162.5 w-auto max-w-full object-contain rounded-lg transition-transform duration-200 group-hover/plan:scale-[1.01]"
            />
          </div>
        </div>
      )}

      {/* Modals Orchestration Component */}
      <RoomModals
        roomId={roomId}
        room={room}
        currentUserId={user?.id}
        currentUserName={currentUserName}
        isOwner={isOwner}
        members={members}
        roomSlides={roomSlides}
        isEditRoomOpen={isEditRoomOpen}
        setIsEditRoomOpen={setIsEditRoomOpen}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        editingTask={editingTask}
        isShareModalOpen={isShareModalOpen}
        setIsShareModalOpen={setIsShareModalOpen}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        isMembersModalOpen={isMembersModalOpen}
        setIsMembersModalOpen={setIsMembersModalOpen}
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        statusActionLoading={roomSocket.statusActionLoading}
        taskToDelete={taskDomain.taskToDelete}
        setTaskToDelete={taskDomain.setTaskToDelete}
        taskActionLoading={taskDomain.actionLoading}
        onSaveRoom={roomSocket.handleSaveRoom}
        onSaveTask={taskDomain.handleSaveTask}
        onRequestDeleteTask={taskDomain.requestDeleteTask}
        onExecuteDeleteTask={taskDomain.handleExecuteDeleteTask}
        onExecuteStatusChange={roomSocket.handleExecuteStatusChange}
        onKickMember={roomSocket.handleKickMember}
      />
    </div>
  );
}
