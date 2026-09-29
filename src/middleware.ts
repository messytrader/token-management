import { type NextRequest } from "next/server";
import { updateStaffSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateStaffSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};