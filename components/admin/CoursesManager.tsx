"use client";

import { FormEvent, useEffect, useState } from "react";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Course = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail: string;
  level: "beginner" | "intermediate" | "advanced";
  category: Category;
  published: boolean;
};

const initialForm = {
  title: "",
  description: "",
  price: "",
  thumbnail: "",
  level: "beginner",
  category: "",
  published: false,
};

export default function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchData() {
    try {
      const [courseResponse, categoryResponse] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/categories"),
      ]);

      const courseData = await courseResponse.json();
      const categoryData = await categoryResponse.json();

      if (courseResponse.ok) {
        setCourses(courseData.courses);
      }

      if (categoryResponse.ok) {
        setCategories(categoryData.categories);
      }
    } catch (error) {
      console.error("FETCH DATA ERROR:", error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const url = editingId
        ? `/api/courses/${editingId}`
        : "/api/courses";

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      setMessage(
        editingId
          ? "Course updated successfully"
          : "Course created successfully"
      );

      setForm(initialForm);
      setEditingId(null);

      await fetchData();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(course: Course) {
    setEditingId(course._id);

    setForm({
      title: course.title,
      description: course.description,
      price: course.price.toString(),
      thumbnail: course.thumbnail || "",
      level: course.level,
      category: course.category._id,
      published: course.published,
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to delete course");
        return;
      }

      setMessage("Course deleted successfully");

      if (editingId === id) {
        cancelEdit();
      }

      await fetchData();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-slate-950">
          {editingId ? "Edit Course" : "Create Course"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Course title"
            className="w-full rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
            required
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Course description"
            className="min-h-32 w-full rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Price"
              min="0"
              step="0.01"
              className="rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
              required
            />

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
              required
            >
              <option value="">
                Select category
              </option>

              {categories.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              name="level"
              value={form.level}
              onChange={handleChange}
              className="rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
            >
              <option value="beginner">
                Beginner
              </option>

              <option value="intermediate">
                Intermediate
              </option>

              <option value="advanced">
                Advanced
              </option>
            </select>

            <input
              type="url"
              name="thumbnail"
              value={form.thumbnail}
              onChange={handleChange}
              placeholder="Thumbnail URL (optional)"
              className="rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  published: e.target.checked,
                }))
              }
            />

            Published
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/10 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingId
                  ? "Update Course"
                  : "Create Course"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && (
          <p className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm text-teal-800">
            {message}
          </p>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <h2 className="mb-5 text-xl font-semibold tracking-tight text-slate-950">
          Courses
        </h2>

        {courses.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
            No courses created yet.
          </p>
        ) : (
          <div className="space-y-4">
            {courses.map((course, index) => (
              <div
                key={course._id}
                style={{ animationDelay: `${index * 45}ms` }}
                className="animate-item-enter rounded-xl border bg-slate-50/60 p-5 hover:border-teal-200 hover:bg-teal-50/40"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {course.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {course.category?.name}
                      {" • "}
                      {course.level}
                      {" • "}
                      ${course.price}
                    </p>

                    <p className="mt-2 text-sm">
                      {course.published
                        ? "Published"
                        : "Draft"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(course)}
                      className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(course._id)
                      }
                      className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}