"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type AppSidebarProps = {
  name: string;
  role: "user" | "admin";
};

const learnerLinks = [
  { href: "/dashboard", label: "Overview", icon: "01" },
  { href: "/dashboard/courses", label: "Browse courses", icon: "02" },
  { href: "/dashboard/my-courses", label: "My learning", icon: "03" },
];

const adminLinks = [
  { href: "/admin", label: "Overview", icon: "01" },
  { href: "/admin/courses", label: "Courses", icon: "02" },
  { href: "/admin/lessons", label: "Lessons", icon: "03" },
  { href: "/admin/categories", label: "Categories", icon: "04" },
  { href: "/admin/users", label: "Users", icon: "05" },
];

export default function AppSidebar({ name, role }: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const links = role === "admin" ? adminLinks : learnerLinks;

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
      >
        <span aria-hidden="true">=</span>
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/25 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white py-6 shadow-xl shadow-slate-900/5 transition-[width,transform] duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
          collapsed ? "lg:w-24 lg:px-3" : "w-72 px-5 lg:w-72 lg:px-5"
        } ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <Link href={role === "admin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white">L</span>
            <span className={collapsed ? "hidden" : ""}>
              <span className="block text-sm font-semibold tracking-tight text-slate-950">Learnspace</span>
              <span className="block text-xs text-slate-500">{role === "admin" ? "Admin workspace" : "Student workspace"}</span>
            </span>
          </Link>
          <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="text-xl text-slate-400 lg:hidden">x</button>
          <button type="button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed((current) => !current)} className="hidden rounded-lg p-2 text-sm font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:block">
            {collapsed ? ">" : "<"}
          </button>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Main navigation">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/admin" && pathname.startsWith(`${link.href}/`));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                title={collapsed ? link.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${collapsed ? "justify-center" : ""} ${active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold ${active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>{link.icon}</span>
                <span className={collapsed ? "hidden" : ""}>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t pt-5">
          <div className={`flex items-center gap-3 rounded-lg bg-slate-50 p-3 ${collapsed ? "justify-center" : ""}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">{name.charAt(0).toUpperCase()}</span>
            <div className={`min-w-0 ${collapsed ? "hidden" : ""}`}>
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="text-xs text-slate-500">{role === "admin" ? "Administrator" : "Learner"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}