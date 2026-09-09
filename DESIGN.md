---
name: TicketWar
description: Real-time concert ticket booking coordination platform with Spotify-inspired dark aesthetic
colors:
  primary: "#1ed760"
  primary-hover: "#1cd05a"
  background-deep: "#121212"
  surface-card: "#181818"
  surface-elevated: "#1f1f1f"
  surface-highlight: "#242424"
  surface-modal: "#1a1a1a"
  border-subtle: "#252525"
  border-default: "#282828"
  border-highlight: "#383838"
  text-primary: "#ffffff"
  text-secondary: "#b3b3b3"
  text-muted: "#a0a0a0"
  text-dim: "#71717a"
  status-success: "#1ed760"
  status-warning: "#ffa42b"
  status-danger: "#f3727f"
  status-info: "#539df5"
typography:
  display:
    fontFamily: "Kanit, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Kanit, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Kanit, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Kanit, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Kanit, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "8px 18px"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: "16px"
  modal:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
---

# TicketWar Design System (Spotify Standard)

## Overview

**TicketWar** is a mission-critical, real-time ticket war coordination platform built for teams racing to secure high-demand concert tickets (ThaiTicketMajor, AllTicket, Eventpop).

The design philosophy is **"Content-First Darkness"** inspired by Spotify:
- **Atmospheric Theater**: The UI recedes into deep charcoal (`#121212`, `#181818`, `#1f1f1f`) so that event posters, seat status badges, and team communication glow with contrast and clarity.
- **High-Stakes Focus**: During intense 10:00 AM ticket drops, anxiety and adrenaline run high. Visual clutter, extraneous animations, and ambiguous controls are strictly eliminated.
- **Ponytail Philosophy (Zero-Boilerplate)**: Built natively with HTML5, standard React hooks, Tailwind CSS v4, and Lucide icons. Every line of design code earns its place.
- **Zero-Emoji Discipline**: Emojis create visual noise and inconsistent rendering across operating systems. The platform enforces crisp Lucide icons and clear typography.

---

## Colors

The color system relies on Spotify's curated achromatic spectrum paired with high-clarity functional highlights.

### 1. Surfaces & Backgrounds
- **Deep Background (`#121212`)**: The foundational canvas for all pages.
- **Elevated Card Surface (`#181818`)**: Primary containers, seat task cards, room cards.
- **Interactive Elevated Surface (`#1f1f1f` / `#242424`)**: Chat input bars, hover states, secondary button backgrounds.
- **Modal Header/Footer (`#1a1a1a`)**: Pinned header and footer areas in modal dialogs.
- **Dividers & Subtle Borders (`#252525` / `#282828` / `#333333`)**: Clean separators without harsh contrast.

### 2. Typography & Contrast (WCAG 2.1 AA Compliant)
- **Primary Text (`#ffffff`)**: Headings, active values, button labels (`Contrast 18:1`).
- **Secondary Text (`#b3b3b3`)**: Metadata, event dates, room descriptions (`Contrast 7.4:1`).
- **Muted & Form Placeholder (`#a0a0a0`)**: Search placeholders, inactive tabs, captions (`Contrast 5.4:1 > 4.5:1 AA`).
- **Subtle Timestamp (`#71717a` / `text-zinc-500`)**: Chat message timestamps.
- *(Note: Raw grays like `#666666` and `#777777` are forbidden due to poor contrast on dark backgrounds).*

### 3. Functional & Semantic Accents
- **Spotify Green (`#1ed760`)**: Reserved exclusively for primary action buttons (`btn-pill-green`), active toggles, verified ticket secured states, and live link previews. Never used decoratively.
- **Danger / Urgent (`#f3727f` / `rose-500`)**: Action cancellation, undo triggers, kick member actions, "ขอกำลังเสริม" indicators.
- **Warning / Hold (`#ffa42b` / `amber-500`)**: Pending payment states, backup queue warnings, "คิวหลุด" alerts.
- **Info / Announcement (`#539df5`)**: Room role badges (Member), informational highlights.

---

## Typography

