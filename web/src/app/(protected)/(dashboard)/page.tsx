"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, KeyRound, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RoomCard, RoomFilters, RoomEmptyState } from "@/components/room";
import { useDashboardRooms } from "./hooks/useDashboardRooms";
import { DashboardModals } from "./components/DashboardModals";

import { RoomCardSkeleton, Pagination } from "@/components/common";

export default function RoomsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
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
    currentPage,
    totalPages,
    handlePageChange,
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
    searchQuery,
    setSearchQuery,
    filteredRooms,
    activeRoomsCount,
    myRoomsCount,
    joinedRoomsCount,
  } = useDashboardRooms();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Header: Title, Search Bar & Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-[#252525]">
        <div className="shrink-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            ห้องแชท
          </h1>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Spotify Pill Search Input */}
          <div className="relative w-full sm:w-72 lg:w-80">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อห้อง, รายละเอียด, รหัสเชิญ..."
              className="w-full bg-[#1e1e1e] hover:bg-[#252525] focus:bg-[#222222] text-xs text-white placeholder-[#777777] rounded-full pl-9 pr-9 py-2 border border-[#333333] focus:border-[#1ed760] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#888888] hover:text-white hover:bg-[#333333] transition cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Join with Code & Create Room */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-full text-xs font-bold text-white bg-[#222222] hover:bg-[#2e2e2e] border border-[#333333] hover:border-[#555555] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-[#1ed760]" />
                <span>เข้าร่วมด้วยรหัส</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 sm:flex-none btn-pill btn-pill-green text-xs px-4 py-2 gap-1.5 cursor-pointer font-bold shadow-lg flex items-center justify-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 text-black stroke-3" />
                <span>สร้างห้องใหม่</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Filter Controls */}
      <RoomFilters
        roomsCount={activeRoomsCount}
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
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
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

      {/* Pagination Controls */}
      {!loading && filteredRooms.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
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
