import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description: "Create a new task for the event",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Optional task description" },
        priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], description: "Task priority level" },
        category: { type: "string", description: "Category (e.g. Venue, Marketing, Technical, Logistics)" },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_event",
    description: "Update event details such as description, status, venue info, ticket URL, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        tagline: { type: "string" },
        description: { type: "string" },
        status: { type: "string", enum: ["PLANNING", "MARKETING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] },
        venue: { type: "string" },
        address: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        capacity: { type: "number" },
        price: { type: "number" },
        ticketUrl: { type: "string" },
        dresscode: { type: "string" },
        ageLimit: { type: "string", enum: ["", "18+", "21+", "25+"] },
        isPublic: { type: "boolean" },
      },
      required: [],
    },
  },
  {
    name: "create_marketing_post",
    description: "Draft a social media post for the event",
    input_schema: {
      type: "object" as const,
      properties: {
        platform: { type: "string", enum: ["Instagram", "Twitter", "Facebook", "TikTok", "LinkedIn"], description: "Social media platform" },
        content: { type: "string", description: "Post caption/content" },
        hashtags: { type: "string", description: "Hashtags to include" },
        notes: { type: "string", description: "Internal notes about this post" },
        scheduledAt: { type: "string", description: "ISO datetime to schedule posting (optional)" },
      },
      required: ["platform", "content"],
    },
  },
  {
    name: "add_dj",
    description: "Add a DJ or artist to the event lineup",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "DJ/artist name" },
        bio: { type: "string", description: "Short artist bio" },
        instagramHandle: { type: "string", description: "Instagram handle (include @)" },
        setTime: { type: "string", description: "Scheduled set time (e.g. '10:00 PM')" },
        setDuration: { type: "number", description: "Set duration in minutes" },
        featured: { type: "boolean", description: "True if this is the headliner" },
      },
      required: ["name"],
    },
  },
  {
    name: "add_schedule_item",
    description: "Add an item to the day-of event schedule",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Schedule item title" },
        type: { type: "string", enum: ["GENERAL", "SET", "BREAK", "SOUNDCHECK", "DOORS", "ANNOUNCEMENT"], description: "Item type" },
        startTime: { type: "string", description: "Start time in HH:MM 24-hour format" },
        endTime: { type: "string", description: "End time in HH:MM 24-hour format (optional)" },
        assignee: { type: "string", description: "Person responsible for this item" },
        description: { type: "string", description: "Additional details" },
      },
      required: ["title", "startTime"],
    },
  },
];

interface ToolInput {
  title?: string;
  description?: string;
  priority?: string;
  category?: string;
  dueDate?: string;
  platform?: string;
  content?: string;
  hashtags?: string;
  notes?: string;
  scheduledAt?: string;
  name?: string;
  bio?: string;
  instagramHandle?: string;
  setTime?: string;
  setDuration?: number;
  featured?: boolean;
  startTime?: string;
  endTime?: string;
  assignee?: string;
  type?: string;
  [key: string]: unknown;
}

interface ActionResult {
  type: string;
  title: string;
  id?: string;
}

