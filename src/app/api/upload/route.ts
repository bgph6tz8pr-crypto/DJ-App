import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId") as string;
    const type = formData.get("type") as string; // "asset" or "media"

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate file type
    const allowedImages = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    const allowedVideos = ["video/mp4", "video/webm", "video/mov", "video/avi"];
    const allowed = [...allowedImages, ...allowedVideos];

    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Please upload an image or video." },
        { status: 400 }
      );
    }

    // Limit: 50MB for videos, 10MB for images
    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${file.type.startsWith("video/") ? "50MB" : "10MB"}.` },
        { status: 400 }
      );
    }

    // Create directory
    const uploadDir = join(process.cwd(), "public", "uploads", eventId ?? "misc", type ?? "files");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = extname(file.name) || (file.type.includes("jpeg") ? ".jpg" : ".png");
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Return public URL
    const url = `/uploads/${eventId ?? "misc"}/${type ?? "files"}/${filename}`;

    return NextResponse.json({ url, filename, size: file.size });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
