import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Server-side Neon Managed Auth instance.
 * Used in Server Components, Server Actions, Route Handlers, and middleware/proxy.
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    // sessionDataTtl: 300, // optional, default 5 min
  },
  // logLevel: "warn", // default
});
