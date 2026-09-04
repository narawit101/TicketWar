/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselSlide {
  url: string;
  label: "โปสเตอร์" | "ผังที่นั่ง";
  type: "banner" | "seating";
}

interface RoomImageCarouselProps {
  title: string;
  bannerUrl?: string | null;
  seatingPlanUrl?: string | null;
  onExpand?: (index: number) => void;
  className?: string;
}

export const RoomImageCarousel: React.FC<RoomImageCarouselProps> = ({
  title,
  bannerUrl,
  seatingPlanUrl,
  onExpand,
  className = "",
}) => {
  const slides: CarouselSlide[] = [];
  if (bannerUrl) {
    slides.push({ url: bannerUrl, label: "โปสเตอร์", type: "banner" });
  }
  if (seatingPlanUrl) {
    slides.push({ url: seatingPlanUrl, label: "ผังที่นั่ง", type: "seating" });
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || slides[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next
        setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
      } else {
        // swipe right -> prev
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
      }
    }
    touchStartX.current = null;
  };

  return (
    <div
      className={`relative w-full aspect-video rounded-xl overflow-hidden mb-3 border border-[#2a2a2a] bg-[#121212] group/carousel select-none cursor-pointer ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => onExpand?.(currentIndex)}
    >
      {/* Blurred Ambience Background for letterboxing */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-lg opacity-30 scale-110 transition-all duration-300 pointer-events-none"
        style={{ backgroundImage: `url(${currentSlide.url})` }}
      />

      {/* Main Crisp Image */}
      <img
        src={currentSlide.url}
        alt={`${title} - ${currentSlide.label}`}
        className="relative z-10 w-full h-full object-contain transition-transform duration-300 group-hover/carousel:scale-[1.02]"
        loading="lazy"
      />

      {/* Top Overlay Gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 z-10 pointer-events-none" />

      {/* Slide Badge (e.g. 1/2 โปสเตอร์ / 2/2 ผังที่นั่ง) */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
        {/* <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/80 text-white backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-md">
          {currentSlide.type === "seating" ? (
            <Map className="w-3 h-3 text-[#539df5]" />
          ) : (
            <ImageIcon className="w-3 h-3 text-[#1ed760]" />
          )}
          <span>
            {slides.length > 1 ? `${currentIndex + 1}/${slides.length} ` : ""}
            {currentSlide.label}
          </span>
        </span> */}
      </div>

      {/* Expand Icon Button */}
      {/* <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onExpand?.(currentIndex);
        }}
        className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition shadow-md opacity-80 group-hover/carousel:opacity-100"
        title="กดเพื่อดูรูปขนาดใหญ่"
      >
        <Maximize2 className="w-3 h-3" />
      </button> */}

      {/* Carousel Navigation Arrows (if 2+ images) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-sm flex items-center justify-center transition shadow-lg opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 hover:scale-105"
            aria-label="รูปก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-sm flex items-center justify-center transition shadow-lg opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 hover:scale-105"
            aria-label="รูปถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* IG-style Dot Indicators */}
          <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all duration-200 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? "w-4 h-1.5 bg-[#1ed760] shadow-sm"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/80"
                }`}
                aria-label={`ไปยังรูปที่ ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
