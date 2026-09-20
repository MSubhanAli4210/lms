import Link from "next/link";
import { redirect } from "next/navigation";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import User from "@/models/User";

export default async function AdminPage() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  await connectDB();

  const [
    totalUsers,
    totalCourses,
    publishedCourses,
    totalLessons,
    activeEnrollments,
    revenueResult,
  ] = await Promise.all([
    User.countDocuments(),

    Course.countDocuments(),

    Course.countDocuments({
      published: true,
    }),

    Lesson.countDocuments(),

    Enrollment.countDocuments({
      status: "active",
    }),

    Enrollment.aggregate([
      {
        $match: {
          status: "active",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amountPaid",
          },
        },
      },
    ]),
  ]);

  const revenue =
    revenueResult[0]?.total || 0;

  return (
    <section className="animate-page-enter min-h-screen px-6 py-10 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Workspace overview
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Welcome back, {user.name}. Here&apos;s what&apos;s happening across Learnspace.
          </p>
        </div>

        {/* Main stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5">
            <p className="text-sm font-medium text-slate-500">
              Total users
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {totalUsers}
            </p>

            <Link
              href="/admin/users"
              className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              Manage users →
            </Link>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5">
            <p className="text-sm font-medium text-slate-500">
              Courses
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {totalCourses}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              {publishedCourses} published
            </p>

            <Link
              href="/admin/courses"
              className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              Manage courses →
            </Link>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5">
            <p className="text-sm font-medium text-slate-500">
              Active enrollments
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {activeEnrollments}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Learners with active course access
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5">
            <p className="text-sm font-medium text-slate-500">
              Course revenue
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              ${Number(revenue).toFixed(2)}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Confirmed enrollment payments
            </p>
          </div>
        </div>

        {/* Management area */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Management
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Manage your platform
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/admin/courses"
                className="group rounded-xl border bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50"
              >
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-800">
                  Courses
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create, edit, publish and remove courses.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-teal-700">
                  Open courses →
                </span>
              </Link>

              <Link
                href="/admin/lessons"
                className="group rounded-xl border bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50"
              >
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-800">
                  Lessons
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage lesson content and course videos.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-teal-700">
                  Open lessons →
                </span>
              </Link>

              <Link
                href="/admin/categories"
                className="group rounded-xl border bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50"
              >
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-800">
                  Categories
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Organize courses into clear categories.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-teal-700">
                  Open categories →
                </span>
              </Link>

              <Link
                href="/admin/users"
                className="group rounded-xl border bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-teal-50"
              >
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-800">
                  Users
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Review accounts and manage access.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-teal-700">
                  Open users →
                </span>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-teal-800 p-7 text-white shadow-lg shadow-teal-900/10">
            <p className="text-sm font-semibold text-teal-100">
              Content overview
            </p>

            <p className="mt-4 text-4xl font-semibold">
              {totalLessons}
            </p>

            <p className="mt-2 text-sm leading-6 text-teal-50/80">
              Total lessons currently available across your course library.
            </p>

            <Link
              href="/admin/lessons"
              className="mt-6 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"
            >
              Manage lessons
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}