"use client";

import React from "react";
import { Room } from "@/types";
import { X, Plus, Radio, Archive } from "lucide-react";

interface RoomListModalProps {
  isOpen: boolean;
  rooms: Room[];
  currentRoomId: string;
  onSelectRoom: (room: Room) => void;
  onOpenCreateRoom: () => void;
  onClose: () => void;
}

export const RoomListModal: React.FC<RoomListModalProps> = ({
  isOpen,
  rooms,
  currentRoomId,
  onSelectRoom,
  onOpenCreateRoom,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#181818] border border-[#2a2a2a] w-full max-w-lg rounded-2xl modal-shadow p-6 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#252525] mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              รายชื่อห้องกดบัตรของคุณ (Concert Rooms)
            </h2>
            <p className="text-xs text-[#b3b3b3]">
              เลือกห้องเพื่อสลับไปติดตามงาน หรือสร้างห้องใหม่
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#888888] hover:text-white hover:bg-[#252525] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room List Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {rooms.map((room) => {
            const isSelected = room.id === currentRoomId;
            return (
              <div
                key={room.id}
                onClick={() => {
                  onSelectRoom(room);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-[#252525] border-[#1ed760] shadow-md"
                    : "bg-[#1f1f1f] hover:bg-[#252525] border-[#2a2a2a]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      room.status === "ACTIVE"
                        ? "bg-[#1ed760] text-black"
                        : "bg-[#333333] text-[#888888]"
                    }`}
                  >
                    {room.status === "ACTIVE" ? (
                      <Radio className="w-5 h-5" />
                    ) : (
                      <Archive className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm tracking-tight">
                      {room.title}
                    </h3>
                    <p className="text-xs text-[#b3b3b3]">
                      {room.eventDate} • {room.memberCount} สมาชิก
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      room.status === "ACTIVE"
                        ? "bg-[#1ed760]/20 text-[#1ed760]"
                        : "bg-[#333333] text-[#888888]"
                    }`}
                  >
                    {room.status === "ACTIVE" ? "Live" : "Archived"}
                  </span>
                  {isSelected && (
                    <span className="text-xs text-[#1ed760] font-bold">
                      ● กำลังเลือก
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#252525] mt-4 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenCreateRoom();
            }}
            className="btn-pill btn-pill-green text-xs px-4 py-2 gap-1.5 cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4 text-black stroke-3" />
            สร้างห้องใหม่
          </button>

          <button
            onClick={onClose}
            className="btn-pill bg-[#252525] hover:bg-[#333333] text-white text-xs px-4 py-2 border border-[#333333] cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
