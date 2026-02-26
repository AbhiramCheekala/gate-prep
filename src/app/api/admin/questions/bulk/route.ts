import { db } from "@/db";
import { mcqQuestions, natQuestions, msqQuestions } from "@/db/schema";
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

async function isAdmin() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session.role === "admin";
}

export async function POST(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const { subjectId, questions } = await req.json();
    if (!subjectId || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      for (const q of questions) {
        if (q.type === "MCQ") {
          await tx.insert(mcqQuestions).values({
            subjectId,
            question: q.question,
            code: q.code,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4,
            correctAns: q.correctAns,
            marks: q.marks,
            negativeMarks: q.negativeMarks || "-0.33",
            explanation: q.explanation,
          });
        } else if (q.type === "NAT") {
          await tx.insert(natQuestions).values({
            subjectId,
            question: q.question,
            code: q.code,
            correctAnsMin: q.correctAnsMin,
            correctAnsMax: q.correctAnsMax ?? q.correctAnsMin,
            marks: q.marks,
            explanation: q.explanation,
          });
        } else if (q.type === "MSQ") {
          await tx.insert(msqQuestions).values({
            subjectId,
            question: q.question,
            code: q.code,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4,
            correctAnswers: q.correctAnswers,
            marks: q.marks,
            explanation: q.explanation,
          });
        }
      }
    });

    return NextResponse.json({ success: true, count: questions.length });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
