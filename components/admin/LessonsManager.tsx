"use client";

import { upload } from "@vercel/blob/client";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

type Course = {
  _id: string;
  title: string;
};

type Lesson = {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  order: number;
  isPreview: boolean;
  course: Course;
};

const MAX_VIDEO_SIZE =
  500 * 1024 * 1024; // 500 MB

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
];

const initialForm = {
  title: "",
  description: "",
  videoUrl: "",
  order: "1",
  isPreview: false,
  course: "",
};

export default function LessonsManager() {
  const [courses, setCourses] =
    useState<Course[]>([]);

  const [lessons, setLessons] =
    useState<Lesson[]>([]);

  const [form, setForm] =
    useState(initialForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [videoFile, setVideoFile] =
    useState<File | null>(null);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  const [
    videoInputKey,
    setVideoInputKey,
  ] = useState(0);

  async function fetchCourses() {
    try {
      const response =
        await fetch("/api/courses");

      const data =
        await response.json();

      if (response.ok) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error(
        "FETCH COURSES ERROR:",
        error
      );
    }
  }

  async function fetchLessons(
    courseId?: string
  ) {
    try {
      const url = courseId
        ? `/api/lessons?courseId=${courseId}`
        : "/api/lessons";

      const response =
        await fetch(url);

      const data =
        await response.json();

      if (response.ok) {
        setLessons(data.lessons);
      } else {
        setMessage(
          data.message ||
            "Could not load lessons"
        );
      }
    } catch (error) {
      console.error(
        "FETCH LESSONS ERROR:",
        error
      );

      setMessage(
        "Could not load lessons"
      );
    }
  }

  useEffect(() => {
    void fetchCourses();
    void fetchLessons();
  }, []);

  function handleChange(
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >
  ) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleVideoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setMessage("");
    setUploadProgress(0);

    const file =
      event.target.files?.[0];

    if (!file) {
      setVideoFile(null);
      return;
    }

    if (
      !ALLOWED_VIDEO_TYPES.includes(
        file.type
      )
    ) {
      setVideoFile(null);

      setMessage(
        "Invalid video format. Please upload MP4, WebM, OGG, MOV, or M4V."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size > MAX_VIDEO_SIZE
    ) {
      setVideoFile(null);

      setMessage(
        "Video is too large. Maximum file size is 500MB."
      );

      event.target.value = "";

      return;
    }

    setVideoFile(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setUploadProgress(0);

      let videoUrl =
        form.videoUrl;

      /*
       * If the admin selected a video,
       * upload it directly from the browser
       * to Vercel Blob.
       *
       * The video does NOT pass through
       * the Next.js API route.
       */
      if (videoFile) {
        try {
          const blob =
            await upload(
              `videos/${videoFile.name}`,
              videoFile,
              {
                access: "private",

                handleUploadUrl:
                  "/api/uploads/video",

                /*
                 * Use multipart for videos
                 * over 100 MB.
                 *
                 * This makes large uploads
                 * more reliable.
                 */
                multipart:
                  videoFile.size >
                  100 *
                    1024 *
                    1024,

                onUploadProgress: ({
                  percentage,
                }) => {
                  setUploadProgress(
                    Math.round(
                      percentage
                    )
                  );
                },
              }
            );

          /*
           * Save the Blob pathname
           * in MongoDB.
           *
           * Example:
           *
           * videos/lesson-name-AbC123.mp4
           */
          videoUrl =
            blob.pathname;

          setUploadProgress(100);
        } catch (uploadError) {
          console.error(
            "VIDEO UPLOAD ERROR:",
            uploadError
          );

          setMessage(
            uploadError instanceof
              Error
              ? uploadError.message
              : "Video upload failed"
          );

          return;
        }
      }

      const url = editingId
        ? `/api/lessons/${editingId}`
        : "/api/lessons";

      const method = editingId
        ? "PATCH"
        : "POST";

      const response =
        await fetch(url, {
          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...form,

            videoUrl,

            order:
              Number(form.order) ||
              1,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Something went wrong"
        );

        return;
      }

      setMessage(
        editingId
          ? "Lesson updated successfully"
          : "Lesson created successfully"
      );

      setForm(initialForm);

      setVideoFile(null);

      setUploadProgress(0);

      setEditingId(null);

      /*
       * Forces the file input to reset.
       */
      setVideoInputKey(
        (current) => current + 1
      );

      await fetchLessons();
    } catch (error) {
      console.error(
        "SAVE LESSON ERROR:",
        error
      );

      setMessage(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(
    lesson: Lesson
  ) {
    setEditingId(lesson._id);

    setForm({
      title: lesson.title,

      description:
        lesson.description || "",

      videoUrl:
        lesson.videoUrl || "",

      order:
        lesson.order.toString(),

      isPreview:
        lesson.isPreview,

      course:
        lesson.course._id,
    });

    setVideoFile(null);

    setUploadProgress(0);

    setMessage("");

    setVideoInputKey(
      (current) => current + 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);

    setForm(initialForm);

    setVideoFile(null);

    setUploadProgress(0);

    setMessage("");

    setVideoInputKey(
      (current) => current + 1
    );
  }

  async function handleDelete(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this lesson?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/lessons/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Failed to delete lesson"
        );

        return;
      }

      setMessage(
        "Lesson deleted successfully"
      );

      if (editingId === id) {
        cancelEdit();
      }

      await fetchLessons();
    } catch (error) {
      console.error(
        "DELETE LESSON ERROR:",
        error
      );

      setMessage(
        "Something went wrong"
      );
    }
  }

  function formatFileSize(
    bytes: number
  ) {
    const mb =
      bytes / (1024 * 1024);

    return `${mb.toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {/* CREATE / EDIT LESSON */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-slate-950">
          {editingId
            ? "Edit Lesson"
            : "Create Lesson"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* COURSE */}
          <select
            name="course"
            value={form.course}
            onChange={handleChange}
            disabled={
              Boolean(editingId) ||
              loading
            }
            required
            className="w-full rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              Select course
            </option>

            {courses.map(
              (course) => (
                <option
                  key={course._id}
                  value={course._id}
                >
                  {course.title}
                </option>
              )
            )}
          </select>

          {/* TITLE */}
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Lesson title"
            disabled={loading}
            required
            className="w-full rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* DESCRIPTION */}
          <textarea
            name="description"
            value={
              form.description
            }
            onChange={handleChange}
            placeholder="Lesson description"
            disabled={loading}
            className="min-h-28 w-full rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* VIDEO UPLOAD */}
          <div className="rounded-xl border border-dashed bg-slate-50/70 p-4">
            <label className="block text-sm font-medium text-slate-700">
              {editingId
                ? "Replace video"
                : "Upload video"}
            </label>

            <input
              key={videoInputKey}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
              onChange={
                handleVideoChange
              }
              disabled={loading}
              className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-100 file:px-4 file:py-2 file:font-semibold file:text-teal-800 hover:file:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <p className="mt-2 text-xs text-slate-500">
              MP4, WebM, OGG, MOV
              or M4V. Maximum 500MB.
            </p>

            {/* CURRENT VIDEO */}
            {editingId &&
              form.videoUrl &&
              !videoFile && (
                <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50 p-3">
                  <p className="text-xs font-medium text-teal-800">
                    Current video will
                    be kept unless you
                    upload a
                    replacement.
                  </p>

                  <p className="mt-1 break-all text-xs text-teal-700">
                    {form.videoUrl}
                  </p>
                </div>
              )}

            {/* SELECTED VIDEO */}
            {videoFile && (
              <div className="mt-3 rounded-lg border bg-white p-3">
                <p className="text-sm font-medium text-slate-800">
                  Selected video
                </p>

                <p className="mt-1 break-all text-xs text-slate-600">
                  {videoFile.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatFileSize(
                    videoFile.size
                  )}
                </p>
              </div>
            )}

            {/* UPLOAD PROGRESS */}
            {loading &&
              videoFile &&
              uploadProgress <
                100 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-xs font-medium text-slate-700">
                      Uploading
                      video...
                    </p>

                    <p className="text-xs font-semibold text-teal-700">
                      {
                        uploadProgress
                      }
                      %
                    </p>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-teal-700 transition-all duration-200"
                      style={{
                        width: `${uploadProgress}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Keep this page open
                    until the upload is
                    complete.
                  </p>
                </div>
              )}

            {/* UPLOAD COMPLETE */}
            {loading &&
              videoFile &&
              uploadProgress ===
                100 && (
                <p className="mt-3 text-xs font-semibold text-teal-700">
                  Video uploaded.
                  Saving lesson...
                </p>
              )}
          </div>

          {/* ORDER */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Lesson order
            </label>

            <input
              type="number"
              name="order"
              value={form.order}
              onChange={handleChange}
              min="1"
              disabled={loading}
              required
              className="w-full rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* FREE PREVIEW */}
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={
                form.isPreview
              }
              disabled={loading}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    isPreview:
                      event.target
                        .checked,
                  })
                )
              }
              className="h-4 w-4 accent-teal-700"
            />

            Free preview lesson
          </label>

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/10 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading &&
              videoFile &&
              uploadProgress < 100
                ? `Uploading ${uploadProgress}%`
                : loading
                  ? "Saving..."
                  : editingId
                    ? "Update Lesson"
                    : "Create Lesson"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={
                  cancelEdit
                }
                disabled={loading}
                className="rounded-lg border bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* MESSAGE */}
        {message && (
          <p className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm text-teal-800">
            {message}
          </p>
        )}
      </div>

      {/* LESSON LIST */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Lessons
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage lesson content
              and videos.
            </p>
          </div>

          {/* COURSE FILTER */}
          <select
            onChange={(event) =>
              void fetchLessons(
                event.target
                  .value ||
                  undefined
              )
            }
            className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
          >
            <option value="">
              All courses
            </option>

            {courses.map(
              (course) => (
                <option
                  key={course._id}
                  value={course._id}
                >
                  {course.title}
                </option>
              )
            )}
          </select>
        </div>

        {lessons.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
            No lessons created yet.
          </p>
        ) : (
          <div className="space-y-4">
            {lessons.map(
              (
                lesson,
                index
              ) => (
                <div
                  key={
                    lesson._id
                  }
                  style={{
                    animationDelay: `${index * 45}ms`,
                  }}
                  className="animate-item-enter rounded-xl border bg-slate-50/60 p-5 hover:border-teal-200 hover:bg-teal-50/40"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div className="min-w-0 flex-1">
                      {/* LESSON TITLE */}
                      <h3 className="font-semibold text-slate-900">
                        {
                          lesson.order
                        }
                        .{" "}
                        {
                          lesson.title
                        }
                      </h3>

                      {/* COURSE */}
                      <p className="mt-1 text-sm text-slate-500">
                        Course:{" "}
                        {
                          lesson
                            .course
                            ?.title
                        }
                      </p>

                      {/* PREVIEW */}
                      {lesson.isPreview && (
                        <p className="mt-1 text-sm font-medium text-teal-700">
                          Free Preview
                        </p>
                      )}

                      {/* VIDEO PLAYER */}
                      {lesson.videoUrl && (
                        <video
                          controls
                          controlsList="nodownload"
                          preload="metadata"
                          src={`/api/videos/${lesson._id}`}
                          className="mt-4 aspect-video w-full max-w-md rounded-xl bg-slate-950"
                        />
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            lesson
                          )
                        }
                        className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(
                            lesson._id
                          )
                        }
                        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}