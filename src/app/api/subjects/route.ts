import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET() {
  const data = await db.select().from(subjects);
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { name } = await req.json();
  try {
    await db.insert(subjects).values({ name });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
