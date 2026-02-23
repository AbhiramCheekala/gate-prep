import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  
  let q = db.select().from(tests);
  if (session.role === "student") {
    q.where(eq(tests.isActive, true));
  }
  
  const data = await q;
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const data = await req.json();
  try {
    await db.insert(tests).values({
      ...data,
      createdBy: session.userId,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
