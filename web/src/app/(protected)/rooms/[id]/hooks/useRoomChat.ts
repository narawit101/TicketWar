"use client";

import { useState, useEffect, useCallback } from "react";
import { Message, ReplyToMessage, TypingUser } from "@/types";
import { getSocket } from "@/lib/socket";
import { playSoundAlert } from "@/lib/audio";
import { toast } from "react-hot-toast";

interface UseRoomChatParams {
  roomId: string;
  userId?: string;
  currentUserName: string;
  currentUserAvatar?: string;
}

export function useRoomChat({
  roomId,
  userId,
  currentUserName,
  currentUserAvatar,
}: UseRoomChatParams) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [readReceipts, setReadReceipts] = useState<
    Record<string, { messageId: string; name: string; avatarUrl?: string | null }>
  >({});

  // Socket event listeners for chat
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    const handleNewMessage = (incomingMsg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) return prev;
        const pendingIdx = prev.findIndex(
          (m) =>
            m.isSending &&
            m.userId === incomingMsg.userId &&
            m.text === incomingMsg.text,
        );
        if (pendingIdx !== -1) {
          const next = [...prev];
          next[pendingIdx] = incomingMsg;
          return next;
        }
        return [...prev, incomingMsg];
      });
      if (incomingMsg.isShoutout) {
        playSoundAlert("alert");
      }
    };

    const handleShoutout = () => {
      playSoundAlert("alert");
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      setPinnedMessage((prev) => (prev?.id === data.messageId ? null : prev));
    };

    const handleMessageUpdated = (updatedMsg: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)),
      );
    };

    const handleReactionUpdated = (data: {
      messageId: string;
      reactions: Record<string, string[]>;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m,
        ),
      );
      setPinnedMessage((prev) =>
        prev && prev.id === data.messageId
          ? { ...prev, reactions: data.reactions }
          : prev,
      );
    };

    const handlePinnedMessageUpdated = (data: {
      pinnedMessage: Message | null;
    }) => {
      setPinnedMessage(data.pinnedMessage);
      if (data.pinnedMessage) {
        toast("มีข้อความใหม่ถูกปักหมุด", { icon: "📌" });
      }
    };

    const handleUserTyping = (data: {
      user?: TypingUser;
      userId?: string;
      isTyping: boolean;
    }) => {
      const uId = data.user?.userId || data.userId;
      if (!uId || uId === userId) return;
      setTypingUsers((prev) => {
        if (data.isTyping && data.user) {
          if (prev.some((u) => u.userId === uId)) return prev;
          return [...prev, data.user];
        } else {
          return prev.filter((u) => u.userId !== uId);
        }
      });
    };

    const handleUserRead = (data: {
      userId: string;
      messageId: string;
      user?: { name: string; avatarUrl?: string | null };
    }) => {
      if (
        !data.userId ||
        data.userId === userId ||
        (data.user?.name && data.user.name === currentUserName)
      )
        return;
      setReadReceipts((prev) => ({
        ...prev,
        [data.userId]: {
          messageId: data.messageId,
          name: data.user?.name || "สมาชิก",
          avatarUrl: data.user?.avatarUrl,
        },
      }));
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_reaction_updated", handleReactionUpdated);
    socket.on("room_pinned_message_updated", handlePinnedMessageUpdated);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_read", handleUserRead);
    socket.on("shoutout_alert", handleShoutout);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_reaction_updated", handleReactionUpdated);
      socket.off("room_pinned_message_updated", handlePinnedMessageUpdated);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_read", handleUserRead);
      socket.off("shoutout_alert", handleShoutout);
    };
  }, [roomId, userId, currentUserName]);

  const handleAddChatMessage = useCallback(
    async (
      text: string,
      imageUrl?: string,
      isShoutout?: boolean,
      replyTo?: ReplyToMessage | null,
    ) => {
      if (!userId) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticMsg: Message = {
        id: tempId,
        roomId,
        userId,
        userName: currentUserName,
        userAvatar: currentUserAvatar,
        text,
        imageUrl,
        isShoutout,
        replyTo: replyTo || undefined,
        reactions: {},
        createdAt: new Date().toISOString(),
        isSending: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const res = await fetch(`/api/rooms/${roomId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            text,
            imageUrl,
            isShoutout,
            replyTo: replyTo || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok && data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? data.message : m)),
          );
          getSocket().emit("send_message", { roomId, message: data.message });
          if (isShoutout) {
            getSocket().emit("send_shoutout", {
              roomId,
              shoutout: { tag: "ALERT" },
            });
          }
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, isSending: false, error: true } : m,
            ),
          );
          toast.error(data.error || "ไม่สามารถส่งข้อความได้");
        }
      } catch (err) {
        console.error("Failed to save and send chat message:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, isSending: false, error: true } : m,
          ),
        );
        toast.error("ไม่สามารถส่งข้อความได้");
      }
    },
    [roomId, userId, currentUserName, currentUserAvatar],
  );

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return;
      let nextUpdatedReactions: Record<string, string[]> = {};
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const cur = { ...(m.reactions || {}) };
          const updated: Record<string, string[]> = {};
          let hadThisEmoji = false;

          for (const [e, users] of Object.entries(cur)) {
            if (!Array.isArray(users)) continue;
            if (e === emoji && users.includes(userId)) {
              hadThisEmoji = true;
            }
            const filtered = users.filter((u) => u !== userId);
            if (filtered.length > 0) {
              updated[e] = filtered;
            }
          }

          if (!hadThisEmoji) {
            updated[emoji] = [...(updated[emoji] || []), userId];
          }

          nextUpdatedReactions = updated;
          return { ...m, reactions: updated };
        }),
      );

      setPinnedMessage((prev) =>
        prev && prev.id === messageId
          ? { ...prev, reactions: nextUpdatedReactions }
          : prev,
      );

      try {
        const res = await fetch(
          `/api/rooms/${roomId}/messages/${messageId}/reactions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, emoji }),
          },
        );
        const data = await res.json();
        if (res.ok && data.reactions) {
          getSocket().emit("update_reaction", {
            roomId,
            messageId,
            reactions: data.reactions,
          });
        }
      } catch (err) {
        console.error("Failed to toggle reaction:", err);
      }
    },
    [roomId, userId],
  );

  const handlePinMessage = useCallback(
    async (messageId: string | null) => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/rooms/${roomId}/pin`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, messageId }),
        });
        const data = await res.json();
        if (res.ok) {
          setPinnedMessage(data.pinnedMessage || null);
          getSocket().emit("update_pin_message", {
            roomId,
            pinnedMessage: data.pinnedMessage || null,
          });

          const pinActionText = messageId
            ? `${currentUserName} ปักหมุดข้อความ`
            : `${currentUserName} เลิกปักหมุดข้อความ`;
          handleAddChatMessage(pinActionText, undefined, true);

          toast.success(
            messageId ? "ปักหมุดข้อความเรียบร้อยแล้ว" : "เลิกปักหมุดข้อความแล้ว",
          );
        } else {
          toast.error(data.error || "ไม่สามารถจัดการปักหมุดได้");
        }
      } catch (err) {
        console.error("Failed to pin message:", err);
        toast.error("เกิดข้อผิดพลาดในการปักหมุดข้อความ");
      }
    },
    [roomId, userId, currentUserName, handleAddChatMessage],
  );

  const handleEditChatMessage = useCallback(
    async (messageId: string, text: string) => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/rooms/${roomId}/messages`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            userId,
            text,
          }),
        });
        const data = await res.json();
        if (res.ok && data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, ...data.message } : m)),
          );
          getSocket().emit("edit_message", { roomId, message: data.message });
          toast.success("แก้ไขข้อความแล้ว");
        } else {
          toast.error(data.error || "ไม่สามารถแก้ไขข้อความได้");
        }
      } catch (err) {
        console.error("Failed to edit chat message:", err);
        toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อความ");
      }
    },
    [roomId, userId],
  );

  const handleDeleteChatMessage = useCallback(
    async (messageId: string) => {
      if (!userId) return;
      try {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        setPinnedMessage((prev) => (prev?.id === messageId ? null : prev));
        getSocket().emit("delete_message", { roomId, messageId });

        const res = await fetch(
          `/api/rooms/${roomId}/messages?messageId=${messageId}&userId=${userId}`,
          {
            method: "DELETE",
          },
        );
        if (res.ok) {
          toast.success("ลบเรียบร้อยแล้ว");
        }
      } catch (err) {
        console.error("Failed to delete chat message:", err);
        toast.error("เกิดข้อผิดพลาดในการลบข้อความ");
      }
    },
    [roomId, userId],
  );

  const handleTypingStart = useCallback(() => {
    if (!userId) return;
    getSocket().emit("typing_start", {
      roomId,
      user: { userId, name: currentUserName, avatarUrl: currentUserAvatar },
    });
  }, [roomId, userId, currentUserName, currentUserAvatar]);

  const handleTypingStop = useCallback(() => {
    if (!userId) return;
    getSocket().emit("typing_stop", { roomId, userId });
  }, [roomId, userId]);

  const handleMarkRead = useCallback(
    (messageId: string) => {
      if (!userId || !messageId) return;
      getSocket().emit("mark_read", {
        roomId,
        userId,
        messageId,
        user: { name: currentUserName, avatarUrl: currentUserAvatar },
      });

      // Persist lastReadAt in DB so dashboard and room lists reflect read status accurately
      fetch(`/api/rooms/${roomId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch((err) => console.error("Failed to mark room as read in db:", err));
    },
    [roomId, userId, currentUserName, currentUserAvatar],
  );

  const handleLoadMoreMessages = useCallback(async () => {
    if (isLoadingMoreMessages || !hasMoreMessages || messages.length === 0)
      return;
    const oldestMsg = messages[0];
    if (!oldestMsg) return;

    try {
      setIsLoadingMoreMessages(true);
      const res = await fetch(
        `/api/rooms/${roomId}/messages?cursor=${oldestMsg.id}&limit=50`,
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOldMsgs = data.messages.filter(
            (m: Message) => !existingIds.has(m.id),
          );
          return [...newOldMsgs, ...prev];
        });
        setHasMoreMessages(Boolean(data.hasMore));
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [isLoadingMoreMessages, hasMoreMessages, messages, roomId]);

  return {
    messages,
    setMessages,
    pinnedMessage,
    setPinnedMessage,
    hasMoreMessages,
    setHasMoreMessages,
    isLoadingMoreMessages,
    typingUsers,
    readReceipts,
    handleAddChatMessage,
    handleToggleReaction,
    handlePinMessage,
    handleEditChatMessage,
    handleDeleteChatMessage,
    handleTypingStart,
    handleTypingStop,
    handleMarkRead,
    handleLoadMoreMessages,
  };
}
