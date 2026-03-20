import { z } from "zod";

export const inviteSchema = z.object({
  inviteCode: z.string().min(6).max(20)
});

