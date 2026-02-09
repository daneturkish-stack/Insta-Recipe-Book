import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  displayName: text("display_name"),
  profileImage: text("profile_image"),
  authProvider: text("auth_provider").notNull().default("email"),
  providerId: text("provider_id"),
  trialStartDate: timestamp("trial_start_date").notNull().defaultNow(),
  subscriptionStatus: text("subscription_status").notNull().default("trial"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  displayName: true,
  profileImage: true,
  authProvider: true,
  providerId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export const shoppingListItems = pgTable("shopping_list_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  amount: text("amount").notNull().default(""),
  unit: text("unit").notNull().default(""),
  aisle: text("aisle").notNull().default("other"),
  inPantry: boolean("in_pantry").notNull().default(false),
  isChecked: boolean("is_checked").notNull().default(false),
  recipeTitle: text("recipe_title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems).pick({
  userId: true,
  name: true,
  amount: true,
  unit: true,
  aisle: true,
  inPantry: true,
  isChecked: true,
  recipeTitle: true,
});

export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
