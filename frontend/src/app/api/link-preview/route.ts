import { NextRequest, NextResponse } from "next/server";

interface LinkPreviewData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  mediaType?: "video" | "music" | "website";
}

// In-memory cache for fast repeated lookups (TTL 10 mins)
const previewCache = new Map<string, { data: LinkPreviewData; exp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_SIZE = 300;

function cleanString(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetaContent(html: string, property: string): string | undefined {
  // Support both property="og:..." and name="twitter:..."
  const regexes = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ];

  for (const regex of regexes) {
    const match = html.match(regex);
    if (match && match[1]) {
      return cleanString(match[1]);
    }
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    const formatted = urlParam.startsWith("http://") || urlParam.startsWith("https://")
      ? urlParam
      : `https://${urlParam}`;
    targetUrl = new URL(formatted);
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const normalizedUrl = targetUrl.toString();

  // Check cache
  const cached = previewCache.get(normalizedUrl);
  if (cached && cached.exp > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const hostname = targetUrl.hostname.toLowerCase();

  // 1. YouTube specialized fast path (via oEmbed)
  const isYouTube =
    hostname.includes("youtube.com") ||
    hostname.includes("youtu.be");

  if (isYouTube) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`,
        {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          signal: AbortSignal.timeout(3500),
        }
      );

      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        const data: LinkPreviewData = {
          url: normalizedUrl,
          title: cleanString(oembed.title) || "วิดีโอ YouTube",
          description: oembed.author_name ? `โดย ${oembed.author_name}` : undefined,
          image: oembed.thumbnail_url || undefined,
          siteName: "YouTube",
          mediaType: "video",
        };

        if (previewCache.size >= MAX_CACHE_SIZE) previewCache.clear();
        previewCache.set(normalizedUrl, { data, exp: Date.now() + CACHE_TTL_MS });
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to generic fetch below if oembed fails
    }
  }

  // 2. Generic OpenGraph HTML scraper
  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "th,en-US;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return NextResponse.json({
        url: normalizedUrl,
        title: targetUrl.hostname,
        siteName: targetUrl.hostname.replace(/^www\./, ""),
      });
    }

    // Read first chunk (max ~100KB) to avoid downloading giant files
    const reader = response.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let bytesRead = 0;
      while (bytesRead < 100000) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.length;
        html += decoder.decode(value, { stream: true });
        if (html.includes("</head>")) break;
      }
      reader.cancel();
    } else {
      html = await response.text();
    }

    const ogTitle =
      extractMetaContent(html, "og:title") ||
      extractMetaContent(html, "twitter:title");
    const ogDesc =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "twitter:description") ||
      extractMetaContent(html, "description");
    let ogImage =
      extractMetaContent(html, "og:image") ||
      extractMetaContent(html, "twitter:image") ||
      extractMetaContent(html, "thumbnail");
    const siteName =
      extractMetaContent(html, "og:site_name") ||
      targetUrl.hostname.replace(/^www\./, "");

    // Fallback title from <title> tag
    let pageTitle = ogTitle;
    if (!pageTitle) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        pageTitle = cleanString(titleMatch[1]);
      }
    }

    // Resolve relative image URLs
    if (ogImage && !ogImage.startsWith("http://") && !ogImage.startsWith("https://")) {
      try {
        ogImage = new URL(ogImage, normalizedUrl).toString();
      } catch {
        ogImage = undefined;
      }
    }

    const data: LinkPreviewData = {
      url: normalizedUrl,
      title: pageTitle || targetUrl.hostname,
      description: ogDesc,
      image: ogImage,
      siteName: siteName || targetUrl.hostname,
      mediaType: isYouTube ? "video" : undefined,
    };

    if (previewCache.size >= MAX_CACHE_SIZE) previewCache.clear();
    previewCache.set(normalizedUrl, { data, exp: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(data);
  } catch {
    // If timeout or blocked, return basic domain fallback so UI still looks good
    return NextResponse.json({
      url: normalizedUrl,
      title: targetUrl.hostname,
      siteName: targetUrl.hostname.replace(/^www\./, ""),
    });
  }
}
