import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Enrollment from "@/models/Enrollment";
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
    const currentUser =
      await getCurrentUser();

    if (
      !currentUser ||
      currentUser.role !== "admin"
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        { message: "Invalid user" },
        { status: 400 }
      );
    }

    const { role } =
      await request.json();

    if (
      !["user", "admin"].includes(
        role
      )
    ) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    /*
      Don't allow the logged-in admin
      to accidentally remove their own
      admin access.
    */
    if (
      currentUser.id === id &&
      role !== "admin"
    ) {
      return NextResponse.json(
        {
          message:
            "You cannot remove your own admin access",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user =
      await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      )
        .select(
          "name email role purchasedCourses createdAt"
        )
        .lean();

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "UPDATE USER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Could not update user",
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
    const currentUser =
      await getCurrentUser();

    if (
      !currentUser ||
      currentUser.role !== "admin"
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        { message: "Invalid user" },
        { status: 400 }
      );
    }

    if (currentUser.id === id) {
      return NextResponse.json(
        {
          message:
            "You cannot delete your own account",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user =
      await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    await Enrollment.deleteMany({
      user: user._id,
    });

    await User.findByIdAndDelete(
      user._id
    );

    return NextResponse.json({
      success: true,
      message:
        "User deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE USER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Could not delete user",
      },
      { status: 500 }
    );
  }
}