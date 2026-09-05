"use client";

import React from "react";
import {
  EditRoomModal,
  EditTaskModal,
  ShareRoomModal,
  ImageLightboxModal,
  ConfirmActionModal,
  ConfirmType,
  MembersModal,
} from "@/components/modals";
import { CarouselSlide } from "@/components/room";
import { Room, SeatTask, RoomMemberItem, TaskAssignee } from "@/types";

interface RoomModalsProps {
  roomId: string;
  room: Room | null;
  currentUserId?: string;
  currentUserName: string;
  isOwner: boolean;
  members: RoomMemberItem[];
  roomSlides: CarouselSlide[];

  // Modal Visibility States
  isEditRoomOpen: boolean;
  setIsEditRoomOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  editingTask: SeatTask | null;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  lightboxIndex: number | null;
  setLightboxIndex: (idx: number | null) => void;
  isMembersModalOpen: boolean;
  setIsMembersModalOpen: (open: boolean) => void;

  // Confirm Modals
  confirmModal: { isOpen: boolean; type: ConfirmType } | null;
  setConfirmModal: (modal: { isOpen: boolean; type: ConfirmType } | null) => void;
  statusActionLoading: boolean;
  taskToDelete: { id: string; location: string } | null;
  setTaskToDelete: (task: { id: string; location: string } | null) => void;
  taskActionLoading: boolean;

  // Handlers
  onSaveRoom: (data: {
    id: string;
    title: string;
    eventDate: string;
    hasQueue?: boolean;
    queueTime?: string | null;
    ticketUrl?: string | null;
    description?: string | null;
    bannerUrl?: string | null;
    seatingPlanUrl?: string | null;
  }) => Promise<boolean>;
  onSaveTask: (
    taskData: Partial<SeatTask> & { assignees?: TaskAssignee[] },
  ) => Promise<boolean>;
  onRequestDeleteTask: (taskId: string) => void;
  onExecuteDeleteTask: () => void;
  onExecuteStatusChange: () => void;
  onKickMember: (targetUserId: string, memberName: string) => void;
}

export const RoomModals: React.FC<RoomModalsProps> = ({
  roomId,
  room,
  currentUserId,
  currentUserName,
  isOwner,
  members,
  roomSlides,
  isEditRoomOpen,
  setIsEditRoomOpen,
  isEditModalOpen,
  setIsEditModalOpen,
  editingTask,
  isShareModalOpen,
  setIsShareModalOpen,
  lightboxIndex,
  setLightboxIndex,
  isMembersModalOpen,
  setIsMembersModalOpen,
  confirmModal,
  setConfirmModal,
  statusActionLoading,
  taskToDelete,
  setTaskToDelete,
  taskActionLoading,
  onSaveRoom,
  onSaveTask,
  onRequestDeleteTask,
  onExecuteDeleteTask,
  onExecuteStatusChange,
  onKickMember,
}) => {
  return (
    <>
      <EditRoomModal
        isOpen={isEditRoomOpen}
        room={room}
        onClose={() => setIsEditRoomOpen(false)}
        onSave={async (data) => {
          await onSaveRoom(data);
        }}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        task={editingTask}
        members={members}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onSaveTask}
        onDelete={(taskId) => {
          setIsEditModalOpen(false);
          onRequestDeleteTask(taskId);
        }}
      />

      <ShareRoomModal
        isOpen={isShareModalOpen}
        room={room}
        onClose={() => setIsShareModalOpen(false)}
      />

      {room && (
        <ImageLightboxModal
          isOpen={lightboxIndex !== null}
          title={room.title}
          slides={roomSlides}
          initialIndex={lightboxIndex ?? 0}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {confirmModal && room && (
        <ConfirmActionModal
          isOpen={confirmModal.isOpen}
          type={confirmModal.type}
          roomTitle={room.title}
          onConfirm={onExecuteStatusChange}
          onClose={() => setConfirmModal(null)}
          loading={statusActionLoading}
        />
      )}

      {taskToDelete && (
        <ConfirmActionModal
          isOpen={!!taskToDelete}
          type="DELETE_TASK"
          itemTitle={taskToDelete.location}
          onConfirm={onExecuteDeleteTask}
          onClose={() => setTaskToDelete(null)}
          loading={taskActionLoading}
        />
      )}

      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={members}
        roomId={roomId}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onKickMember={onKickMember}
      />
    </>
  );
};
