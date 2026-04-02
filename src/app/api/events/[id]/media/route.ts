import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess(eventId: string, userId: string) {
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
  if (!await checkAccess(id, userId!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const media = await prisma.mediaItem.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(media);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string })?.id;
  if (!await checkAccess(id, userId!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const item = await prisma.mediaItem.create({
    data: { ...body, eventId: id, uploadedById: userId },
  });

  return NextResponse.json(item, { status: 201 });
}
