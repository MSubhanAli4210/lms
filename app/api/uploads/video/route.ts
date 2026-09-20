import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

const allowedContentTypes = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
];

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();

        if (!user || user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes,
          maximumSizeInBytes: MAX_VIDEO_SIZE,
          addRandomSuffix: true,
        };
      },

      onUploadCompleted: async ({ blob }) => {
        console.log(
          "Video upload completed:",
          blob.pathname
        );
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("VIDEO UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Video upload failed",
      },
      { status: 400 }
    );
  }
}