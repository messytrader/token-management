import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Staff (director/admin/PA) login ke liye. Supabase Auth cookies me session
// rakhta hai. Guest users (mobile+PIN) ke liye ye file use NAHI hoti.
export async function supabaseStaffServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component se call hone par set nahi ho sakta,
            // middleware isko refresh karta hai. Ignore karo.
          }
        },
      },
    }
  );
}

export type StaffProfile = {
  id: string;
  full_name: string;
  role: "director" | "admin" | "receptionist";
};

export async function getStaffUser(): Promise<StaffProfile | null> {
  const sb = await supabaseStaffServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb
    .from("staff")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || !data.active) return null;
  return { id: data.id, full_name: data.full_name, role: data.role };
}