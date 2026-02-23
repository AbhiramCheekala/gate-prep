import { mysqlTable, varchar, mysqlEnum, int, boolean, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const tests = mysqlTable("tests", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["practice", "mock"]).notNull(),
  durationMins: int("duration_mins"),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const testQuestions = mysqlTable("test_questions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  testId: varchar("test_id", { length: 36 }).references(() => tests.id),
  questionId: varchar("question_id", { length: 36 }).notNull(),
  questionType: mysqlEnum("question_type", ["MCQ", "NAT", "MSQ"]).notNull(),
  questionOrder: int("question_order").notNull(),
}, (t) => ({
  testOrderIdx: uniqueIndex("test_order_idx").on(t.testId, t.questionOrder),
}));
