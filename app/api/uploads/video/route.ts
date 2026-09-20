import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("video");
  if (!(file instanceof File)) return NextResponse.json({ message: "Video file is required" }, { status: 400 });
  if (!file.type.startsWith("video/")) return NextResponse.json({ message: "Only video files are supported" }, { status: 400 });
  if (file.size > 500 * 1024 * 1024) return NextResponse.json({ message: "Video must be smaller than 500MB" }, { status: 400 });

  const extension = path.extname(file.name).toLowerCase() || ".mp4";
  const fileName = `${randomUUID()}${extension}`;
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ success: true, url: `/uploads/${fileName}` }, { status: 201 });
}