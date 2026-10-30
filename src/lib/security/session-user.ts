import { auth } from "@/lib/auth/server";
import {
  provisionAuthenticatedUser,
  type AppUserRow,
} from "@/lib/db";

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export type RequireAppUserResult =
  | {
      ok: true;
      session: { user: SessionUser };
      appUser: AppUserRow;
    }
  | {
      ok: false;
      error: string;
      status: 401 | 503;
    };

/**
 * Server-side gate: authenticated Neon session + provisioned app_users row.
 * Callers must branch on `result.ok` before accessing session/appUser.
 */
export async function requireAppUser(): Promise<RequireAppUserResult> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const { appUser, dbError } = await provisionAuthenticatedUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });

  if (dbError || !appUser.id) {
    return {
      ok: false,
      error: dbError || "Account unavailable",
      status: 503,
    };
  }

  return {
    ok: true,
    session: {
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      },
    },
    appUser,
  };
}
