import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import User from "@/models/User";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  await connectDB();
  const users = await User.find().select("name email role purchasedCourses createdAt").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, users });
}