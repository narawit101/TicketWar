"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SeatTask,
  SeatStatus,
  PendingPaymentRecord,
  TaskAssignee,
  SecuredByRecord,
} from "@/types";
import { getSocket } from "@/lib/socket";
import { playSoundAlert } from "@/lib/audio";
import { toast } from "react-hot-toast";

interface UseRoomTasksParams {
  roomId: string;
  userId?: string;
  currentUserName: string;
  onAddChatMessage?: (
    text: string,
    imageUrl?: string,
    isShoutout?: boolean,
  ) => void;
}

export function useRoomTasks({
  roomId,
  userId,
  currentUserName,
  onAddChatMessage,
}: UseRoomTasksParams) {
  const [tasks, setTasks] = useState<SeatTask[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    location: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Socket event listeners for tasks
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    const handleSeatStatusUpdated = (data: {
      taskId: string;
      status: SeatStatus;
      quantitySecured?: number;
      securedBy?: Array<{
        userId: string;
        name: string;
        qty: number;
        at: string;
        zoneName?: string;
      }>;
      pendingPayments?: PendingPaymentRecord[];
      backupLocation?: string | null;
      backupPrice?: number | null;
      note?: string;
      targetLocation?: string;
      targetDate?: string;
      price?: number;
      quantityNeeded?: number;
      task?: SeatTask;
      assignee?: TaskAssignee | null;
      assignees?: TaskAssignee[];
      updatedBy?: string;
      updatedAt?: string;
    }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === data.taskId
            ? {
                ...t,
                ...(data.task || {}),
                status: data.status,
                quantitySecured:
                  data.quantitySecured !== undefined
                    ? data.quantitySecured
                    : t.quantitySecured,
                securedBy:
                  data.securedBy !== undefined ? data.securedBy : t.securedBy,
                assignees:
                  data.assignees !== undefined
                    ? data.assignees
                    : data.securedBy !== undefined
                      ? (data.securedBy as unknown as SecuredByRecord[])
                          .filter((s) => Boolean(s.isAssignee))
                          .map((s) => ({
                            userId: s.userId,
                            name: s.name,
                          }))
                      : t.assignees,
                assignee:
                  data.assignee !== undefined
                    ? data.assignee
                    : data.assignees && data.assignees.length > 0
                      ? data.assignees[0]
                      : (() => {
                          const firstAssignee = (
                            data.securedBy as unknown as SecuredByRecord[]
                          )?.find((s) => Boolean(s.isAssignee));
                          return firstAssignee
                            ? {
                                userId: firstAssignee.userId,
                                name: firstAssignee.name,
                              }
                            : t.assignee;
                        })(),
                note:
                  data.note !== undefined
                    ? data.note
                    : data.task?.note !== undefined
                      ? data.task.note
                      : t.note,
                targetLocation:
                  data.targetLocation ||
                  data.task?.targetLocation ||
                  t.targetLocation,
                targetDate:
                  data.targetDate || data.task?.targetDate || t.targetDate,
                price:
                  data.price !== undefined
                    ? data.price
                    : data.task?.price !== undefined
                      ? data.task.price
                      : t.price,
                quantityNeeded:
                  data.quantityNeeded !== undefined
                    ? data.quantityNeeded
                    : data.task?.quantityNeeded !== undefined
                      ? data.task.quantityNeeded
                      : t.quantityNeeded,
                pendingPayments:
                  data.pendingPayments !== undefined
                    ? data.pendingPayments
                    : data.task?.pendingPayments !== undefined
                      ? data.task.pendingPayments
                      : t.pendingPayments,
                backupLocation:
                  data.backupLocation !== undefined
                    ? data.backupLocation
                    : data.task?.backupLocation !== undefined
                      ? data.task.backupLocation
                      : t.backupLocation,
                backupPrice:
                  data.backupPrice !== undefined
                    ? data.backupPrice
                    : data.task?.backupPrice !== undefined
                      ? data.task.backupPrice
                      : t.backupPrice,
                lastUpdatedBy: data.updatedBy || t.lastUpdatedBy,
                lastUpdatedAt: data.updatedAt || "เมื่อสักครู่",
              }
            : t,
        ),
      );
    };

    const handleTaskCreated = (newTask: SeatTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
      toast(`มีที่นั่งใหม่: ${newTask.targetLocation}`, { icon: "🎯" });
    };

    const handleTaskDeleted = (deletedTaskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== deletedTaskId));
    };

    socket.on("seat_status_updated", handleSeatStatusUpdated);
    socket.on("task_created", handleTaskCreated);
    socket.on("task_deleted", handleTaskDeleted);

    return () => {
      socket.off("seat_status_updated", handleSeatStatusUpdated);
      socket.off("task_created", handleTaskCreated);
      socket.off("task_deleted", handleTaskDeleted);
    };
  }, [roomId]);

  const handleStartPendingPayment = useCallback(
    async (
      taskId: string,
      zoneType: "MAIN" | "BACKUP",
      zoneName: string,
      price: number,
    ) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const isBackup = zoneType === "BACKUP";
      const pendingList = target.pendingPayments || [];
      const securedList = target.securedBy || [];

      const isRecordBackup = (item: {
        zoneType?: string;
        zoneName?: string;
      }) => {
        if (item.zoneType === "BACKUP") return true;
        if (item.zoneType === "MAIN") return false;
        const name = (item.zoneName || "").trim();
        if (!name) return false;
        if (name.includes("สำรอง")) return true;
        if (
          target.backupLocation &&
          (name === target.backupLocation ||
            name.includes(target.backupLocation) ||
            target.backupLocation.includes(name))
        ) {
          return true;
        }
        return false;
      };

      const zonePendingCount = pendingList.filter((p) =>
        isBackup ? isRecordBackup(p) : !isRecordBackup(p),
      ).length;

      const zoneSecuredCount =
        securedList.length > 0
          ? securedList
              .filter((s) => (isBackup ? isRecordBackup(s) : !isRecordBackup(s)))
              .reduce((acc, s) => acc + (s.qty || 1), 0)
          : isBackup
            ? 0
            : target.quantitySecured;

      if (zonePendingCount + zoneSecuredCount >= target.quantityNeeded) {
        toast.error(
          `${isBackup ? "โซนสำรอง" : "โซนหลัก"} ครบจำนวนที่ต้องการแล้ว (${target.quantityNeeded} ใบ)`,
        );
        return;
      }

      playSoundAlert("success");

      const newPending: PendingPaymentRecord = {
        id: crypto.randomUUID(),
        userId: userId || "",
        name: currentUserName,
        zoneType,
        zoneName,
        price,
        at: new Date().toISOString(),
      };

      const updatedPending = [...(target.pendingPayments || []), newPending];
      const nextStatus: SeatStatus =
        target.quantitySecured >= target.quantityNeeded
          ? "COMPLETED"
          : "PENDING_PAYMENT";

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                pendingPayments: updatedPending,
                status: nextStatus,
                lastUpdatedBy: currentUserName,
                lastUpdatedAt: "เมื่อสักครู่",
              }
            : t,
        ),
      );

      getSocket().emit("update_seat_status", {
        roomId,
        taskId,
        status: nextStatus,
        pendingPayments: updatedPending,
        quantitySecured: target.quantitySecured,
        securedBy: target.securedBy,
        updatedBy: currentUserName,
      });

      const cleanZone = zoneName.trim();
      const zoneLabel = cleanZone.startsWith("โซน")
        ? cleanZone
        : `${zoneType === "MAIN" ? "โซนหลัก" : "โซนสำรอง"} ${cleanZone}`;
      const pendingMsg = `${currentUserName} ล็อคที่นั่งได้แล้ว! กำลังรอจ่ายเงิน (${zoneLabel} - ${price.toLocaleString()} THB)`;
      onAddChatMessage?.(pendingMsg, undefined, true);

      try {
        await fetch(`/api/rooms/${roomId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            status: nextStatus,
            pendingPayments: updatedPending,
            lastUpdatedById: userId,
          }),
        });
      } catch (err) {
        console.error("Failed to save pending payment in DB:", err);
      }
    },
    [roomId, userId, currentUserName, tasks, onAddChatMessage],
  );

  const handleConfirmPayment = useCallback(
    async (taskId: string, pendingId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const pendingItem = target.pendingPayments?.find((p) => p.id === pendingId);
      const remainingPending = (target.pendingPayments || []).filter(
        (p) => p.id !== pendingId,
      );

      playSoundAlert("success");
      const nextSecured = target.quantitySecured + 1;
      const isNowFull = nextSecured >= target.quantityNeeded;
      const nextStatus: SeatStatus = isNowFull
        ? "COMPLETED"
        : remainingPending.length > 0
          ? "PENDING_PAYMENT"
          : "AVAILABLE";

      const updatedSecuredBy = [...(target.securedBy || [])];
      const buyerName = pendingItem?.name || currentUserName;
      const buyerId = pendingItem?.userId || userId || "";
      const zoneLabel =
        pendingItem?.zoneName ||
        (pendingItem?.zoneType === "BACKUP"
          ? target.backupLocation || "โซนสำรอง"
          : target.targetLocation);

      updatedSecuredBy.push({
        userId: buyerId,
        name: buyerName,
        qty: 1,
        at:
          new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + " น.",
        zoneName: zoneLabel,
        zoneType: pendingItem?.zoneType,
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                quantitySecured: nextSecured,
                status: nextStatus,
                securedBy: updatedSecuredBy,
                pendingPayments: remainingPending,
                lastUpdatedBy: currentUserName,
                lastUpdatedAt: "เมื่อสักครู่",
              }
            : t,
        ),
      );

      getSocket().emit("update_seat_status", {
        roomId,
        taskId,
        status: nextStatus,
        quantitySecured: nextSecured,
        securedBy: updatedSecuredBy,
        pendingPayments: remainingPending,
        updatedBy: currentUserName,
      });

      const confirmMsg = isNowFull
        ? `${buyerName} ชำระเงินเรียบร้อย! ได้บัตร ${zoneLabel} ครบแล้ว! (${nextSecured}/${target.quantityNeeded})`
        : `${buyerName} ชำระเงินเรียบร้อย! ได้บัตร ${zoneLabel} แล้ว (+1 ใบ)`;

      onAddChatMessage?.(confirmMsg, undefined, true);

      try {
        await fetch(`/api/rooms/${roomId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            status: nextStatus,
            quantitySecured: nextSecured,
            securedBy: updatedSecuredBy,
            pendingPayments: remainingPending,
            lastUpdatedById: userId,
          }),
        });
      } catch (err) {
        console.error("Failed to save confirm payment in DB:", err);
      }
    },
    [roomId, userId, currentUserName, tasks, onAddChatMessage],
  );

  const handleDirectSecured = useCallback(
    async (
      taskId: string,
      zoneType: "MAIN" | "BACKUP",
      zoneName: string,
    ) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;
      if (target.quantitySecured >= target.quantityNeeded) {
        toast.error(
          `ที่นั่งครบตามจำนวนที่ต้องการแล้ว (${target.quantityNeeded} ใบ)`,
        );
        return;
      }

      playSoundAlert("success");
      const nextSecured = target.quantitySecured + 1;
      const isNowFull = nextSecured >= target.quantityNeeded;
      const remainingPending = target.pendingPayments || [];
      const nextStatus: SeatStatus = isNowFull
        ? "COMPLETED"
        : remainingPending.length > 0
          ? "PENDING_PAYMENT"
          : "AVAILABLE";

      const updatedSecuredBy = [...(target.securedBy || [])];
      const buyerName = currentUserName;
      const buyerId = userId || "";

      updatedSecuredBy.push({
        userId: buyerId,
        name: buyerName,
        qty: 1,
        at:
          new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) + " น.",
        zoneName,
        zoneType,
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                quantitySecured: nextSecured,
                status: nextStatus,
                securedBy: updatedSecuredBy,
                lastUpdatedBy: currentUserName,
                lastUpdatedAt: "เมื่อสักครู่",
              }
            : t,
        ),
      );

      getSocket().emit("update_seat_status", {
        roomId,
        taskId,
        status: nextStatus,
        quantitySecured: nextSecured,
        securedBy: updatedSecuredBy,
        pendingPayments: remainingPending,
        updatedBy: currentUserName,
      });

      const msg = isNowFull
        ? `${buyerName} ได้บัตร ${zoneName} ครบแล้ว! (${nextSecured}/${target.quantityNeeded})`
        : `${buyerName} ได้บัตร ${zoneName} แล้ว! (+1 ใบ)`;
      onAddChatMessage?.(msg, undefined, true);

      try {
        await fetch(`/api/rooms/${roomId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            status: nextStatus,
            quantitySecured: nextSecured,
            securedBy: updatedSecuredBy,
            lastUpdatedById: userId,
          }),
        });
      } catch (err) {
        console.error("Failed to save direct secured in DB:", err);
      }
    },
    [roomId, userId, currentUserName, tasks, onAddChatMessage],
  );

  const handleAssignTask = useCallback(
    async (taskId: string, targetMember: TaskAssignee | null) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const currentAssignees: TaskAssignee[] =
        target.assignees && target.assignees.length > 0
          ? target.assignees
          : target.assignee
            ? [target.assignee]
            : [];

      let newAssignees: TaskAssignee[] = [];
      let isRemoved = false;

      if (targetMember === null) {
        newAssignees = [];
        isRemoved = true;
      } else {
        const isAlreadyAssigned = currentAssignees.some(
          (a) =>
            a.userId === targetMember.userId || a.name === targetMember.name,
        );

        if (isAlreadyAssigned) {
          newAssignees = currentAssignees.filter(
            (a) =>
              a.userId !== targetMember.userId && a.name !== targetMember.name,
          );
          isRemoved = true;
        } else {
          newAssignees = [...currentAssignees, targetMember];
          isRemoved = false;
        }
      }

      const cleanSecured = (target.securedBy || []).filter(
        (s) => !s.isAssignee,
      );
      const updatedSecuredBy = [
        ...cleanSecured,
        ...newAssignees.map((a) => ({
          isAssignee: true,
          userId: a.userId,
          name: a.name,
          qty: 0,
          at: "",
        })),
      ];

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                assignee: newAssignees[0] || null,
                assignees: newAssignees,
                securedBy: updatedSecuredBy,
                lastUpdatedBy: currentUserName,
                lastUpdatedAt: "เมื่อสักครู่",
              }
            : t,
        ),
      );

      getSocket().emit("update_seat_status", {
        roomId,
        taskId,
        assignee: newAssignees[0] || null,
        assignees: newAssignees,
        securedBy: updatedSecuredBy,
        updatedBy: currentUserName,
      });

      if (targetMember === null) {
        playSoundAlert("warning");
        const unassignMsg = `${currentUserName} ยกเลิกการมอบหมายงาน ${target.targetLocation} ทั้งหมด`;
        onAddChatMessage?.(unassignMsg, undefined, true);
        toast.success("ยกเลิกการมอบหมายงานทั้งหมดเรียบร้อย");
      } else if (isRemoved) {
        playSoundAlert("warning");
        const unassignMsg = `📢 ${currentUserName} ถอนการมอบหมายงาน ${target.targetLocation} จาก ${targetMember.name}`;
        onAddChatMessage?.(unassignMsg, undefined, true);
        toast.success(`ถอนการมอบหมาย ${targetMember.name} เรียบร้อย`);
      } else {
        playSoundAlert("success");
        const assignMsg = `📢 ${currentUserName} มอบหมายงาน ${target.targetLocation} ให้กับ ${targetMember.name}`;
        onAddChatMessage?.(assignMsg, undefined, true);
        toast.success(`มอบหมายงานให้ ${targetMember.name} เรียบร้อย`);
      }

      try {
        await fetch(`/api/rooms/${roomId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            securedBy: updatedSecuredBy,
            lastUpdatedById: userId,
          }),
        });
      } catch (err) {
        console.error("Failed to save assignment in DB:", err);
      }
    },
    [roomId, userId, currentUserName, tasks, onAddChatMessage],
  );

  const handleCancelPendingPayment = useCallback(
    async (taskId: string, pendingId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;

      const pendingItem = target.pendingPayments?.find(
        (p) => p.id === pendingId,
      );
      const remainingPending = (target.pendingPayments || []).filter(
        (p) => p.id !== pendingId,
      );

      playSoundAlert("warning");
      const nextStatus: SeatStatus =
        target.quantitySecured >= target.quantityNeeded
          ? "COMPLETED"
          : remainingPending.length > 0
            ? "PENDING_PAYMENT"
            : "AVAILABLE";

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: nextStatus,
                pendingPayments: remainingPending,
                lastUpdatedBy: currentUserName,
                lastUpdatedAt: "เมื่อสักครู่",
              }
            : t,
        ),
      );

      getSocket().emit("update_seat_status", {
        roomId,
        taskId,
        status: nextStatus,
        pendingPayments: remainingPending,
        quantitySecured: target.quantitySecured,
        securedBy: target.securedBy,
        updatedBy: currentUserName,
      });

      const cancelMsg = `${currentUserName} ยกเลิกการชำระเงิน (${pendingItem?.zoneName || "ที่นั่ง"})`;
      onAddChatMessage?.(cancelMsg, undefined, true);

      try {
        await fetch(`/api/rooms/${roomId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            status: nextStatus,
            pendingPayments: remainingPending,
            lastUpdatedById: userId,
          }),
        });
      } catch (err) {
        console.error("Failed to cancel pending payment in DB:", err);
      }
    },
    [roomId, userId, currentUserName, tasks, onAddChatMessage],
  );

  const handleDecrement = useCallback(
    async (taskId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target || target.quantitySecured <= 0) return;

      playSoundAlert("warning");
      const nextSecured = target.quantitySecured - 1;
      const nextStatus: SeatStatus =
        nextSecured >= target.quantityNeeded ? "COMPLETED" : "AVAILABLE";

      const updatedSecuredBy = [...(target.securedBy || [])];
      const existingIndex = updatedSecuredBy.findIndex(
        (s) => s.userId === userId || s.name === currentUserName,
      );
      if (existingIndex >= 0) {
        if (updatedSecuredBy[existingIndex].qty > 1) {
          updatedSecuredBy[existingIndex] = {
            ...updatedSecuredBy[existingIndex],
            qty: updatedSecuredBy[existingIndex].qty - 1,
          };
        } else {
          updatedSecuredBy.splice(existingIndex, 1);
        }
      } else if (updatedSecuredBy.length > 0) {
        const lastIndex = updatedSecuredBy.length - 1;
        if (updatedSecuredBy[lastIndex].qty > 1) {
          updatedSecuredBy[lastIndex] = {
            ...updatedSecuredBy[lastIndex],
            qty: updatedSecuredBy[lastIndex].qty - 1,
          };
        } else {
          updatedSecuredBy.pop();
        }
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                quantitySecured: nextSecured,
                status: nextStatus,
                securedBy: updatedSecuredBy,
                lastUpdatedBy: currentUserName,
                lastUpdatedAt: "เมื่อสักครู่",
              }
            : t,
        ),
      );

      getSocket().emit("update_seat_status", {
        roomId,
        taskId,
        status: nextStatus,
        quantitySecured: nextSecured,
        securedBy: updatedSecuredBy,
        updatedBy: currentUserName,
      });

      const decrementMsg = `${currentUserName} ยกเลิก ${target.targetLocation} 1 ใบ (เหลือ ${nextSecured}/${target.quantityNeeded})`;
      onAddChatMessage?.(decrementMsg, undefined, true);

      try {
        await fetch(`/api/rooms/${roomId}/tasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            status: nextStatus,
            quantitySecured: nextSecured,
            securedBy: updatedSecuredBy,
            lastUpdatedById: userId,
          }),
        });
      } catch (err) {
        console.error("Failed to save decrement in DB:", err);
      }
    },
    [roomId, userId, currentUserName, tasks, onAddChatMessage],
  );

  const handleSaveTask = useCallback(
    async (
      taskData: Partial<SeatTask> & { assignees?: TaskAssignee[] },
    ): Promise<boolean> => {
      try {
        const assignees = taskData.assignees || [];
        const assigneeSecured = assignees.map((a) => ({
          isAssignee: true,
          userId: a.userId,
          name: a.name,
          qty: 0,
          at: "",
        }));

        if (taskData.id) {
          const existingTarget = tasks.find((t) => t.id === taskData.id);
          const cleanSecured = (existingTarget?.securedBy || []).filter(
            (s) => !s.isAssignee,
          );
          const updatedSecuredBy = [...cleanSecured, ...assigneeSecured];

          const res = await fetch(`/api/rooms/${roomId}/tasks`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: taskData.id,
              status: taskData.status,
              quantitySecured: taskData.quantitySecured,
              securedBy: updatedSecuredBy,
              targetLocation: taskData.targetLocation,
              backupLocation: taskData.backupLocation,
              targetDate: taskData.targetDate,
              price: taskData.price,
              backupPrice: taskData.backupPrice,
              quantityNeeded: taskData.quantityNeeded,
              note: taskData.note,
              lastUpdatedById: userId,
            }),
          });
          const result = await res.json();
          if (res.ok && result.task) {
            const updatedTask = {
              ...result.task,
              securedBy: updatedSecuredBy,
              assignees,
              assignee: assignees[0] || null,
            };
            setTasks((prev) =>
              prev.map((t) => (t.id === taskData.id ? updatedTask : t)),
            );
            getSocket().emit("update_seat_status", {
              roomId,
              taskId: result.task.id,
              status: result.task.status,
              quantitySecured: result.task.quantitySecured,
              securedBy: updatedSecuredBy,
              assignees,
              assignee: assignees[0] || null,
              note: result.task.note,
              targetLocation: result.task.targetLocation,
              backupLocation: result.task.backupLocation,
              targetDate: result.task.targetDate,
              price: result.task.price,
              backupPrice: result.task.backupPrice,
              quantityNeeded: result.task.quantityNeeded,
              task: updatedTask,
              updatedBy: currentUserName,
            });
            toast.success("บันทึกการแก้ไขที่นั่งเรียบร้อยแล้ว");
            onAddChatMessage?.(
              `${currentUserName} แก้ไขที่นั่ง ${result.task.targetLocation}`,
              undefined,
              true,
            );
            return true;
          } else {
            toast.error(result.error || "ไม่สามารถบันทึกการแก้ไขได้");
            return false;
          }
        } else {
          const updatedSecuredBy = [...assigneeSecured];

          const res = await fetch(`/api/rooms/${roomId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetLocation: taskData.targetLocation,
              backupLocation: taskData.backupLocation,
              targetDate: taskData.targetDate,
              price: taskData.price,
              backupPrice: taskData.backupPrice,
              quantityNeeded: taskData.quantityNeeded,
              quantitySecured: taskData.quantitySecured,
              note: taskData.note,
              status: taskData.status || "AVAILABLE",
              securedBy: updatedSecuredBy,
              lastUpdatedById: userId,
            }),
          });
          const result = await res.json();
          if (res.ok && result.task) {
            const newTask = {
              ...result.task,
              securedBy: updatedSecuredBy,
              assignees,
              assignee: assignees[0] || null,
            };
            setTasks((prev) => [newTask, ...prev]);
            getSocket().emit("task_created", { roomId, task: newTask });
            toast.success("เพิ่มที่นั่งเป้าหมายสำเร็จ");
            const assigneeMsg =
              assignees.length > 0
                ? ` (มอบหมายให้ ${assignees.map((a) => a.name).join(", ")})`
                : "";
            onAddChatMessage?.(
              `${currentUserName} เพิ่มที่นั่ง ${result.task.targetLocation} (${result.task.quantityNeeded} ใบ)${assigneeMsg}`,
              undefined,
              true,
            );
            return true;
          } else {
            toast.error(result.error || "ไม่สามารถเพิ่มที่นั่งได้");
            return false;
          }
        }
      } catch (err) {
        console.error("Failed to save task:", err);
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        return false;
      }
    },
    [roomId, userId, currentUserName, tasks, onAddChatMessage],
  );

  const requestDeleteTask = useCallback(
    (taskId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      setTaskToDelete({
        id: taskId,
        location: target?.targetLocation || "ที่นั่งนี้",
      });
    },
    [tasks],
  );

  const handleExecuteDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;
    const { id: taskId } = taskToDelete;
    setActionLoading(true);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    getSocket().emit("task_deleted", { roomId, taskId });
    try {
      await fetch(`/api/rooms/${roomId}/tasks?taskId=${taskId}`, {
        method: "DELETE",
      });
      onAddChatMessage?.(
        `${currentUserName} ลบที่นั่ง ${taskToDelete.location}`,
        undefined,
        true,
      );
      toast.success("ลบที่นั่งเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Failed to delete task from DB:", err);
      toast.error("เกิดข้อผิดพลาดในการลบที่นั่ง");
    } finally {
      setActionLoading(false);
      setTaskToDelete(null);
    }
  }, [roomId, currentUserName, taskToDelete, onAddChatMessage]);

  return {
    tasks,
    setTasks,
    taskToDelete,
    setTaskToDelete,
    actionLoading,
    handleStartPendingPayment,
    handleConfirmPayment,
    handleDirectSecured,
    handleAssignTask,
    handleCancelPendingPayment,
    handleDecrement,
    handleSaveTask,
    requestDeleteTask,
    handleExecuteDeleteTask,
  };
}
