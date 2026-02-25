import { mysqlTable, varchar, decimal, mysqlEnum, timestamp, int, json, boolean, uniqueIndex } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { students } from "./users";
import { tests, testQuestions } from "./tests";

export const testAttempts = mysqlTable("test_attempts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: varchar("student_id", { length: 36 }).references(() => students.id),
  testId: varchar("test_id", { length: 36 }).references(() => tests.id),
  startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`),
  submittedAt: timestamp("submitted_at"),
  totalScore: decimal("total_score", { precision: 6, scale: 2 }),
  maxScore: decimal("max_score", { precision: 6, scale: 2 }),
  status: mysqlEnum("status", ["in_progress", "submitted", "timed_out"]).default("in_progress"),
});

export const studentResponses = mysqlTable("student_responses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  attemptId: varchar("attempt_id", { length: 36 }).references(() => testAttempts.id),
  testQuestionId: varchar("test_question_id", { length: 36 }).references(() => testQuestions.id),
  questionType: mysqlEnum("question_type", ["MCQ", "NAT", "MSQ"]).notNull(),
  mcqResponse: mysqlEnum("mcq_response", ["option1", "option2", "option3", "option4"]),
  natResponse: decimal("nat_response", { precision: 18, scale: 4 }),
  msqResponse: json("msq_response"), // string[]
  isCorrect: boolean("is_correct"),
  isMarkedForReview: boolean("is_marked_for_review").default(false),
  scoreAwarded: decimal("score_awarded", { precision: 4, scale: 2 }),
  timeSpentSecs: int("time_spent_secs").default(0),
  answeredAt: timestamp("answered_at").onUpdateNow(),
}, (t) => ({
  attemptQuestionIdx: uniqueIndex("attempt_question_idx").on(t.attemptId, t.testQuestionId),
}));
