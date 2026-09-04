import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users/search?query=...&roomId=...&currentUserId=...
// Lightweight bounded user search with membershipStatus enrichment
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";
    const roomId = searchParams.get("roomId")?.trim();
    const currentUserId = searchParams.get("currentUserId")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Clean query (strip leading @ if present)
    const cleanQuery = query.startsWith("@") ? query.slice(1) : query;

    const memberUserIds = new Set<string>();
    const pendingInviteeIds = new Set<string>();

    if (roomId) {
      const [room, members, pendingInvites] = await Promise.all([
        prisma.room.findUnique({
          where: { id: roomId },
          select: { createdById: true },
        }),
        prisma.roomMember.findMany({
          where: { roomId },
          select: { userId: true },
        }),
        prisma.roomInvitation.findMany({
          where: { roomId, status: "PENDING" },
          select: { inviteeId: true },
        }),
      ]);

      if (room) {
        memberUserIds.add(room.createdById);
      }
      members.forEach((m) => memberUserIds.add(m.userId));
      pendingInvites.forEach((i) => pendingInviteeIds.add(i.inviteeId));
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          currentUserId ? { id: { not: currentUserId } } : {},
          {
            OR: [
              { email: { contains: cleanQuery, mode: "insensitive" } },
              { name: { contains: cleanQuery, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      take: 8,
    });

    const enrichedUsers = users.map((u) => {
      let membershipStatus: "MEMBER" | "INVITED" | null = null;
      if (memberUserIds.has(u.id)) {
        membershipStatus = "MEMBER";
      } else if (pendingInviteeIds.has(u.id)) {
        membershipStatus = "INVITED";
      }
      return {
        ...u,
        membershipStatus,
      };
    });

    return NextResponse.json({ users: enrichedUsers });
  } catch (error: unknown) {
    console.error("[GET /api/users/search error]:", error);
    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดในการค้นหาผู้ใช้",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
