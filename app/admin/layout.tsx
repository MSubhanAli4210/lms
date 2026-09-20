import { redirect } from "next/navigation";

import AppSidebar from "@/components/AppSidebar";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-[#f4f7f6] lg:flex-row">
      <AppSidebar name={user.name} role="admin" />
      <main className="min-w-0 flex-1 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}