import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts } from "@/db/schema";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "student") {
    return NextResponse.json({ success: false, error: "Only students can start attempts" }, { status: 403 });
  }

  const { testId } = await req.json();
  try {
    const [result] = await db.insert(testAttempts).values({
      studentId: session.userId,
      testId,
      status: "in_progress",
    });
    
    // In MySQL with drizzle, insert result usually contains insertId if auto-increment.
    // But we use UUID. Drizzle returns results based on driver.
    // For UUIDs with randomUUID(), we can just get the attempt back.
    const attempt = await db.query.testAttempts.findFirst({
      where: (ta, { and, eq }) => and(eq(ta.studentId, session.userId), eq(ta.testId, testId), eq(ta.status, "in_progress")),
      orderBy: (ta, { desc }) => desc(ta.startedAt)
    });

    return NextResponse.json({ success: true, data: { attemptId: attempt?.id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
