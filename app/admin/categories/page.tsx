import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import CategoriesManager from "@/components/admin/CategoriesManager";

export default async function CategoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <section className="animate-page-enter min-h-screen px-6 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Content library</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Category Management
          </h1>

          <p className="mt-3 text-slate-600">
            Create and manage LMS course categories.
          </p>
        </div>

        <CategoriesManager />
      </div>
    </section>
  );
}