### Font Stack
- **Primary Font**: `Kanit` (`--font-kanit`), fallback `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Thai & Latin Harmony**: Kanit delivers exceptional legibility for both Thai script and Latin ticketing abbreviations (e.g. `VIP-A`, `A2`, `Zone B`).

### Type Scale & Weight Hierarchy

| Role | Font / Weight | Size | Line Height | Tracking | Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | Kanit Bold (700) | 24px–32px | 1.2 | -0.02em | Hero titles, landing headers |
| **Headline** | Kanit Bold (700) | 18px–20px | 1.3 | normal | Modal headers, room card titles |
| **Title / Subhead** | Kanit Semibold (600) | 15px–16px | 1.4 | normal | Task location, section subheads |
| **Body Standard** | Kanit Regular (400) | 14px (0.875rem) | 1.5 | normal | Chat messages, descriptions |
| **Action Label** | Kanit Bold (700) | 12px–13px | 1.0 | 0.05em | Button labels, pills (`uppercase` where fitting) |
| **Caption / Meta** | Kanit Medium (500) | 11px–12px | 1.4 | normal | Time stamps, member counts, queue badges |
| **Code / Shortcut** | Monospace (mono) | 10px–11px | 1.0 | normal | Keyboard accelerator badges (`Alt+1`, `5s`) |

---

## Layout

### 1. Spacing Rhythm & Responsive Grids
- **Base Grid Unit**: `8px` (`p-2`, `p-4`, `p-6`, `gap-3`, `gap-4`).
- **Dashboard Grid**: Responsive card grid transitioning from 1 column (`<640px`) to 2 columns (`md:grid-cols-2`) and 3 columns (`lg:grid-cols-3`).
- **Live Chat Layout**: Split view in room detail (`2-column` on desktop: Left Seat Tasks, Right Live Chat).

### 2. Anti-Cutoff Modal Architecture Standard
Every modal dialog follows a rigid 3-zone structure guaranteeing that headers, close buttons (`[X]`), and action buttons are **never cropped on mobile screens**:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
  <div className="bg-[#181818] border border-[#282828] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
    {/* Zone 1: Pinned Header */}
    <div className="px-6 py-4 border-b border-[#252525] bg-[#1a1a1a] shrink-0 flex items-center justify-between">
      <h2 className="text-base font-bold text-white">หัวข้อ</h2>
      <button type="button" className="p-1.5 rounded-lg text-[#888888] hover:text-white">✕</button>
    </div>
    {/* Zone 2: Scrollable Body */}
    <form className="p-6 space-y-4 overflow-y-auto text-sm flex-1 custom-scrollbar">
      {/* Form Controls */}
    </form>
    {/* Zone 3: Pinned Footer */}
    <div className="px-6 py-3 border-t border-[#252525] bg-[#181818] shrink-0 flex items-center justify-end gap-2.5">
      <button type="button" className="btn-pill btn-pill-dark">ยกเลิก</button>
      <button type="submit" className="btn-pill btn-pill-green">บันทึก</button>
    </div>
  </div>
</div>
```

### 3. Touch Target Ergonomics (Mobile 44px Standard)
- All interactive icons, menu toggles (`MoreVertical`), and action controls on touch devices enforce a minimum click target of **44×44px** (using `min-w-10 min-h-10 sm:min-w-9 sm:min-h-9` or negative margin hit area extensions).

### 4. Minimal Single-Line Footer
- All dashboard pages feature the unified minimalist footer:
  - Background: `#121212` with `border-t border-[#252525]`, compact `py-5 px-4 md:px-8`.
  - Left: TW Green Icon Badge + `TicketWar`.
  - Center: Nav links (`ห้องแชท`, `ThaiTicketMajor`, `AllTicket`, `Eventpop`).
  - Right: `© 2026 TicketWar`.

---

## Elevation & Depth

TicketWar relies on dark tonal layering and heavy shadows rather than harsh borders to establish hierarchy.

| Level | Surface Token | Shadow / Treatment | Usage |
| :--- | :--- | :--- | :--- |
| **Base (0)** | `#121212` | None | Window background, deep container |
| **Card (1)** | `#181818` | `border border-[#282828]` | Room cards, seat tasks, chat bubble |
| **Elevated (2)** | `#1f1f1f` / `#242424` | `shadow-md border border-[#333333]` | Hover cards, search pills, floating chips |
| **Overlay (3)** | `#1a1a1a` | `shadow-2xl` (`rgba(0,0,0,0.5) 0px 8px 24px`) | Modal dialogs, dropdown menus, lightboxes |
| **Glass (Sticky)** | `rgba(18,18,18,0.8)` | `backdrop-blur-md border-b border-[#252525]` | Sticky room header, chat action bar |

---

## Shapes

The design system enforces the **"Subtle vs Full Pill"** geometric principle:

1. **Subtle Rounded (`rounded-lg` / 8px to `rounded-xl` / 12px)**:
   - Reserved strictly for **containers, cards, textareas, form inputs, and modal shells**.
   - Form inputs and textareas must **never** be full pills.
