import {
  createReadStream,
} from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

function getContentType(fileName: string) {
  const extension = path
    .extname(fileName)
    .toLowerCase();

  switch (extension) {
    case ".webm":
      return "video/webm";

    case ".ogg":
      return "video/ogg";

    case ".mov":
      return "video/quicktime";

    case ".m4v":
      return "video/x-m4v";

    case ".mp4":
    default:
      return "video/mp4";
  }
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { lessonId } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        lessonId
      )
    ) {
      return NextResponse.json(
        { message: "Invalid lesson" },
        { status: 400 }
      );
    }

    await connectDB();

    const lesson =
      await Lesson.findById(lessonId);

    if (!lesson) {
      return NextResponse.json(
        { message: "Lesson not found" },
        { status: 404 }
      );
    }

    if (!lesson.videoUrl) {
      return NextResponse.json(
        {
          message:
            "This lesson does not have a video",
        },
        { status: 404 }
      );
    }

    /*
      Admins can watch everything.

      Learners may watch:
      - preview lessons
      - courses they actively own
    */
    if (
      user.role !== "admin" &&
      !lesson.isPreview
    ) {
      const enrollment =
        await Enrollment.findOne({
          user: user.id,
          course: lesson.course,
          status: "active",
        }).lean();

      if (!enrollment) {
        return NextResponse.json(
          {
            message:
              "You must purchase this course to watch this lesson",
          },
          { status: 403 }
        );
      }
    }

    /*
      path.basename prevents directory traversal.
    */
    const fileName = path.basename(
      lesson.videoUrl.replace(
        /^\/uploads\//,
        ""
      )
    );

    /*
      New private storage.
    */
    let videoPath = path.join(
      process.cwd(),
      "storage",
      "videos",
      fileName
    );

    let fileStats;

    try {
      fileStats = await stat(videoPath);
    } catch {
      /*
        Temporary compatibility for old videos.

        Re-upload old videos later so they move
        into /storage/videos.
      */
      videoPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        fileName
      );

      try {
        fileStats = await stat(videoPath);
      } catch {
        return NextResponse.json(
          {
            message:
              "Video file was not found",
          },
          { status: 404 }
        );
      }
    }

    const fileSize = fileStats.size;

    const range =
      request.headers.get("range");

    const contentType =
      getContentType(fileName);

    /*
      Browser didn't ask for a range.
      Stream the complete file.
    */
    if (!range) {
      const nodeStream =
        createReadStream(videoPath);

      const webStream =
        Readable.toWeb(nodeStream);

      return new Response(
        webStream as BodyInit,
        {
          status: 200,
          headers: {
            "Content-Type":
              contentType,

            "Content-Length":
              fileSize.toString(),

            "Accept-Ranges":
              "bytes",

            "Cache-Control":
              "private, no-store",
          },
        }
      );
    }

    const match =
      /bytes=(\d*)-(\d*)/.exec(
        range
      );

    if (!match) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range":
            `bytes */${fileSize}`,
        },
      });
    }

    const startText = match[1];
    const endText = match[2];

    let start: number;
    let end: number;

    /*
      Support suffix range:
      bytes=-500
    */
    if (!startText) {
      const suffixLength =
        Number(endText);

      if (
        !Number.isFinite(
          suffixLength
        ) ||
        suffixLength <= 0
      ) {
        return new Response(null, {
          status: 416,
          headers: {
            "Content-Range":
              `bytes */${fileSize}`,
          },
        });
      }

      start = Math.max(
        fileSize - suffixLength,
        0
      );

      end = fileSize - 1;
    } else {
      start = Number(startText);

      /*
        Limit open-ended requests to about 1MB.
        The browser will request subsequent chunks.
      */
      end = endText
        ? Number(endText)
        : Math.min(
            start +
              1024 * 1024 -
              1,
            fileSize - 1
          );
    }

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end < start ||
      start >= fileSize
    ) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range":
            `bytes */${fileSize}`,
        },
      });
    }

    end = Math.min(
      end,
      fileSize - 1
    );

    const chunkSize =
      end - start + 1;

    const nodeStream =
      createReadStream(videoPath, {
        start,
        end,
      });

    const webStream =
      Readable.toWeb(nodeStream);

    return new Response(
      webStream as BodyInit,
      {
        status: 206,

        headers: {
          "Content-Type":
            contentType,

          "Content-Length":
            chunkSize.toString(),

          "Content-Range":
            `bytes ${start}-${end}/${fileSize}`,

          "Accept-Ranges":
            "bytes",

          "Cache-Control":
            "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "VIDEO STREAM ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Could not stream video",
      },
      { status: 500 }
    );
  }
}