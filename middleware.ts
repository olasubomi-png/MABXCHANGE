import { auth } from "@/lib/auth/server";

/**
 * Protects selected routes.
 * Unauthenticated users are redirected to /auth/sign-in.
 *
 * Note: On Next.js 16 the recommended filename is proxy.ts
 * and the export name is `proxy`. We keep middleware.ts for
 * broader compatibility while the upgrade settles.
 */
export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    // Protect the main app surfaces once auth is required
    // For now we only protect profile and any future private routes.
    // Home / activity / rewards remain publicly viewable as the demo shell.
    "/profile/:path*",
    "/account/:path*",
  ],
};
