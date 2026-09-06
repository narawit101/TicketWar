<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🎟️ TicketWar Web Application - Agent Instructions & Coding Standards

> **Scope**: The `web/` directory contains the Next.js 16 (App Router + Turbopack + React 19) Full-stack Web Application for the **TicketWar** platform.  
> All AI agents and developers modifying code within this directory **must strictly adhere to these rules and prohibitions 100% without exception**.

---

## 🚫 1. Strict Prohibitions

### ❌ Tailwind CSS v4 Canonical Rules (Zero Deprecated Classes)
- **Never use deprecated Tailwind utility classes**:
  - ❌ **NEVER** `bg-gradient-to-*` ➔ ✅ **MUST USE** `bg-linear-to-*` (e.g., `bg-linear-to-r`, `bg-linear-to-t`)
  - ❌ **NEVER** `break-words` ➔ ✅ **MUST USE** `wrap-break-word`
  - ❌ **NEVER** arbitrary aspect ratios like `aspect-[16/9]` ➔ ✅ **MUST USE** `aspect-video` or `aspect-square`
  - ❌ **NEVER** arbitrary borders/strokes like `h-[1px]`, `stroke-[3]` ➔ ✅ **MUST USE** `h-px`, `stroke-3`
  - ❌ **NEVER** generic bright colors (e.g., plain red, browser blue) ➔ ✅ **MUST USE** Spotify Palette or Tailwind curated tokens (`#1ed760`, `#121212`, `zinc-800`, `rose-600`, `amber-500`)

### ❌ Timezone & Date Conventions (Zero-Shift Guarantee)
- ❌ **NEVER** use `.toISOString().split("T")[0]` on `targetDate` or any Date-only values. Production cloud servers (Vercel/Docker) run in **UTC**, while users are in **Asia/Bangkok (UTC+7)**. Truncating UTC midnight dates causes dates to shift **backward by 1 day**!
- ❌ **NEVER** parse Date-only inputs with `new Date("YYYY-MM-DD")` without explicit timezone handling.
- ✅ **MANDATORY PRACTICES**:
  - **Parsing String to Date**: Use `parseDateInBangkok(dateStr)` from `@/lib/date` (automatically sets time to noon `12:00:00+07:00` to prevent UTC backward day rollover).
  - **Serializing Date to String**: Use `toInputDateValue(date)` from `@/lib/date` (always converts accurately in `Asia/Bangkok` timezone).
  - **Thai Display Formatting**: Use `formatThaiDate(date)` or `formatEventDate(date)`.

### ❌ Serverless Payload & File Upload Guards
- ❌ **NEVER** submit raw, uncompressed image files (> 4.5 MB) directly to Next.js API Routes (violates Vercel Serverless 4.5 MB request body limit).
- ✅ **ALWAYS** compress images client-side via HTML5 Canvas (`processImageFile`) before uploading.

---

## 🎨 2. Spotify Design System Standard

1. **Content-First Darkness**:
   - Deep background: `#121212`
   - Elevated cards & containers: `#181818` or `#1f1f1f`
   - Primary brand accent: Spotify Green (`#1ed760`) — reserved exclusively for primary action buttons, active toggles, and highlights.
   - Semantic color tokens:
     - **Success / Primary Active**: `#1ed760` (Spotify Green)
     - **Danger / Destructive**: `#f3727f` or `rose-600` (Red)
     - **Warning / Archive**: `#ffa42b` or `amber-500` (Amber/Orange)
     - **Announcement / Info**: `#539df5` (Blue)

2. **Corner Radius Principles ("Subtle vs Full")**:
   - **Subtle (`rounded-lg` to `rounded-xl` / 8px–12px)**: Form inputs, textareas, cards, containers, and modals.
   - **Full Pill (`rounded-full`)**: Strictly reserved for **Action Buttons (`btn-pill`)** and **Status Badges / Tags**.

3. **Anti-Cutoff Modal Layout Pattern**:
   - Header pinned at top: `shrink-0 border-b border-[#252525]`
   - Body scrollable: `max-h-[90vh] overflow-y-auto flex-1 custom-scrollbar`
   - Footer pinned at bottom: `shrink-0 border-t border-[#252525]`

---

## 🔌 3. Architecture & Service Specifications

1. **Next.js & Database (Prisma ORM)**:
   - `web/prisma/schema.prisma` is the Single Source of Truth for the database schema.
   - Supports both Pooled Connection (Port 6543) in production and Direct Session (Port 5432) for migrations.
   - Run `npx prisma generate` after any schema edits.
   - All API queries must be bounded with `take: 100` and specific `select` fields to prevent memory leaks and query bloat.

2. **Real-time WebSocket Relay**:
   - Standalone Socket.IO relay server resides in the `websocket/` directory.
   - Client connects via `NEXT_PUBLIC_SOCKET_URL`.
   - Incorporates exponential reconnection backoff to seamlessly handle Render free-tier cold starts (50–60s).

3. **Cloud Storage (Cloudinary)**:
   - Enforce segregated folder storage:
     - `ticketwar/chat` for in-room chat images.
     - `ticketwar/files` for PDF documents and ticket receipts.

---

## ⚡ 4. Code Principles (Ponytail Philosophy)

- **YAGNI (You Aren't Gonna Need It)**: Implement only what is directly requested. Never introduce unrequested abstractions or third-party dependencies.
- **Native Web Platform First**: Prioritize native browser APIs (HTML5 Canvas for image resizing, standard `ClipboardEvent` for clipboard pasting, Web Audio API for synthetic alert sounds).
- **Zero Boilerplate**: Keep code concise, readable, and structured as deep modules that are easy to test and maintain.
