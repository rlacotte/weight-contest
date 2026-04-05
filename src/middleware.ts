import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/weigh-in",
  "/contests",
  "/achievements",
  "/coaching",
  "/messages",
  "/profile",
  "/settings",
  "/notifications",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path needs protection
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Check for NextAuth session cookie
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
