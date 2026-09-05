"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses: Record<
  NonNullable<AvatarProps["size"]>,
  { box: string; text: string }
> = {
  xxs: { box: "w-4 h-4", text: "text-[8px]" },
  xs: { box: "w-6 h-6", text: "text-[10px]" },
  sm: { box: "w-8 h-8", text: "text-xs" },
  md: { box: "w-9 h-9", text: "text-sm" },
  lg: { box: "w-12 h-12", text: "text-base" },
  xl: { box: "w-20 h-20", text: "text-2xl" },
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = "sm",
  className = "",
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { box, text } = sizeClasses[size];
  const initial = (name || "U").trim().charAt(0).toUpperCase();

  const isError = Boolean(src && failedSrc === src);

  if (src && !isError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailedSrc(src)}
        className={`${box} rounded-full object-cover border border-zinc-700 shrink-0 select-none ${className}`}
      />
    );
  }

  return (
    <div
      className={`${box} rounded-full bg-[#252525] border border-zinc-700 text-zinc-200 ${text} font-bold flex items-center justify-center shrink-0 select-none ${className}`}
      aria-label={name}
    >
      {initial}
    </div>
  );
};
