/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
} from "lucide-react";
import { CarouselSlide } from "@/components/room";

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
  const [prevProps, setPrevProps] = useState({ isOpen, initialIndex });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  if (isOpen !== prevProps.isOpen || initialIndex !== prevProps.initialIndex) {
    setPrevProps({ isOpen, initialIndex });
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.5, 5));
  const handleZoomOut = () => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((s) => Math.min(s + 0.25, 5));
    } else {
      setScale((s) => {
        const next = Math.max(s - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    hasMoved.current = true;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const touchStartX = useRef<number | null>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Touch support for mobile / tablets with swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    if (scale > 1) {
      setIsDragging(true);
      hasMoved.current = false;
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    } else {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scale > 1 && isDragging) {
      hasMoved.current = true;
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1) {
      setIsDragging(false);
    } else if (touchStartX.current !== null && e.changedTouches.length === 1) {
      const diffX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diffX) > 40 && slides.length > 1) {
        if (diffX < 0) {
          // Swipe left -> Next slide
          changeSlide(currentIndex < slides.length - 1 ? currentIndex + 1 : 0);
        } else {
          // Swipe right -> Prev slide
          changeSlide(currentIndex > 0 ? currentIndex - 1 : slides.length - 1);
        }
      }
      touchStartX.current = null;
    }
  };

  const changeSlide = useCallback(
    (newIndex: number) => {
      setCurrentIndex(newIndex);
      resetZoom();
    },
    [resetZoom],
  );

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (slides.length > 1 && thumbnailRefs.current[currentIndex]) {
      thumbnailRefs.current[currentIndex]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex, slides.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-" || e.key === "_") handleZoomOut();
      if (e.key === "0") resetZoom();
      if (scale === 1) {
        if (e.key === "ArrowLeft") {
          changeSlide(currentIndex > 0 ? currentIndex - 1 : slides.length - 1);
        }
        if (e.key === "ArrowRight") {
          changeSlide(currentIndex < slides.length - 1 ? currentIndex + 1 : 0);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    onClose,
    slides.length,
    scale,
    currentIndex,
    changeSlide,
    resetZoom,
  ]);

  if (!isOpen || slides.length === 0) return null;

  const current = slides[currentIndex] || slides[0];

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!current?.url) return;
    try {
      const res = await fetch(current.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanName = current.label
        ? `${current.label.replace(/\s+/g, "_")}.png`
        : `image_${currentIndex + 1}.png`;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(current.url, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={() => {
        if (!hasMoved.current) onClose();
      }}
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Header */}
      <div
        className="w-full max-w-[96vw] flex items-center justify-between py-2 px-3 sm:px-4 z-20 text-white shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-zinc-200 truncate max-w-[40vw] sm:max-w-md">
            {title}
          </h3>
          {slides.length > 1 && (
            <span className="text-xs text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full shrink-0">
              {currentIndex + 1}/{slides.length}
            </span>
          )}
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom Out */}
          <button
            type="button"
            disabled={scale <= 1}
            onClick={handleZoomOut}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
            title="ย่อขนาด (-)"
            aria-label="ย่อขนาด"
          >
            <ZoomOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Zoom % / Reset */}
          <button
            type="button"
            onClick={resetZoom}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs sm:text-xs font-mono font-medium text-zinc-200 hover:text-white transition cursor-pointer min-w-12 text-center"
            title="รีเซ็ตขนาด (0)"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            disabled={scale >= 5}
            onClick={handleZoomIn}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
            title="ขยายขนาด (+)"
            aria-label="ขยายขนาด"
          >
            <ZoomIn className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Reset button icon if zoomed */}
          {scale > 1 && (
            <button
              type="button"
              onClick={resetZoom}
              className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#1ed760] transition cursor-pointer"
              title="รีเซ็ตขนาดเดิม"
              aria-label="รีเซ็ตขนาดเดิม"
            >
              <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-white/20 mx-1" />

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-[#1ed760]/20 hover:text-[#1ed760] text-zinc-300 transition cursor-pointer"
            title="ดาวน์โหลดรูปภาพ"
            aria-label="ดาวน์โหลดรูปภาพ"
          >
            <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Open in new tab / External Link */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (current?.url) window.open(current.url, "_blank");
            }}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer"
            title="เปิดในแท็บใหม่"
            aria-label="เปิดในแท็บใหม่"
          >
            <ExternalLink className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-rose-500/30 hover:text-rose-400 text-zinc-300 transition cursor-pointer"
            title="ปิด (Esc)"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        className="relative w-full flex-1 flex items-center justify-center min-h-0 overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (!hasMoved.current) {
            onClose();
          }
        }}
      >
        <img
          src={current.url}
          alt={`${title} - ${current.label || "image"}`}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
          className={`max-h-[88vh] max-w-[96vw] object-contain rounded-xl shadow-2xl select-none transition-transform ${
            isDragging ? "duration-0" : "duration-100 ease-out"
          }`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
        />

        {/* Previous Button */}
        {slides.length > 1 && scale === 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              changeSlide(
                currentIndex > 0 ? currentIndex - 1 : slides.length - 1,
              );
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition shadow-2xl cursor-pointer hover:scale-110 z-20"
            title="รูปก่อนหน้า (ลูกศรซ้าย)"
            aria-label="รูปก่อนหน้า"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {slides.length > 1 && scale === 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              changeSlide(
                currentIndex < slides.length - 1 ? currentIndex + 1 : 0,
              );
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition shadow-2xl cursor-pointer hover:scale-110 z-20"
            title="รูปถัดไป (ลูกศรขวา)"
            aria-label="รูปถัดไป"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Bottom Floating Hint */}
        <div className="absolute bottom-2.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-zinc-400 pointer-events-none z-10 transition-opacity">
          {scale > 1
            ? "คลิกลากเพื่อเลื่อนดู • ดับเบิลคลิกเพื่อรีเซ็ต"
            : "ดับเบิลคลิก หรือ เลื่อนเมาส์ เพื่อซูมดูรายละเอียด"}
        </div>
      </div>

      {/* Facebook-style Bottom Filmstrip Thumbnails if 2+ images */}
      {slides.length > 1 && (
        <div
          className="my-2 z-20 flex items-center gap-2 max-w-[92vw] sm:max-w-2xl overflow-x-auto no-scrollbar p-1.5 bg-black/75 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {slides.map((s, idx) => (
            <button
              key={idx}
              ref={(el) => {
                thumbnailRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => changeSlide(idx)}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 transition-all duration-150 cursor-pointer ${
                idx === currentIndex
                  ? " scale-105 opacity-100 shadow-xl"
                  : "opacity-40 hover:opacity-100 hover:scale-102 ring-1 ring-white/15"
              }`}
              title={s.label || `รูปที่ ${idx + 1}`}
            >
              <img
                src={s.url}
                alt=""
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              {s.label && (
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-zinc-300 font-medium truncate px-1 text-center">
                  {s.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
