import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";

import Course from "@/models/Course";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();

    // Make sure Category model is registered
    Category;

    const courses = await Course.find()
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("GET COURSES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get courses",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 403 }
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

    if (!title || !description || price === undefined || !category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title, description, price and category are required",
        },
        { status: 400 }
      );
    }

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existingCourse = await Course.findOne({ slug });

    if (existingCourse) {
      return NextResponse.json(
        {
          success: false,
          message: "A course with this title already exists",
        },
        { status: 409 }
      );
    }

    const course = await Course.create({
      title: title.trim(),
      slug,
      description: description.trim(),
      price: Number(price),
      thumbnail: thumbnail || "",
      level: level || "beginner",
      category,
      published: published ?? false,
    });

    await course.populate("category", "name slug");

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully",
        course,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create course",
      },
      { status: 500 }
    );
  }
}