async function executeTool(
  toolName: string,
  input: ToolInput,
  eventId: string,
  eventDate: string
): Promise<{ data: unknown; action: ActionResult }> {
  switch (toolName) {
    case "create_task": {
      const { dueDate, ...rest } = input;
      const task = await prisma.task.create({
        data: {
          title: rest.title!,
          description: rest.description,
          priority: rest.priority ?? "MEDIUM",
          category: rest.category,
          eventId,
          dueDate: dueDate ? new Date(`${dueDate}T12:00:00.000Z`) : undefined,
        },
      });
      return { data: task, action: { type: "create_task", title: `Created task: ${task.title}`, id: task.id } };
    }

    case "update_event": {
      const updateData: Record<string, unknown> = {};
      const editableFields = ["name", "tagline", "description", "status", "venue", "address", "city", "state", "capacity", "price", "ticketUrl", "dresscode", "ageLimit", "isPublic"];
      for (const field of editableFields) {
        if (field in input && input[field] !== undefined) {
          updateData[field] = input[field];
        }
      }
      const event = await prisma.event.update({ where: { id: eventId }, data: updateData });
      const fields = Object.keys(updateData).join(", ");
      return { data: event, action: { type: "update_event", title: `Updated event: ${fields}` } };
    }

    case "create_marketing_post": {
      const { scheduledAt, ...rest } = input;
      const post = await prisma.marketingPost.create({
        data: {
          platform: rest.platform!,
          content: rest.content!,
          hashtags: rest.hashtags,
          notes: rest.notes,
          eventId,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        },
      });
      return { data: post, action: { type: "create_marketing_post", title: `Drafted ${post.platform} post`, id: post.id } };
    }

    case "add_dj": {
      const count = await prisma.eventDJ.count({ where: { eventId } });
      const dj = await prisma.eventDJ.create({
        data: {
          name: input.name!,
          bio: input.bio,
          instagramHandle: input.instagramHandle,
          setTime: input.setTime,
          setDuration: input.setDuration,
          featured: input.featured ?? false,
          eventId,
          order: count,
        },
      });
      return { data: dj, action: { type: "add_dj", title: `Added DJ: ${dj.name}`, id: dj.id } };
    }

    case "add_schedule_item": {
      const count = await prisma.scheduleItem.count({ where: { eventId } });
      const item = await prisma.scheduleItem.create({
        data: {
          title: input.title!,
          type: input.type ?? "GENERAL",
          description: input.description,
          assignee: input.assignee,
          startTime: new Date(`${eventDate}T${input.startTime}:00.000Z`),
          endTime: input.endTime ? new Date(`${eventDate}T${input.endTime}:00.000Z`) : undefined,
          eventId,
          order: count,
        },
      });
      return { data: item, action: { type: "add_schedule_item", title: `Added to schedule: ${item.title}` } };
    }

    default:
      return { data: { error: "Unknown tool" }, action: { type: "unknown", title: "Unknown action" } };
  }
}

