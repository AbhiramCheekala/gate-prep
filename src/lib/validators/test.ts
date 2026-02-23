import { z } from "zod";

export const testValidator = z.object({
  name: z.string().min(1),
  type: z.enum(["practice", "mock"]),
  durationMins: z.number().int().positive().nullable(),
  isActive: z.boolean().optional(),
});
