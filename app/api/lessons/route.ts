import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";

import Course from "@/models/Course";
import Lesson from "@/models/Lesson";

export async function GET(
  request: Request
) {
  try {
    const user =
      await getCurrentUser();

    if (
      !user ||
      user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const courseId =
      searchParams.get(
        "courseId"
      );

    const filter: {
      course?: string;
    } = {};

    if (courseId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          courseId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid course ID",
          },
          { status: 400 }
        );
      }

      filter.course =
        courseId;
    }

    const lessons =
      await Lesson.find(
        filter
      )
        .populate(
          "course",
          "title slug"
        )
        .sort({
          order: 1,
          createdAt: 1,
        });

    return NextResponse.json({
      success: true,
      lessons,
    });
  } catch (error) {
    console.error(
      "GET LESSONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to get lessons",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const user =
      await getCurrentUser();

    if (
      !user ||
      user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const {
      title,
      description,
      videoUrl,
      order,
      isPreview,
      course,
    } = await request.json();

    if (!title || !course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title and course are required",
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        course
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid course ID",
        },
        { status: 400 }
      );
    }

    const courseExists =
      await Course.findById(
        course
      );

    if (!courseExists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course not found",
        },
        { status: 404 }
      );
    }

    const lesson =
      await Lesson.create({
        title: title.trim(),
        description:
          description?.trim() ||
          "",
        videoUrl:
          videoUrl || "",
        order:
          Number(order) || 1,
        isPreview:
          Boolean(isPreview),
        course,
      });

    await Course.findByIdAndUpdate(
      course,
      {
        $addToSet: {
          lessons:
            lesson._id,
        },
      }
    );

    await lesson.populate(
      "course",
      "title slug"
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Lesson created successfully",
        lesson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE LESSON ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create lesson",
      },
      { status: 500 }
    );
  }
}