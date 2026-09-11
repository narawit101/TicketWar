"use client";

import { useState, useEffect, useMemo } from "react";
import { parseDateInBangkok, toInputDateValue } from "@/lib/date";

export interface UseRoomCountdownOptions {
  eventDate?: string | Date | null;
  hasQueue?: boolean;
  queueTime?: string | null;
  roomStatus?: string;
  isAllSecured?: boolean;
}

export interface RoomCountdownState {
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  targetType: "QUEUE" | "SALE" | null;
  text: string;
  secondsLeft: number | null;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
}

export function useRoomCountdown({
  eventDate,
  hasQueue,
  queueTime,
  roomStatus,
  isAllSecured,
}: UseRoomCountdownOptions): RoomCountdownState {
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate parsed dates
  const { saleDate, queueDate } = useMemo(() => {
    const sDate = parseDateInBangkok(eventDate);
    let qDate: Date | null = null;
    if (sDate && hasQueue && queueTime) {
      const cleanTime = queueTime.replace(/น\.?/g, "").trim();
      const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const dateOnly = toInputDateValue(sDate);
        const queueIso = `${dateOnly}T${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}:00+07:00`;
        const q = new Date(queueIso);
        if (!isNaN(q.getTime())) {
          qDate = q;
        }
      }
    }
    return { saleDate: sDate, queueDate: qDate };
  }, [eventDate, hasQueue, queueTime]);

  // Derive countdown values synchronously
  const computed = useMemo(() => {
    if (roomStatus === "ARCHIVED") {
      return {
        status: "ENDED" as const,
        targetType: null,
        text: "จบแล้ว",
        secondsLeft: null,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isUrgent: false,
      };
    }

    if (!saleDate) {
      return {
        status: "ENDED" as const,
        targetType: null,
        text: "",
        secondsLeft: null,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isUrgent: false,
      };
    }

    const saleTimeMs = saleDate.getTime();

    // If all tickets secured and sale time arrived
    if (isAllSecured && nowMs >= saleTimeMs) {
      return {
        status: "ENDED" as const,
        targetType: null,
        text: "ได้บัตรครบแล้ว",
        secondsLeft: null,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isUrgent: false,
      };
    }

    // 1. Queue countdown in future
    if (queueDate && queueDate.getTime() > nowMs) {
      const diffSec = Math.floor((queueDate.getTime() - nowMs) / 1000);
      const days = Math.floor(diffSec / 86400);
      const hours = Math.floor((diffSec % 86400) / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      const text =
        days > 0 ? `อีก ${days} วัน ${timeStr}` : `เปิดรันคิวใน ${timeStr}`;

      return {
        status: "UPCOMING" as const,
        targetType: "QUEUE" as const,
        text,
        secondsLeft: diffSec,
        days,
        hours,
        minutes,
        seconds,
        isUrgent: days === 0,
      };
    }

    // 2. Sale date countdown in future
    if (saleTimeMs > nowMs) {
      const diffSec = Math.floor((saleTimeMs - nowMs) / 1000);
      const days = Math.floor(diffSec / 86400);
      const hours = Math.floor((diffSec % 86400) / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      const text =
        days > 0 ? `อีก ${days} วัน ${timeStr}` : `เปิดกดบัตรใน ${timeStr}`;

      return {
        status: "UPCOMING" as const,
        targetType: "SALE" as const,
        text,
        secondsLeft: diffSec,
        days,
        hours,
        minutes,
        seconds,
        isUrgent: days === 0,
      };
    }

    // 3. Active window (first 2 hours of sale)
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    if (nowMs - saleTimeMs < TWO_HOURS_MS) {
      return {
        status: "ACTIVE" as const,
        targetType: "SALE" as const,
        text: "กำลังเปิดจำหน่าย",
        secondsLeft: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isUrgent: true,
      };
    }

    // 4. Over 2 hours: ended
    return {
      status: "ENDED" as const,
      targetType: null,
      text: "จบแล้ว",
      secondsLeft: null,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUrgent: false,
    };
  }, [roomStatus, saleDate, queueDate, isAllSecured, nowMs]);

  return computed;
}
