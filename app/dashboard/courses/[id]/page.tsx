import { notFound } from "next/navigation";

import CourseActions from "@/components/CourseActions";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

type CourseLesson = {
  _id: { toString(): string };
  title: string;
  description: string;
  order: number;
  isPreview: boolean;
  videoUrl: string;
};

export default async function CourseDetailPage({ params }: PageProps<"/dashboard/courses/[id]">) {
  const user = await getCurrentUser();
  if (!user) return null;
  await connectDB();
  const { id } = await params;
  const course = await Course.findById(id).populate("category", "name").populate("lessons", "title description order isPreview videoUrl").lean();
  if (!course) notFound();
  const enrollment = await Enrollment.findOne({ user: user.id, course: id, status: "active" }).lean();
  const lessons = (course.lessons || []) as unknown as CourseLesson[];

  return (
    <section className="animate-page-enter min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-teal-800 p-7 text-white shadow-lg shadow-teal-900/10 sm:p-10">
          <p className="text-sm font-medium text-teal-100">{course.category?.name || "Course"} · <span className="capitalize">{course.level}</span></p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight">{course.title}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-teal-50">{course.description}</p>
          <div className="mt-8"><CourseActions courseId={id} owned={Boolean(enrollment)} price={course.price} /></div>
        </div>
        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950">Course lessons</h2>
          <div className="mt-5 divide-y">
            {lessons.length ? lessons.sort((a, b) => a.order - b.order).map((lesson) => (
              <div key={lesson._id.toString()} className="flex items-start gap-4 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">{lesson.order}</span>
                <div className="min-w-0 flex-1"><h3 className="font-medium text-slate-900">{lesson.title}</h3><p className="mt-1 text-sm text-slate-500">{lesson.isPreview || enrollment ? lesson.description : "Enroll to unlock this lesson."}</p>{(lesson.isPreview || enrollment) && lesson.videoUrl && <video controls preload="metadata" src={lesson.videoUrl} className="mt-4 aspect-video w-full max-w-2xl rounded-xl bg-slate-950" />}</div>
              </div>
            )) : <p className="mt-4 text-sm text-slate-500">Lessons are being prepared.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}