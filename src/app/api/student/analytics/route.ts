import { db } from "@/db";
import { testAttempts, tests, studentResponses, subjects, mcqQuestions, natQuestions, msqQuestions, testQuestions } from "@/db/schema";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Performance Over Time (Last 10 tests)
  const performanceHistory = await db
    .select({
      testName: tests.name,
      score: testAttempts.totalScore,
      maxScore: testAttempts.maxScore,
      date: testAttempts.submittedAt,
    })
    .from(testAttempts)
    .innerJoin(tests, eq(testAttempts.testId, tests.id))
    .where(eq(testAttempts.studentId, session.userId))
    .orderBy(testAttempts.submittedAt)
    .limit(10);

  // 2. Subject-wise performance
  // This is more complex because questions are in 3 different tables.
  // We'll fetch all responses and their subject names.
  
  const allResponses = await db
    .select({
      isCorrect: studentResponses.isCorrect,
      questionType: studentResponses.questionType,
      questionId: testQuestions.questionId,
    })
    .from(studentResponses)
    .innerJoin(testAttempts, eq(studentResponses.attemptId, testAttempts.id))
    .innerJoin(testQuestions, eq(studentResponses.testQuestionId, testQuestions.id))
    .where(eq(testAttempts.studentId, session.userId));

  const subjectPerformance: Record<string, { correct: number; total: number }> = {};

  for (const res of allResponses) {
    let subjectId = null;
    if (res.questionType === "MCQ") {
      const q = await db.query.mcqQuestions.findFirst({ where: eq(mcqQuestions.id, res.questionId) });
      subjectId = q?.subjectId;
    } else if (res.questionType === "NAT") {
      const q = await db.query.natQuestions.findFirst({ where: eq(natQuestions.id, res.questionId) });
      subjectId = q?.subjectId;
    } else if (res.questionType === "MSQ") {
      const q = await db.query.msqQuestions.findFirst({ where: eq(msqQuestions.id, res.questionId) });
      subjectId = q?.subjectId;
    }

    if (subjectId) {
      const subject = await db.query.subjects.findFirst({ where: eq(subjects.id, subjectId) });
      const subjectName = subject?.name || "Unknown";
      
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = { correct: 0, total: 0 };
      }
      subjectPerformance[subjectName].total++;
      if (res.isCorrect) {
        subjectPerformance[subjectName].correct++;
      }
    }
  }

  const subjectData = Object.entries(subjectPerformance).map(([name, data]) => ({
    subject: name,
    accuracy: Math.round((data.correct / data.total) * 100),
    total: data.total,
  }));

  return NextResponse.json({
    performanceHistory,
    subjectData,
  });
}
