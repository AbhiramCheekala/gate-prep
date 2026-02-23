import { mysqlTable, varchar, text, tinyint, decimal, json, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { subjects } from "./subjects";

export const mcqQuestions = mysqlTable("mcq_questions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  subjectId: varchar("subject_id", { length: 36 }).references(() => subjects.id),
  question: text("question").notNull(),
  option1: text("option1").notNull(),
  option2: text("option2").notNull(),
  option3: text("option3").notNull(),
  option4: text("option4").notNull(),
  correctAns: mysqlEnum("correct_ans", ["option1", "option2", "option3", "option4"]).notNull(),
  marks: tinyint("marks").notNull(),
  negativeMarks: decimal("negative_marks", { precision: 4, scale: 2 }).default("-0.33"),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const natQuestions = mysqlTable("nat_questions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  subjectId: varchar("subject_id", { length: 36 }).references(() => subjects.id),
  question: text("question").notNull(),
  correctAnsMin: decimal("correct_ans_min", { precision: 12, scale: 4 }).notNull(),
  correctAnsMax: decimal("correct_ans_max", { precision: 12, scale: 4 }).notNull(),
  marks: tinyint("marks").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const msqQuestions = mysqlTable("msq_questions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  subjectId: varchar("subject_id", { length: 36 }).references(() => subjects.id),
  question: text("question").notNull(),
  option1: text("option1").notNull(),
  option2: text("option2").notNull(),
  option3: text("option3").notNull(),
  option4: text("option4").notNull(),
  correctAnswers: json("correct_answers").notNull(), // string[]
  marks: tinyint("marks").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});
