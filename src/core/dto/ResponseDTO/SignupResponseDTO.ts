export interface SignupResponseDTO {
  user: {
    id: string;
    email: string;
    password: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    token: string;
  };
}
