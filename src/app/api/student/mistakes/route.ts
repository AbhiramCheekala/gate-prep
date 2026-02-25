import { db } from "@/db";
import { studentResponses, testAttempts, testQuestions, mcqQuestions, natQuestions, msqQuestions } from "@/db/schema";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { NextResponse, NextRequest } from "next/server";
import { eq, and, gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 10;

  // Get incorrect responses for this student with cursor-based pagination
  const responses = await db
    .select({
      id: studentResponses.id,
      questionType: studentResponses.questionType,
      mcqResponse: studentResponses.mcqResponse,
      natResponse: studentResponses.natResponse,
      msqResponse: studentResponses.msqResponse,
      scoreAwarded: studentResponses.scoreAwarded,
      testQuestionId: studentResponses.testQuestionId,
      questionId: testQuestions.questionId,
    })
    .from(studentResponses)
    .innerJoin(testAttempts, eq(studentResponses.attemptId, testAttempts.id))
    .innerJoin(testQuestions, eq(studentResponses.testQuestionId, testQuestions.id))
    .where(
      and(
        eq(testAttempts.studentId, session.userId),
        eq(studentResponses.isCorrect, false),
        cursor ? gt(studentResponses.id, cursor) : undefined
      )
    )
    .limit(limit + 1);

  const hasMore = responses.length > limit;
  const items = hasMore ? responses.slice(0, limit) : responses;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Fetch question details for each response
  const mistakes = await Promise.all(
    items.map(async (res) => {
      let questionData = null;
      if (res.questionType === "MCQ") {
        questionData = await db.query.mcqQuestions.findFirst({
          where: eq(mcqQuestions.id, res.questionId),
        });
      } else if (res.questionType === "NAT") {
        questionData = await db.query.natQuestions.findFirst({
          where: eq(natQuestions.id, res.questionId),
        });
      } else if (res.questionType === "MSQ") {
        questionData = await db.query.msqQuestions.findFirst({
          where: eq(msqQuestions.id, res.questionId),
        });
      }

      return {
        ...res,
        question: questionData,
      };
    })
  );

  return NextResponse.json({
    items: mistakes,
    nextCursor,
  });
}
