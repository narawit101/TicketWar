# 🎟️ TicketWar - Realtime Concert Ticket War Room

> **TicketWar** is a real-time concert ticketing coordination platform engineered according to the **Spotify Design System** (Content-First Darkness). It empowers friend groups and ticketing teams to plan seat targets, eliminate booking conflicts, broadcast instant audio shoutouts, share payment/ticket proofs (PDF & images), and track acquisition progress live during ticket drops.

---

## 📁 Clean Architecture & Deep Modules

```
task/
├── prisma/                 # 🗄️ Single Source of Truth (Database Schema & PostgreSQL Client)
│   └── schema.prisma       # Schema supporting Pooled (6543) & Direct (5432) connections
│
├── frontend/               # 🌐 Next.js 16 (React 19, Tailwind CSS v4 Turbopack, API Routes)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (protected)/# Protected Routes (Streamlined Lobby Dashboard & War Rooms)
│   │   │   ├── login/      # Spotify-styled Auth Page
│   │   │   └── api/        # 100% Real PostgreSQL API routes (Bounded queries with take: 100)
│   │   ├── components/     # UI Components (RoomCard, RoomFilters, RoomEmptyState, Avatar, Modals)
│   │   ├── context/        # Auth Context (Session & Auth state)
│   │   ├── lib/            # Prisma Client, Hooks (useClickOutside), Cloudinary & Socket Connector
│   │   └── types/          # TypeScript Domain Interfaces
│   └── package.json
│
├── backend/                # 🔌 Standalone WebSocket Server (Node.js + Socket.io)
│   ├── server.js           # Realtime Socket.io relay server (Zero DB bottleneck, low RAM)
│   └── package.json        # Production ready ("start": "node server.js")
│
├── prototypes/             # High-resolution UI Mockups & Implementation Plans
├── package.json            # Root runner scripts (npm run dev / npm run server / prisma)
├── CONTEXT.md              # System Architecture, Deep Modules & Deployment Specifications
├── DESIGN.md               # Spotify Design System & Tailwind v4 Canonical Standard
└── README.md
```

---

## 🛠️ Technology Stack (Free-Tier Hardened)

- **Frontend**: [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + Tailwind CSS v4 (Deployable on **Vercel Hobby Tier** with client-side 3.5 MB file size guards).
- **Backend & Realtime**: [Node.js](https://nodejs.org) + [Socket.io](https://socket.io) for persistent WebSocket communication (Deployable on **Render Web Service** with exponential backoff handling 50–60s cold starts).
- **Database**: [PostgreSQL (Supabase)](https://supabase.com) managed via [Prisma ORM](https://www.prisma.io) — **Supports Transaction Connection Pooler (Port 6543) and Direct Migrations (Port 5432)**.
- **Cloud Storage**: [Cloudinary](https://cloudinary.com) with folder segregation (`ticketwar/chat` for images, `ticketwar/files` for PDF receipts).
- **Audio Alerts**: Zero-dependency Web Audio API synthesizing immediate alert pings directly in-browser.
- **Deep Modules**: Standardized `<Avatar />` component, `<RoomCard />` with localized menus, and `useClickOutside` hook.
- **Styling Standard**: Spotify Design System tokens ([`DESIGN.md`](./DESIGN.md)) strictly adhering to **Tailwind CSS v4 Canonical Classes** (`tailwindcss(suggestCanonicalClasses)`).

---

## 🎨 Design & Coding Standard (Tailwind CSS Canonical Only)

In accordance with [`DESIGN.md`](./DESIGN.md), all styling across the codebase must strictly follow **Tailwind CSS v4 Canonical Suggestions** (`tailwindcss(suggestCanonicalClasses)`):

- **Canonical Gradients**: Write `bg-linear-to-r`, `bg-linear-to-b`, etc. (never deprecated `bg-gradient-to-*`)
- **Canonical Word Wrapping**: Write `wrap-break-word` (never deprecated `break-words`)
- **Canonical Aspect Ratios**: Write `aspect-video`, `aspect-square` (avoid arbitrary `aspect-[16/9]`)
- **Canonical Strokes & Separators**: Write `stroke-3`, `h-px`, `w-px` (avoid `stroke-[3]`, `h-[1px]`)
- **Radius Guideline ("มนน้อย vs มนมาก")**:
  - **มนน้อย (`rounded-lg` / 8px)**: Standard for all form inputs, textareas, cards, and modal containers.
  - **มนมาก (`rounded-full` / 9999px)**: Reserved strictly for action buttons (`btn-pill`) and status badges.
- **Anti-Cutoff Modal Pattern**:
  - Header pinned at top (`shrink-0 border-b border-[#252525]`), modal body scrollable (`max-h-[90vh] overflow-y-auto flex-1`), footer pinned at bottom (`border-t border-[#252525]`).

---

## ✨ Key Features

1. **Fast-Action Seat Target Tracker**:
   - 1-click status toggle (`Available` ➔ `Pending Payment` ➔ `Completed`).
   - Auto-calculated remaining tickets (`quantityNeeded - quantitySecured`).
   - Instant contingency notes and live audit trail ("Updated by @user X seconds ago").
2. **Real-time Live War Room Chat**:
   - Bi-directional Socket.io messaging with low-latency delivery.
   - Quick Audio Shoutouts (`🎉 ได้บัตรแล้ว!`, `⚠️ คิวหลุด!`, `🆘 ขอกำลังเสริม!`).
   - Multi-format proof sharing: automatic image lightbox viewing and PDF document file cards with direct download.
   - Guarded against oversized uploads (< 3.5 MB) to ensure smooth Vercel serverless operations.
3. **Decomposed Room Dashboard**:
   - Streamlined page controller with modular components (`<RoomCard />`, `<RoomFilters />`, `<RoomEmptyState />`).
   - Localized dropdown action menus preventing whole-dashboard re-renders.
4. **Room Sharing & Lifecycle**:
   - Share room code or direct invite link with 1-click copy and QR code.
   - Post-sale room closure: Archive (read-only) or Purge (permanent deletion).
5. **Input Limits & Data Integrity**:
   - Enforced client-side and server-side length limits (e.g. room title 80 chars, notes 500–800 chars, quantity 1–10).
6. **Minimal Spotify Footer**:
   - Distraction-free, single-line footer with fast links to major ticketing platforms.

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Ensure `.env` at the root has your PostgreSQL connection strings and Cloudinary keys:
```env
DATABASE_URL="postgresql://postgres:042545@localhost:5432/ticketwar_db"
DIRECT_URL="postgresql://postgres:042545@localhost:5432/ticketwar_db"
PORT=4000
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
```

> **For Supabase Deployment:**
> - Set `DATABASE_URL` to the **Transaction Pooler (Port 6543)**.
> - Set `DIRECT_URL` to the **Direct Connection (Port 5432)**.

### 2. Database Commands (Run Once from Root)
```bash
# Push schema to PostgreSQL database:
npx prisma db push

# Validate schema integrity:
npx prisma validate

# Open visual Prisma Studio (GUI):
npx prisma studio
```

### 3. Running Frontend & Backend (Direct from Root)

```bash
# Terminal 1: Run Next.js Frontend (http://localhost:3000)
npm run dev

# Terminal 2: Run WebSocket Backend with Watch Mode (http://localhost:4000)
npm run server
```

---

## 🧪 Code Quality & Verification

```bash
# Run ESLint (100% clean - 0 errors, 0 warnings)
npm run lint

# Build production bundle (Turbopack)
npm run build
```
