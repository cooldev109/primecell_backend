import { z } from 'zod';

// Auth schemas for OTP authentication

export const authStartSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const authVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    createdAt: z.date(),
  }),
});

export type AuthStartDto = z.infer<typeof authStartSchema>;
export type AuthVerifyDto = z.infer<typeof authVerifySchema>;
export type AuthResponseDto = z.infer<typeof authResponseSchema>;
