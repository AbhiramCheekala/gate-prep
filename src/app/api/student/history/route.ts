import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts, tests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "student") return NextResponse.json({ success: false }, { status: 403 });

  const data = await db.select({
    id: testAttempts.id,
    testName: tests.name,
    testType: tests.type,
    startedAt: testAttempts.startedAt,
    submittedAt: testAttempts.submittedAt,
    totalScore: testAttempts.totalScore,
    maxScore: testAttempts.maxScore,
    status: testAttempts.status,
  })
  .from(testAttempts)
  .leftJoin(tests, eq(testAttempts.testId, tests.id))
  .where(eq(testAttempts.studentId, session.userId))
  .orderBy(desc(testAttempts.startedAt));

  return NextResponse.json({ success: true, data });
}
