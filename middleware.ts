import { auth } from "@/lib/auth/server";

/**
 * Protects private exchange pages.
 * Unauthenticated users are redirected to /auth/sign-in.
 * Auth routes and the auth API proxy remain public.
 */
export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    /*
     * Protect the main app surfaces.
     * Exclude:
     * - /auth/* (sign-in, sign-up)
     * - /api/auth/* (Neon Auth proxy)
     * - static assets / Next internals
     */
    "/",
    "/activity/:path*",
    "/rewards/:path*",
    "/profile/:path*",
    "/account/:path*",
  ],
};
