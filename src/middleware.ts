import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TENANT_HOST_HEADER = "x-tenant-host";

function normalizeHost(host: string): string {
  return host.split(":")[0].toLowerCase();
}

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/api/health") ||
    request.nextUrl.pathname.startsWith("/api/payments/webhook")
  ) {
    return NextResponse.next();
  }

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    process.env.DEFAULT_TENANT_HOST ??
    "localhost";

  const headers = new Headers(request.headers);
  headers.set(TENANT_HOST_HEADER, normalizeHost(host));

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
