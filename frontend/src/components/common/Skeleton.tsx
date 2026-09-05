import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-[#252525] rounded-md ${className}`}
      {...props}
    />
  );
};

export const MemberRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#121212] border border-[#282828] animate-pulse">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
          <Skeleton className="h-3.5 w-28 max-w-full rounded" />
          <Skeleton className="h-2.5 w-36 max-w-full rounded bg-[#1f1f1f]" />
        </div>
      </div>
      <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
    </div>
  );
};

export const NotificationItemSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-[#181818] border border-[#262626] animate-pulse space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-3.5 w-3/4 rounded" />
          <Skeleton className="h-2.5 w-1/2 rounded bg-[#1f1f1f]" />
          <Skeleton className="h-2.5 w-1/3 rounded bg-[#1f1f1f]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    </div>
  );
};

export const RoomCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden p-4 sm:p-5 flex flex-col justify-between space-y-4 animate-pulse shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-4/5 rounded-lg" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-44 sm:h-52 w-full rounded-xl" />

      <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
};

export const MediaGridSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 10,
  className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4",
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl bg-[#222222]" />
      ))}
    </div>
  );
};

export const FileRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161616] border border-[#282828] animate-pulse">
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3">
        <Skeleton className="w-11 h-11 rounded-xl bg-[#222222] shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="h-3.5 w-48 max-w-full rounded" />
          <Skeleton className="h-2.5 w-32 max-w-full rounded bg-[#1f1f1f]" />
        </div>
      </div>
      <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
    </div>
  );
};

export const RoomHeaderSkeleton: React.FC = () => {
  return (
    <div className="shrink-0 flex items-start justify-between gap-2.5 sm:gap-4 pb-3.5 border-b border-zinc-800/80 animate-pulse">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 sm:h-7 w-48 sm:w-64 rounded-lg" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
    </div>
  );
};

export const RoomHeroSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 shrink-0 animate-pulse">
      {/* Top Banner Box */}
      <Skeleton className="w-full h-44 sm:h-56 md:h-72 rounded-2xl" />

      {/* Description / Note */}
      <div className="bg-[#181818] border border-[#282828] rounded-2xl p-4 space-y-2">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>

      {/* 3-Col Summary Bar */}
      <div className="grid grid-cols-3 bg-[#181818] border border-[#282828] rounded-2xl py-3 px-2 sm:px-4 text-center">
        <div className="py-1 flex flex-col items-center gap-1.5">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
        </div>
        <div className="border-x border-[#282828] py-1 flex flex-col items-center gap-1.5">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
        </div>
        <div className="py-1 flex flex-col items-center gap-1.5">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
        </div>
      </div>
    </div>
  );
};

export const RoomSeatTasksSkeleton: React.FC = () => {
  return (
    <div className="lg:col-span-4 h-120 sm:h-135 lg:h-full flex flex-col min-h-0 overflow-hidden animate-pulse">
      {/* List Header */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-0.5 mb-2.5">
        <div className="flex items-center gap-1 bg-[#161616] p-0.5 rounded-full border border-[#2a2a2a]">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-hidden space-y-2.5 min-h-0">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3.5 sm:p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-3.5 w-1/2 rounded" />
            </div>
            <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RoomChatSkeleton: React.FC = () => {
  return (
    <div className="lg:col-span-6 h-150 sm:h-170 lg:h-full flex flex-col min-h-0 overflow-hidden">
      <div className="relative bg-zinc-900/70 border border-zinc-800/80 rounded-xl flex flex-col h-full min-h-0 overflow-hidden shadow-sm animate-pulse">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/90 shrink-0">
          <Skeleton className="h-5 w-28 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {/* Incoming message */}
          <div className="flex items-start gap-2.5 max-w-[75%]">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-10 w-48 rounded-2xl rounded-tl-sm bg-[#222222]" />
            </div>
          </div>

          {/* Outgoing message */}
          <div className="flex items-end justify-end gap-2.5">
            <Skeleton className="h-12 w-52 rounded-2xl rounded-tr-sm bg-[#282828]" />
          </div>

          {/* Incoming message */}
          <div className="flex items-start gap-2.5 max-w-[75%]">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-8 w-40 rounded-2xl rounded-tl-sm bg-[#222222]" />
            </div>
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/90 shrink-0">
          <Skeleton className="h-11 w-full rounded-xl bg-[#1e1e1e]" />
        </div>
      </div>
    </div>
  );
};

export const RoomSeatingPlanSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-xl space-y-3.5 shrink-0 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <Skeleton className="h-5 w-36 rounded-md" />
      </div>

      {/* Plan Container */}
      <Skeleton className="w-full h-72 sm:h-96 rounded-xl bg-zinc-950/90" />
    </div>
  );
};
