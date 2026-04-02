import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string })?.id;
  const { name, bio, phone, instagram } = await req.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, bio, phone, instagram },
    select: { id: true, name: true, email: true, role: true, bio: true, phone: true, instagram: true },
  });

  return NextResponse.json(user);
}
