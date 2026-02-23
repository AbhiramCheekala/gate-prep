import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: session });
}
