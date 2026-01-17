import { z } from "zod";
import { Role } from "../../../types";

export const authRegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  isActive: z.boolean().default(true),
  role: z.enum([Role.ADMIN, Role.SALES_PERSON, Role.CUSTOMER])
}).strict();

export type AuthDTO = z.infer<typeof authRegisterRequestSchema>;

export const authLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
}).strict();

export type AuthLoginDTO = z.infer<typeof authLoginRequestSchema>;