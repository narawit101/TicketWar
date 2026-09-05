/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Message, ReplyToMessage } from "@/types";
import { Avatar } from "@/components/common";
import {
  Calendar,
  Clock,
  Pin,
  PinOff,
  Loader2,
  CornerUpLeft,
  FileText,
  Check,
  Smile,
  MoreVertical,
  Copy,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getChatDivider,
  formatChatTime,
  stripEmojis,
  isPdfUrl,
  getPdfFileName,
  renderMessageContent,
  extractFirstUrl,
  QUICK_REACTIONS,
  formatSentTime,
} from "./chatUtils";
import { LinkPreviewCard } from "./LinkPreviewCard";

const SentTimeIndicator: React.FC<{ createdAt?: string }> = ({ createdAt }) => {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    // Update every 20 seconds so relative time transitions smoothly
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const text = React.useMemo(() => {
    return formatSentTime(createdAt, now);
  }, [createdAt, now]);

  return (
    <div className="flex items-center mt-1 select-none justify-end pr-0.5 animate-in fade-in duration-150">
      <span className="text-[10px] text-zinc-500 font-medium">{text}</span>
    </div>
  );
};

interface ChatMessageItemProps {
  msg: Message;
  prevMsg?: Message;
  nextMsg?: Message;
  currentUserId?: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
  pinnedMessage?: Message | null;
  pinnedByName?: string | null;
  isReadOnly?: boolean;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (text: string) => void;
  onSaveEdit: (msgId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (msg: Message) => void;
  activeMenuId: string | null;
  setActiveMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  activeReactionPickerId: string | null;
  setActiveReactionPickerId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  onToggleReaction?: (messageId: string, emoji: string) => Promise<void> | void;
  onOpenReactionsModal: (
    messageId: string,
    reactions: Record<string, string[]>,
  ) => void;
  onReply: (reply: ReplyToMessage) => void;
  onPinMessage?: (messageId: string | null) => Promise<void> | void;
  onDeleteClick: (info: {
    id: string;
    text?: string;
    isImage?: boolean;
    isPdf?: boolean;
  }) => void;
  onLightboxClick: (url: string) => void;
  onCopyMessage: (msg: Message) => void;
  onDownloadFile: (url: string, filename?: string) => void;
  onScrollToMessage: (msgId: string) => void;
  readReceipts?: Record<
    string,
    { messageId: string; name: string; avatarUrl?: string | null }
  >;
  isLastMyMessage?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  prevMsg,
  nextMsg,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  pinnedMessage,
  pinnedByName,
  isReadOnly = false,
  isEditing,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  activeMenuId,
  setActiveMenuId,
  activeReactionPickerId,
  setActiveReactionPickerId,
  onToggleReaction,
  onOpenReactionsModal,
  onReply,
  onPinMessage,
  onDeleteClick,
  onLightboxClick,
  onCopyMessage,
  onDownloadFile,
  onScrollToMessage,
  readReceipts,
  isLastMyMessage = false,
}) => {
  const [openUpwards, setOpenUpwards] = React.useState(true);
  const [openToLeft, setOpenToLeft] = React.useState(true);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const divider = getChatDivider(msg, prevMsg);
  const isMe = currentUserId
    ? msg.userId === currentUserId
    : msg.userName === currentUserName;
  const avatar = msg.userAvatar || (isMe ? currentUserAvatar : undefined);
  const isActionActive =
    activeMenuId === msg.id || activeReactionPickerId === msg.id;

  const isSameSenderAsPrev = Boolean(
    prevMsg &&
      !prevMsg.isShoutout &&
      !divider &&
      (currentUserId
        ? prevMsg.userId === msg.userId
        : prevMsg.userName === msg.userName),
  );

  const nextDivider = nextMsg ? getChatDivider(nextMsg, msg) : null;
  const isSameSenderAsNext = Boolean(
    nextMsg &&
      !nextMsg.isShoutout &&
      !nextDivider &&
      (currentUserId
        ? nextMsg.userId === msg.userId
        : nextMsg.userName === msg.userName),
  );

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isReadOnly || isEditing || msg.isSending || msg.error) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    const target = e.currentTarget;
    longPressTimerRef.current = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(40);
        }
      } catch {}

      const rect = target.getBoundingClientRect();
      setOpenUpwards(rect.top > 160);
      setOpenToLeft(
        rect.left < 170
          ? false
          : rect.right > (typeof window !== "undefined" ? window.innerWidth - 170 : 300)
          ? true
          : isMe,
      );
      setActiveReactionPickerId(msg.id);
      setActiveMenuId(null);
    }, 380);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 8 || dy > 8) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  return (
    <React.Fragment>
      {/* Date / Time Divider */}
      {divider && (
        <div className="flex items-center justify-center my-2 select-none">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
          <div className="m-3 px-3 py-0.5 rounded-full bg-[#1e1e1e]/90 border border-zinc-700/50 text-[11px] font-medium text-zinc-400 shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
            {divider.type === "date" ? (
              <Calendar className="w-3 h-3 text-[#1ed760]" />
            ) : (
              <Clock className="w-3 h-3 text-zinc-400" />
            )}
            <span>{divider.label}</span>
          </div>
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
        </div>
      )}

      {/* Shoutout / System Event Notification */}
      {msg.isShoutout ? (
        <div className="flex justify-center my-1.5">
          <div className="bg-zinc-800/90 border border-zinc-700/60 rounded-full px-4 py-1.5 text-xs sm:text-[13px] text-zinc-200 flex items-center gap-2 shadow-sm text-center">
            <span>{stripEmojis(msg.text || "")}</span>
            <span className="text-[11px] text-zinc-500 ml-1 shrink-0">
              {formatChatTime(msg.createdAt)}
            </span>
          </div>
        </div>
      ) : (
        <div
          data-message-id={msg.id}
          className={`flex gap-2.5 group items-end rounded-2xl ${
            isMe ? "flex-row-reverse" : "flex-row"
          } ${isActionActive ? "relative z-30" : ""} ${
            isSameSenderAsPrev ? "mt-1" : "mt-3"
          }`}
        >
          {/* User Avatar - Only show for other members on the LAST message of consecutive sequence */}
          {!isMe && (
            !isSameSenderAsNext ? (
              <Avatar
                src={avatar}
                name={msg.userName}
                size="sm"
                className="mb-1"
              />
            ) : (
              <div className="w-8 shrink-0 mb-1" aria-hidden="true" />
            )
          )}

          {/* Message Bubble + Action dots container */}
          <div
            className={`flex items-center gap-1.5 min-w-0 max-w-4/5 ${
              isMe ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className={`flex flex-col min-w-0 select-text relative ${
                isMe ? "items-end" : "items-start"
              }`}
            >
              {/* Header: Sender Name + Timestamp (only show for other users on FIRST message of consecutive sequence, or if pinned/error/sending) */}
              {((!isSameSenderAsPrev && !isMe) ||
                pinnedMessage?.id === msg.id ||
                msg.isSending ||
                msg.error) && (
                <div className="flex items-baseline gap-2 mb-1">
                  {!isSameSenderAsPrev && !isMe && (
                    <span className="text-xs font-semibold text-zinc-300">
                      {msg.userName}
                    </span>
                  )}
                  {pinnedMessage?.id === msg.id && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1ed760] select-none">
                      <Pin className="w-2.5 h-2.5 fill-[#1ed760]" />
                      <span>
                        {pinnedByName
                          ? `ปักหมุดโดย ${pinnedByName === currentUserName ? "คุณ" : pinnedByName}`
                          : "ปักหมุดแล้ว"}
                      </span>
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">
                    {msg.isSending ? (
                      <span className="inline-flex items-center gap-1 text-[#1ed760] font-medium">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>กำลังส่ง...</span>
                      </span>
                    ) : msg.error ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                        <span>ส่งไม่สำเร็จ</span>
                      </span>
                    ) : (
                      !isSameSenderAsPrev && !isMe && formatChatTime(msg.createdAt)
                    )}
                  </span>
                </div>
              )}

              {/* Messenger-style Reply Header & Quoted Pill */}
              {msg.replyTo && (
                <div
                  className={`flex flex-col mb-1 select-none max-w-full ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-0.5 px-1">
                    <span>
                      {isMe
                        ? `คุณตอบกลับ${msg.replyTo.userName === currentUserName ? "ตัวเอง" : ` ${msg.replyTo.userName}`}`
                        : `${msg.userName} ตอบกลับ${msg.replyTo.userName === currentUserName ? "คุณ" : ` ${msg.replyTo.userName}`}`}
                    </span>
                    <CornerUpLeft className="w-3 h-3 text-zinc-400" />
                  </div>

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (msg.replyTo?.id) onScrollToMessage(msg.replyTo.id);
                    }}
                    className="bg-[#242424] hover:bg-[#2c2c2c] border border-[#383838] rounded-2xl px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer flex items-center gap-2 max-w-xs sm:max-w-sm shadow-sm"
                    title="คลิกเพื่อไปยังข้อความต้นทาง"
                  >
                    {msg.replyTo.imageUrl &&
                      (isPdfUrl(msg.replyTo.imageUrl) ? (
                        <div className="w-6 h-6 rounded-md bg-[#181818] border border-[#383838] flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-zinc-300" />
                        </div>
                      ) : (
                        <img
                          src={msg.replyTo.imageUrl}
                          alt="พรีวิว"
                          className="w-6 h-6 rounded-md object-cover border border-[#383838] shrink-0 bg-[#181818]"
                        />
                      ))}
                    <span className="truncate">
                      {msg.replyTo.text ||
                        (isPdfUrl(msg.replyTo.imageUrl)
                          ? "เอกสาร PDF"
                          : "รูปภาพ")}
                    </span>
                  </div>
                </div>
              )}

              {/* Message Bubble or Edit Box */}
              {isEditing ? (
                <div
                  key={`edit-${msg.id}`}
                  className="bg-[#181818] border border-[#383838] rounded-2xl p-3 shadow-2xl min-w-60 sm:min-w-72.5 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#b3b3b3]">
                    <span className="font-semibold text-white">
                      แก้ไขข้อความ
                    </span>
                  </div>
                  <textarea
                    autoFocus
                    rows={6}
                    value={editText}
                    onChange={(e) => onEditTextChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        if (e.nativeEvent.isComposing) return;
                        e.preventDefault();
                        onSaveEdit(msg.id);
                      }
                      if (e.key === "Escape") onCancelEdit();
                    }}
                    className="w-full bg-[#242424] text-white placeholder:text-[#6a6a6a] border border-[#383838] focus:border-[#555555] focus:outline-none focus:ring-0 rounded-xl px-3 py-2 text-xs sm:text-sm resize-none max-h-32 leading-relaxed"
                    placeholder="พิมพ์ข้อความใหม่..."
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-0.5 mt-2">
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="px-3 py-1 rounded-full text-xs font-semibold text-[#b3b3b3] hover:text-white hover:bg-[#282828] transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={!editText.trim()}
                      onClick={() => onSaveEdit(msg.id)}
                      className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#1ed760] hover:bg-[#1cd05a] disabled:bg-[#282828] disabled:text-[#6a6a6a] text-black transition cursor-pointer shadow-md flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-3" />
                      <span>บันทึก</span>
                    </button>
                  </div>
                </div>
              ) : msg.imageUrl ? (
                /* Image or PDF Message */
                <div key={`media-${msg.id}`} className="space-y-1.5">
                  {msg.text && !isPdfUrl(msg.imageUrl) && (
                    (() => {
                      const firstUrl = extractFirstUrl(msg.text);
                      if (firstUrl) {
                        return (
                          <div
                            className={`rounded-2xl overflow-hidden shadow-sm max-w-xs sm:max-w-sm w-full bg-[#242424] border border-[#333333] ${msg.isSending ? "opacity-75" : ""}`}
                          >
                            <div
                              className={`p-3 text-[13px] sm:text-sm leading-relaxed ${
                                isMe
                                  ? "bg-[#1ed760] text-black font-medium"
                                  : "bg-[#242424] text-zinc-100"
                              }`}
                            >
                              <p className="whitespace-pre-wrap wrap-break-word">
                                {renderMessageContent(msg.text, isMe)}
                              </p>
                            </div>
                            <LinkPreviewCard
                              url={firstUrl}
                              isMe={isMe}
                              isAttached
                            />
                          </div>
                        );
                      }
                      return (
                        <div
                          className={`rounded-2xl text-[13px] sm:text-sm leading-relaxed p-3 ${
                            isMe
                              ? "bg-[#1ed760] text-black font-medium shadow-sm"
                              : "bg-[#242424] text-zinc-100 border border-[#333333]"
                          } ${msg.isSending ? "opacity-75" : ""}`}
                        >
                          <p className="whitespace-pre-wrap wrap-break-word">
                            {renderMessageContent(msg.text, isMe)}
                          </p>
                        </div>
                      );
                    })()
                  )}

                  {isPdfUrl(msg.imageUrl) ? (
                    <a
                      href={msg.isSending ? undefined : msg.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-2xl bg-[#1f1f1f] border border-[#333333] hover:border-[#4d4d4d] transition-all group text-left min-w-55 max-w-sm shadow-md ${
                        msg.isSending
                          ? "opacity-75 pointer-events-none"
                          : "hover:bg-[#282828]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#282828] border border-[#383838] flex items-center justify-center shrink-0 group-hover:border-[#4d4d4d] transition-colors">
                        <FileText className="w-5 h-5 text-zinc-200 group-hover:text-white transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#1ed760] transition-colors"
                          title={getPdfFileName(msg)}
                        >
                          {getPdfFileName(msg)}
                        </p>
                        <p className="text-[11px] text-[#b3b3b3]">PDF</p>
                      </div>
                    </a>
                  ) : (
                    <div
                      onClick={() => {
                        if (!msg.isSending && msg.imageUrl) {
                          onLightboxClick(msg.imageUrl);
                        }
                      }}
                      className={`rounded-2xl overflow-hidden border border-zinc-800 shadow-md relative inline-block max-w-full ${
                        msg.isSending
                          ? "cursor-default opacity-75"
                          : "cursor-pointer group/img"
                      }`}
                    >
                      <img
                        src={msg.imageUrl}
                        alt="รูปภาพที่แนบ"
                        className="w-full max-h-72 object-contain transition-transform duration-200 block rounded-2xl"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center pointer-events-none rounded-2xl" />
                    </div>
                  )}
                </div>
              ) : (
                /* Text Only Message */
                (() => {
                  const firstUrl = extractFirstUrl(msg.text);

                  if (firstUrl) {
                    return (
                      <div
                        key={`bubble-unified-${msg.id}`}
                        className={`rounded-2xl overflow-hidden shadow-sm max-w-xs sm:max-w-sm w-full bg-[#242424] border border-[#333333] ${msg.isSending ? "opacity-75" : ""}`}
                      >
                        <div
                          className={`p-3 text-[13px] sm:text-sm leading-relaxed ${
                            isMe
                              ? "bg-[#1ed760] text-black font-medium"
                              : "bg-[#242424] text-zinc-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap wrap-break-word">
                            {renderMessageContent(msg.text || "", isMe)}
                          </p>
                        </div>
                        <LinkPreviewCard
                          url={firstUrl}
                          isMe={isMe}
                          isAttached
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`bubble-text-${msg.id}`}
                      className={`rounded-2xl text-[13px] sm:text-sm leading-relaxed p-3 ${
                        isMe
                          ? "bg-[#1ed760] text-black font-medium shadow-sm"
                          : "bg-[#242424] text-zinc-100 border border-[#333333]"
                      } ${msg.isSending ? "opacity-75" : ""}`}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word">
                        {renderMessageContent(msg.text || "", isMe)}
                      </p>
                    </div>
                  );
                })()
              )}

              {/* Messenger / Instagram Style Floating Reaction Pill */}
              {msg.reactions &&
                Object.keys(msg.reactions).length > 0 &&
                (() => {
                  const activeReactions = Object.entries(msg.reactions).filter(
                    ([, users]) => Array.isArray(users) && users.length > 0,
                  );
                  if (activeReactions.length === 0) return null;

                  const totalCount = activeReactions.reduce(
                    (sum, [, users]) => sum + users.length,
                    0,
                  );
                  const hasReacted = currentUserId
                    ? activeReactions.some(([, users]) =>
                        users.includes(currentUserId),
                      )
                    : false;

                  return (
                    <div
                      className={`-mt-2.5 z-10 flex items-center ${
                        isMe ? "mr-1.5 justify-end" : "ml-1.5 justify-start"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReactionsModal(msg.id, msg.reactions || {});
                        }}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full  shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer select-none ${
                          hasReacted
                            ? "bg-[#242b24] text-[#1ed760]"
                            : "bg-[#181818] hover:border-[#555555] text-zinc-300"
                        }`}
                        title="คลิกเพื่อดูว่าใครแสดงความรู้สึก"
                      >
                        <div className="flex items-center -space-x-0.5 text-xs leading-none">
                          {activeReactions.slice(0, 3).map(([emoji]) => (
                            <span key={emoji} className="inline-block">
                              {emoji}
                            </span>
                          ))}
                        </div>
                        {totalCount > 1 && (
                          <span className="text-[10px] font-bold text-zinc-300 pr-0.5 leading-none">
                            {totalCount}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })()}

              {/* Read Receipts (LINE/Messenger style - only show on own messages when others read) */}
              {isMe &&
                (() => {
                  const readers = Object.entries(readReceipts || {})
                    .filter(
                      ([uId, r]) =>
                        uId !== currentUserId &&
                        r.name !== currentUserName &&
                        uId !== msg.userId &&
                        r.name !== msg.userName &&
                        r.messageId === msg.id,
                    )
                    .map(([uId, r]) => ({
                      userId: uId,
                      name: r.name,
                      avatarUrl: r.avatarUrl,
                    }));

                  if (readers.length > 0) {
                    return (
                      <div
                        className="flex items-center gap-1 mt-1 select-none justify-end"
                        title={
                          readers.length === 1
                            ? `อ่านแล้วโดย ${readers[0].name}`
                            : `อ่านแล้วโดย ${readers.map((r) => r.name).join(", ")}`
                        }
                      >
                        <div className="flex items-center -space-x-1 pr-0.5">
                          {readers.map((r) => (
                            <Avatar
                              key={r.userId}
                              src={r.avatarUrl}
                              name={r.name}
                              size="xxs"
                              className="border border-zinc-900 ring-1 ring-zinc-700/60 shadow-xs"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // If no one has read yet, and this is the latest message sent by me
                  if (isLastMyMessage && !msg.isSending && !msg.error) {
                    return <SentTimeIndicator createdAt={msg.createdAt} />;
                  }

                  return null;
                })()}

              {/* Quick Reaction Picker Popover (Anchored to Message Bubble) */}
              {activeReactionPickerId === msg.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute z-50 flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-[#181818] border border-[#383838] rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-100 max-w-[calc(100vw-32px)] select-none pointer-events-auto ${
                    openUpwards ? "bottom-full mb-2" : "top-full mt-2"
                  } ${isMe ? "right-0" : "left-0"}`}
                >
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onToggleReaction?.(msg.id, emoji);
                        setActiveReactionPickerId(null);
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-base sm:text-lg hover:scale-125 transition-transform cursor-pointer rounded-full hover:bg-[#282828] shrink-0"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons (Hover action pill) */}
            {!isReadOnly && !isEditing && !msg.isSending && !msg.error && (
              <div
                data-chat-actions
                className={`relative self-center shrink-0 flex items-center transition-all ${
                  isActionActive
                    ? "opacity-100 z-40"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {/* Action Pill Container */}
                <div className="flex items-center bg-[#181818] border border-[#383838] rounded-lg shadow-lg p-0.5 gap-0.5">
                  {/* Quick Reaction Smile button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setOpenUpwards(rect.top > 160);
                      setOpenToLeft(
                        rect.left < 170
                          ? false
                          : rect.right >
                              (typeof window !== "undefined"
                                ? window.innerWidth - 170
                                : 300)
                          ? true
                          : isMe,
                      );
                      setActiveReactionPickerId((prev) =>
                        prev === msg.id ? null : msg.id,
                      );
                      setActiveMenuId(null);
                    }}
                    className={`p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer ${
                      activeReactionPickerId === msg.id
                        ? "text-[#1ed760] bg-zinc-800"
                        : ""
                    }`}
                    title="แสดงความรู้สึก"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>

                  {/* Reply button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReply({
                        id: msg.id,
                        userName: msg.userName,
                        text: msg.text
                          ? stripEmojis(msg.text).slice(0, 80)
                          : undefined,
                        imageUrl: msg.imageUrl,
                      });
                    }}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                    title="ตอบกลับ"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* More Options button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setOpenUpwards(rect.top > 230);
                      setOpenToLeft(
                        rect.left < 170
                          ? false
                          : rect.right >
                              (typeof window !== "undefined"
                                ? window.innerWidth - 170
                                : 300)
                          ? true
                          : isMe,
                      );
                      setActiveMenuId((prev) =>
                        prev === msg.id ? null : msg.id,
                      );
                      setActiveReactionPickerId(null);
                    }}
                    className={`p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer ${
                      activeMenuId === msg.id
                        ? "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700"
                        : ""
                    }`}
                    title="เพิ่มเติม"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Dropdown Menu (Instagram Direct Style) */}
                {activeMenuId === msg.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute z-50 min-w-40 sm:min-w-44 bg-[#262626] border border-[#383838] rounded-2xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${
                      openUpwards ? "bottom-full mb-1.5" : "top-full mt-1.5"
                    } ${openToLeft ? "right-0" : "left-0"}`}
                  >
                    {/* Timestamp Header at top */}
                    <div className="px-3 pt-1.5 pb-2 text-xs font-semibold text-zinc-400 border-b border-zinc-700/50 select-none">
                      {formatChatTime(msg.createdAt)}
                    </div>

                    <div className="pt-1 space-y-0.5">
                      {/* Pin / Unpin option */}
                      {onPinMessage && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            const isPinned = pinnedMessage?.id === msg.id;
                            onPinMessage(isPinned ? null : msg.id);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium text-white hover:bg-[#333333] rounded-xl transition text-left cursor-pointer"
                        >
                          <span>
                            {pinnedMessage?.id === msg.id
                              ? "เลิกปักหมุด"
                              : "ปักหมุด"}
                          </span>
                          {pinnedMessage?.id === msg.id ? (
                            <PinOff className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Pin className="w-4 h-4 text-[#1ed760]" />
                          )}
                        </button>
                      )}

                      {/* Copy option (Text only - no copy for images/files) */}
                      {!msg.imageUrl && msg.text && (
                        <button
                          type="button"
                          onClick={() => onCopyMessage(msg)}
                          className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium text-white hover:bg-[#333333] rounded-xl transition text-left cursor-pointer"
                        >
                          <span>คัดลอก</span>
                          <Copy className="w-4 h-4 text-zinc-400" />
                        </button>
                      )}

                      {/* Download file/image option */}
                      {msg.imageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            const filename = isPdfUrl(msg.imageUrl)
                              ? getPdfFileName(msg)
                              : `image_${msg.id.slice(0, 8)}.png`;
                            onDownloadFile(msg.imageUrl!, filename);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium text-white hover:bg-[#333333] rounded-xl transition text-left cursor-pointer"
                        >
                          <span>ดาวน์โหลด</span>
                          <Download className="w-4 h-4 text-zinc-400" />
                        </button>
                      )}

                      {/* Edit option (Only for isMe) */}
                      {isMe && msg.text && !msg.imageUrl && (
                        <button
                          type="button"
                          onClick={() => onStartEdit(msg)}
                          className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium text-white hover:bg-[#333333] rounded-xl transition text-left cursor-pointer"
                        >
                          <span>แก้ไข</span>
                          <Pencil className="w-4 h-4 text-zinc-400" />
                        </button>
                      )}

                      {/* Delete option (Only for isMe) */}
                      {isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onDeleteClick({
                              id: msg.id,
                              text: msg.text || undefined,
                              isImage:
                                !!msg.imageUrl && !isPdfUrl(msg.imageUrl),
                              isPdf: !!msg.imageUrl && isPdfUrl(msg.imageUrl),
                            });
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium text-rose-400 hover:bg-rose-500/15 rounded-xl transition text-left cursor-pointer"
                        >
                          <span>ลบ</span>
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};
