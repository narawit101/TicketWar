"use client";

import React, { useState } from "react";
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Ticket,
  Users,
  Clock,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Room, SeatTask } from "@/types";
import { formatThaiDate } from "@/lib/date";
import {
  calculateRoomSummary,
  exportSummaryToCSV,
  copySummaryToClipboard,
} from "@/lib/exportSummary";

interface WarRoomSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  tasks: SeatTask[];
}

export const WarRoomSummaryModal: React.FC<WarRoomSummaryModalProps> = ({
  isOpen,
  onClose,
  room,
  tasks,
}) => {
  const [activeTab, setActiveTab] = useState<"TICKETS" | "MEMBERS">("TICKETS");
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const summary = calculateRoomSummary(tasks);

  const handleCopy = async () => {
    const ok = await copySummaryToClipboard(room, tasks);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadCSV = () => {
    exportSummaryToCSV(room, tasks);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#121212] border border-[#282828] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#252525] bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1ed760]/15 flex items-center justify-center border border-[#1ed760]/30">
              <Ticket className="w-5 h-5 text-[#1ed760]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>สรุปผล</span>
                <span className="text-xs py-0.5 rounded-full text-[#1ed760] font-semibold">
                  {summary.totalSecured}/{summary.totalNeeded} ใบ
                </span>
              </h2>
              <p className="text-xs text-[#888888] truncate max-w-md">
                {room.title}
                {room.eventDate && ` • ${formatThaiDate(room.eventDate)}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#888888] hover:text-white hover:bg-[#252525] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Tickets Secured */}
            <div className="bg-[#181818] border border-[#252525] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#888888] mb-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>ได้บัตรแล้ว</span>
                </span>
                <span className="font-semibold text-white">
                  {summary.securedPercent}%
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                {summary.totalSecured}{" "}
                <span className="text-xs text-[#888888] font-normal">
                  / {summary.totalNeeded} ใบ
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-[#282828] h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-[#1ed760] h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.securedPercent}%` }}
                />
              </div>
            </div>

            {/* Card 2: Total Secured Amount */}
            <div className="bg-[#181818] border border-[#252525] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#888888] mb-1">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#1ed760]" />
                  <span>ยอดเงิน</span>
                </span>
              </div>
              <div className="text-2xl font-black text-[#1ed760]">
                ฿{summary.totalSecuredAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#777777] mt-1">
                จาก {summary.totalSecured} ใบที่กดได้แล้ว
              </div>
            </div>

            {/* Card 3: Pending Payments */}
            <div className="bg-[#181818] border border-[#252525] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#888888] mb-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>รอจ่ายเงิน</span>
                </span>
                {summary.totalPending > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                    กำลังรอ
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-white">
                {summary.totalPending}{" "}
                <span className="text-xs text-[#888888] font-normal">ใบ</span>
              </div>
              <div className="text-[11px] text-[#888888] mt-1">
                ฿{summary.totalPendingAmount.toLocaleString()}{" "}
                {summary.totalPending > 0 && (
                  <span className="text-[#666666]">
                    (รวม ฿{summary.totalAmount.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#252525] pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("TICKETS")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "TICKETS"
                  ? "bg-white text-black shadow"
                  : "text-[#888888] hover:text-white bg-[#1a1a1a]"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>รายการบัตร ({tasks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("MEMBERS")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "MEMBERS"
                  ? "bg-white text-black shadow"
                  : "text-[#888888] hover:text-white bg-[#1a1a1a]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>สรุปรายคน ({summary.members.length})</span>
            </button>
          </div>

          {/* Tab 1: Detailed Ticket Breakdown */}
          {activeTab === "TICKETS" && (
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#777777]">
                  ยังไม่มีรายการเป้าหมายในห้องนี้
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#b3b3b3]">
                    <thead className="text-[11px] uppercase bg-[#181818] text-[#888888] border-y border-[#252525]">
                      <tr>
                        <th className="py-2.5 px-3">โซน/รอบ</th>
                        <th className="py-2.5 px-3">ราคา/ใบ</th>
                        <th className="py-2.5 px-3 text-center">ได้/ต้องการ</th>
                        <th className="py-2.5 px-3">คนกด</th>
                        <th className="py-2.5 px-3 text-right">ยอดเงินรวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]">
                      {tasks.map((task) => {
                        const item = summary.taskItems.find(
                          (t) => t.taskId === task.id,
                        );
                        const isDone =
                          task.quantitySecured >= task.quantityNeeded;

                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-[#181818]/60 transition"
                          >
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">
                                {task.targetLocation}
                              </div>
                              <div className="text-[11px] text-[#777777]">
                                {formatThaiDate(task.targetDate)}
                                {task.backupLocation &&
                                  ` • สำรอง: ${task.backupLocation}`}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-semibold text-white">
                                ฿{task.price.toLocaleString()}
                              </span>
                              {task.backupPrice && (
                                <div className="text-[10px] text-[#777777]">
                                  สำรอง ฿{task.backupPrice.toLocaleString()}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                  isDone
                                    ? "bg-[#1ed760]/20 text-[#1ed760]"
                                    : task.quantitySecured > 0
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-[#252525] text-[#888888]"
                                }`}
                              >
                                {task.quantitySecured}/{task.quantityNeeded}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              {task.securedBy && task.securedBy.length > 0 ? (
                                <div className="space-y-0.5">
                                  {task.securedBy.map((s, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs text-white flex items-center gap-1.5"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760]" />
                                      <span className="font-medium">
                                        {s.name}
                                      </span>
                                      <span className="text-[10px] text-[#888888]">
                                        ({s.qty || 1} ใบ
                                        {s.zoneName ? ` - ${s.zoneName}` : ""})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#666666]">-</span>
                              )}

                              {task.pendingPayments &&
                                task.pendingPayments.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {task.pendingPayments.map((p, idx) => (
                                      <div
                                        key={idx}
                                        className="text-[11px] text-amber-400 flex items-center gap-1"
                                      >
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>{p.name} (รอจ่าย)</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </td>

                            <td className="py-3 px-3 text-right font-bold text-white">
                              ฿{(item?.subtotalSecured || 0).toLocaleString()}
                              {item?.pending ? (
                                <div className="text-[10px] text-amber-400 font-normal">
                                  +฿
                                  {(
                                    item?.subtotalPending || 0
                                  ).toLocaleString()}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Member Split & Expense Breakdown */}
          {activeTab === "MEMBERS" && (
            <div className="space-y-3">
              {summary.members.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#777777]">
                  ยังไม่มีสมาชิกที่กดบัตรได้ในรายการ
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summary.members.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-[#181818] border border-[#262626] rounded-xl p-4 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-white text-sm">
                            {m.name}
                          </div>
                          <div className="text-xs text-[#888888] mt-0.5">
                            กดได้ {m.securedQty} ใบ
                            {m.pendingQty > 0 && ` • รอจ่าย ${m.pendingQty} ใบ`}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-[#1ed760]">
                            ฿{m.totalSecuredCost.toLocaleString()}
                          </div>
                          {m.totalPendingCost > 0 && (
                            <div className="text-[10px] text-amber-400">
                              +รอจ่าย ฿{m.totalPendingCost.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {m.zones.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#252525] flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-[#777777]">
                            โซน:
                          </span>
                          {m.zones.map((zone, zIdx) => (
                            <span
                              key={zIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#222222] text-[#cccccc]"
                            >
                              {zone}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pinned Footer with Actions */}
        <div className="shrink-0 px-6 py-4 border-t border-[#252525] bg-[#161616] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Copy for LINE */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2 rounded-full text-xs font-bold text-white bg-[#222222] hover:bg-[#2d2d2d] border border-[#333333] hover:border-[#555555] transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-[#1ed760]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#888888]" />
              )}
              <span>{isCopied ? "คัดลอกแล้ว!" : "คัดลอก"}</span>
            </button>

            {/* Download Excel / CSV */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex-1 sm:flex-none btn-pill btn-pill-green text-xs px-5 py-2 font-bold cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <FileSpreadsheet className="w-4 h-4 text-black stroke-2" />
              <span>ดาวน์โหลด Excel (CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
