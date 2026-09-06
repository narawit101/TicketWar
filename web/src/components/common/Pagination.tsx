"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  // ponytail: if only 1 page or invalid total, do not render pagination
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex items-center justify-center gap-1.5 pt-6 select-none ${className}`}
    >
      {/* Previous Page Button */}
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#282828] bg-[#181818] text-[#b3b3b3] hover:text-white hover:bg-[#252525] transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
        title="หน้าก่อนหน้า"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">ก่อนหน้า</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#666666]"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(page);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                isActive
                  ? "bg-[#1ed760] text-black shadow-md shadow-[#1ed760]/20 font-extrabold"
                  : "bg-[#181818] text-[#b3b3b3] hover:text-white hover:bg-[#252525] border border-[#282828]"
              }`}
              title={`หน้าที่ ${pageNum}`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#282828] bg-[#181818] text-[#b3b3b3] hover:text-white hover:bg-[#252525] transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
        title="หน้าถัดไป"
      >
        <span className="hidden sm:inline">ถัดไป</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};
