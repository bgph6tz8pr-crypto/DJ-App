import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getEventMembership(eventId: string, userId: string) {
  return prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string })?.id;
  const membership = await getEventMembership(id, userId!);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      genres: true,
      djs: { orderBy: { order: "asc" } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, role: true } },
        },
      },
      scheduleItems: { orderBy: { order: "asc" } },
      _count: { select: { tasks: true, messages: true, mediaItems: true, scheduleItems: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string })?.id;
  const membership = await getEventMembership(id, userId!);
  if (!membership || !["ORGANIZER"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const event = await prisma.event.update({ where: { id }, data: body });
    return NextResponse.json(event);
  } catch (err) {
    console.error("Update event error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string })?.id;
  const membership = await getEventMembership(id, userId!);
  if (!membership || membership.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
