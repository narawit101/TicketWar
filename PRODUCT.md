# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are friend groups, fandoms, concertgoers, and organized ticketing teams in Thailand and Southeast Asia who coordinate simultaneously across multiple devices during high-stakes ticket drops (e.g., ThaiTicketMajor, AllTicket, Eventpop).

## Product Purpose

TicketWar is a real-time concert ticketing coordination platform and live "war room". It eliminates duplicate bookings, checkout conflicts, payment window timeouts (10–15 minute limits), and chaotic post-sale financial settlement by providing a unified live mission control.

## Positioning

Unlike generic group chats (LINE, WhatsApp, Discord) where critical updates get buried, TicketWar provides:
- **Fast-Action Seat Target Tracker**: 1-click status toggles (`Available` -> `Pending Payment` -> `Completed`) with real-time remaining quota calculations and fallback zone contingency notes.
- **Urgent Real-time Audio Shoutouts**: Zero-latency synthetic Web Audio alerts (`🎉 ได้บัตรแล้ว!`, `⚠️ คิวหลุด!`, `🆘 ขอกำลังเสริม!`) that penetrate noisy ticket drop sessions.
- **Proof Sharing & Audit Trail**: Real-time image and PDF document sharing for ticket receipts, paired with transparent "who updated what and when" audit logs.
- **Settlement & Lifecycle**: Post-sale Room Archive (read-only review of prices, seats, and receipts) or Room Purge for privacy.

## Operating Context

- **High-Stress Drops**: Users operate during rapid 5–15 minute ticket drops under heavy server queue loads.
- **Split-Screen Browsing**: Often viewed side-by-side with official ticketing sites on desktop or on mobile while waiting in virtual waiting rooms.
- **Timezone Sensitivity**: All ticket drop dates and rounds are anchored to Thailand Time (`Asia/Bangkok`, UTC+7).

## Capabilities and Constraints

- **Architecture**: Next.js 16 (App Router + Turbopack + React 19) frontend paired with a standalone Node.js + Socket.io relay server.
- **Database**: PostgreSQL (Supabase) via Prisma ORM, utilizing Transaction Connection Pooler (port 6543) and bounded queries (`take: 100`).
- **Serverless Limits**: Strictly enforced client-side image compression (< 3.5 MB) to prevent Vercel 4.5 MB request body limit overflows.
- **Date Handling**: Zero-shift date convention enforced via `@/lib/date` (`parseDateInBangkok`, `toInputDateValue`).
- **Input Constraints**: Defined character limits on titles, notes, and prices to prevent UI overflows and database spam.

## Brand Commitments

- **Spotify Design System Standard**: Content-First Darkness (`#121212` background, `#181818` / `#1f1f1f` surfaces) with Spotify Green (`#1ed760`) reserved exclusively for primary actions, active highlights, and success states.
- **Radius Rule ("มนน้อย vs มนมาก")**: Strict distinction between subtle radius (`rounded-lg` / 8px) for cards, inputs, and modals, versus full pill (`rounded-full`) reserved strictly for action buttons and status chips.
- **Anti-Cutoff Layouts**: Pinned headers and footers with scrollable inner bodies on all dialogs and drawers.
- **Tone**: Focused, operational, calm, and distraction-free. Bilingual support (Thai / English) tailored for local ticketing culture.

## Evidence on Hand

- `CONTEXT.md`: System architecture, deployment strategy, and domain workflows.
- `DESIGN.md`: Spotify design system token specifications and Tailwind CSS v4 canonical mappings.
- `README.md`: Getting started guide and feature breakdown.
- `prisma/schema.prisma`: Production PostgreSQL domain schema.
- `web/`: Next.js 16 application source code.
- `websocket/`: Standalone Socket.io relay service.

## Product Principles

1. **Zero-Latency Coordination**: Every second counts during a ticket war; updates and alerts must propagate instantly without requiring manual page refreshes.
2. **Prevent Duplicate Purchases**: Clearly signal who has claimed or paid for which seats so teammates never double-book or abandon backup zones prematurely.
3. **Content-First Darkness**: Reduce visual fatigue and prioritize readability of seat zones, countdowns, and prices above decorative elements.
4. **Native Web Platform First**: Leverage standard browser capabilities (Canvas, AudioContext, Clipboard) for resilient and lightweight performance.

## Accessibility & Inclusion

- High contrast text on dark backgrounds (`#ffffff` and `#b3b3b3` against `#121212` / `#181818`).
- Auditory alerts backed by visual toasts and live chat messages for hearing-impaired users.
- Accessible keyboard focus rings and clear touch targets for high-pressure mobile usage.
