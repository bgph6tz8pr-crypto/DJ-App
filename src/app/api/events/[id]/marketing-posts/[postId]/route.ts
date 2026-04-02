import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess(eventId: string, userId: string) {
  return prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, postId } = await params;
  const userId = (session.user as { id?: string })?.id;
  if (!await checkAccess(id, userId!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const post = await prisma.marketingPost.update({ where: { id: postId }, data: body });
  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, postId } = await params;
  const userId = (session.user as { id?: string })?.id;
  if (!await checkAccess(id, userId!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.marketingPost.delete({ where: { id: postId } });
  return NextResponse.json({ success: true });
}
