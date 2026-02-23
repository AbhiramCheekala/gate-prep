import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testQuestions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function DELETE(req: NextRequest, { params }: { params: { id: string, qid: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  await db.delete(testQuestions).where(and(eq(testQuestions.testId, params.id), eq(testQuestions.id, params.qid)));
  return NextResponse.json({ success: true });
}
