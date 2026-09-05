/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Message, ReplyToMessage, RoomMemberItem, TypingUser } from "@/types";
import {
  Loader2,
  ChevronDown,
  Pin,
  // X,
  Maximize2,
  Minimize2,
  Images,
  FileText,
} from "lucide-react";
import { ConfirmActionModal, ImageLightboxModal } from "@/components/modals";
import { Avatar } from "@/components/common";
import { toast } from "react-hot-toast";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputBar } from "./ChatInputBar";
import { ChatMediaGalleryModal } from "./ChatMediaGalleryModal";
import { ChatReactionsModal } from "./ChatReactionsModal";
import {
  isPdfUrl,
  stripEmojis,
  handleDownloadFile,
  isPdfFile,
} from "./chatUtils";

export interface LiveChatProps {
  messages: Message[];
  currentUserName: string;
  currentUserAvatar?: string | null;
  currentUserId?: string;
  pinnedMessage?: Message | null;
  roomMembers?: RoomMemberItem[];
  typingUsers?: TypingUser[];
  readReceipts?: Record<
    string,
    { messageId: string; name: string; avatarUrl?: string | null }
  >;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onMarkRead?: (messageId: string) => void;
  onPinMessage?: (messageId: string | null) => Promise<void> | void;
  onToggleReaction?: (messageId: string, emoji: string) => Promise<void> | void;
  onSendMessage: (
    text: string,
    imageUrl?: string,
    isShoutout?: boolean,
    replyTo?: ReplyToMessage | null,
  ) => Promise<void> | void;
  onEditMessage?: (messageId: string, newText: string) => Promise<void> | void;
  onDeleteMessage?: (messageId: string) => Promise<void> | void;
  isReadOnly?: boolean;
  hasMoreMessages?: boolean;
  onLoadMoreMessages?: () => Promise<void>;
  isLoadingMore?: boolean;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  currentUserName,
  currentUserAvatar,
  currentUserId,
  pinnedMessage,
  roomMembers,
  typingUsers = [],
  readReceipts = {},
  onTypingStart,
  onTypingStop,
  onMarkRead,
  onPinMessage,
  onToggleReaction,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  isReadOnly = false,
  hasMoreMessages = false,
  onLoadMoreMessages,
  isLoadingMore = false,
}) => {
  // Chat input and file attachments
  const [inputText, setInputText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<
    { dataUrl: string; name: string }[]
  >([]);
  const [replyingTo, setReplyingTo] = useState<ReplyToMessage | null>(null);

  // Scroll & unread state
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  // Fullscreen & media gallery modal
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);

  // Message action states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<
    string | null
  >(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Modals state
  const [reactionsModal, setReactionsModal] = useState<{
    messageId: string;
    reactions: Record<string, string[]>;
  } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<{
    id: string;
    text?: string;
    isImage?: boolean;
    isPdf?: boolean;
  } | null>(null);

  // Refs
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevLastMsgIdRef = useRef<string | undefined>(undefined);
  const prevFirstMsgIdRef = useRef<string | undefined>(undefined);
  const isPrependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);

  // Focus input on mount without scrolling outer page
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Filter active typing users (excluding current user)
  const activeTypingUsers = useMemo(() => {
    return (typingUsers || []).filter((u) => u.userId !== currentUserId);
  }, [typingUsers, currentUserId]);

  // Filter photos and files for Media Gallery
  const roomPhotos = useMemo(() => {
    return messages.filter((m) => m.imageUrl && !isPdfUrl(m.imageUrl));
  }, [messages]);

  const roomFiles = useMemo(() => {
    return messages.filter((m) => m.imageUrl && isPdfUrl(m.imageUrl));
  }, [messages]);

  // Lightbox slides and index from room photos
  const lightboxSlides = useMemo(() => {
    if (!lightboxUrl) return [];
    const isRoomPhoto = roomPhotos.some((p) => p.imageUrl === lightboxUrl);
    if (isRoomPhoto && roomPhotos.length > 0) {
      return roomPhotos.map((p) => ({
        url: p.imageUrl!,
        type: "seating" as const,
      }));
    }
    return [{ url: lightboxUrl, type: "seating" as const }];
  }, [lightboxUrl, roomPhotos]);

  const lightboxIndex = useMemo(() => {
    if (!lightboxUrl) return 0;
    const idx = roomPhotos.findIndex((p) => p.imageUrl === lightboxUrl);
    return idx >= 0 ? idx : 0;
  }, [lightboxUrl, roomPhotos]);

  // Find who pinned the message from latest pin shoutout
  const pinnedByName = useMemo(() => {
    if (!pinnedMessage) return null;
    const pinShout = [...messages]
      .reverse()
      .find(
        (m) =>
          m.isShoutout &&
          m.text?.includes("ปักหมุดข้อความ") &&
          !m.text?.includes("เลิกปักหมุดข้อความ"),
      );
    if (!pinShout?.text) return null;
    const match = pinShout.text.match(/^(.+?)\s+ปักหมุดข้อความ$/);
    return match ? match[1] : null;
  }, [pinnedMessage, messages]);

  // Mark latest message from other members as read (never mark own messages)
  useEffect(() => {
    if (messages.length > 0 && onMarkRead) {
      const lastMsgFromOther = [...messages]
        .reverse()
        .find(
          (m) =>
            !m.isShoutout &&
            (currentUserId
              ? m.userId !== currentUserId
              : m.userName !== currentUserName),
        );
      if (lastMsgFromOther?.id) {
        onMarkRead(lastMsgFromOther.id);
      }
    }
  }, [messages, currentUserId, currentUserName, onMarkRead]);

  // Close active dropdown menu & reaction picker when clicking outside
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-chat-actions]")) return;
      setActiveMenuId(null);
      setActiveReactionPickerId(null);
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // Escape key listener for lightbox, modals, and fullscreen
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxUrl) {
          setLightboxUrl(null);
        } else if (reactionsModal) {
          setReactionsModal(null);
        } else if (isMediaGalleryOpen) {
          setIsMediaGalleryOpen(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl, reactionsModal, isMediaGalleryOpen, isFullscreen]);

  // Smart auto-scroll / unread tracker
  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return;

    if (messages.length === 0) {
      prevMessagesLengthRef.current = 0;
      prevLastMsgIdRef.current = undefined;
      prevFirstMsgIdRef.current = undefined;
      return;
    }

    const currentFirstMsgId = messages[0]?.id;
    const currentLastMsgId = messages[messages.length - 1]?.id;
    const isInitial = !prevLastMsgIdRef.current;

    const hasNewBottomMessages =
      !isInitial &&
      prevLastMsgIdRef.current !== undefined &&
      currentLastMsgId !== prevLastMsgIdRef.current &&
      messages.length > prevMessagesLengthRef.current;

    const isPrepended =
      !isInitial &&
      currentFirstMsgId !== prevFirstMsgIdRef.current &&
      currentLastMsgId === prevLastMsgIdRef.current;

    if (isPrepended || isPrependingRef.current) {
      if (prevScrollHeightRef.current > 0) {
        const heightDiff = el.scrollHeight - prevScrollHeightRef.current;
        el.scrollTop = heightDiff;
      }
      isPrependingRef.current = false;
      prevScrollHeightRef.current = 0;
    } else if (isInitial || isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setShowScrollBottom(false);
      setNewMessagesCount(0);
    } else if (hasNewBottomMessages) {
      const newMessages = messages.slice(prevMessagesLengthRef.current);
      const lastNewMsg = newMessages[newMessages.length - 1];
      const isLastFromMe = lastNewMsg
        ? currentUserId
          ? lastNewMsg.userId === currentUserId
          : lastNewMsg.userName === currentUserName
        : false;

      if (isLastFromMe) {
        el.scrollTop = el.scrollHeight;
        setShowScrollBottom(false);
        setNewMessagesCount(0);
        isAtBottomRef.current = true;
      } else {
        const incomingFromOthers = newMessages.filter((msg) => {
          return currentUserId
            ? msg.userId !== currentUserId
            : msg.userName !== currentUserName;
        });

        setShowScrollBottom(true);
        if (incomingFromOthers.length > 0) {
          setNewMessagesCount((prev) => prev + incomingFromOthers.length);
        }
      }
    }

    prevMessagesLengthRef.current = messages.length;
    prevFirstMsgIdRef.current = currentFirstMsgId;
    prevLastMsgIdRef.current = currentLastMsgId;
  }, [messages, currentUserId, currentUserName]);

  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
      setShowScrollBottom(false);
      setNewMessagesCount(0);
      isAtBottomRef.current = true;
    }
  };

  const scrollToMessage = (messageId: string) => {
    const el = chatBodyRef.current?.querySelector(
      `[data-message-id="${messageId}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      toast("ข้อความนี้อาจอยู่หน้าก่อนหน้า", { icon: "ℹ️" });
    }
  };

  const handleScroll = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
    isAtBottomRef.current = isBottom;

    if (isBottom) {
      setShowScrollBottom(false);
      setNewMessagesCount(0);
    } else {
      setShowScrollBottom(true);
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditText(msg.text || "");
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (msgId: string) => {
    const clean = stripEmojis(editText.trim());
    if (!clean) return;
    if (onEditMessage) {
      await onEditMessage(msgId, clean);
    }
    setEditingMessageId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDelete = async (msgId: string) => {
    setActiveMenuId(null);
    if (onDeleteMessage) {
      await onDeleteMessage(msgId);
    }
  };

  const handleCopyMessage = async (msg: Message) => {
    setActiveMenuId(null);
    const content = msg.text || "";
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      toast.success("คัดลอกข้อความแล้ว");
    } catch {
      toast.error("ไม่สามารถคัดลอกข้อความได้");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.some((f) => f.type.startsWith("image/") || isPdfFile(f))) {
      e.preventDefault();
      // Drop handled through file reading
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#121212] flex flex-col h-screen w-screen overflow-hidden shadow-2xl"
          : "relative bg-zinc-900/70 border border-zinc-800/80 rounded-xl flex flex-col h-full min-h-0 overflow-hidden shadow-sm"
      }
    >
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/90 shrink-0">
        <div className="flex items-center gap-2">
          {/* <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760]" /> */}
          <h3 className="font-bold text-zinc-100 text-sm sm:text-base">
            ข้อความในห้อง
          </h3>
        </div>

        {/* Right header actions: Media Gallery + Fullscreen Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMediaGalleryOpen(true)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs"
            title="ดูรูปและไฟล์ทั้งหมดในห้อง (สไตล์ Facebook)"
          >
            <Images className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">
              ไฟล์สื่อ
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition cursor-pointer"
            title={isFullscreen ? "ย่อหน้าต่างกลับ" : "เปิดแชทเต็มหน้าจอ"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-[#1ed760]" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          onClick={() => scrollToMessage(pinnedMessage.id)}
          className="px-3.5 py-2 bg-[#181818] border-b border-[#282828] flex items-center justify-between gap-2.5 cursor-pointer hover:bg-[#202020] transition-colors shrink-0 select-none group"
          title="คลิกเพื่อไปยังข้อความที่ปักหมุด"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
              <Pin className="w-3.5 h-3.5 text-[#1ed760]" />
            </div>

            {pinnedMessage.imageUrl &&
              (isPdfUrl(pinnedMessage.imageUrl) ? (
                <div className="w-8 h-8 rounded bg-[#242424] border border-[#383838] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-zinc-300" />
                </div>
              ) : (
                <img
                  src={pinnedMessage.imageUrl}
                  alt="ปักหมุด"
                  className="w-8 h-8 rounded object-cover border border-[#383838] shrink-0 bg-[#242424]"
                />
              ))}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white leading-none mb-1">
                {pinnedByName
                  ? `ปักหมุดโดย ${pinnedByName === currentUserName ? "คุณ" : pinnedByName}`
                  : "ข้อความปักหมุด"}
              </p>
              <p className="text-xs text-zinc-300 truncate">
                {pinnedMessage.text ||
                  (isPdfUrl(pinnedMessage.imageUrl) ? "เอกสาร PDF" : "รูปภาพ")}
              </p>
            </div>
          </div>

          {/* {onPinMessage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPinMessage(null);
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0 cursor-pointer"
              title="เลิกปักหมุด"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )} */}
        </div>
      )}

      {/* Messages Stream */}
      <div
        ref={chatBodyRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-3 min-h-0"
      >
        {/* Load More Top Indicator */}
        {isLoadingMore ? (
          <div className="flex items-center justify-center py-2 select-none">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1e1e]/90 border border-zinc-700/50 text-[11px] font-medium text-zinc-400 shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin text-[#1ed760]" />
              <span>กำลังโหลดข้อความก่อนหน้า...</span>
            </div>
          </div>
        ) : hasMoreMessages ? (
          <div className="flex justify-center my-1 select-none">
            <button
              type="button"
              onClick={() => {
                const el = chatBodyRef.current;
                if (el && onLoadMoreMessages) {
                  prevScrollHeightRef.current = el.scrollHeight;
                  isPrependingRef.current = true;
                  onLoadMoreMessages();
                }
              }}
              className="text-[11px] text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 px-3 py-1 rounded-full transition cursor-pointer"
            >
              โหลดข้อความก่อนหน้า
            </button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-zinc-500">
              ยังไม่มีข้อความ เริ่มต้นพูดคุยกันในห้องได้เลย
            </p>
          </div>
        ) : (
          (() => {
            const lastMessage =
              messages.length > 0 ? messages[messages.length - 1] : undefined;
            const isLastMessageMine = Boolean(
              lastMessage &&
              !lastMessage.isShoutout &&
              (currentUserId
                ? lastMessage.userId === currentUserId
                : lastMessage.userName === currentUserName),
            );
            const lastMyMessageId = isLastMessageMine ? lastMessage?.id : null;

            return messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : undefined;
              const nextMsg =
                index < messages.length - 1 ? messages[index + 1] : undefined;
              return (
                <ChatMessageItem
                  key={msg.id}
                  msg={msg}
                  prevMsg={prevMsg}
                  nextMsg={nextMsg}
                  isLastMyMessage={msg.id === lastMyMessageId}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                  pinnedMessage={pinnedMessage}
                  pinnedByName={pinnedByName}
                  isReadOnly={isReadOnly}
                  isEditing={editingMessageId === msg.id}
                  editText={editText}
                  onEditTextChange={setEditText}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onStartEdit={handleStartEdit}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  activeReactionPickerId={activeReactionPickerId}
                  setActiveReactionPickerId={setActiveReactionPickerId}
                  onToggleReaction={onToggleReaction}
                  onOpenReactionsModal={(mId, reactions) =>
                    setReactionsModal({ messageId: mId, reactions })
                  }
                  onReply={setReplyingTo}
                  onPinMessage={onPinMessage}
                  onDeleteClick={setMessageToDelete}
                  onLightboxClick={setLightboxUrl}
                  onCopyMessage={handleCopyMessage}
                  onDownloadFile={handleDownloadFile}
                  onScrollToMessage={scrollToMessage}
                  readReceipts={readReceipts}
                />
              );
            });
          })()
        )}

        {/* Real-time Typing Indicator ("กำลังพิมพ์...") */}
        {activeTypingUsers.length > 0 && (
          <div className="flex items-center gap-2 py-1 px-1 select-none animate-in fade-in duration-150">
            <div className="flex -space-x-1.5 overflow-hidden">
              {activeTypingUsers.slice(0, 3).map((u) => (
                <Avatar
                  key={u.userId}
                  src={u.avatarUrl}
                  name={u.name}
                  size="xs"
                />
              ))}
            </div>
            <div className="bg-[#242424] border border-[#333333] rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
              <span className="text-xs text-zinc-300">
                {activeTypingUsers.length === 1
                  ? `${activeTypingUsers[0].name} กำลังพิมพ์`
                  : `${activeTypingUsers
                      .map((u) => u.name)
                      .slice(0, 2)
                      .join(
                        ", ",
                      )}${activeTypingUsers.length > 2 ? ` และอีก ${activeTypingUsers.length - 2} คน` : ""} กำลังพิมพ์`}
              </span>
              <span className="flex items-center gap-0.5 ml-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-bounce" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to Bottom / New Message Floating Pill */}
      {showScrollBottom && (
        <div className="absolute bottom-16 inset-x-0 flex justify-center pointer-events-none z-20">
          <button
            type="button"
            onClick={scrollToBottom}
            className={`pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl animate-in fade-in slide-in-from-bottom-2 cursor-pointer ${
              newMessagesCount > 0
                ? "bg-[#1ed760] hover:bg-[#1cd05a] text-black"
                : "bg-[#242424] hover:bg-[#303030] text-white border border-[#383838]"
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5] " />
            <span>
              {newMessagesCount > 0
                ? `ข้อความใหม่ (${newMessagesCount})`
                : "ล่าสุด"}
            </span>
          </button>
        </div>
      )}

      {/* Input bar and pending attachments */}
      <ChatInputBar
        isReadOnly={isReadOnly}
        inputText={inputText}
        setInputText={setInputText}
        pendingFiles={pendingFiles}
        setPendingFiles={setPendingFiles}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        onScrollToBottom={scrollToBottom}
        inputRef={inputRef}
      />

      {/* Confirm Delete Message / Image Modal */}
      <ConfirmActionModal
        isOpen={!!messageToDelete}
        type="DELETE_MESSAGE"
        itemTitle={
          messageToDelete?.isPdf
            ? "เอกสาร PDF"
            : messageToDelete?.isImage
              ? "รูปภาพ"
              : messageToDelete?.text
                ? messageToDelete.text.slice(0, 35)
                : "ข้อความนี้"
        }
        onClose={() => setMessageToDelete(null)}
        onConfirm={() => {
          if (messageToDelete) {
            const id = messageToDelete.id;
            setMessageToDelete(null);
            handleDelete(id);
          }
        }}
      />

      {/* Instagram-style Reactions Modal ("ความรู้สึก") */}
      <ChatReactionsModal
        isOpen={!!reactionsModal}
        messageId={reactionsModal?.messageId || ""}
        reactions={reactionsModal?.reactions || {}}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        roomMembers={roomMembers}
        messages={messages}
        onClose={() => setReactionsModal(null)}
        onToggleReaction={onToggleReaction}
      />

      {/* Facebook-style Media & Files Gallery Modal */}
      <ChatMediaGalleryModal
        isOpen={isMediaGalleryOpen}
        onClose={() => setIsMediaGalleryOpen(false)}
        roomPhotos={roomPhotos}
        roomFiles={roomFiles}
        onSelectPhoto={setLightboxUrl}
        onDownloadFile={handleDownloadFile}
        onScrollToMessage={scrollToMessage}
      />

      {/* Image Lightbox Modal (z-[70] rendered on top of gallery modal) */}
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        title="รูปภาพในห้อง"
        slides={lightboxSlides}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
};
