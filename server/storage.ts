import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, desc } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { randomUUID, scryptSync, randomBytes } from "crypto";
import {
  type User,
  type InsertUser,
  type Session,
  type InsertShoppingListItem,
  type ShoppingListItem,
  users,
  sessions,
  shoppingListItems,
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const testHash = scryptSync(password, salt, 64).toString("hex");
  return hash === testHash;
}

function generateToken(): string {
  return randomBytes(48).toString("hex");
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSession(userId: string): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  registerWithEmail(email: string, password: string, displayName?: string): Promise<{ user: User; token: string }>;
  loginWithEmail(email: string, password: string): Promise<{ user: User; token: string }>;
  loginWithProvider(provider: string, providerId: string, email: string, displayName?: string, profileImage?: string): Promise<{ user: User; token: string }>;
  getUserFromToken(token: string): Promise<User | undefined>;
  updateSubscriptionStatus(userId: string, status: string): Promise<void>;
  updateProfileImage(userId: string, profileImage: string): Promise<User | undefined>;
  getShoppingList(userId: string): Promise<ShoppingListItem[]>;
  addShoppingListItems(items: InsertShoppingListItem[]): Promise<ShoppingListItem[]>;
  toggleShoppingListItem(id: string, userId: string): Promise<ShoppingListItem | undefined>;
  deleteShoppingListItem(id: string, userId: string): Promise<void>;
  clearShoppingList(userId: string): Promise<void>;
  clearCheckedItems(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByProvider(
    provider: string,
    providerId: string,
  ): Promise<User | undefined> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.providerId, providerId));
    return results.find((u) => u.authProvider === provider);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        email: insertUser.email.toLowerCase(),
      })
      .returning();
    return user;
  }

  async createSession(userId: string): Promise<Session> {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    if (session && session.expiresAt < new Date()) {
      await this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(sessions).where(eq(sessions.token, ""));
  }

  async registerWithEmail(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<{ user: User; token: string }> {
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw new Error("An account with this email already exists");
    }

    const hashedPassword = hashPassword(password);
    const user = await this.createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: displayName || email.split("@")[0],
      authProvider: "email",
    });

    const session = await this.createSession(user.id);
    return { user, token: session.token };
  }

  async loginWithEmail(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      throw new Error("Invalid email or password");
    }

    if (!verifyPassword(password, user.password)) {
      throw new Error("Invalid email or password");
    }

    const session = await this.createSession(user.id);
    return { user, token: session.token };
  }

  async loginWithProvider(
    provider: string,
    providerId: string,
    email: string,
    displayName?: string,
    profileImage?: string,
  ): Promise<{ user: User; token: string }> {
    let user = await this.getUserByProvider(provider, providerId);

    if (!user) {
      const existingEmail = await this.getUserByEmail(email);
      if (existingEmail) {
        user = existingEmail;
      } else {
        user = await this.createUser({
          email: email.toLowerCase(),
          displayName: displayName || email.split("@")[0],
          profileImage,
          authProvider: provider,
          providerId,
        });
      }
    }

    const session = await this.createSession(user.id);
    return { user, token: session.token };
  }

  async getUserFromToken(token: string): Promise<User | undefined> {
    const session = await this.getSessionByToken(token);
    if (!session) return undefined;
    return this.getUser(session.userId);
  }

  async updateSubscriptionStatus(userId: string, status: string): Promise<void> {
    await db
      .update(users)
      .set({ subscriptionStatus: status })
      .where(eq(users.id, userId));
  }

  async updateProfileImage(userId: string, profileImage: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ profileImage })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getShoppingList(userId: string): Promise<ShoppingListItem[]> {
    return db
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.userId, userId))
      .orderBy(desc(shoppingListItems.createdAt));
  }

  async addShoppingListItems(items: InsertShoppingListItem[]): Promise<ShoppingListItem[]> {
    if (items.length === 0) return [];
    const sanitized = items.map((item) => ({
      ...item,
      aisle: item.aisle || "other",
      inPantry: item.inPantry ?? false,
      isChecked: item.isChecked ?? false,
    }));
    return db
      .insert(shoppingListItems)
      .values(sanitized)
      .returning();
  }

  async toggleShoppingListItem(id: string, userId: string): Promise<ShoppingListItem | undefined> {
    const [existing] = await db
      .select()
      .from(shoppingListItems)
      .where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, userId)));
    if (!existing) return undefined;
    const [updated] = await db
      .update(shoppingListItems)
      .set({ isChecked: !existing.isChecked })
      .where(eq(shoppingListItems.id, id))
      .returning();
    return updated;
  }

  async deleteShoppingListItem(id: string, userId: string): Promise<void> {
    await db
      .delete(shoppingListItems)
      .where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, userId)));
  }

  async clearShoppingList(userId: string): Promise<void> {
    await db
      .delete(shoppingListItems)
      .where(eq(shoppingListItems.userId, userId));
  }

  async clearCheckedItems(userId: string): Promise<void> {
    await db
      .delete(shoppingListItems)
      .where(
        and(
          eq(shoppingListItems.userId, userId),
          eq(shoppingListItems.isChecked, true),
        ),
      );
  }
}

export const storage = new DatabaseStorage();
