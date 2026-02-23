import { db } from "@/db";
import { students } from "@/db/schema";
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import bcrypt from "bcryptjs";
import { desc, lt, and } from "drizzle-orm";

async function isAdmin() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session.role === "admin";
}

export async function GET(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // Expected to be a timestamp string
  const limit = parseInt(searchParams.get("limit") || "10");

  const query = db.select({
    id: students.id,
    name: students.name,
    email: students.email,
    isActive: students.isActive,
    createdAt: students.createdAt,
  })
  .from(students)
  .orderBy(desc(students.createdAt))
  .limit(limit + 1);

  if (cursor) {
    query.where(lt(students.createdAt, new Date(cursor)));
  }

  const results = await query;
  
  let nextCursor = null;
  if (results.length > limit) {
    const nextItem = results.pop();
    nextCursor = nextItem?.createdAt?.toISOString();
  }

  return NextResponse.json({
    items: results,
    nextCursor
  });
}

export async function POST(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(students).values({ name, email, passwordHash });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
