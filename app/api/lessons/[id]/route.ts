import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";

import Lesson from "@/models/Lesson";
import Course from "@/models/Course";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid lesson ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const {
      title,
      description,
      videoUrl,
      order,
      isPreview,
    } = await request.json();

    const lesson = await Lesson.findByIdAndUpdate(
      id,
      {
        title: title?.trim(),
        description: description?.trim() || "",
        videoUrl: videoUrl || "",
        order: Number(order) || 1,
        isPreview: Boolean(isPreview),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("course", "title slug");

    if (!lesson) {
      return NextResponse.json(
        { success: false, message: "Lesson not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lesson updated successfully",
      lesson,
    });
  } catch (error) {
    console.error("UPDATE LESSON ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update lesson",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid lesson ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return NextResponse.json(
        { success: false, message: "Lesson not found" },
        { status: 404 }
      );
    }

    await Course.findByIdAndUpdate(lesson.course, {
      $pull: {
        lessons: lesson._id,
      },
    });

    await Lesson.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("DELETE LESSON ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete lesson",
      },
      { status: 500 }
    );
  }
}