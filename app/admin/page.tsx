import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <section className="animate-page-enter min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Workspace overview</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Admin Dashboard</h1>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <p className="text-lg font-medium text-slate-900">Welcome, {user.name}</p>
          <p className="mt-2 text-sm text-slate-500">Manage your learning content from one place.</p>
        </div>
      </div>
    </section>
  );
}