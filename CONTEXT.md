# TicketWar - Project Context & Architecture Reference

> **Project Name:** TicketWar  
> **Core Mission:** Real-time concert and event ticket war coordination platform. Provides live seat target tracking, instant team chat, rapid alert shoutouts, and transparent audit logging to eliminate duplicate bookings and payment confusion during ticket drops.

---

## 1. Problem Statement & Solution

### Real-world Challenges During Ticket Drops:
1. **Lack of Real-time Coordination**: Friends queuing for concert tickets usually coordinate via messaging apps (e.g. LINE/WhatsApp) or voice calls. Without a unified live dashboard, members end up competing for the same zone, duplicating checkout attempts, or missing high-priority backup seats.
2. **Payment Window Confusion**: Once someone secures tickets, ticket providers grant a strict 10–15 minute payment window. Other teammates often don't know whether the seats were successfully paid for, timed out, or if they should switch to alternative zones.
3. **Chaotic Post-Sale Settlement**: Receipts, seat confirmations, and queue screenshots end up scattered across group chats, complicating financial reconciliation and cost splitting.

### The TicketWar Solution:
1. **Fast-Action Seat Target Tracker (1-Click Toggles)**:
   - Structured seat targets: Zone/Seat, Event Date/Round, Price (THB), Needed vs. Secured vs. Remaining tickets (auto-calculated).
   - Backup Strategy (Note): Instant contingency notes (e.g., *"If VIP-A sells out, immediately fall back to Zone B Row 1"*).
   - 3 Fast-Action Statuses: `Available` (ว่าง), `Pending Payment` (รอจ่าย), `Completed` (เสร็จสิ้น).
   - Live Audit Trail: Explicit records of who modified what and how many seconds ago.
2. **Live War Chat, Multi-Media Attachments & Quick Shoutouts**:
   - Real-time text chat paired with high-priority audio alert buttons (`🎉 Got It!`, `⚠️ Queue Dropped!`, `🆘 Need Backup!`).
   - Web Audio API zero-latency synthetic audio pings that alert all room members instantly.
   - **Image & PDF File Sharing**:
     - Images auto-uploaded to Cloudinary folder `ticketwar/chat` with client compression.
     - PDF documents auto-uploaded to Cloudinary folder `ticketwar/files`.
     - Clean Spotify file cards displaying original file name, PDF badge, direct download via `...` action menu, and lightbox preview for images (no redundant text bubble).
     - Guarded with client-side 3.5 MB file size limit to prevent Vercel 4.5 MB request body limit overflows.
3. **Flexible Room Lifecycle**:
   - Room owners can share invite links and QR codes via unified Share Modal.
   - Post-sale closure options: **"Archive"** (read-only mode for reviewing tickets, prices, and receipts) or **"Purge/Delete"** (permanently wipe all room data for privacy).

---

## 2. Architecture & Technology Stack (Save-Cost & Free-Tier Hardening)

Engineered for ultra-low latency, zero operating cost, and hardened for free-tier services:

| Layer | Technology | Role & Free-Tier Optimization |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 16 (App Router) + React 19** | Deployed on **Vercel** (Free Hobby Tier). Optimized with Turbopack for sub-second builds. Protected against 4.5 MB body limit with client-side file guards. |
| **Styling** | **Tailwind CSS v4** | Implements the **Spotify Design System** ([`DESIGN.md`](./DESIGN.md)) strictly using canonical classes (`tailwindcss(suggestCanonicalClasses)`). |
| **Backend & Realtime** | **Node.js + Socket.io** | Deployed on **Render** (Free Web Service) as a pure WebSocket relay server. Built with exponential backoff (`reconnectionDelayMax: 5000`) for Render 50–60s cold starts. |
| **Database** | **PostgreSQL (Supabase)** | Supabase Free Tier (500MB database). Supports **Transaction Connection Pooler (Port 6543)** via `DATABASE_URL` and direct migrations (Port 5432) via `DIRECT_URL`. |
| **Storage** | **Cloudinary** | Automatic client-side/server-side WebP compression and separated folders (`ticketwar/chat` for images, `ticketwar/files` for PDFs). |
| **Audio** | **Web Audio API** | Synthesizes immediate alert chimes directly in-browser with zero external asset requests. |

---

## 3. Design System & Codebase Architecture (Deep Modules & Ponytail)

Adopted directly from [`DESIGN.md`](./DESIGN.md) and Codebase Design:
- **Content-First Darkness**:
  - Deep Base Layer: `#121212`
  - Card Surfaces / Chat: `#181818` (Surface Level 1)
  - Interactive Surfaces / Inputs: `#1f1f1f`
  - Borders & Separators: `#252525`, `#383838`, `#4d4d4d`
- **Semantic Status Colors**:
  - `Completed`: **Spotify Green** (`#1ed760`) with black text
  - `Pending Payment`: **Spotify Warning Orange** (`#ffa42b`) with black text
  - `Available`: **Dark Pill** (`#1f1f1f`) with silver text (`#b3b3b3`) and `#7c7c7c` border
