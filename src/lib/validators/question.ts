import { z } from "zod";

export const mcqValidator = z.object({
  subjectId: z.string().uuid(),
  question: z.string().min(1),
  option1: z.string().min(1),
  option2: z.string().min(1),
  option3: z.string().min(1),
  option4: z.string().min(1),
  correctAns: z.enum(["option1", "option2", "option3", "option4"]),
  marks: z.number().int().min(1).max(2),
  explanation: z.string().optional(),
});

export const natValidator = z.object({
  subjectId: z.string().uuid(),
  question: z.string().min(1),
  correctAnsMin: z.number(),
  correctAnsMax: z.number(),
  marks: z.number().int().min(1).max(2),
  explanation: z.string().optional(),
});

export const msqValidator = z.object({
  subjectId: z.string().uuid(),
  question: z.string().min(1),
  option1: z.string().min(1),
  option2: z.string().min(1),
  option3: z.string().min(1),
  option4: z.string().min(1),
  correctAnswers: z.array(z.string()).min(1),
  marks: z.number().int().min(1).max(2),
  explanation: z.string().optional(),
});

export const bulkUploadValidator = z.array(z.discriminatedUnion("type", [
  z.object({ type: z.literal("MCQ") }).merge(mcqValidator),
  z.object({ type: z.literal("NAT") }).merge(natValidator),
  z.object({ type: z.literal("MSQ") }).merge(msqValidator),
]));
