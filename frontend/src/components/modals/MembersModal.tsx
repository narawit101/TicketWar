import React, { useState } from "react";
import { RoomMemberItem } from "@/types";
import { X, Crown, UserX, Loader2, AlertTriangle, Users } from "lucide-react";
import { Avatar, MemberRowSkeleton } from "@/components/common";
import { RoomInviteSection } from "@/components/room";

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: RoomMemberItem[];
  roomId?: string;
  currentUserId?: string;
  isOwner: boolean;
  onKickMember: (userId: string, memberName: string) => Promise<void> | void;
  showInviteSection?: boolean;
  isLoading?: boolean;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  isOpen,
  onClose,
  members,
  roomId,
  currentUserId,
  isOwner,
  onKickMember,
  showInviteSection = true,
  isLoading = false,
}) => {
  const [memberToKick, setMemberToKick] = useState<RoomMemberItem | null>(null);
  const [isKicking, setIsKicking] = useState(false);

  if (!isOpen) return null;

  const handleConfirmKick = async () => {
    if (!memberToKick) return;
    try {
      setIsKicking(true);
      await onKickMember(memberToKick.userId, memberToKick.name);
      setMemberToKick(null);
    } finally {
      setIsKicking(false);
    }
  };

  const owners = members.filter((m) => m.role === "OWNER");
  const regularMembers = members.filter((m) => m.role !== "OWNER");

  const renderMemberRow = (member: RoomMemberItem) => {
    const isCurrentUser = member.userId === currentUserId;
    const isMemberOwner = member.role === "OWNER";

    return (
      <div
        key={member.id}
        className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#121212] border border-[#282828] hover:border-[#383838] transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={member.avatarUrl} name={member.name} size="md" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white truncate">
                {member.name}
              </span>
              {isCurrentUser && (
                <span className="text-xs text-[#1ed760] font-medium">
                  (คุณ)
                </span>
              )}
            </div>
            {member.email && (
              <span className="text-xs sm:text-sm text-[#888888] block truncate mt-0.5">
                {member.email}
              </span>
            )}
          </div>
        </div>

        {/* Kick Button (Only for Room Owner, cannot kick self or owner) */}
        {isOwner && !isMemberOwner && !isCurrentUser && (
          <button
            type="button"
            onClick={() => setMemberToKick(member)}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0 ml-2"
            title={`ให้ ${member.name} ออกจากแชท`}
            aria-label={`ให้ ${member.name} ออกจากแชท`}
          >
            <UserX className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181818] border border-[#282828] w-full max-w-lg rounded-2xl p-5 sm:p-6 relative shadow-2xl animate-in zoom-in-95 duration-150 text-left flex flex-col h-[60vh] min-h-100 max-h-180"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#252525] mb-3">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {isLoading ? "สมาชิกในห้อง" : `สมาชิกในห้อง (${members.length})`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#252525] transition cursor-pointer"
            aria-label="ปิดหน้าต่างสมาชิก"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kick Confirmation Overlay if a member is selected */}
        {memberToKick ? (
          <div className="space-y-4 py-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white">
                ยืนยันการนำสมาชิกออกจากแชท
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto">
                คุณแน่ใจหรือไม่ว่าต้องการให้{" "}
                <strong className="text-white font-semibold">
                  {memberToKick.name}
                </strong>{" "}
                ออกจากแชทนี้?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isKicking}
                onClick={() => setMemberToKick(null)}
                className="py-2.5 text-sm rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer border border-zinc-700/60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isKicking}
                onClick={handleConfirmKick}
                className="py-2.5 text-sm rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isKicking && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>ให้ออกจากแชท</span>
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar pb-6 pt-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-[#1ed760]/50" />
                <span className="text-xs text-zinc-500 font-semibold">กำลังโหลดสมาชิก...</span>
              </div>
              <MemberRowSkeleton />
              <MemberRowSkeleton />
              <MemberRowSkeleton />
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar pb-6">
            {/* 1. เจ้าของห้อง */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#1ed760]" />
                <span>เจ้าของห้อง ({owners.length})</span>
              </div>
              <div className="space-y-2">{owners.map(renderMemberRow)}</div>
            </div>

            {/* 2. สมาชิก */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>สมาชิก ({regularMembers.length})</span>
              </div>
              {regularMembers.length > 0 ? (
                <div className="space-y-2">
                  {regularMembers.map(renderMemberRow)}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 py-3 text-center bg-[#121212] rounded-xl border border-[#222222]">
                  ยังไม่มีสมาชิกคนอื่นในห้องนี้
                </div>
              )}
            </div>

            {/* 3. เชิญเพื่อนเข้าร่วมห้อง */}
            {showInviteSection && roomId && (
              <div className="pt-3 border-t border-[#252525]">
                <RoomInviteSection
                  roomId={roomId}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
