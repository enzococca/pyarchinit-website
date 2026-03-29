import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const locale = request.cookies.get("locale")?.value;
  if (!locale) {
    const acceptLang = request.headers.get("accept-language") || "";
    const detectedLocale = acceptLang.includes("it") ? "it" : "en";
    const response = NextResponse.next();
    response.cookies.set("locale", detectedLocale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|uploads|videos).*)",
  ],
};
