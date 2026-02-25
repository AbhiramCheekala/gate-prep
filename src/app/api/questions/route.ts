import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mcqQuestions, natQuestions, msqQuestions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const subjectId = searchParams.get("subjectId");

  try {
    let data: any[] = [];
    if (type === "MCQ" || !type) {
      const q = db.select().from(mcqQuestions);
      if (subjectId) q.where(eq(mcqQuestions.subjectId, subjectId));
      const res = await q;
      data = [...data, ...res.map(i => ({ ...i, type: "MCQ" }))];
    }
    if (type === "NAT" || !type) {
      const q = db.select().from(natQuestions);
      if (subjectId) q.where(eq(natQuestions.subjectId, subjectId));
      const res = await q;
      data = [...data, ...res.map(i => ({ ...i, type: "NAT" }))];
    }
    if (type === "MSQ" || !type) {
      const q = db.select().from(msqQuestions);
      if (subjectId) q.where(eq(msqQuestions.subjectId, subjectId));
      const res = await q;
      data = [...data, ...res.map(i => ({ ...i, type: "MSQ" }))];
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { type, ...data } = await req.json();
  try {
    if (type === "MCQ") await db.insert(mcqQuestions).values(data);
    else if (type === "NAT") {
      const payload = {
        ...data,
        correctAnsMax: data.correctAnsMax ?? data.correctAnsMin
      };
      await db.insert(natQuestions).values(payload);
    }
    else if (type === "MSQ") await db.insert(msqQuestions).values(data);
    else throw new Error("Invalid question type");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
