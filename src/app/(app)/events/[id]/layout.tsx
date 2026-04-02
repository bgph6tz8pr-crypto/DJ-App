import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { EventNav } from "@/components/layout/event-nav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function EventLayout({ children, params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const userId = (session.user as { id?: string })?.id;

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });

  if (!event) notFound();

  // Check user is a member
  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: userId! } },
  });

  if (!membership) {
    redirect("/events");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <EventNav
        eventId={event.id}
        eventName={event.name}
        eventStatus={event.status}
      />
      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}
