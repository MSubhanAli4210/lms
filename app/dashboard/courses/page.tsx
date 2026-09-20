import Link from "next/link";

import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";

export default async function BrowseCoursesPage() {
  await connectDB();
  const courses = await Course.find({ published: true }).populate("category", "name").sort({ createdAt: -1 }).lean();

  return (
    <section className="animate-page-enter min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Course catalog</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Find your next course</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Practical lessons, clear progress, and a focused place to keep learning.</p>
        {courses.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">Published courses will appear here.</div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <Link key={course._id.toString()} href={`/dashboard/courses/${course._id}`} className="group overflow-hidden rounded-2xl border bg-white shadow-sm shadow-slate-900/5 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-900/10">
                <div className="flex h-36 items-end bg-teal-800 p-5 text-white">
                  <span className="text-sm font-medium text-teal-100">{course.category?.name || "Learning"}</span>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-slate-950 group-hover:text-teal-800">{course.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{course.description}</p>
                  <div className="mt-5 flex items-center justify-between text-sm"><span className="font-medium capitalize text-slate-500">{course.level}</span><span className="font-semibold text-teal-800">{course.price ? `$${course.price.toFixed(2)}` : "Free"}</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}