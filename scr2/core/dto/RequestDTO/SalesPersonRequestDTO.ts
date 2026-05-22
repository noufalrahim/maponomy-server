import { z } from "zod";

export const salesPersonRequestSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string().min(1),
    active: z.boolean().default(true),
    monthlyTarget: z.number().default(0),
    password: z.string().min(8),
}).strict();

export type SalesPersonRequestDTO = z.infer<typeof salesPersonRequestSchema>;
