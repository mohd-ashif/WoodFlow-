import { z } from 'zod';

export const createAccessRequestSchema = z.object({
  requestedCompanyName: z.string().min(2, 'Company name is required'),
  message: z.string().optional(),
});

export type CreateAccessRequestInput = z.infer<typeof createAccessRequestSchema>;
