import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mcqQuestions, natQuestions, msqQuestions } from "@/db/schema";
import { bulkUploadValidator } from "@/lib/validators/question";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const json = await req.json();
  const result = bulkUploadValidator.safeParse(json);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error.message }, { status: 400 });
  }

  const questions = result.data;
  let successCount = 0;

  try {
    for (const q of questions) {
      if (q.type === "MCQ") {
        const { type, ...data } = q;
        await db.insert(mcqQuestions).values(data as any);
      } else if (q.type === "NAT") {
        const { type, ...data } = q;
        const payload = {
          ...data,
          correctAnsMax: q.correctAnsMax ?? q.correctAnsMin
        };
        await db.insert(natQuestions).values(payload as any);
      } else if (q.type === "MSQ") {
        const { type, ...data } = q;
        await db.insert(msqQuestions).values(data as any);
      }
      successCount++;
    }
    return NextResponse.json({ success: true, count: successCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, count: successCount }, { status: 500 });
  }
}
