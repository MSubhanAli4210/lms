"use client";

import { FormEvent, useEffect, useState } from "react";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchCategories() {
    try {
      const response = await fetch("/api/categories");

      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("FETCH CATEGORIES ERROR:", error);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      setLoading(true);
      setMessage("");

      const url = editingId
        ? `/api/categories/${editingId}`
        : "/api/categories";

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      setMessage(
        editingId
          ? "Category updated successfully"
          : "Category created successfully"
      );

      setName("");
      setEditingId(null);

      await fetchCategories();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(category: Category) {
    setName(category.name);
    setEditingId(category._id);
    setMessage("");
  }

  function cancelEdit() {
    setName("");
    setEditingId(null);
    setMessage("");
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to delete category");
        return;
      }

      setMessage("Category deleted successfully");

      if (editingId === id) {
        setEditingId(null);
        setName("");
      }

      await fetchCategories();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <h2 className="mb-5 text-xl font-semibold tracking-tight text-slate-950">
          {editingId ? "Edit Category" : "Add Category"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/10 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : editingId
                ? "Update"
                : "Add Category"}
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
        </form>

        {message && (
          <p className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm text-teal-800">
            {message}
          </p>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <h2 className="mb-5 text-xl font-semibold tracking-tight text-slate-950">
          Categories
        </h2>

        {categories.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
            No categories yet.
          </p>
        ) : (
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div
                key={category._id}
                style={{ animationDelay: `${index * 45}ms` }}
                className="animate-item-enter flex flex-col gap-4 rounded-xl border bg-slate-50/60 p-4 hover:border-teal-200 hover:bg-teal-50/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {category.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {category.slug}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-800"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(category._id)}
                    className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}