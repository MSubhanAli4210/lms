import { redirect } from "next/navigation";

import AppSidebar from "@/components/AppSidebar";
import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] lg:flex-row">
      <AppSidebar
        name={user.name}
        role={user.role}
      />

      <main className="h-screen min-w-0 flex-1 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}