function buildSystemPrompt(event: {
  name: string; status: string; tagline?: string | null; description?: string | null;
  startDate: Date; endDate?: Date | null; doorsOpen?: Date | null;
  venue?: string | null; address?: string | null; city?: string | null; state?: string | null;
  capacity?: number | null; price?: number | null; ticketUrl?: string | null;
  dresscode?: string | null; ageLimit?: string | null; isPublic: boolean;
  genres: Array<{ genre: string }>;
  djs: Array<{ name: string; featured: boolean; setTime?: string | null; setDuration?: number | null; instagramHandle?: string | null; bio?: string | null }>;
  members: Array<{ role: string; user: { name?: string | null; email: string } }>;
  tasks: Array<{ title: string; status: string; priority: string; category?: string | null }>;
  scheduleItems: Array<{ title: string; type: string; startTime: Date; assignee?: string | null }>;
}) {
  const lines: string[] = [];
  lines.push(`You are an AI assistant embedded in a DJ event management platform, helping manage the event "${event.name}".`);
  lines.push("");
  lines.push("You have full context about this event and can both answer questions AND take actions (create tasks, draft posts, update event details, add DJs, add schedule items). Be proactive — when asked to do something, use the appropriate tool(s) to actually do it, then explain what you did.");
  lines.push("");
  lines.push("## Current Event");
  lines.push(`- **Name:** ${event.name}`);
  lines.push(`- **Status:** ${event.status}`);
  if (event.tagline) lines.push(`- **Tagline:** ${event.tagline}`);
  if (event.description) lines.push(`- **Description:** ${event.description}`);
  lines.push(`- **Start:** ${event.startDate.toISOString()}`);
  if (event.endDate) lines.push(`- **End:** ${event.endDate.toISOString()}`);
  if (event.doorsOpen) lines.push(`- **Doors Open:** ${event.doorsOpen.toISOString()}`);
  if (event.venue) lines.push(`- **Venue:** ${[event.venue, event.city, event.state].filter(Boolean).join(", ")}`);
  if (event.address) lines.push(`- **Address:** ${event.address}`);
  if (event.capacity) lines.push(`- **Capacity:** ${event.capacity}`);
  if (event.price != null) lines.push(`- **Ticket Price:** $${event.price}`);
  if (event.ticketUrl) lines.push(`- **Ticket URL:** ${event.ticketUrl}`);
  if (event.dresscode) lines.push(`- **Dress Code:** ${event.dresscode}`);
  if (event.ageLimit) lines.push(`- **Age Limit:** ${event.ageLimit}`);
  lines.push(`- **Public:** ${event.isPublic ? "Yes" : "No"}`);

  if (event.genres.length > 0) {
    lines.push(`- **Genres:** ${event.genres.map((g) => g.genre).join(", ")}`);
  }

  if (event.djs.length > 0) {
    lines.push("");
    lines.push("## DJ Lineup");
    event.djs.forEach((dj) => {
      lines.push(`- **${dj.name}**${dj.featured ? " (Headliner)" : ""}${dj.setTime ? ` @ ${dj.setTime}` : ""}${dj.setDuration ? ` (${dj.setDuration}min)` : ""}`);
      if (dj.instagramHandle) lines.push(`  Instagram: ${dj.instagramHandle}`);
    });
  }

  if (event.members.length > 0) {
    lines.push("");
    lines.push("## Team");
    event.members.forEach((m) => {
      lines.push(`- ${m.user.name ?? m.user.email} (${m.role})`);
    });
  }

  if (event.tasks.length > 0) {
    lines.push("");
    lines.push("## Tasks");
    const byStatus: Record<string, typeof event.tasks> = {};
    event.tasks.forEach((t) => { (byStatus[t.status] ??= []).push(t); });
    ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"].forEach((s) => {
      if (!byStatus[s]?.length) return;
      lines.push(`### ${s}`);
      byStatus[s].forEach((t) => lines.push(`- [${t.priority}] ${t.title}${t.category ? ` (${t.category})` : ""}`));
    });
  }

  if (event.scheduleItems.length > 0) {
    lines.push("");
    lines.push("## Day-Of Schedule");
    event.scheduleItems
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .forEach((item) => {
        const h = item.startTime.getUTCHours();
        const m = item.startTime.getUTCMinutes().toString().padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        lines.push(`- ${h12}:${m} ${ampm} — ${item.title} (${item.type})${item.assignee ? ` · ${item.assignee}` : ""}`);
      });
  }

  lines.push("");
  lines.push("## Guidelines");
  lines.push("- When creating tasks, pick sensible priorities and categories.");
  lines.push("- For marketing posts, write engaging copy that fits the platform style.");
  lines.push("- Confirm what actions you took and what fields were set.");
  lines.push("- If asked to set up ticketing, update the ticketUrl and capacity fields.");
  lines.push("- Today's date context: " + new Date().toUTCString());

  return lines.join("\n");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file." })}\n\ndata: ${JSON.stringify({ type: "done" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id?: string })?.id;

  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: userId! } },
  });
  if (!membership) return new Response("Forbidden", { status: 403 });

  const body = await req.json() as { messages: Array<{ role: string; content: string }> };
  const { messages: incomingMessages } = body;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      genres: true,
      djs: { orderBy: { order: "asc" } },
      members: { include: { user: { select: { name: true, email: true } } } },
      tasks: { orderBy: [{ status: "asc" }, { createdAt: "asc" }] },
      scheduleItems: { orderBy: [{ order: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!event) return new Response("Not found", { status: 404 });

  const systemPrompt = buildSystemPrompt(event);
  const eventDate = event.startDate.toISOString().split("T")[0];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const allMessages: Anthropic.MessageParam[] = incomingMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        let iterations = 0;
        const MAX_ITERATIONS = 8;

        while (iterations < MAX_ITERATIONS) {
          iterations++;

          const msgStream = client.messages.stream({
            model: "claude-opus-4-7",
            max_tokens: 8192,
            system: systemPrompt,
            messages: allMessages,
            tools: TOOLS,
            thinking: { type: "adaptive" },
          });

          for await (const event of msgStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send({ type: "text", delta: event.delta.text });
            }
          }

          const finalMsg = await msgStream.finalMessage();

          if (finalMsg.stop_reason === "end_turn") {
            break;
          }

          if (finalMsg.stop_reason === "tool_use") {
            allMessages.push({ role: "assistant", content: finalMsg.content });
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const block of finalMsg.content) {
              if (block.type === "tool_use") {
                send({ type: "tool_start", toolId: block.id, tool: block.name });
                try {
                  const result = await executeTool(
                    block.name,
                    block.input as ToolInput,
                    id,
                    eventDate
                  );
                  send({ type: "tool_done", toolId: block.id, tool: block.name, action: result.action });
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: JSON.stringify(result.data),
                  });
                } catch (err) {
                  const errMsg = err instanceof Error ? err.message : "Tool execution failed";
                  send({ type: "tool_done", toolId: block.id, tool: block.name, action: { type: "error", title: `Failed: ${errMsg}` } });
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: JSON.stringify({ error: errMsg }),
                    is_error: true,
                  });
                }
              }
            }

            allMessages.push({ role: "user", content: toolResults });
          } else {
            break;
          }
        }

        send({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", message: msg });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
