/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { getYouTubeVideoId } from "./chatUtils";

export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  mediaType?: "video" | "music" | "website";
}

interface LinkPreviewCardProps {
  url: string;
  isMe?: boolean;
  isAttached?: boolean;
}

// Client-side cache to avoid repeated requests within the session
const clientCache = new Map<string, LinkPreviewData>();

export const fetchLinkPreview = async (
  url: string,
): Promise<LinkPreviewData | null> => {
  if (clientCache.has(url)) return clientCache.get(url)!;

  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    try {
      const ytRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`,
      );
      if (ytRes.ok) {
        const oembed = await ytRes.json();
        const ytData: LinkPreviewData = {
          url,
          title: oembed.title || "วิดีโอ YouTube",
          description: oembed.author_name || undefined,
          image:
            oembed.thumbnail_url ||
            `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          siteName: "YouTube",
          mediaType: "video",
        };
        clientCache.set(url, ytData);
        return ytData;
      }
    } catch {
      // fallback to internal API
    }
  }

  try {
    const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const json = await res.json();
      if (json && (json.title || json.image)) {
        clientCache.set(url, json);
        return json;
      }
    }
  } catch {
    // Silently return null
  }

  return null;
};

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({
  url,
  isMe,
  isAttached = false,
}) => {
  const ytId = getYouTubeVideoId(url);
  const isYouTube = !!ytId;

  const [data, setData] = useState<LinkPreviewData | null>(() => {
    if (clientCache.has(url)) return clientCache.get(url)!;
    if (isYouTube && ytId) {
      return {
        url,
        title: "กำลังโหลดข้อมูลวิดีโอ...",
        image: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        siteName: "YouTube",
        mediaType: "video",
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(!clientCache.has(url));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (clientCache.has(url)) {
      return;
    }

    let isMounted = true;
    fetchLinkPreview(url).then((resData) => {
      if (isMounted) {
        if (resData) setData(resData);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [url]);

  // Loading shimmer state
  if (loading && !data) {
    if (isAttached) {
      return (
        <div className="w-full bg-[#242424] p-3.5 animate-pulse flex items-center gap-3 border-t border-black/10">
          <div className="w-12 h-12 rounded-xl bg-[#2e2e2e] shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3 bg-[#2e2e2e] rounded-md w-3/4" />
            <div className="h-2.5 bg-[#2a2a2a] rounded-md w-1/2" />
          </div>
        </div>
      );
    }
    return (
      <div
        className={`mt-1.5 w-full max-w-xs sm:max-w-sm rounded-2xl bg-[#242424] border border-[#333333] p-3.5 animate-pulse flex items-center gap-3 ${
          isMe ? "ml-auto" : "mr-auto"
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-[#2e2e2e] shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="h-3 bg-[#2e2e2e] rounded-md w-3/4" />
          <div className="h-2.5 bg-[#2a2a2a] rounded-md w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const displayImage = !imageError ? data.image : undefined;
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = data.siteName || "link";
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={
        isAttached
          ? "block w-full bg-[#242424] border-t border-black/10 dark:border-white/10 text-left select-none transition-colors"
          : `mt-1.5 block w-full max-w-xs sm:max-w-sm rounded-2xl overflow-hidden bg-[#242424] border border-[#333333] shadow-md text-left select-none ${
              isMe ? "ml-auto" : "mr-auto"
            }`
      }
    >
      {/* Cover / Thumbnail Preview */}
      {displayImage ? (
        <div className="relative w-full aspect-video bg-[#181818] overflow-hidden">
          <img
            src={displayImage}
            alt={data.title || "ตัวอย่างลิงก์"}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      {/* Content Details: สีเทาตัวหนังสือขาว เรียบๆ */}
      <div className="p-3.5 space-y-1 bg-[#242424]">
        {/* Domain (only shown if no cover image) */}
        {!displayImage && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#b3b3b3] uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-[#1ed760] shrink-0" />
            <span className="truncate">{data.siteName || domain}</span>
          </div>
        )}

        {/* Title: White text, clean */}
        <h4 className="text-xs sm:text-[13px] font-semibold text-white line-clamp-2 leading-snug">
          {data.title || domain}
        </h4>

        {/* Subtitle / Channel: Grey text */}
        {data.description && (
          <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 leading-normal">
            {data.description.replace(/^ช่อง\s*/, "")}
          </p>
        )}
      </div>
    </a>
  );
};