2. **Full Pill (`rounded-full` / 9999px)**:
   - Reserved strictly for **Action Buttons (`btn-pill`)**, **Status Badges**, **Tags**, and the standalone **Global Search Input**.
3. **Circular (`rounded-full` / 50%)**:
   - Avatars, icon-only buttons (`btn-circle`), counter badges.

---

## Components

### 1. Fast-Action Undo Guardrail (5-Second Countdown)
When a user clicks "ได้บัตรแล้ว" or confirms payment during high-stress drops, an optimistic toast displays an active 5-second countdown before persisting to DB & relaying WebSocket audio alarms:
- **Visual Countdown**: Live seconds ticker (`5s` ➔ `4s` ➔ `3s` ➔ `2s` ➔ `1s`).
- **Progress Depletion Bar**: Continuous `#1ed760` bar shrinking from 100% to 0% over 5,000ms.
- **Lucide Icons**: `<Ticket />` for seat secured, `<CreditCard />` for payment, `<Undo2 />` on the undo button. Zero emojis.
- **Instant Rollback**: Clicking "เลิกทำ" immediately aborts the timer, restores optimistic state, and shows a neutral confirmation toast.

### 2. Live Chat & Center Alert Banners
- **Center Alert Pill**: System shoutouts (`ได้บัตรแล้ว`, `คิวหลุด`, `ขอกำลังเสริม`, `เข้ามาแล้ว`) render as centered neutral pills (`bg-zinc-800/90 border border-zinc-700/60 rounded-full px-4 py-1.5`).
- **Sender Attribution**: Shouts automatically prefix the sender (`iceXD: ขอกำลังเสริม!`) so the whole team instantly knows who is calling.
- **Quiet Elegance**: No flashy neon backgrounds or emojis. Clean typography and monospace timestamp.

### 3. Keyboard Accelerators for Power Users
- `Alt+1` ➔ Broadcasts `"ได้บัตรแล้ว!"`
- `Alt+2` ➔ Broadcasts `"คิวหลุด!"`
- `Alt+3` ➔ Broadcasts `"ขอกำลังเสริม!"`
- Subtle, quiet quick shoutout chips placed above the chat input with monospace shortcut tags (`Alt+1`, `Alt+2`, `Alt+3`).

### 4. Seat Task Card
- Displays zone name (`targetLocation`), backup location (`backupLocation`), ticket price, and target/secured quantity counters.
- Single-click action button (`+1 ได้บัตร`) with active visual feedback.
- Assigned member avatar stack with remove and reassign capability.

### 5. Form Validation & Safety Guardrails
Strict field limits prevent layout breakage and database overflows:
- Room Title: `maxLength={80}`
- Room Description: `maxLength={800}`
- Ticket URL: `maxLength={500}`
- Target Location / Zone: `maxLength={50}`
- Task Notes: `maxLength={500}`
- Ticket Price: `min={0}` `max={999999}` (THB)
- Quantity: `min={1}` `max={10}`

---

## Do's and Don'ts

### Do
- ✅ **Do** use Tailwind CSS v4 Canonical Classes (`bg-linear-to-*`, `wrap-break-word`, `aspect-video`, `h-px`, `stroke-3`).
- ✅ **Do** enforce WCAG AA text contrast ratio > 4.5:1 (`text-[#ffffff]`, `text-[#b3b3b3]`, `text-[#a0a0a0]`).
- ✅ **Do** respect `@media (prefers-reduced-motion: reduce)` by disabling aggressive scaling and bounce effects.
- ✅ **Do** handle dates using Bangkok timezone (`parseDateInBangkok`, `toInputDateValue`) to prevent UTC zero-shift bugs.
- ✅ **Do** compress images on client canvas before uploading to serverless APIs.
- ✅ **Do** use Lucide icons (`<Ticket />`, `<CreditCard />`, `<Crown />`, `<Users />`) instead of emojis.

### Don't
- ❌ **Don't** use emojis anywhere in system messages, alerts, role tags, or toasts.
- ❌ **Don't** use deprecated Tailwind classes (`bg-gradient-to-*`, `break-words`, `aspect-[16/9]`).
- ❌ **Don't** use low-contrast grays (`#666666`, `#777777`) on dark surfaces.
- ❌ **Don't** use pill radius on form inputs or cards (inputs are always `rounded-lg`).
- ❌ **Don't** use decorative Spotify Green — reserve green strictly for active CTAs and ticket secured states.
- ❌ **Don't** use `.toISOString().split("T")[0]` on Date-only values.
