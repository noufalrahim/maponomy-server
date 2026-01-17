import { SalesPersonRecord } from "../../../infrastructure/db/schema";

export interface LoginResponseDTO {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  token: string;
  salesperson?: SalesPersonRecord | null;
}
