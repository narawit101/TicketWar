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
3. **Flexible Room Lifecycle**:
   - Room owners can share invite links and QR codes via unified Share Modal.
   - Post-sale closure options: **"Archive"** (read-only mode for reviewing tickets, prices, and receipts) or **"Purge/Delete"** (permanently wipe all room data for privacy).

---

## 2. Architecture & Technology Stack (Save-Cost Philosophy)

Engineered for ultra-low latency, zero or minimal operating cost, and maximum utilization of free-tier services:

| Layer | Technology | Role & Cost-Saving Justification |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 16 (App Router) + React 19** | Deployed on **Vercel** (Free Hobby Tier). Optimized with Turbopack for sub-second builds. |
| **Styling** | **Tailwind CSS v4** | Implements the **Spotify Design System** ([`DESIGN.md`](./DESIGN.md)) strictly using canonical classes (`tailwindcss(suggestCanonicalClasses)`). |
| **Backend & Realtime** | **Node.js + Socket.io** | Deployed on **Render / Railway** free/hobby tiers for persistent, bi-directional WebSocket channels (`/backend`). |
| **Database** | **PostgreSQL (Supabase)** | Supabase Free Tier (500MB database, connection pooling) managed with **Prisma ORM** at project root (`/prisma`). |
| **Storage** | **Cloudinary** | Automatic client-side/server-side WebP compression and separated folders (`ticketwar/chat` for images, `ticketwar/files` for PDFs). |
| **Audio** | **Web Audio API** | Synthesizes immediate alert chimes directly in-browser with zero external asset requests. |

---

## 3. Design System & Aesthetics (Spotify-Inspired)

Adopted directly from [`DESIGN.md`](./DESIGN.md):
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
- **Anti-Cutoff Modal Architecture**:
  - Pinned header (`bg-[#1a1a1a] border-b border-[#252525]`), `max-h-[90vh] flex flex-col`, scrollable form body (`overflow-y-auto flex-1`), pinned footer (`border-t border-[#252525]`).
- **Tailwind CSS v4 Canonical Rules**:
  - Always write canonical classes (`bg-linear-to-*`, `wrap-break-word`, `aspect-video`, `h-px`, `stroke-3`, `scheme-dark`).
- **Minimal Footer**:
  - Single-line Spotify dark footer (`#121212`, `border-t border-[#252525]`, brand icon, fast ticket links, copyright).

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
│   └── schema.prisma         # Single Source of Truth (Database Schema & PostgreSQL Client)
├── backend/
│   ├── server.js             # Standalone WebSocket Server (Node.js + Socket.io)
│   └── package.json
├── frontend/                 # Next.js 16 (React 19 + Tailwind CSS v4 + Turbopack)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (protected)/  # Protected routes (Lobby, Rooms dashboard, Join room)
│   │   │   ├── login/        # Spotify-styled Auth Page
│   │   │   ├── api/          # 100% Real PostgreSQL API routes (auth, rooms, tasks, messages)
│   │   │   ├── globals.css   # Spotify tokens & Tailwind CSS v4 configuration
│   │   │   └── layout.tsx    # Next.js Root Layout with Toaster and AuthProvider
│   │   ├── components/
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
│   │   │   ├── prisma.ts           # Shared Prisma database instance
│   │   │   └── socket.ts           # Socket.io client connector
│   │   └── types/
│   │       └── index.ts            # TypeScript interfaces (Room, SeatTask, Message, Member)
│   └── package.json
└── prototypes/               # High-fidelity prototype mockups
```

---

## 5. Extensibility & Setup Checklist

1. **Connecting Live Database**:
   - Provide `DATABASE_URL` and `DIRECT_URL` in `.env`
   - Run `npx prisma db push` to synchronize tables with PostgreSQL
2. **Connecting Live WebSocket Client**:
   - Point `NEXT_PUBLIC_SOCKET_URL` to your hosted Node.js instance on Render/Railway (default: `http://localhost:4000`)
3. **Connecting Cloudinary**:
   - Fill in `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, and `CLOUDINARY_API_KEY` in `.env`
   - Images automatically route to `ticketwar/chat` and PDFs to `ticketwar/files`

