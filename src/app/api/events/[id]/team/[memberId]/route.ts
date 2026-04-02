import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await params;
  const userId = (session.user as { id?: string })?.id;

  const callerMembership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: userId! } },
  });
  if (!callerMembership || callerMembership.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role } = await req.json();
  const updated = await prisma.eventMember.update({
    where: { id: memberId },
    data: { role },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await params;
  const userId = (session.user as { id?: string })?.id;

  const callerMembership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: userId! } },
  });
  if (!callerMembership || callerMembership.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.eventMember.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}
