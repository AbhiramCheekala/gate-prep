import { db } from "@/db";
import { studentResponses, testAttempts, testQuestions, mcqQuestions, natQuestions, msqQuestions } from "@/db/schema";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all incorrect responses for this student
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
        eq(studentResponses.isCorrect, false)
      )
    );

  // Fetch question details for each response
  const mistakes = await Promise.all(
    responses.map(async (res) => {
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

  return NextResponse.json(mistakes);
}
