import { notFound } from "next/navigation";

import CourseActions from "@/components/CourseActions";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";

import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

type CourseLesson = {
  _id: {
    toString(): string;
  };
  title: string;
  description: string;
  order: number;
  isPreview: boolean;
  videoUrl: string;
};

export default async function CourseDetailPage({
  params,
}: PageProps<"/dashboard/courses/[id]">) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  await connectDB();

  const { id } = await params;

  const course = await Course.findById(id)
    .populate("category", "name")
    .populate(
      "lessons",
      "title description order isPreview videoUrl"
    )
    .lean();

  if (!course) {
    notFound();
  }

  const enrollment = await Enrollment.findOne({
    user: user.id,
    course: id,
    status: "active",
  }).lean();

  const lessons = (course.lessons || []) as unknown as CourseLesson[];

  const sortedLessons = [...lessons].sort(
    (a, b) => a.order - b.order
  );

  return (
    <section className="animate-page-enter min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Course header */}
        <div className="rounded-2xl bg-teal-800 p-7 text-white shadow-lg shadow-teal-900/10 sm:p-10">
          <p className="text-sm font-medium text-teal-100">
            {course.category?.name || "Course"}{" "}
            <span className="mx-1">·</span>
            <span className="capitalize">
              {course.level}
            </span>
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight">
            {course.title}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-teal-50">
            {course.description}
          </p>

          <div className="mt-8">
            <CourseActions
              courseId={id}
              owned={Boolean(enrollment)}
              price={course.price}
            />
          </div>
        </div>

        {/* Lessons */}
        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Course lessons
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {sortedLessons.length}{" "}
                {sortedLessons.length === 1
                  ? "lesson"
                  : "lessons"}
              </p>
            </div>

            {enrollment && (
              <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
                Enrolled
              </span>
            )}
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {sortedLessons.length ? (
              sortedLessons.map((lesson) => {
                const unlocked =
                  lesson.isPreview || Boolean(enrollment);

                return (
                  <div
                    key={lesson._id.toString()}
                    className="flex items-start gap-4 py-5"
                  >
                    {/* Lesson number */}
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                      {lesson.order}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-slate-900">
                          {lesson.title}
                        </h3>

                        {lesson.isPreview && (
                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                            Preview
                          </span>
                        )}

                        {!unlocked && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            Locked
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {unlocked
                          ? lesson.description
                          : "Enroll in this course to unlock this lesson."}
                      </p>

                      {/* Protected video stream */}
                      {unlocked && lesson.videoUrl && (
                        <div className="mt-4 overflow-hidden rounded-xl bg-slate-950">
                          <video
                            controls
                            controlsList="nodownload"
                            preload="metadata"
                            src={`/api/videos/${lesson._id.toString()}`}
                            className="aspect-video w-full max-w-2xl bg-slate-950"
                          >
                            Your browser does not support video playback.
                          </video>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-sm text-slate-500">
                Lessons are being prepared.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}