- **Border Radius Specification ("มนน้อย vs มนมาก")**:
  - **มนน้อย (8px / `rounded-lg`)**: ALL form inputs, textareas, cards, containers, and dialog body. Textareas must never use pill radius.
  - **มนมาก (Pill 9999px / `rounded-full`)**: Action buttons (`btn-pill`), status chips, and circular controls (`btn-circle` 50%).
- **Deep Reusable Components**:
  - `<Avatar />`: Compact interface (`src`, `name`, `size`, `className`) with automatic fallback to user initials and Spotify dark styling.
  - `<RoomCard />`: Encapsulates room information, carousel, lightbox trigger, and localized action menu. Eliminates whole-page re-renders.
  - `<RoomFilters />`: Encapsulates ownership tabs, status pills, and custom date picker.
  - `<RoomEmptyState />`: Contextual empty state banner with one-click filter reset.
  - `useClickOutside`: Custom hook for dropdowns and popovers, eliminating memory leaks and repetitive event listeners.
- **Tailwind CSS v4 Canonical Rules**:
  - Always write canonical classes (`bg-linear-to-*`, `wrap-break-word`, `aspect-video`, `h-px`, `stroke-3`, `scheme-dark`).

---

## 4. Repository & File Structure

```
task/
├── .env.example              # Sample environment configuration file
├── CONTEXT.md                # Project context, architecture & guidelines (This file)
├── DESIGN.md                 # Spotify Design System specifications & Tailwind v4 canonical rules
├── README.md                 # Setup, installation, and usage instructions
├── database.dbml             # Database Markup Language for https://dbdiagram.io
├── package.json              # Root runner scripts (concurrent frontend + backend + prisma)
├── prisma/
│   └── schema.prisma         # Single Source of Truth (Database Schema, Pooler & Direct URLs)
├── backend/
│   ├── server.js             # Standalone WebSocket Server (Node.js + Socket.io)
│   └── package.json          # Production start script ("start": "node server.js")
├── frontend/                 # Next.js 16 (React 19 + Tailwind CSS v4 + Turbopack)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (protected)/
│   │   │   │   ├── page.tsx  # Decomposed Lobby Dashboard Controller (~400 lines)
│   │   │   │   └── rooms/[id]/ # Live War Room Dashboard
│   │   │   ├── login/        # Spotify-styled Auth Page
│   │   │   ├── api/          # 100% Real PostgreSQL API routes (bounded queries with take: 100)
│   │   │   ├── globals.css   # Spotify tokens & Tailwind CSS v4 configuration
│   │   │   └── layout.tsx    # Next.js Root Layout with Toaster and AuthProvider
│   │   ├── components/
│   │   │   ├── Avatar.tsx          # Deep universal avatar with initials fallback
│   │   │   ├── RoomCard.tsx        # Self-contained room card with localized action dropdown
│   │   │   ├── RoomFilters.tsx     # Toolbar with ownership tabs, status and date filter
│   │   │   ├── RoomEmptyState.tsx  # Contextual empty state banner
│   │   │   ├── CreateRoomModal.tsx # New War Room creation modal (pinned header, max-h 90vh)
│   │   │   ├── EditRoomModal.tsx   # Edit War Room details modal
│   │   │   ├── EditTaskModal.tsx   # Add/Edit Seat Target modal
│   │   │   ├── LiveChat.tsx        # Realtime chat feed, shoutouts, PDF & image file cards
│   │   │   ├── SeatTaskCard.tsx    # Seat tracking card with 1-click toggles and progress
│   │   │   ├── ShareRoomModal.tsx  # Unified room share modal (invite link & code)
│   │   │   ├── MembersModal.tsx    # Room members list & ownership controls
│   │   │   ├── RoomImageCarousel.tsx # Poster and seating plan carousel
│   │   │   ├── ImageLightboxModal.tsx # Fullscreen image zoom viewer with download
│   │   │   └── Footer.tsx          # Minimal Spotify-styled universal footer
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Authentication context (JWT / session)
│   │   ├── lib/
│   │   │   ├── audio.ts            # Zero-dependency Web Audio API sound alerts
│   │   │   ├── cloudinary.ts       # Cloudinary upload helpers (chat vs files folders)
│   │   │   ├── hooks.ts            # Shared hooks (useClickOutside)
│   │   │   ├── prisma.ts           # Shared Prisma database instance
│   │   │   └── socket.ts           # Socket.io client with exponential backoff
│   │   └── types/
│   │       └── index.ts            # TypeScript interfaces (Room, SeatTask, Message, Member)
│   └── package.json
└── prototypes/               # High-fidelity prototype mockups
```

---

## 5. Free-Tier Production Deployment Checklist

1. **Supabase (Database)**:
   - Provide `DATABASE_URL` with **Transaction Pooler (Port 6543)** in Vercel environment variables:
     `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Provide `DIRECT_URL` with **Direct Session Connection (Port 5432)** for schema migrations:
     `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
2. **Render (WebSocket Relay)**:
   - Build command: `npm install`
   - Start command: `node server.js`
   - Set environment variables: `PORT=4000`, `FRONTEND_URL=https://your-vercel-domain.vercel.app`
3. **Vercel (Frontend Next.js)**:
   - Root directory: `frontend`
   - Environment variables: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SOCKET_URL=https://your-render-app.onrender.com`, Cloudinary credentials.
4. **Cloudinary**:
   - Provide `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
