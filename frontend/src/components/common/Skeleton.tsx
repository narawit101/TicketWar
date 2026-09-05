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
