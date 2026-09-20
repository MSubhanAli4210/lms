import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const enrollments = await Enrollment.find({
      user: user.id,
      status: "active",
    })
      .populate({
        path: "course",
        populate: {
          path: "category",
          select: "name slug",
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    console.error("GET ENROLLMENTS ERROR:", error);

    return NextResponse.json(
      { message: "Could not load enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courseId } = await request.json();

    if (
      !courseId ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return NextResponse.json(
        { message: "Invalid course" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.findById(courseId);

    if (!course || !course.published) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    // IMPORTANT:
    // Paid courses can ONLY be activated by Stripe webhook.
    if (course.price > 0) {
      return NextResponse.json(
        {
          message:
            "This is a paid course. Payment is required before enrollment.",
        },
        { status: 403 }
      );
    }

    const enrollment =
      await Enrollment.findOneAndUpdate(
        {
          user: user.id,
          course: course._id,
        },
        {
          user: user.id,
          course: course._id,
          status: "active",
          amountPaid: 0,
          paymentSessionId: "",
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

    await User.findByIdAndUpdate(user.id, {
      $addToSet: {
        purchasedCourses: course._id,
      },
    });

    return NextResponse.json({
      success: true,
      enrollment,
    });
  } catch (error) {
    console.error("CREATE ENROLLMENT ERROR:", error);

    return NextResponse.json(
      { message: "Could not enroll in course" },
      { status: 500 }
    );
  }
}