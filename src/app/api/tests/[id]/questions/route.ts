import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testQuestions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await db.select().from(testQuestions).where(eq(testQuestions.testId, params.id)).orderBy(asc(testQuestions.questionOrder));
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { questionId, questionType, questionOrder } = await req.json();
  try {
    await db.insert(testQuestions).values({
      testId: params.id,
      questionId,
      questionType,
      questionOrder,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
