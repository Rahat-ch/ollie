/**
 * Next 16's Proxy (the renamed Middleware), on the Node.js runtime by
 * default: every `/api/*` request passes the abuse guard before its route
 * runs. A request from another site is refused with 403 and one address
 * sending a burst with 429; the health check is let through untouched
 * (src/lib/abuse-guard.ts). The daily spend cap lives in the routes, where
 * the cost of each call is known (src/lib/spend-cap.ts).
 */
import { NextResponse, type NextRequest } from "next/server";
import { serverApiGuard } from "@/lib/abuse-guard";

export function proxy(request: NextRequest) {
  return serverApiGuard()(request) ?? NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
