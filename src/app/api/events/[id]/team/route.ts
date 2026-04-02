import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string })?.id;

  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: userId! } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await prisma.eventMember.findMany({
    where: { eventId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          bio: true,
          instagram: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string })?.id;

  const callerMembership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: userId! } },
  });
  if (!callerMembership || !["ORGANIZER", "MARKETING"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Only organizers can add team members." }, { status: 403 });
  }

  const { email, role } = await req.json();

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    return NextResponse.json(
      { error: "No account found with that email. They need to register first." },
      { status: 404 }
    );
  }

  const existing = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: targetUser.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This person is already on the team." },
      { status: 409 }
    );
  }

  const member = await prisma.eventMember.create({
    data: { eventId: id, userId: targetUser.id, role: role || "STAFF" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, role: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}
