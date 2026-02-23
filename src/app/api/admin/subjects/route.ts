import { db } from "@/db";
import { subjects } from "@/db/schema";
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { eq } from "drizzle-orm";

async function isAdmin() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session.role === "admin";
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const allSubjects = await db.select().from(subjects);
  return NextResponse.json(allSubjects);
}

export async function POST(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    
    await db.insert(subjects).values({ name });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
