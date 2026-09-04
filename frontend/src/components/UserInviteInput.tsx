import React, { useState, useEffect, useRef } from "react";
import { SearchUserResult } from "@/types";
import { X, Loader2, UserPlus, AtSign } from "lucide-react";
import { Avatar } from "./Avatar";
import { useClickOutside } from "@/lib/hooks";

interface UserInviteInputProps {
  selectedUsers: SearchUserResult[];
  onChange: (users: SearchUserResult[]) => void;
  roomId?: string;
  currentUserId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const UserInviteInput: React.FC<UserInviteInputProps> = ({
  selectedUsers,
  onChange,
  roomId,
  currentUserId,
  placeholder = "พิมพ์ @email หรือชื่อเพื่อน...",
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      const resetTimer = setTimeout(() => {
        setResults([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          query: clean,
          ...(roomId ? { roomId } : {}),
          ...(currentUserId ? { currentUserId } : {}),
        });
        const res = await fetch(`/api/users/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out already selected users
          const selectedIds = new Set(selectedUsers.map((u) => u.id));
          setResults(
            (data.users || []).filter((u: SearchUserResult) => !selectedIds.has(u.id))
          );
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, roomId, currentUserId, selectedUsers]);

  const handleSelect = (user: SearchUserResult) => {
    onChange([...selectedUsers, user]);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleRemove = (userId: string) => {
    onChange(selectedUsers.filter((u) => u.id !== userId));
  };

  return (
    <div className="space-y-2.5" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#777777]">
          <AtSign className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-[#1f1f1f] border border-[#333333] focus:border-[#1ed760] rounded-lg pl-9 pr-9 py-2 text-xs sm:text-sm text-white placeholder-[#777777] outline-none transition disabled:opacity-50"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <Loader2 className="w-4 h-4 text-[#888888] animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[#777777] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Dropdown Results */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#202020] border border-[#333333] rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
            {results.length === 0 ? (
              <div className="py-3 px-3 text-center text-xs text-[#888888]">
                {loading ? "กำลังค้นหา..." : "ไม่พบบัญชีผู้ใช้ที่ตรงกับข้อมูลนี้"}
              </div>
            ) : (
              results.map((u) => {
                const isMember = u.membershipStatus === "MEMBER";
                const isInvited = u.membershipStatus === "INVITED";
                const isDisabled = isMember || isInvited;

                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelect(u)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition text-left group ${
                      isDisabled
                        ? "opacity-65 cursor-not-allowed bg-transparent"
                        : "hover:bg-[#2c2c2c] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isDisabled
                              ? "text-[#b3b3b3]"
                              : "text-white group-hover:text-[#1ed760] transition-colors"
                          }`}
                        >
                          {u.name}
                        </p>
                        <p className="text-[11px] text-[#777777] truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isMember ? (
                        <span className="text-xs text-zinc-400 font-medium px-2.5 py-1 rounded-full bg-zinc-800/90 border border-zinc-700/60">
                          เป็นสมาชิกอยู่แล้ว
                        </span>
                      ) : isInvited ? (
                        <span className="text-xs text-zinc-400 font-medium px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50">
                          ส่งคำเชิญแล้ว
                        </span>
                      ) : (
                        <span className="p-1.5 text-[#888888] group-hover:text-[#1ed760] transition block">
                          <UserPlus className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Users Badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-[#1f1f1f] border border-[#333333] hover:border-[#1ed760]/50 rounded-full text-xs text-white transition group animate-in fade-in zoom-in-90"
            >
              <Avatar src={u.avatarUrl} name={u.name} size="xs" />
              <span className="font-medium max-w-32 truncate">{u.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(u.id)}
                disabled={disabled}
                className="text-[#888888] hover:text-[#f3727f] p-0.5 rounded-full hover:bg-white/5 transition cursor-pointer"
                title="ลบออก"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
