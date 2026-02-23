import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tests, testQuestions, mcqQuestions, natQuestions, msqQuestions } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const testData = await db.select().from(tests).where(eq(tests.id, params.id)).limit(1);
  if (!testData[0]) return NextResponse.json({ success: false, error: "Test not found" }, { status: 404 });

  const tqs = await db.select().from(testQuestions).where(eq(testQuestions.testId, params.id)).orderBy(asc(testQuestions.questionOrder));
  
  const mcqIds = tqs.filter(i => i.questionType === "MCQ").map(i => i.questionId);
  const natIds = tqs.filter(i => i.questionType === "NAT").map(i => i.questionId);
  const msqIds = tqs.filter(i => i.questionType === "MSQ").map(i => i.questionId);

  const mcqs = mcqIds.length > 0 ? await db.select().from(mcqQuestions).where(inArray(mcqQuestions.id, mcqIds)) : [];
  const nats = natIds.length > 0 ? await db.select().from(natQuestions).where(inArray(natQuestions.id, natIds)) : [];
  const msqs = msqIds.length > 0 ? await db.select().from(msqQuestions).where(inArray(msqQuestions.id, msqIds)) : [];

  const questionsMap: Record<string, any> = {};
  mcqs.forEach(q => questionsMap[q.id] = { ...q, type: "MCQ" });
  nats.forEach(q => questionsMap[q.id] = { ...q, type: "NAT" });
  msqs.forEach(q => questionsMap[q.id] = { ...q, type: "MSQ" });

  const orderedQuestions = tqs.map(tq => ({
    ...questionsMap[tq.questionId],
    testQuestionId: tq.id,
    order: tq.questionOrder
  }));

  return NextResponse.json({ success: true, data: { ...testData[0], questions: orderedQuestions } });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const data = await req.json();
  await db.update(tests).set(data).where(eq(tests.id, params.id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  await db.delete(tests).where(eq(tests.id, params.id));
  return NextResponse.json({ success: true });
}
