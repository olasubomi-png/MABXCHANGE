import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/",
    "/markets/:path*",
    "/trade/:path*",
    "/wallet/:path*",
    "/activity/:path*",
    "/rewards/:path*",
    "/profile/:path*",
    "/account/:path*",
  ],
};
