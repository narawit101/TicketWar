import React from "react";
import { Message, RoomMemberItem } from "@/types";
import { Avatar } from "@/components/common";
import { X } from "lucide-react";

interface ChatReactionsModalProps {
  isOpen: boolean;
  messageId: string;
  reactions: Record<string, string[]>;
  currentUserId?: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
  roomMembers?: RoomMemberItem[];
  messages: Message[];
  onClose: () => void;
  onToggleReaction?: (messageId: string, emoji: string) => Promise<void> | void;
}

export const ChatReactionsModal: React.FC<ChatReactionsModalProps> = ({
  isOpen,
  messageId,
  reactions,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  roomMembers,
  messages,
  onClose,
  onToggleReaction,
}) => {
  if (!isOpen) return null;

  const getUserInfo = (userId: string) => {
    if (userId === currentUserId) {
      return {
        name: currentUserName,
        avatar: currentUserAvatar,
        isMe: true,
      };
    }
    const member = roomMembers?.find((m) => m.userId === userId);
    if (member) {
      return {
        name: member.name,
        avatar: member.avatarUrl,
        isMe: false,
      };
    }
    const msgAuthor = messages.find((m) => m.userId === userId);
    if (msgAuthor) {
      return {
        name: msgAuthor.userName,
        avatar: msgAuthor.userAvatar,
        isMe: false,
      };
    }
    return { name: "สมาชิก", avatar: undefined, isMe: false };
  };

  const currentModalMsg = messages.find((m) => m.id === messageId);
  const activeReactions = currentModalMsg?.reactions || reactions || {};

  const entries: { userId: string; emoji: string }[] = [];
  Object.entries(activeReactions).forEach(([emoji, userIds]) => {
    (userIds || []).forEach((uId) => {
      entries.push({ userId: uId, emoji });
    });
  });

  const sorted = [...entries].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#242424] border border-[#383838] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header: Close X on top-left, centered title */}
        <div className="relative flex items-center justify-center px-4 py-3.5 border-b border-[#333333]">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3.5 p-1 text-zinc-400 hover:text-white transition rounded-full hover:bg-[#333333] cursor-pointer"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold text-white">ความรู้สึก</h3>
        </div>

        {/* List of Reacting Members */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {sorted.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              ยังไม่มีใครแสดงความรู้สึก
            </div>
          ) : (
            sorted.map((item) => {
              const info = getUserInfo(item.userId);
              return (
                <div
                  key={`${item.userId}-${item.emoji}`}
                  onClick={() => {
                    if (info.isMe && onToggleReaction) {
                      onToggleReaction(messageId, item.emoji);
                      if (sorted.length <= 1) {
                        onClose();
                      }
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                    info.isMe
                      ? "cursor-pointer hover:bg-[#2c2c2c] active:scale-[0.99]"
                      : "hover:bg-[#2a2a2a]/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={info.avatar} name={info.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {info.name}
                      </p>
                      {info.isMe && (
                        <p className="text-xs text-zinc-400 hover:text-zinc-200">
                          เลือกเพื่อลบออก
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xl shrink-0 ml-3 select-none">
                    {item.emoji}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
