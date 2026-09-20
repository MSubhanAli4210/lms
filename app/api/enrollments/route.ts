import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const enrollments = await Enrollment.find({ user: user.id, status: "active" })
    .populate({ path: "course", populate: { path: "category", select: "name slug" } })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({ success: true, enrollments });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { courseId } = await request.json();
  await connectDB();
  const course = await Course.findById(courseId);
  if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });

  const enrollment = await Enrollment.findOneAndUpdate(
    { user: user.id, course: course._id },
    { user: user.id, course: course._id, status: "active", amountPaid: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findByIdAndUpdate(user.id, { $addToSet: { purchasedCourses: course._id } });
  return NextResponse.json({ success: true, enrollment });
}