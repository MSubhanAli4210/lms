import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";

import Category from "@/models/Category";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import User from "@/models/User";

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

    const { id } =
      await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
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

    await connectDB();

    const {
      title,
      description,
      price,
      thumbnail,
      level,
      category,
      published,
    } = await request.json();

    if (
      !title ||
      !description ||
      price === undefined ||
      !category
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title, description, price and category are required",
        },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        category
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid category",
        },
        { status: 400 }
      );
    }

    const categoryExists =
      await Category.findById(
        category
      );

    if (!categoryExists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category not found",
        },
        { status: 404 }
      );
    }

    const numericPrice =
      Number(price);

    if (
      Number.isNaN(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid price",
        },
        { status: 400 }
      );
    }

    const validLevels = [
      "beginner",
      "intermediate",
      "advanced",
    ];

    const cleanLevel =
      validLevels.includes(level)
        ? level
        : "beginner";

    const slug = title
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      );

    const duplicateCourse =
      await Course.findOne({
        _id: {
          $ne: id,
        },
        slug,
      });

    if (duplicateCourse) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A course with this title already exists",
        },
        { status: 409 }
      );
    }

    const course =
      await Course.findByIdAndUpdate(
        id,
        {
          title:
            title.trim(),
          slug,
          description:
            description.trim(),
          price:
            numericPrice,
          thumbnail:
            thumbnail || "",
          level:
            cleanLevel,
          category,
          published:
            Boolean(
              published
            ),
        },
        {
          new: true,
          runValidators:
            true,
        }
      ).populate(
        "category",
        "name slug"
      );

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error(
      "UPDATE COURSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update course",
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

    const { id } =
      await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
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

    await connectDB();

    const course =
      await Course.findById(
        id
      );

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course not found",
        },
        { status: 404 }
      );
    }

    await Promise.all([
      Lesson.deleteMany({
        course:
          course._id,
      }),

      Enrollment.deleteMany({
        course:
          course._id,
      }),

      User.updateMany(
        {
          purchasedCourses:
            course._id,
        },
        {
          $pull: {
            purchasedCourses:
              course._id,
          },
        }
      ),
    ]);

    await Course.findByIdAndDelete(
      course._id
    );

    return NextResponse.json({
      success: true,
      message:
        "Course and related data deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE COURSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete course",
      },
      { status: 500 }
    );
  }
}