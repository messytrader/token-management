import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/supabase/staff-server";
import { AdminLoginForm } from "./AdminLoginForm";
import { Navbar } from "../../../components/Navbar";

const HOME: Record<string, string> = {
  director: "/admin/director",
  admin: "/admin/settings",
  receptionist: "/admin/desk",
};

export default async function AdminLoginPage() {
  const staff = await getStaffUser();
  if (staff) redirect(HOME[staff.role] ?? "/admin");

  return (
    <main className="min-h-dvh bg-gradient-to-b from-secondary to-background">
      <Navbar backHref="/" showHelp={false} />
      <div className="flex min-h-[calc(100dvh-73px)] items-center justify-center px-5 py-10 sm:px-8">
        <AdminLoginForm />
      </div>
    </main>
  );
}