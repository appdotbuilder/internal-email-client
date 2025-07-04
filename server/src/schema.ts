
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  recipient_id: z.number(),
  subject: z.string(),
  body: z.string(),
  is_read: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Message = z.infer<typeof messageSchema>;

// User registration input schema
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// User login input schema
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Send message input schema
export const sendMessageInputSchema = z.object({
  recipient_email: z.string().email(),
  subject: z.string().min(1),
  body: z.string()
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

// Mark message as read input schema
export const markMessageReadInputSchema = z.object({
  message_id: z.number()
});

export type MarkMessageReadInput = z.infer<typeof markMessageReadInputSchema>;

// Get messages input schema (for filtering)
export const getMessagesInputSchema = z.object({
  type: z.enum(['inbox', 'sent']).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

// Message with user details (for display)
export const messageWithUsersSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  recipient_id: z.number(),
  subject: z.string(),
  body: z.string(),
  is_read: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  sender: z.object({
    id: z.number(),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string()
  }),
  recipient: z.object({
    id: z.number(),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string()
  })
});

export type MessageWithUsers = z.infer<typeof messageWithUsersSchema>;

// Public user info (without password)
export const publicUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  created_at: z.coerce.date()
});

export type PublicUser = z.infer<typeof publicUserSchema>;

// Auth session response
export const authSessionSchema = z.object({
  user: publicUserSchema,
  session_token: z.string()
});

export type AuthSession = z.infer<typeof authSessionSchema>;
