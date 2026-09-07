"use client";

import React, { useState } from "react";
import {
  X,
  Smartphone,
  Download,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  Monitor,
} from "lucide-react";
import Image from "next/image";
import { usePwaStatus } from "@/lib/pwa";
import { toast } from "react-hot-toast";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;
  return <PwaInstallDialog onClose={onClose} />;
};

const PwaInstallDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { isStandalone, isIOS, canInstall, triggerNativePrompt } =
    usePwaStatus();
  // Tab state allows users to view instructions for either iOS or Android/PC
  const [activeTab, setActiveTab] = useState<"auto" | "ios" | "android">(
    isIOS ? "ios" : "auto",
  );
  const [installing, setInstalling] = useState(false);

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      const accepted = await triggerNativePrompt();
      if (accepted) {
        toast.success("กำลังติดตั้งแอป TicketWar ลงเครื่องของคุณ...");
        onClose();
      } else {
        toast("ยกเลิกการติดตั้ง", { icon: "ℹ️" });
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการติดตั้ง");
    } finally {
      setInstalling(false);
    }
  };

  const showIosGuide = activeTab === "ios" || (activeTab === "auto" && isIOS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#181818] border border-[#252525] w-full max-w-md rounded-2xl modal-shadow overflow-hidden relative animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] text-left">
        {/* Anti-Cutoff Header */}
        <div className="p-5 border-b border-[#252525] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1ed760]/10 flex items-center justify-center border border-[#1ed760]/20">
              <Smartphone className="w-4 h-4 text-[#1ed760]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                ติดตั้ง TicketWar ลงเครื่อง
              </h2>
              <p className="text-xs text-[#a0a0a0]">
                เปิดเร็ว เต็มจอ ไม่มีแถบ URL เกะกะ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#252525] transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {/* App Card Preview */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#262626] flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md shrink-0 border border-white/10 bg-[#181818] flex items-center justify-center">
              <Image
                src="/icon-192.png"
                alt="TicketWar Icon"
                width={56}
                height={56}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">
                  TicketWar
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-[#888888] truncate mt-0.5">
                ห้องแชทส่วนตัว
              </p>
              <p className="text-[11px] text-[#666666] mt-1">
                {isStandalone
                  ? "✓ ติดตั้งแล้วในโหมด Standalone"
                  : "รองรับทั้ง iOS, Android, macOS และ Windows"}
              </p>
            </div>
          </div>

          {/* Already installed banner */}
          {isStandalone && (
            <div className="p-3 rounded-xl bg-[#1ed760]/10 border border-[#1ed760]/30 flex items-center gap-2.5 text-xs text-[#1ed760]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                คุณกำลังเปิดใช้งาน TicketWar ผ่านแอปที่ติดตั้งแล้วเรียบร้อย!
              </span>
            </div>
          )}

          {/* Platform Tab Switcher */}
          <div className="flex rounded-lg bg-[#141414] p-1 border border-[#242424]">
            <button
              type="button"
              onClick={() => setActiveTab("android")}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                !showIosGuide
                  ? "bg-[#252525] text-white shadow-xs"
                  : "text-[#888888] hover:text-[#cccccc]"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Android / PC</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ios")}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                showIosGuide
                  ? "bg-[#252525] text-white shadow-xs"
                  : "text-[#888888] hover:text-[#cccccc]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone / iPad</span>
            </button>
          </div>

          {/* iOS Safari Instructions */}
          {showIosGuide ? (
            <div className="space-y-3">
              <p className="text-xs text-[#a0a0a0] leading-relaxed">
                เนื่องจาก iOS Safari กำหนดให้ติดตั้งผ่านเมนูของระบบ กรุณาทำตาม 3
                สเต็ปง่ายๆ ดังนี้:
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#141414] border border-[#252525] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#252525] text-[#1ed760] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <p className="text-white font-medium flex items-center gap-1.5">
                      <span>แตะที่ปุ่มแชร์</span>
                      <Share className="w-3.5 h-3.5 text-[#539df5]" />
                      <span>(Share)</span>
                    </p>
                    <p className="text-[#888888] mt-0.5">
                      แถบเครื่องมือด้านล่างของหน้าจอ Safari
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#141414] border border-[#252525] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#252525] text-[#1ed760] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="text-white font-medium flex items-center gap-1.5">
                      <span>เลือก &quot;เพิ่มไปยังหน้าจอโฮม&quot;</span>
                      <PlusSquare className="w-3.5 h-3.5 text-[#1ed760]" />
                    </p>
                    <p className="text-[#888888] mt-0.5">
                      (Add to Home Screen) ในเมนูที่แสดงขึ้นมา
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#141414] border border-[#252525] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#252525] text-[#1ed760] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="text-white font-medium">
                      แตะปุ่ม &quot;เพิ่ม&quot; (Add) มุมขวาบน
                    </p>
                    <p className="text-[#888888] mt-0.5">
                      ไอคอน TicketWar จะปรากฏบนหน้าจอมือถือของคุณทันที
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Desktop / Chrome Instructions */
            <div className="space-y-3">
              <p className="text-xs text-[#a0a0a0] leading-relaxed">
                ติดตั้งแอปลงบนเบราว์เซอร์ Chrome, Edge หรือโทรศัพท์ Android
                เพื่อเข้าถึงวอร์รูมได้ภายในคลิกเดียว
              </p>

              {canInstall ? (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  disabled={installing}
                  className="w-full btn-pill btn-pill-green py-3 px-4 text-sm font-bold tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4 text-black stroke-2" />
                  <span>
                    {installing
                      ? "กำลังติดตั้ง..."
                      : "กดเพื่อติดตั้งแอปลงเครื่อง"}
                  </span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-[#141414] border border-[#252525] space-y-2 text-xs">
                  <p className="text-white font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>วิธีติดตั้งด้วยตนเอง:</span>
                  </p>
                  <ul className="text-[#a0a0a0] space-y-1.5 pl-4 list-disc">
                    <li>
                      คลิกไอคอน{" "}
                      <span className="text-white font-bold">
                        ติดตั้ง (Install)
                      </span>{" "}
                      บนแถบ Address bar ขวาบนของเบราว์เซอร์
                    </li>
                    <li>
                      หรือกดเมนู{" "}
                      <span className="text-white font-bold">
                        จุดสามจุด (⋮)
                      </span>{" "}
                      ➔ เลือก{" "}
                      <span className="text-white font-bold">
                        &quot;ติดตั้ง TicketWar...&quot;
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Benefits Feature Grid */}
          <div className="pt-2 border-t border-[#252525] grid grid-cols-2 gap-2 text-left">
            <div className="p-2.5 rounded-lg bg-[#141414] border border-[#222222]">
              <p className="text-[11px] font-bold text-white flex items-center gap-1">
                <span className="text-[#1ed760]">⚡</span> เปิดได้เร็วกว่า
              </p>
              <p className="text-[10px] text-[#888888] mt-0.5">
                แคชส่วนติดต่อล่วงหน้า โหลดไวไม่ค้าง
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#141414] border border-[#222222]">
              <p className="text-[11px] font-bold text-white flex items-center gap-1">
                <span className="text-[#539df5]">📱</span> ไร้ขอบเบราว์เซอร์
              </p>
              <p className="text-[10px] text-[#888888] mt-0.5">
                เต็มจอ standalone เพิ่มพื้นที่ดูแชทและผัง
              </p>
            </div>
          </div>
        </div>

        {/* Anti-Cutoff Footer */}
        <div className="p-4 border-t border-[#252525] flex items-center justify-end shrink-0 bg-[#181818]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs sm:text-sm font-bold text-[#b3b3b3] hover:text-white border border-[#333333] hover:border-[#555555] transition cursor-pointer"
          >
            เข้าใจแล้ว / ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
