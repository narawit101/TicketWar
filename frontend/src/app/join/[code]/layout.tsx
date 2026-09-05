import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/date";
import Link from "next/link";
import { TicketWarLogo } from "@/components/common/TicketWarLogo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  if (!code) {
    return {
      title: "คำเชิญเข้าห้องกดบัตร | TicketWar",
    };
  }

  try {
    const room = await prisma.room.findUnique({
      where: { inviteCode: code },
      select: {
        title: true,
        bannerUrl: true,
        seatingPlanUrl: true,
        description: true,
        eventDate: true,
        owner: { select: { name: true } },
      },
    });

    if (!room) {
      return {
        title: "ไม่พบห้องกดบัตร | TicketWar",
        description: "รหัสคำเชิญไม่ถูกต้องหรือห้องนี้อาจถูกลบไปแล้ว",
      };
    }

    const dateStr = room.eventDate
      ? ` วันเวลากดบัตร: ${formatEventDate(room.eventDate)}`
      : "";
    const ownerStr = room.owner?.name ? ` โดย ${room.owner.name}` : "";
    const title = `${room.title} - ชวนร่วมทีมกดบัตร`;
    const description =
      room.description ||
      `ชวนร่วมทีมกดบัตร "${room.title}"${ownerStr}${dateStr} บน TicketWar`;

    // Use poster banner first, fallback to seating plan if available
    const imageUrl = room.bannerUrl || room.seatingPlanUrl || undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: imageUrl
          ? [
              {
                url: imageUrl,
                alt: room.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch (err) {
    console.error("Failed to generate metadata for join room:", err);
    return {
      title: "คำเชิญเข้าห้องกดบัตร | TicketWar",
      description: "ร่วมทีมกดบัตรคอนเสิร์ตบน TicketWar",
    };
  }
}

export default function JoinRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
      {/* Topbar Navigation */}
      <header className="h-16 border-b border-[#252525] bg-[#121212] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <TicketWarLogo />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center">{children}</main>
    </div>
  );
}
