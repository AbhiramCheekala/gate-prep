import { db } from "@/db";
import { mcqQuestions, natQuestions, msqQuestions, subjects } from "@/db/schema";
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { eq, desc, lt } from "drizzle-orm";

async function isAdmin() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session.role === "admin";
}

export async function GET(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "20");

  // Since questions are spread across 3 tables, we fetch from all and merge
  // This is a simplified approach for cursor pagination across multiple tables
  
  const mcqQuery = db.select().from(mcqQuestions).orderBy(desc(mcqQuestions.createdAt)).limit(limit);
  const natQuery = db.select().from(natQuestions).orderBy(desc(natQuestions.createdAt)).limit(limit);
  const msqQuery = db.select().from(msqQuestions).orderBy(desc(msqQuestions.createdAt)).limit(limit);

  if (cursor) {
    const cursorDate = new Date(cursor);
    mcqQuery.where(lt(mcqQuestions.createdAt, cursorDate));
    natQuery.where(lt(natQuestions.createdAt, cursorDate));
    msqQuery.where(lt(msqQuestions.createdAt, cursorDate));
  }

  const [mcqs, nats, msqs] = await Promise.all([mcqQuery, natQuery, msqQuery]);

  const allQuestions = [
    ...mcqs.map(q => ({ ...q, type: "MCQ" })),
    ...nats.map(q => ({ ...q, type: "NAT" })),
    ...msqs.map(q => ({ ...q, type: "MSQ" })),
  ]
  .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
  .slice(0, limit);

  let nextCursor = null;
  if (allQuestions.length > 0) {
    // We check if there might be more questions
    // A more precise check would involve checking if any table returned 'limit' items
    if (mcqs.length === limit || nats.length === limit || msqs.length === limit) {
      nextCursor = allQuestions[allQuestions.length - 1].createdAt?.toISOString();
    }
  }

  return NextResponse.json({
    items: allQuestions,
    nextCursor
  });
}
