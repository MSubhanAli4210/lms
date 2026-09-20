import { randomUUID } from "node:crypto";
import {
  mkdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

const allowedTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
]);

const allowedExtensions = new Set([
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".m4v",
]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const formData =
      await request.formData();

    const file = formData.get("video");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Video file is required" },
        { status: 400 }
      );
    }

    if (
      !file.type.startsWith("video/") ||
      !allowedTypes.has(file.type)
    ) {
      return NextResponse.json(
        {
          message:
            "Unsupported video format. Use MP4, WebM, OGG, MOV or M4V.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { message: "Video file is empty" },
        { status: 400 }
      );
    }

    if (
      file.size >
      500 * 1024 * 1024
    ) {
      return NextResponse.json(
        {
          message:
            "Video must be smaller than 500MB",
        },
        { status: 400 }
      );
    }

    const extension = path
      .extname(file.name)
      .toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return NextResponse.json(
        {
          message:
            "Unsupported video extension",
        },
        { status: 400 }
      );
    }

    const fileName =
      `${randomUUID()}${extension}`;

    /*
      IMPORTANT:
      This is intentionally NOT inside /public.
    */
    const uploadDirectory = path.join(
      process.cwd(),
      "storage",
      "videos"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    await writeFile(
      path.join(
        uploadDirectory,
        fileName
      ),
      buffer
    );

    /*
      Store only the private storage key in MongoDB.
      It is NOT a public URL anymore.
    */
    return NextResponse.json(
      {
        success: true,
        url: fileName,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "VIDEO UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Video upload failed",
      },
      { status: 500 }
    );
  }
}