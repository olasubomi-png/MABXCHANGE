import { auth } from "@/lib/auth/server";

/**
 * Neon Auth API proxy.
 * All Managed Better Auth endpoints are served through this catch-all route.
 */
export const { GET, POST } = auth.handler();
