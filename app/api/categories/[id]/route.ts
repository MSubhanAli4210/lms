import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";

import Category from "@/models/Category";
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
            "Invalid category ID",
        },
        { status: 400 }
      );
    }

    const { name } =
      await request.json();

    if (
      !name ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category name is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const cleanName =
      name.trim();

    const slug =
      cleanName
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        );

    const duplicate =
      await Category.findOne({
        _id: {
          $ne: id,
        },
        $or: [
          {
            name:
              cleanName,
          },
          { slug },
        ],
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category already exists",
        },
        { status: 409 }
      );
    }

    const category =
      await Category.findByIdAndUpdate(
        id,
        {
          name:
            cleanName,
          slug,
        },
        {
          new: true,
          runValidators:
            true,
        }
      );

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Category updated",
      category,
    });
  } catch (error) {
    console.error(
      "UPDATE CATEGORY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update category",
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
            "Invalid category ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const category =
      await Category.findById(
        id
      );

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category not found",
        },
        { status: 404 }
      );
    }

    const coursesUsingCategory =
      await Course.countDocuments(
        {
          category: id,
        }
      );

    if (
      coursesUsingCategory >
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `This category is used by ${coursesUsingCategory} ${
            coursesUsingCategory ===
            1
              ? "course"
              : "courses"
          }. Reassign or delete those courses first.`,
        },
        { status: 409 }
      );
    }

    await Category.findByIdAndDelete(
      id
    );

    return NextResponse.json({
      success: true,
      message:
        "Category deleted",
    });
  } catch (error) {
    console.error(
      "DELETE CATEGORY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete category",
      },
      { status: 500 }
    );
  }
}