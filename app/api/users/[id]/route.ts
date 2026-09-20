import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import User from "@/models/User";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const { role } = await request.json();
  if (!mongoose.Types.ObjectId.isValid(id) || !["user", "admin"].includes(role)) return NextResponse.json({ message: "Invalid user or role" }, { status: 400 });
  await connectDB();
  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("name email role purchasedCourses createdAt").lean();
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  return NextResponse.json({ success: true, user });
}