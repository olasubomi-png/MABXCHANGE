import { auth } from "@/lib/auth/server";
import { provisionAuthenticatedUser } from "@/lib/db";

export async function requireAppUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }
  const { appUser, dbError } = await provisionAuthenticatedUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
  if (dbError || !appUser.id) {
    return {
      error: dbError || "Account unavailable",
      status: 503 as const,
    };
  }
  return {
    session,
    appUser,
    error: null as null,
  };
}
