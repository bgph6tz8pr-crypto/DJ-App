import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = new URL(req.url).searchParams.get("eventId");

  let excludeIds: string[] = [];
  if (eventId) {
    const existing = await prisma.eventMember.findMany({
      where: { eventId },
      select: { userId: true },
    });
    excludeIds = existing.map((m) => m.userId);
  }

  const users = await prisma.user.findMany({
    where: excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {},
    select: { id: true, name: true, email: true, image: true, role: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return NextResponse.json(users);
}
