"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Room, RoomMemberItem } from "@/types";
import {
  CreateRoomModal,
  EditRoomModal,
  JoinRoomModal,
  ImageLightboxModal,
  ShareRoomModal,
  ConfirmActionModal,
  ConfirmType,
  RoomFormData,
  MembersModal,
} from "@/components/modals";
import { CarouselSlide } from "@/components/room";

interface DashboardModalsProps {
  editingRoom: Room | null;
  onCloseEdit: () => void;
  onSaveRoom: (data: RoomFormData) => Promise<void> | void;

  isCreateOpen: boolean;
  onCloseCreate: () => void;
  onCreateRoom: (data: RoomFormData) => Promise<void> | void;

  isJoinOpen: boolean;
  onCloseJoin: () => void;

  confirmModal: {
    isOpen: boolean;
    type: ConfirmType;
    roomId: string;
    roomTitle: string;
  } | null;
  onCloseConfirm: () => void;
  onConfirmStatusChange: () => Promise<void> | void;
  actionLoadingId: string | null;

  shareRoom: Room | null;
  onCloseShare: () => void;

  lightbox: {
    isOpen: boolean;
    title: string;
    slides: CarouselSlide[];
    initialIndex: number;
  } | null;
  onCloseLightbox: () => void;

  membersModalRoom: Room | null;
  roomMembers: RoomMemberItem[];
  onCloseMembers: () => void;
  onKickMember: (userId: string, memberName: string) => Promise<void> | void;
  currentUserId?: string;
}

export const DashboardModals: React.FC<DashboardModalsProps> = ({
  editingRoom,
  onCloseEdit,
  onSaveRoom,
  isCreateOpen,
  onCloseCreate,
  onCreateRoom,
  isJoinOpen,
  onCloseJoin,
  confirmModal,
  onCloseConfirm,
  onConfirmStatusChange,
  actionLoadingId,
  shareRoom,
  onCloseShare,
  lightbox,
  onCloseLightbox,
  membersModalRoom,
  roomMembers,
  onCloseMembers,
  onKickMember,
  currentUserId,
}) => {
  const router = useRouter();

  return (
    <>
      <EditRoomModal
        isOpen={!!editingRoom}
        room={editingRoom}
        onClose={onCloseEdit}
        onSave={onSaveRoom}
      />

      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={onCloseCreate}
        onCreate={onCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={onCloseJoin}
        onSuccess={(roomId) => {
          router.push(`/rooms/${roomId}`);
        }}
      />

      {confirmModal && (
        <ConfirmActionModal
          isOpen={confirmModal.isOpen}
          type={confirmModal.type}
          roomTitle={confirmModal.roomTitle}
          onConfirm={onConfirmStatusChange}
          onClose={onCloseConfirm}
          loading={actionLoadingId === confirmModal.roomId}
        />
      )}

      <ShareRoomModal
        isOpen={!!shareRoom}
        room={shareRoom}
        onClose={onCloseShare}
      />

      <ImageLightboxModal
        isOpen={!!lightbox?.isOpen}
        title={lightbox?.title || ""}
        slides={lightbox?.slides || []}
        initialIndex={lightbox?.initialIndex || 0}
        onClose={onCloseLightbox}
      />

      <MembersModal
        isOpen={!!membersModalRoom}
        onClose={onCloseMembers}
        members={roomMembers}
        roomId={membersModalRoom?.id}
        currentUserId={currentUserId}
        isOwner={
          membersModalRoom?.createdById === currentUserId ||
          membersModalRoom?.role === "OWNER"
        }
        onKickMember={onKickMember}
        showInviteSection={false}
      />
    </>
  );
};
