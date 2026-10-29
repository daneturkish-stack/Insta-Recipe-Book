import { db, auth } from "./firebase";
import { type User, type InsertUser, type InsertShoppingListItem, type ShoppingListItem } from "@shared/schema";
import { FieldValue } from "firebase-admin/firestore";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { id: string }): Promise<User>;
  updateSubscriptionStatus(userId: string, status: string): Promise<void>;
  updateProfileImage(userId: string, profileImage: string): Promise<User | undefined>;
  getShoppingList(userId: string): Promise<ShoppingListItem[]>;
  addShoppingListItems(items: InsertShoppingListItem[]): Promise<ShoppingListItem[]>;
  toggleShoppingListItem(id: string, userId: string): Promise<ShoppingListItem | undefined>;
  deleteShoppingListItem(id: string, userId: string): Promise<void>;
  clearShoppingList(userId: string): Promise<void>;
  clearCheckedItems(userId: string): Promise<void>;
}

export class FirestoreStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection("users").doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data()!;
    return {
      ...data,
      id: doc.id,
      trialStartDate: data.trialStartDate.toDate(),
      createdAt: data.createdAt.toDate(),
    } as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snap = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    if (snap.empty) return undefined;
    const doc = snap.docs[0];
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      trialStartDate: data.trialStartDate.toDate(),
      createdAt: data.createdAt.toDate(),
    } as User;
  }

  async createUser(user: InsertUser & { id: string }): Promise<User> {
    const now = new Date();
    const newUser: User = {
      ...user,
      email: user.email.toLowerCase(),
      authProvider: user.authProvider || "email",
      trialStartDate: now,
      subscriptionStatus: "trial",
      createdAt: now,
    };
    await db.collection("users").doc(user.id).set({
      ...newUser,
      trialStartDate: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
    return newUser;
  }

  async updateSubscriptionStatus(userId: string, status: string): Promise<void> {
    await db.collection("users").doc(userId).update({ subscriptionStatus: status });
  }

  async updateProfileImage(userId: string, profileImage: string): Promise<User | undefined> {
    await db.collection("users").doc(userId).update({ profileImage });
    return this.getUser(userId);
  }

  async getShoppingList(userId: string): Promise<ShoppingListItem[]> {
    const snap = await db
      .collection("shoppingListItems")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate(),
      } as ShoppingListItem;
    });
  }

  async addShoppingListItems(items: InsertShoppingListItem[]): Promise<ShoppingListItem[]> {
    if (items.length === 0) return [];

    const batch = db.batch();
    const results: ShoppingListItem[] = [];
    const now = new Date();

    for (const item of items) {
      const ref = db.collection("shoppingListItems").doc();
      const sanitized = {
        ...item,
        aisle: item.aisle || "other",
        inPantry: item.inPantry ?? false,
        isChecked: item.isChecked ?? false,
        createdAt: FieldValue.serverTimestamp(),
      };
      batch.set(ref, sanitized);
      results.push({
        ...sanitized,
        id: ref.id,
        createdAt: now,
      } as unknown as ShoppingListItem);
    }

    await batch.commit();
    return results;
  }

  async toggleShoppingListItem(id: string, userId: string): Promise<ShoppingListItem | undefined> {
    const ref = db.collection("shoppingListItems").doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) return undefined;

    const isChecked = !doc.data()?.isChecked;
    await ref.update({ isChecked });

    const updated = await ref.get();
    const data = updated.data()!;
    return {
      ...data,
      id: updated.id,
      createdAt: data.createdAt.toDate(),
    } as ShoppingListItem;
  }

  async deleteShoppingListItem(id: string, userId: string): Promise<void> {
    const ref = db.collection("shoppingListItems").doc(id);
    const doc = await ref.get();
    if (doc.exists && doc.data()?.userId === userId) {
      await ref.delete();
    }
  }

  async clearShoppingList(userId: string): Promise<void> {
    const snap = await db.collection("shoppingListItems").where("userId", "==", userId).get();
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async clearCheckedItems(userId: string): Promise<void> {
    const snap = await db
      .collection("shoppingListItems")
      .where("userId", "==", userId)
      .where("isChecked", "==", true)
      .get();
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

export const storage = new FirestoreStorage();
