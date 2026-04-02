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
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, taskId } = await params;
  const userId = (session.user as { id?: string })?.id;
  if (!await checkAccess(id, userId!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  // Auto-set completedAt
  if (body.status === "DONE" && !body.completedAt) {
    body.completedAt = new Date();
  } else if (body.status && body.status !== "DONE") {
    body.completedAt = null;
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: body,
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, taskId } = await params;
  const userId = (session.user as { id?: string })?.id;
  if (!await checkAccess(id, userId!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.task.delete({ where: { id: taskId } });
  return NextResponse.json({ success: true });
}
