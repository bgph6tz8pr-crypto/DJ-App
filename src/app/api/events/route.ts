import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;

  const memberships = await prisma.eventMember.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          _count: { select: { members: true, tasks: true, mediaItems: true, messages: true } },
          genres: true,
        },
      },
    },
    orderBy: { event: { startDate: "desc" } },
  });

  return NextResponse.json(memberships.map((m) => m.event));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;

  try {
    const body = await req.json();
    const { genres, ...data } = body;

    const event = await prisma.event.create({
      data: {
        ...data,
        createdById: userId,
        genres: genres?.length
          ? { create: genres.map((g: string) => ({ genre: g })) }
          : undefined,
        members: {
          create: [{ userId: userId!, role: "ORGANIZER" }],
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}
