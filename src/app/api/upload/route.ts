import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const eventId = (formData.get("eventId") as string) ?? "misc";
    const type = (formData.get("type") as string) ?? "files";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const allowedImages = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    const allowedVideos = ["video/mp4", "video/webm", "video/mov", "video/avi"];
    if (![...allowedImages, ...allowedVideos].includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Please upload an image or video." },
        { status: 400 }
      );
    }

    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${file.type.startsWith("video/") ? "50MB" : "10MB"}.` },
        { status: 400 }
      );
    }

    const blob = await put(`${eventId}/${type}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url, filename: file.name, size: file.size });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
