import { redirect } from "next/navigation";

import AppSidebar from "@/components/AppSidebar";
import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#f4f7f6] lg:flex-row">
      <AppSidebar name={user.name} role={user.role} />
      <main className="min-w-0 flex-1 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}