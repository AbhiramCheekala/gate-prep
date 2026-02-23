import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentResponses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const { testQuestionId, questionType, response, timeSpentSecs, isMarkedForReview } = await req.json();

  try {
    // Check if response exists
    const existing = await db.select().from(studentResponses).where(
      and(eq(studentResponses.attemptId, params.attemptId), eq(studentResponses.testQuestionId, testQuestionId))
    ).limit(1);

    const resData: any = {
      attemptId: params.attemptId,
      testQuestionId,
      questionType,
      timeSpentSecs,
      isMarkedForReview,
    };

    if (questionType === "MCQ") resData.mcqResponse = response;
    else if (questionType === "NAT") resData.natResponse = response;
    else if (questionType === "MSQ") resData.msqResponse = response;

    if (existing[0]) {
      await db.update(studentResponses).set(resData).where(eq(studentResponses.id, existing[0].id));
    } else {
      await db.insert(studentResponses).values(resData);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
