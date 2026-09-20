import Link from "next/link";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Enrollment from "@/models/Enrollment";

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  await connectDB();
  const enrollments = await Enrollment.find({ user: user.id, status: "active" }).populate("course", "title description level price").sort({ updatedAt: -1 }).lean();

  return (
    <section className="animate-page-enter min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Your progress</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">My learning</h1>
        {enrollments.length === 0 ? <div className="mt-10 rounded-2xl border border-dashed bg-white p-10 text-center"><p className="text-sm text-slate-500">You have not enrolled in a course yet.</p><Link href="/dashboard/courses" className="mt-4 inline-block font-semibold text-teal-800 hover:text-teal-900">Browse the catalog</Link></div> : <div className="mt-10 space-y-4">{enrollments.map((item) => <Link key={item._id.toString()} href={`/dashboard/courses/${item.course._id}`} className="block rounded-2xl border bg-white p-6 shadow-sm hover:border-teal-200 hover:shadow-md"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h2 className="text-lg font-semibold text-slate-950">{item.course.title}</h2><p className="mt-1 line-clamp-1 text-sm text-slate-500">{item.course.description}</p></div><span className="text-sm font-semibold text-teal-800">Continue learning</span></div></Link>)}</div>}
      </div>
    </section>
  );
}