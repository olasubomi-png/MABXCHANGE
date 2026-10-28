"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Client-side auth helpers for Client Components (forms, hooks, sign-out buttons).
 * Requests are proxied through /api/auth/[...path].
 */
export const authClient = createAuthClient();
