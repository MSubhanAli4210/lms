import Link from "next/link";
import { redirect } from "next/navigation";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const [activeCourses, availableCourses] =
    await Promise.all([
      Enrollment.countDocuments({
        user: user.id,
        status: "active",
      }),

      Course.countDocuments({
        published: true,
      }),
    ]);

  const firstName = user.name.split(" ")[0];

  return (
    <section className="animate-page-enter min-h-screen px-6 py-10 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Your learning space
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Student Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Everything you need to keep learning in one place.
          </p>
        </div>

        {/* Welcome hero */}
        <div className="relative overflow-hidden rounded-3xl bg-teal-800 p-7 text-white shadow-xl shadow-teal-900/10 sm:p-10">
          {/* decorative shapes */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-32 h-44 w-44 rounded-full border border-white/10" />

          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100">
              Welcome back
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to learn, {firstName}?
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-teal-50/80 sm:text-base">
              Continue your current courses or discover something
              new to learn today.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard/my-courses"
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
              >
                Continue learning
              </Link>

              <Link
                href="/dashboard/courses"
                className="rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="animate-item-enter rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active courses
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {activeCourses}
                </p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                </svg>
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {activeCourses === 0
                ? "Start your first course"
                : `${activeCourses} ${
                    activeCourses === 1 ? "course" : "courses"
                  } in your learning`}
            </p>
          </div>

          <div className="animate-item-enter rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Available courses
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {availableCourses}
                </p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m4 19 8-8" />
                  <path d="m12 19 8-8" />
                  <path d="m4 11 8-8" />
                </svg>
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Explore the complete course catalog
            </p>
          </div>

          <div className="animate-item-enter rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Account
                </p>

                <p className="mt-3 text-lg font-semibold text-slate-950">
                  Active
                </p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </div>

            <p className="mt-3 truncate text-xs text-slate-400">
              {user.email}
            </p>
          </div>
        </div>

        {/* Bottom content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Quick actions */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                Quick access
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                What would you like to do?
              </h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/my-courses"
                className="group rounded-xl border bg-slate-50 p-5 hover:border-teal-200 hover:bg-teal-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>

                <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-teal-800">
                  My learning
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Open your enrolled courses and keep learning.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-teal-700">
                  Continue →
                </span>
              </Link>

              <Link
                href="/dashboard/courses"
                className="group rounded-xl border bg-slate-50 p-5 hover:border-teal-200 hover:bg-teal-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </div>

                <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-teal-800">
                  Find a course
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Browse available courses and find something new.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-teal-700">
                  Browse catalog →
                </span>
              </Link>
            </div>
          </div>

          {/* Small side card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </span>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Keep moving forward
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {activeCourses > 0
                ? "Your courses are ready whenever you are. A little progress every day adds up."
                : "Your learning space is ready. Browse the catalog and choose your first course."}
            </p>

            <Link
              href={
                activeCourses > 0
                  ? "/dashboard/my-courses"
                  : "/dashboard/courses"
              }
              className="mt-5 inline-flex items-center text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              {activeCourses > 0
                ? "Go to my learning"
                : "Explore courses"}{" "}
              →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}