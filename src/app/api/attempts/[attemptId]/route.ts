import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testAttempts, studentResponses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { attemptId: string } }) {
  const attempt = await db.select().from(testAttempts).where(eq(testAttempts.id, params.attemptId)).limit(1);
  if (!attempt[0]) return NextResponse.json({ success: false, error: "Attempt not found" }, { status: 404 });

  const responses = await db.select().from(studentResponses).where(eq(studentResponses.attemptId, params.attemptId));
  
  return NextResponse.json({ success: true, data: { ...attempt[0], responses } });
}
