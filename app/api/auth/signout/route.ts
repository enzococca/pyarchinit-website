export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function POST() {
  try {
    await signOut({ redirect: false });
  } catch {
    // signOut may throw in some NextAuth versions, that's fine
  }
  const response = NextResponse.json({ ok: true });
  // Clear the session cookie
  response.cookies.set("authjs.session-token", "", { maxAge: 0, path: "/" });
  response.cookies.set("__Secure-authjs.session-token", "", { maxAge: 0, path: "/", secure: true });
  return response;
}
