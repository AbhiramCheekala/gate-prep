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
      const { type, ...data } = q;
      if (type === "MCQ") await db.insert(mcqQuestions).values(data as any);
      else if (type === "NAT") await db.insert(natQuestions).values(data as any);
      else if (type === "MSQ") await db.insert(msqQuestions).values(data as any);
      successCount++;
    }
    return NextResponse.json({ success: true, count: successCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, count: successCount }, { status: 500 });
  }
}
