/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Map,
  Image as ImageIcon,
} from "lucide-react";
import { CarouselSlide } from "./RoomImageCarousel";

interface ImageLightboxModalProps {
  isOpen: boolean;
  title: string;
  slides: CarouselSlide[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  title,
  slides,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
      }
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, slides.length]);

  if (!isOpen || slides.length === 0) return null;

  const current = slides[currentIndex] || slides[0];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Controls */}
      <div
        className="w-full max-w-5xl flex items-center justify-between py-2.5 px-4 mb-2 z-20 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/15 flex items-center gap-1.5 shrink-0">
            {current.type === "seating" ? (
              <Map className="w-3.5 h-3.5 text-[#539df5]" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-[#1ed760]" />
            )}
            <span>
              {slides.length > 1 ? `${currentIndex + 1}/${slides.length} ` : ""}
              {current.label}
            </span>
          </span> */}
          <h3 className="text-sm font-semibold text-zinc-200 truncate">
            {title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer"
          title="ปิด (Esc)"
          aria-label="ปิด"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Box */}
      <div
        className="relative max-w-5xl w-full flex-1 flex items-center justify-center min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.url}
          alt={`${title} - ${current.label}`}
          className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-200"
        />

        {/* Previous Button */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((prev) =>
                prev > 0 ? prev - 1 : slides.length - 1,
              )
            }
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition shadow-2xl cursor-pointer hover:scale-110"
            title="รูปก่อนหน้า (ลูกศรซ้าย)"
            aria-label="รูปก่อนหน้า"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((prev) =>
                prev < slides.length - 1 ? prev + 1 : 0,
              )
            }
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition shadow-2xl cursor-pointer hover:scale-110"
            title="รูปถัดไป (ลูกศรขวา)"
            aria-label="รูปถัดไป"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Switcher Tabs if 2+ images */}
      {slides.length > 1 && (
        <div
          className="mt-3 z-20 flex items-center gap-2 bg-[#181818]/90 border border-white/10 p-1.5 rounded-full backdrop-blur-md shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                idx === currentIndex
                  ? "bg-[#1ed760] text-black font-bold shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {s.type === "seating" ? (
                <Map className="w-3 h-3" />
              ) : (
                <ImageIcon className="w-3 h-3" />
              )}
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
