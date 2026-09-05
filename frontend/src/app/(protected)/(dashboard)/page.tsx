"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RoomCard, RoomFilters, RoomEmptyState } from "@/components/room";
import { useDashboardRooms } from "./hooks/useDashboardRooms";
import { DashboardModals } from "./components/DashboardModals";

import { RoomCardSkeleton } from "@/components/common";

export default function RoomsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
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
    myRoomsCount,
    joinedRoomsCount,
  } = useDashboardRooms();

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
            <div className="flex items-center justify-center gap-2.5">
              <KeyRound className="w-3.5 h-3.5 text-[#1ed760]" />
              <span>เข้าร่วมด้วยรหัส</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none btn-pill btn-pill-green text-xs px-4 py-2 gap-1.5 cursor-pointer font-bold shadow-lg flex items-center justify-center"
          >
            <div className="flex items-center justify-center gap-2.5">
              <Plus className="w-4 h-4 text-black stroke-3" />
              <span>สร้างห้องใหม่</span>
            </div>
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

      {/* Loading State: Clean Skeleton Grid */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <RoomCardSkeleton />
          <RoomCardSkeleton />
          <RoomCardSkeleton />
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
              onEnterRoom={(id) => {
                markRoomAsRead(id);
                router.push(`/rooms/${id}`);
              }}
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
              onOpenMembers={handleOpenMembers}
            />
          ))}
        </div>
      )}

      {/* Modals Container */}
      <DashboardModals
        editingRoom={editingRoom}
        onCloseEdit={() => setEditingRoom(null)}
        onSaveRoom={handleSaveRoom}
        isCreateOpen={isCreateOpen}
        onCloseCreate={() => setIsCreateOpen(false)}
        onCreateRoom={handleCreateRoom}
        isJoinOpen={isJoinOpen}
        onCloseJoin={() => setIsJoinOpen(false)}
        confirmModal={confirmModal}
        onCloseConfirm={() => setConfirmModal(null)}
        onConfirmStatusChange={executeConfirmedStatusChange}
        actionLoadingId={actionLoadingId}
        shareRoom={shareRoom}
        onCloseShare={() => setShareRoom(null)}
        lightbox={lightbox}
        onCloseLightbox={() => setLightbox(null)}
        membersModalRoom={membersModalRoom}
        roomMembers={roomMembers}
        loadingMembers={loadingMembers}
        onCloseMembers={() => setMembersModalRoom(null)}
        onKickMember={handleKickMember}
        currentUserId={user?.id}
      />
    </div>
  );
}
