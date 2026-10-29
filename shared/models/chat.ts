import { z } from "zod";

export const insertConversationSchema = z.object({
  title: z.string(),
});

export const insertMessageSchema = z.object({
  conversationId: z.number(),
  role: z.string(),
  content: z.string(),
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = InsertConversation & {
  id: number;
  createdAt: Date;
};

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = InsertMessage & {
  id: number;
  createdAt: Date;
};
