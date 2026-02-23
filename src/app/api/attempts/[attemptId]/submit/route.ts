import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts, studentResponses, testQuestions, mcqQuestions, natQuestions, msqQuestions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { computeScore } from "@/lib/scoring";

export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const attempt = await db.query.testAttempts.findFirst({
      where: (ta, { eq }) => eq(ta.id, params.attemptId),
    });
    if (!attempt || !attempt.testId) return NextResponse.json({ success: false, error: "Attempt or Test not found" }, { status: 404 });

    const responses = await db.select().from(studentResponses).where(eq(studentResponses.attemptId, params.attemptId));
    const tqs = await db.select().from(testQuestions).where(eq(testQuestions.testId, attempt.testId));

    // Fetch question details to score
    const mcqIds = tqs.filter(i => i.questionType === "MCQ").map(i => i.questionId);
    const natIds = tqs.filter(i => i.questionType === "NAT").map(i => i.questionId);
    const msqIds = tqs.filter(i => i.questionType === "MSQ").map(i => i.questionId);

    const mcqs = mcqIds.length > 0 ? await db.select().from(mcqQuestions).where(inArray(mcqQuestions.id, mcqIds)) : [];
    const nats = natIds.length > 0 ? await db.select().from(natQuestions).where(inArray(natQuestions.id, natIds)) : [];
    const msqs = msqIds.length > 0 ? await db.select().from(msqQuestions).where(inArray(msqQuestions.id, msqIds)) : [];

    const questionsMap: Record<string, any> = {};
    mcqs.forEach(q => questionsMap[q.id] = q);
    nats.forEach(q => questionsMap[q.id] = q);
    msqs.forEach(q => questionsMap[q.id] = q);

    let totalScore = 0;
    let maxScore = 0;

    for (const tq of tqs) {
      const question = questionsMap[tq.questionId];
      maxScore += question.marks;
      
      const response = responses.find(r => r.testQuestionId === tq.id);
      let studentAns = null;
      if (response) {
        if (tq.questionType === "MCQ") studentAns = response.mcqResponse;
        else if (tq.questionType === "NAT") studentAns = response.natResponse;
        else if (tq.questionType === "MSQ") studentAns = response.msqResponse;
      }

      let correctAns: any = null;
      if (tq.questionType === "MCQ") correctAns = question.correctAns;
      else if (tq.questionType === "NAT") correctAns = { min: question.correctAnsMin, max: question.correctAnsMax };
      else if (tq.questionType === "MSQ") correctAns = question.correctAnswers;

      const score = computeScore(tq.questionType as any, question.marks, correctAns, studentAns);
      totalScore += score;

      if (response) {
        await db.update(studentResponses).set({
          isCorrect: score > 0,
          scoreAwarded: score.toString(),
        }).where(eq(studentResponses.id, response.id));
      }
    }

    await db.update(testAttempts).set({
      submittedAt: new Date(),
      totalScore: totalScore.toString(),
      maxScore: maxScore.toString(),
      status: "submitted",
    }).where(eq(testAttempts.id, params.attemptId));

    return NextResponse.json({ success: true, data: { totalScore, maxScore } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
