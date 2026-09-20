"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type AppSidebarProps = {
  name: string;
  role: "user" | "admin";
};

const learnerLinks = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/courses", label: "Browse courses", icon: "courses" },
  { href: "/dashboard/my-courses", label: "My learning", icon: "learning" },
];

const adminLinks = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/courses", label: "Courses", icon: "courses" },
  { href: "/admin/lessons", label: "Lessons", icon: "lessons" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/users", label: "Users", icon: "users" },
];

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function CollapseIcon({
  collapsed,
}: {
  collapsed: boolean;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />

      {collapsed ? (
        <path d="m14 9 3 3-3 3" />
      ) : (
        <path d="m17 9-3 3 3 3" />
      )}
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function NavIcon({ icon }: { icon: string }) {
  const className = "h-[18px] w-[18px]";

  if (icon === "home") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (icon === "courses") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    );
  }

  if (icon === "learning") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m10 8 6 4-6 4Z" />
      </svg>
    );
  }

  if (icon === "lessons") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m10 9 5 3-5 3Z" />
      </svg>
    );
  }

  if (icon === "categories") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (icon === "users") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  return null;
}

export default function AppSidebar({
  name,
  role,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const links = role === "admin" ? adminLinks : learnerLinks;

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/login", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      setLoggingOut(false);
      alert("Could not log out. Please try again.");
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
      >
        <MenuIcon />
      </button>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white py-6 shadow-xl shadow-slate-900/5 transition-[width,transform] duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
          collapsed
            ? "lg:w-[88px] lg:px-3"
            : "w-72 px-5 lg:w-72 lg:px-5"
        } ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href={role === "admin" ? "/admin" : "/dashboard"}
            onClick={() => setOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white shadow-sm shadow-teal-900/10">
              L
            </span>

            <div
              className={`min-w-0 ${
                collapsed ? "lg:hidden" : ""
              }`}
            >
              <span className="block truncate text-sm font-semibold tracking-tight text-slate-950">
                Learnspace
              </span>

              <span className="block truncate text-xs text-slate-500">
                {role === "admin"
                  ? "Admin workspace"
                  : "Student workspace"}
              </span>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <CloseIcon />
          </button>

          {/* Desktop collapse */}
          <button
            type="button"
            aria-label={
              collapsed
                ? "Expand navigation"
                : "Collapse navigation"
            }
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            onClick={() =>
              setCollapsed((current) => !current)
            }
            className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-teal-50 hover:text-teal-800 lg:flex ${
              collapsed ? "absolute left-[62px] top-7" : ""
            }`}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="mt-10 space-y-1.5"
          aria-label="Main navigation"
        >
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" &&
                link.href !== "/admin" &&
                pathname.startsWith(`${link.href}/`));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                title={collapsed ? link.label : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  collapsed ? "lg:justify-center" : ""
                } ${
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                    active
                      ? "bg-teal-700 text-white shadow-sm shadow-teal-900/10"
                      : "text-slate-500 group-hover:bg-white group-hover:text-slate-900 group-hover:shadow-sm"
                  }`}
                >
                  <NavIcon icon={link.icon} />
                </span>

                <span
                  className={
                    collapsed ? "lg:hidden" : ""
                  }
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom area */}
        <div className="mt-auto space-y-3 border-t border-slate-200 pt-5">
          {/* User */}
          <div
            className={`flex items-center gap-3 rounded-xl bg-slate-50 p-3 ${
              collapsed ? "lg:justify-center lg:p-2" : ""
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
              {name.charAt(0).toUpperCase()}
            </span>

            <div
              className={`min-w-0 ${
                collapsed ? "lg:hidden" : ""
              }`}
            >
              <p className="truncate text-sm font-semibold text-slate-900">
                {name}
              </p>

              <p className="text-xs text-slate-500">
                {role === "admin"
                  ? "Administrator"
                  : "Learner"}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Logout" : undefined}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition group-hover:bg-white">
              <LogoutIcon />
            </span>

            <span
              className={
                collapsed ? "lg:hidden" : ""
              }
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}