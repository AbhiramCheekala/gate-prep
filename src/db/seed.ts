import * as dotenv from "dotenv";
dotenv.config();

import { db } from "./index";
import { subjects, mcqQuestions, natQuestions, msqQuestions, users, students, tests, testQuestions } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // 1. Create Subject
  const [subject] = await db.insert(subjects).values({
    name: "Computer Science",
  });
  
  // Re-fetch to get the ID if it was generated
  const sub = await db.query.subjects.findFirst();
  if (!sub) throw new Error("Subject creation failed");
  const subjectId = sub.id;

  // 2. Create Questions
  await db.insert(mcqQuestions).values({
    subjectId,
    question: "Which of the following is a volatile memory?",
    option1: "RAM",
    option2: "ROM",
    option3: "EPROM",
    option4: "Flash Memory",
    correctAns: "option1",
    marks: 1,
    explanation: "RAM is volatile as it loses data when power is turned off."
  });

  await db.insert(natQuestions).values({
    subjectId,
    question: "What is the result of 2^10?",
    correctAnsMin: "1024.0000",
    correctAnsMax: "1024.0000",
    marks: 1,
    explanation: "2 raised to the power of 10 is 1024."
  });

  await db.insert(msqQuestions).values({
    subjectId,
    question: "Which of the following are operating systems?",
    option1: "Linux",
    option2: "Windows",
    option3: "Oracle",
    option4: "Intel",
    correctAnswers: ["option1", "option2"],
    marks: 2,
    explanation: "Linux and Windows are operating systems. Oracle is a DB and Intel is a chip manufacturer."
  });

  // 3. Create Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    name: "Admin User",
    email: "admin@gateprep.com",
    passwordHash: adminPassword,
    role: "admin",
  });

  // 4. Create Student
  const studentPassword = await bcrypt.hash("student123", 10);
  await db.insert(students).values({
    name: "Sample Student",
    email: "student@gateprep.com",
    passwordHash: studentPassword,
  });

  // 5. Create a Test
  const admin = await db.query.users.findFirst();
  await db.insert(tests).values({
    name: "Sample Practice Test",
    type: "practice",
    durationMins: 30,
    createdBy: admin?.id,
  });

  const test = await db.query.tests.findFirst();
  
  // Add questions to the test
  const allMcqs = await db.select().from(mcqQuestions);
  const allNats = await db.select().from(natQuestions);

  if (test) {
    await db.insert(testQuestions).values([
      { testId: test.id, questionId: allMcqs[0].id, questionType: "MCQ", questionOrder: 1 },
      { testId: test.id, questionId: allNats[0].id, questionType: "NAT", questionOrder: 2 },
    ]);
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
