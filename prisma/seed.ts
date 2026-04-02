import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo users
  const hashedPassword = await bcrypt.hash("demo1234", 10);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@demo.com" },
    update: {},
    create: {
      email: "organizer@demo.com",
      name: "Alex Rivera",
      password: hashedPassword,
      role: "ORGANIZER",
      bio: "Event organizer with 10+ years in the nightlife industry",
      instagram: "@alexrivera_events",
    },
  });

  const dj = await prisma.user.upsert({
    where: { email: "dj@demo.com" },
    update: {},
    create: {
      email: "dj@demo.com",
      name: "DJ Nexus",
      password: hashedPassword,
      role: "DJ",
      bio: "House & Techno specialist. Resident DJ at Club Vortex.",
      instagram: "@djnexus",
    },
  });

  const photographer = await prisma.user.upsert({
    where: { email: "photo@demo.com" },
    update: {},
    create: {
      email: "photo@demo.com",
      name: "Maya Chen",
      password: hashedPassword,
      role: "PHOTOGRAPHER",
      bio: "Event & nightlife photographer",
      instagram: "@mayachen_photo",
    },
  });

  const marketer = await prisma.user.upsert({
    where: { email: "marketing@demo.com" },
    update: {},
    create: {
      email: "marketing@demo.com",
      name: "Jordan Blake",
      password: hashedPassword,
      role: "MARKETING",
      bio: "Digital marketing & social media specialist",
    },
  });

  // Create a demo event
  const event = await prisma.event.create({
    data: {
      name: "NEON NIGHTS Vol. 3",
      tagline: "The underground returns",
      description:
        "The most anticipated underground electronic music event of the season. Three floors, five DJs, one unforgettable night.",
      venue: "Club Vortex",
      address: "420 Industrial Blvd",
      city: "Los Angeles",
      state: "CA",
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      doorsOpen: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000),
      status: "MARKETING",
      ticketUrl: "https://tickets.example.com/neon-nights-3",
      capacity: 500,
      price: 25,
      dresscode: "All black / neon accents",
      ageLimit: "21+",
      createdById: organizer.id,
      genres: {
        create: [
          { genre: "House" },
          { genre: "Techno" },
          { genre: "Tech House" },
          { genre: "Minimal" },
        ],
      },
      djs: {
        create: [
          {
            name: "DJ Nexus",
            bio: "House & Techno specialist",
            instagramHandle: "@djnexus",
            setTime: "11:00 PM",
            setDuration: 90,
            genres: JSON.stringify(["House", "Tech House"]),
            order: 1,
            featured: true,
          },
          {
            name: "VOID",
            bio: "Dark techno from Berlin",
            instagramHandle: "@void_techno",
            setTime: "12:30 AM",
            setDuration: 120,
            genres: JSON.stringify(["Techno", "Industrial"]),
            order: 2,
            featured: true,
          },
          {
            name: "Prism",
            bio: "Melodic house & minimal",
            instagramHandle: "@prism_sounds",
            setTime: "2:30 AM",
            setDuration: 90,
            genres: JSON.stringify(["Melodic House", "Minimal"]),
            order: 3,
          },
        ],
      },
      members: {
        create: [
          { userId: organizer.id, role: "ORGANIZER" },
          { userId: dj.id, role: "DJ" },
          { userId: photographer.id, role: "PHOTOGRAPHER" },
          { userId: marketer.id, role: "MARKETING" },
        ],
      },
      tasks: {
        create: [
          {
            title: "Confirm venue contract",
            status: "DONE",
            priority: "HIGH",
            category: "LOGISTICS",
            assigneeId: organizer.id,
          },
          {
            title: "Design flyer",
            status: "IN_PROGRESS",
            priority: "HIGH",
            category: "MARKETING",
            assigneeId: marketer.id,
          },
          {
            title: "Post event on Instagram",
            status: "TODO",
            priority: "MEDIUM",
            category: "MARKETING",
            assigneeId: marketer.id,
          },
          {
            title: "Sound check schedule",
            status: "TODO",
            priority: "HIGH",
            category: "TECHNICAL",
            assigneeId: dj.id,
          },
          {
            title: "Book photographer",
            status: "DONE",
            priority: "MEDIUM",
            category: "LOGISTICS",
            assigneeId: organizer.id,
          },
          {
            title: "Set up ticket sales",
            status: "DONE",
            priority: "URGENT",
            category: "LOGISTICS",
            assigneeId: organizer.id,
          },
          {
            title: "Create Facebook event",
            status: "TODO",
            priority: "MEDIUM",
            category: "MARKETING",
            assigneeId: marketer.id,
          },
          {
            title: "Coordinate with security",
            status: "TODO",
            priority: "HIGH",
            category: "LOGISTICS",
            assigneeId: organizer.id,
          },
        ],
      },
      scheduleItems: {
        create: [
          {
            title: "Doors Open",
            type: "DOORS",
            startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000),
            color: "#3b82f6",
            order: 0,
          },
          {
            title: "Opening Set - Prism",
            type: "DJ_SET",
            startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
            assignee: "Prism",
            color: "#7c3aed",
            order: 1,
          },
          {
            title: "Main Set - DJ Nexus",
            type: "DJ_SET",
            startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
            endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            assignee: "DJ Nexus",
            color: "#ec4899",
            order: 2,
          },
          {
            title: "Headliner - VOID",
            type: "DJ_SET",
            startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
            assignee: "VOID",
            color: "#f59e0b",
            order: 3,
          },
          {
            title: "Closing",
            type: "GENERAL",
            startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
            color: "#64748b",
            order: 4,
          },
        ],
      },
      messages: {
        create: [
          {
            userId: organizer.id,
            content: "Welcome to the NEON NIGHTS Vol. 3 team channel! Let's make this one legendary. 🎉",
            type: "ANNOUNCEMENT",
          },
          {
            userId: marketer.id,
            content: "Working on the flyer design now. Should have drafts ready by tomorrow.",
          },
          {
            userId: dj.id,
            content: "Confirmed! I'll be bringing my full 4-deck setup. Need to coordinate load-in time.",
          },
          {
            userId: photographer.id,
            content: "I'm on board! Will need access from 9 PM for setup shots before the crowd arrives.",
          },
        ],
      },
    },
  });

  console.log("✅ Seed complete!");
  console.log("\nDemo accounts:");
  console.log("  organizer@demo.com / demo1234 (Organizer)");
  console.log("  dj@demo.com / demo1234 (DJ)");
  console.log("  photo@demo.com / demo1234 (Photographer)");
  console.log("  marketing@demo.com / demo1234 (Marketing)");
  console.log(`\nCreated event: ${event.name} (id: ${event.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
