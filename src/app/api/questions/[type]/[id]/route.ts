import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mcqQuestions, natQuestions, msqQuestions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

const getTable = (type: string) => {
  if (type === "MCQ") return mcqQuestions;
  if (type === "NAT") return natQuestions;
  if (type === "MSQ") return msqQuestions;
  return null;
};

export async function GET(req: NextRequest, { params }: { params: { type: string, id: string } }) {
  const table = getTable(params.type);
  if (!table) return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });

  const data = await db.select().from(table as any).where(eq((table as any).id, params.id)).limit(1);
  return NextResponse.json({ success: true, data: data[0] });
}

export async function PUT(req: NextRequest, { params }: { params: { type: string, id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const table = getTable(params.type);
  if (!table) return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });

  const data = await req.json();
  await db.update(table as any).set(data).where(eq((table as any).id, params.id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { type: string, id: string } }) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.role !== "admin" && session.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const table = getTable(params.type);
  if (!table) return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });

  await db.delete(table as any).where(eq((table as any).id, params.id));
  return NextResponse.json({ success: true });
}
