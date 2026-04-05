export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/weigh-in/:path*",
    "/contests/:path*",
    "/achievements/:path*",
    "/coaching/:path*",
    "/messages/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/notifications/:path*",
  ],
};
