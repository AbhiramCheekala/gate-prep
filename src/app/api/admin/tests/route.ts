import { db } from "@/db";
import { tests, testQuestions, mcqQuestions, msqQuestions, natQuestions } from "@/db/schema";
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { eq, desc, lt, sql } from "drizzle-orm";

async function isAdmin() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session.role === "admin";
}

export async function GET(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "10");

  const query = db.select()
    .from(tests)
    .orderBy(desc(tests.createdAt))
    .limit(limit + 1);

  if (cursor) {
    query.where(lt(tests.createdAt, new Date(cursor)));
  }

  const results = await query;

  let nextCursor = null;
  if (results.length > limit) {
    const nextItem = results.pop();
    nextCursor = nextItem?.createdAt?.toISOString();
  }

  return NextResponse.json({
    items: results,
    nextCursor
  });
}

export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const { name, type, durationMins, selectionMode, questionIds, randomCounts, generatedQuestions, subjectId } = await req.json();
    
    if (!name || !type || !durationMins) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let finalQuestions: { id: string, type: string }[] = [];

    if (selectionMode === "ai" && generatedQuestions && subjectId) {
      // Questions will be inserted within the transaction
    } else if (selectionMode === "random") {
      const { mcq = 0, msq = 0, nat = 0 } = randomCounts || {};
      
      const [randomMcqs, randomMsqs, randomNats] = await Promise.all([
        mcq > 0 ? db.select({ id: mcqQuestions.id }).from(mcqQuestions).orderBy(sql`RAND()`).limit(mcq) : [],
        msq > 0 ? db.select({ id: msqQuestions.id }).from(msqQuestions).orderBy(sql`RAND()`).limit(msq) : [],
        nat > 0 ? db.select({ id: natQuestions.id }).from(natQuestions).orderBy(sql`RAND()`).limit(nat) : [],
      ]);

      finalQuestions = [
        ...randomMcqs.map(q => ({ id: q.id, type: "MCQ" })),
        ...randomMsqs.map(q => ({ id: q.id, type: "MSQ" })),
        ...randomNats.map(q => ({ id: q.id, type: "NAT" })),
      ];
    } else {
      if (!questionIds || questionIds.length === 0) {
        return NextResponse.json({ error: "No questions selected" }, { status: 400 });
      }
      finalQuestions = questionIds;
    }
    
    // Start transaction
    await db.transaction(async (tx) => {
      const testId = crypto.randomUUID();
      await tx.insert(tests).values({
        id: testId,
        name,
        type,
        durationMins: parseInt(durationMins),
        createdBy: session.userId,
      });

      // If AI generated, insert them first
      if (selectionMode === "ai" && generatedQuestions) {
        for (const [index, q] of generatedQuestions.entries()) {
          const qId = crypto.randomUUID();
          if (q.type === "MCQ") {
            await tx.insert(mcqQuestions).values({ id: qId, subjectId, ...q });
          } else if (q.type === "NAT") {
            await tx.insert(natQuestions).values({ id: qId, subjectId, ...q });
          } else if (q.type === "MSQ") {
            await tx.insert(msqQuestions).values({ id: qId, subjectId, ...q });
          }
          
          await tx.insert(testQuestions).values({
            id: crypto.randomUUID(),
            testId,
            questionId: qId,
            questionType: q.type,
            questionOrder: index + 1,
          });
        }
      } else {
        // Insert existing questions
        const testQuestionValues = finalQuestions.map((q, index: number) => ({
          id: crypto.randomUUID(),
          testId,
          questionId: q.id,
          questionType: q.type as any,
          questionOrder: index + 1,
        }));

        await tx.insert(testQuestions).values(testQuestionValues);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Test creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
