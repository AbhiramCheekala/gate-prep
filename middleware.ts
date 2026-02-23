import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./src/lib/session";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (request.nextUrl.pathname.startsWith("/student")) {
    if (!session.userId || session.role !== "student") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!session.userId || (session.role !== "admin" && session.role !== "teacher")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/admin/:path*"],
};
