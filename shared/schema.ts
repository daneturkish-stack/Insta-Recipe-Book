import { z } from "zod";

export const insertUserSchema = z.object({
    email: z.string().email(),
    password: z.string().optional().nullable(),
    displayName: z.string().optional().nullable(),
    profileImage: z.string().optional().nullable(),
    authProvider: z.string().optional().nullable(),
    providerId: z.string().optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export type User = {
    id: string;
    email: string;
    password?: string | null;
    displayName?: string | null;
    profileImage?: string | null;
    authProvider: string;
    providerId?: string | null;
    trialStartDate: Date;
    subscriptionStatus: string;
    createdAt: Date;
};

export type Session = {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
};

export const insertShoppingListItemSchema = z.object({
    userId: z.string(),
    name: z.string(),
    amount: z.string().optional().nullable().default(""),
    unit: z.string().optional().nullable().default(""),
    aisle: z.string().optional().nullable().default("other"),
    inPantry: z.boolean().optional().nullable().default(false),
    isChecked: z.boolean().optional().nullable().default(false),
    recipeTitle: z.string().optional().nullable(),
});

export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;

export type ShoppingListItem = {
    id: string;
    userId: string;
    name: string;
    amount: string;
    unit: string;
    aisle: string;
    inPantry: boolean;
    isChecked: boolean;
    recipeTitle?: string | null;
    createdAt: Date;
};
