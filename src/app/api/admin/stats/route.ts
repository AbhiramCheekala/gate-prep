import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mcqQuestions, natQuestions, msqQuestions, tests, students, testAttempts } from "@/db/schema";
import { count, avg } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  const [mcqCount] = await db.select({ value: count() }).from(mcqQuestions);
  const [natCount] = await db.select({ value: count() }).from(natQuestions);
  const [msqCount] = await db.select({ value: count() }).from(msqQuestions);
  const [testCount] = await db.select({ value: count() }).from(tests);
  const [studentCount] = await db.select({ value: count() }).from(students);
  const [attemptCount] = await db.select({ value: count() }).from(testAttempts);
  const [avgScore] = await db.select({ value: avg(testAttempts.totalScore) }).from(testAttempts);

  return NextResponse.json({
    success: true,
    data: {
      totalQuestions: mcqCount.value + natCount.value + msqCount.value,
      breakdown: { MCQ: mcqCount.value, NAT: natCount.value, MSQ: msqCount.value },
      totalTests: testCount.value,
      totalStudents: studentCount.value,
      totalAttempts: attemptCount.value,
      avgScore: avgScore.value || 0,
    }
  });
}
