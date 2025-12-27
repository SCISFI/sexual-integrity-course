import {
  users,
  weekReflections,
  commitments,
  dailyCheckins,
  weekCompletions,
  type User,
  type InsertUser,
  type WeekReflection,
  type Commitment,
  type DailyCheckin,
  type WeekCompletion,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Week reflections
  getWeekReflection(userId: string, weekNumber: number): Promise<WeekReflection | undefined>;
  upsertWeekReflection(userId: string, weekNumber: number, data: { q1?: string; q2?: string; q3?: string; q4?: string }): Promise<WeekReflection>;

  // Commitments
  getCommitment(userId: string, weekNumber: number): Promise<Commitment | undefined>;
  upsertCommitment(userId: string, weekNumber: number, statement: string): Promise<Commitment>;

  // Daily check-ins
  getDailyCheckin(userId: string, dateKey: string): Promise<DailyCheckin | undefined>;
  upsertDailyCheckin(userId: string, dateKey: string, data: { mood?: number; triggers?: string; wins?: string; tomorrow?: string }): Promise<DailyCheckin>;

  // Week completions
  getCompletedWeeks(userId: string): Promise<number[]>;
  markWeekComplete(userId: string, weekNumber: number): Promise<WeekCompletion>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Week reflections
  async getWeekReflection(userId: string, weekNumber: number): Promise<WeekReflection | undefined> {
    const [result] = await db
      .select()
      .from(weekReflections)
      .where(and(eq(weekReflections.userId, userId), eq(weekReflections.weekNumber, weekNumber)));
    return result || undefined;
  }

  async upsertWeekReflection(
    userId: string,
    weekNumber: number,
    data: { q1?: string; q2?: string; q3?: string; q4?: string }
  ): Promise<WeekReflection> {
    const existing = await this.getWeekReflection(userId, weekNumber);
    if (existing) {
      const [updated] = await db
        .update(weekReflections)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(weekReflections.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(weekReflections)
        .values({ userId, weekNumber, ...data })
        .returning();
      return created;
    }
  }

  // Commitments
  async getCommitment(userId: string, weekNumber: number): Promise<Commitment | undefined> {
    const [result] = await db
      .select()
      .from(commitments)
      .where(and(eq(commitments.userId, userId), eq(commitments.weekNumber, weekNumber)));
    return result || undefined;
  }

  async upsertCommitment(userId: string, weekNumber: number, statement: string): Promise<Commitment> {
    const existing = await this.getCommitment(userId, weekNumber);
    if (existing) {
      const [updated] = await db
        .update(commitments)
        .set({ statement, updatedAt: new Date() })
        .where(eq(commitments.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(commitments)
        .values({ userId, weekNumber, statement })
        .returning();
      return created;
    }
  }

  // Daily check-ins
  async getDailyCheckin(userId: string, dateKey: string): Promise<DailyCheckin | undefined> {
    const [result] = await db
      .select()
      .from(dailyCheckins)
      .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.dateKey, dateKey)));
    return result || undefined;
  }

  async upsertDailyCheckin(
    userId: string,
    dateKey: string,
    data: { mood?: number; triggers?: string; wins?: string; tomorrow?: string }
  ): Promise<DailyCheckin> {
    const existing = await this.getDailyCheckin(userId, dateKey);
    if (existing) {
      const [updated] = await db
        .update(dailyCheckins)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(dailyCheckins.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyCheckins)
        .values({ userId, dateKey, ...data })
        .returning();
      return created;
    }
  }

  // Week completions
  async getCompletedWeeks(userId: string): Promise<number[]> {
    const results = await db
      .select({ weekNumber: weekCompletions.weekNumber })
      .from(weekCompletions)
      .where(eq(weekCompletions.userId, userId));
    return results.map((r) => r.weekNumber);
  }

  async markWeekComplete(userId: string, weekNumber: number): Promise<WeekCompletion> {
    // Check if already completed
    const existing = await db
      .select()
      .from(weekCompletions)
      .where(and(eq(weekCompletions.userId, userId), eq(weekCompletions.weekNumber, weekNumber)));
    
    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await db
      .insert(weekCompletions)
      .values({ userId, weekNumber })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
