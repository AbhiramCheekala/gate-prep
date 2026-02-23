import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password, role } = await req.json();
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  try {
    let user;
    if (role === "admin") {
      const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = results[0];
    } else {
      const results = await db.select().from(students).where(eq(students.email, email)).limit(1);
      user = results[0];
    }

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    session.userId = user.id;
    session.role = role === "admin" ? (user as any).role : "student";
    session.name = user.name;
    session.email = user.email;
    await session.save();

    return NextResponse.json({ success: true, data: { name: user.name, role: session.role } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
