import {
  users,
  weekReflections,
  commitments,
  dailyCheckins,
  weekCompletions,
  therapistClients,
  payments,
  weekFeeWaivers,
  therapistFeedback,
  passwordResetTokens,
  homeworkCompletions,
  type User,
  type InsertUser,
  type WeekReflection,
  type Commitment,
  type DailyCheckin,
  type WeekCompletion,
  type TherapistClient,
  type Payment,
  type WeekFeeWaiver,
  type UserRole,
  type TherapistFeedback,
  type PasswordResetToken,
  type HomeworkCompletion,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, sql } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser & { 
    role?: UserRole; 
    startDate?: string;
    licenseState?: string;
    licenseNumber?: string;
    licenseAttestation?: boolean;
    licenseAttestationDate?: Date;
    termsAccepted?: boolean;
    termsAcceptedDate?: Date;
  }): Promise<User>;
  updateUser(id: string, data: Partial<{ name: string; startDate: string; allFeesWaived: boolean; subscriptionStatus: string; stripeCustomerId: string; stripeSubscriptionId: string }>): Promise<User | undefined>;
  getUsersByRole(role: UserRole): Promise<User[]>;

  // Therapist-Client assignments
  assignTherapistToClient(therapistId: string, clientId: string): Promise<TherapistClient>;
  removeTherapistFromClient(therapistId: string, clientId: string): Promise<void>;
  removeAllTherapistsFromClient(clientId: string): Promise<void>;
  getClientsForTherapist(therapistId: string): Promise<User[]>;
  getTherapistsForClient(clientId: string): Promise<User[]>;

  // Week fee waivers
  waiveWeekFee(clientId: string, weekNumber: number, waivedBy: string): Promise<WeekFeeWaiver>;
  getWaivedWeeks(clientId: string): Promise<number[]>;
  removeWeekWaiver(clientId: string, weekNumber: number): Promise<void>;

  // Payments
  createPayment(data: { userId: string; type: string; weekNumber?: number; amount: number; status?: string; stripePaymentId?: string; assignedTherapistId?: string }): Promise<Payment>;
  getPaymentsForUser(userId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: string, stripePaymentId?: string): Promise<Payment | undefined>;
  hasWeekPayment(userId: string, weekNumber: number): Promise<boolean>;
  getPaymentByStripeId(stripePaymentId: string): Promise<Payment | undefined>;
  getRevenueByTherapist(): Promise<{ therapistId: string; therapistName: string | null; therapistEmail: string; totalAmount: number; paymentCount: number }[]>;

  // Week reflections
  getWeekReflection(userId: string, weekNumber: number): Promise<WeekReflection | undefined>;
  getAllWeekReflections(userId: string): Promise<WeekReflection[]>;
  upsertWeekReflection(userId: string, weekNumber: number, data: { q1?: string; q2?: string; q3?: string; q4?: string }): Promise<WeekReflection>;

  // Commitments
  getCommitment(userId: string, weekNumber: number): Promise<Commitment | undefined>;
  upsertCommitment(userId: string, weekNumber: number, statement: string): Promise<Commitment>;

  // Daily check-ins
  getDailyCheckin(userId: string, dateKey: string): Promise<DailyCheckin | undefined>;
  upsertDailyCheckin(userId: string, dateKey: string, data: { 
    morningChecks?: string; 
    haltChecks?: string; 
    urgeLevel?: number; 
    moodLevel?: number; 
    eveningChecks?: string; 
    journalEntry?: string;
  }): Promise<DailyCheckin>;
  getUserCheckinHistory(userId: string, limit?: number): Promise<DailyCheckin[]>;

  // Week completions
  getCompletedWeeks(userId: string): Promise<number[]>;
  markWeekComplete(userId: string, weekNumber: number): Promise<WeekCompletion>;
  resetWeekCompletion(userId: string, weekNumber: number): Promise<void>;

  // Therapist feedback
  addTherapistFeedback(therapistId: string, clientId: string, feedbackType: string, content: string, weekNumber?: number): Promise<TherapistFeedback>;
  getClientFeedback(clientId: string): Promise<TherapistFeedback[]>;
  getFeedbackForTherapist(therapistId: string, clientId: string): Promise<TherapistFeedback[]>;

  // Password reset tokens
  createPasswordResetToken(userId: string): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  cleanExpiredTokens(): Promise<void>;

  // Password update
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;

  // Homework completions
  getHomeworkCompletion(userId: string, weekNumber: number): Promise<HomeworkCompletion | undefined>;
  upsertHomeworkCompletion(userId: string, weekNumber: number, completedItems: number[]): Promise<HomeworkCompletion>;
  getAllHomeworkCompletions(userId: string): Promise<HomeworkCompletion[]>;

  // User deletion
  deleteUser(userId: string): Promise<void>;
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

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { 
    role?: UserRole; 
    startDate?: string;
    licenseState?: string;
    licenseNumber?: string;
    licenseAttestation?: boolean;
    licenseAttestationDate?: Date;
    termsAccepted?: boolean;
    termsAcceptedDate?: Date;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || "client",
        startDate: insertUser.startDate || null,
        licenseState: insertUser.licenseState || null,
        licenseNumber: insertUser.licenseNumber || null,
        licenseAttestation: insertUser.licenseAttestation || false,
        licenseAttestationDate: insertUser.licenseAttestationDate || null,
        termsAccepted: insertUser.termsAccepted || false,
        termsAcceptedDate: insertUser.termsAcceptedDate || null,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<{ name: string; startDate: string; allFeesWaived: boolean; subscriptionStatus: string; stripeCustomerId: string; stripeSubscriptionId: string }>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Therapist-Client assignments
  async assignTherapistToClient(therapistId: string, clientId: string): Promise<TherapistClient> {
    const [assignment] = await db
      .insert(therapistClients)
      .values({ therapistId, clientId })
      .returning();
    return assignment;
  }

  async removeTherapistFromClient(therapistId: string, clientId: string): Promise<void> {
    await db
      .delete(therapistClients)
      .where(and(eq(therapistClients.therapistId, therapistId), eq(therapistClients.clientId, clientId)));
  }

  async removeAllTherapistsFromClient(clientId: string): Promise<void> {
    await db
      .delete(therapistClients)
      .where(eq(therapistClients.clientId, clientId));
  }

  async getClientsForTherapist(therapistId: string): Promise<User[]> {
    const assignments = await db
      .select({ clientId: therapistClients.clientId })
      .from(therapistClients)
      .where(eq(therapistClients.therapistId, therapistId));
    
    if (assignments.length === 0) return [];
    
    const clientIds = assignments.map(a => a.clientId);
    const clients = await Promise.all(clientIds.map(id => this.getUser(id)));
    return clients.filter((c): c is User => c !== undefined);
  }

  async getTherapistsForClient(clientId: string): Promise<User[]> {
    const assignments = await db
      .select({ therapistId: therapistClients.therapistId })
      .from(therapistClients)
      .where(eq(therapistClients.clientId, clientId));
    
    if (assignments.length === 0) return [];
    
    const therapistIds = assignments.map(a => a.therapistId);
    const therapists = await Promise.all(therapistIds.map(id => this.getUser(id)));
    return therapists.filter((t): t is User => t !== undefined);
  }

  // Week fee waivers
  async waiveWeekFee(clientId: string, weekNumber: number, waivedBy: string): Promise<WeekFeeWaiver> {
    const [waiver] = await db
      .insert(weekFeeWaivers)
      .values({ clientId, weekNumber, waivedBy })
      .returning();
    return waiver;
  }

  async getWaivedWeeks(clientId: string): Promise<number[]> {
    const waivers = await db
      .select({ weekNumber: weekFeeWaivers.weekNumber })
      .from(weekFeeWaivers)
      .where(eq(weekFeeWaivers.clientId, clientId));
    return waivers.map(w => w.weekNumber);
  }

  async removeWeekWaiver(clientId: string, weekNumber: number): Promise<void> {
    await db
      .delete(weekFeeWaivers)
      .where(and(eq(weekFeeWaivers.clientId, clientId), eq(weekFeeWaivers.weekNumber, weekNumber)));
  }

  // Payments
  async createPayment(data: { userId: string; type: string; weekNumber?: number; amount: number; status?: string; stripePaymentId?: string; assignedTherapistId?: string }): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values({
        userId: data.userId,
        type: data.type,
        weekNumber: data.weekNumber || null,
        amount: data.amount,
        status: data.status || "pending",
        stripePaymentId: data.stripePaymentId || null,
        assignedTherapistId: data.assignedTherapistId || null,
      })
      .returning();
    return payment;
  }

  async getPaymentsForUser(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: string, status: string, stripePaymentId?: string): Promise<Payment | undefined> {
    const updateData: { status: string; stripePaymentId?: string } = { status };
    if (stripePaymentId) updateData.stripePaymentId = stripePaymentId;
    
    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async hasWeekPayment(userId: string, weekNumber: number): Promise<boolean> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(
        eq(payments.userId, userId),
        eq(payments.weekNumber, weekNumber),
        eq(payments.status, "completed")
      ));
    return !!payment;
  }

  async getPaymentByStripeId(stripePaymentId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentId, stripePaymentId));
    return payment || undefined;
  }

  async getRevenueByTherapist(): Promise<{ therapistId: string; therapistName: string | null; therapistEmail: string; totalAmount: number; paymentCount: number }[]> {
    const results = await db
      .select({
        therapistId: payments.assignedTherapistId,
        therapistName: users.name,
        therapistEmail: users.email,
        totalAmount: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        paymentCount: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .innerJoin(users, eq(payments.assignedTherapistId, users.id))
      .where(eq(payments.status, "completed"))
      .groupBy(payments.assignedTherapistId, users.name, users.email);
    
    return results.filter(r => r.therapistId !== null).map(r => ({
      therapistId: r.therapistId!,
      therapistName: r.therapistName,
      therapistEmail: r.therapistEmail,
      totalAmount: Number(r.totalAmount),
      paymentCount: Number(r.paymentCount),
    }));
  }

  // Week reflections
  async getWeekReflection(userId: string, weekNumber: number): Promise<WeekReflection | undefined> {
    const [result] = await db
      .select()
      .from(weekReflections)
      .where(and(eq(weekReflections.userId, userId), eq(weekReflections.weekNumber, weekNumber)));
    return result || undefined;
  }

  async getAllWeekReflections(userId: string): Promise<WeekReflection[]> {
    const results = await db
      .select()
      .from(weekReflections)
      .where(eq(weekReflections.userId, userId))
      .orderBy(weekReflections.weekNumber);
    return results;
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
    data: { 
      morningChecks?: string; 
      haltChecks?: string; 
      urgeLevel?: number; 
      moodLevel?: number; 
      eveningChecks?: string; 
      journalEntry?: string;
    }
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

  async getUserCheckinHistory(userId: string, limit: number = 30): Promise<DailyCheckin[]> {
    const results = await db
      .select()
      .from(dailyCheckins)
      .where(eq(dailyCheckins.userId, userId))
      .orderBy(dailyCheckins.dateKey)
      .limit(limit);
    return results;
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

  async resetWeekCompletion(userId: string, weekNumber: number): Promise<void> {
    await db
      .delete(weekCompletions)
      .where(and(eq(weekCompletions.userId, userId), eq(weekCompletions.weekNumber, weekNumber)));
  }

  // Therapist feedback
  async addTherapistFeedback(
    therapistId: string, 
    clientId: string, 
    feedbackType: string, 
    content: string, 
    weekNumber?: number
  ): Promise<TherapistFeedback> {
    const [created] = await db
      .insert(therapistFeedback)
      .values({ therapistId, clientId, feedbackType, content, weekNumber })
      .returning();
    return created;
  }

  async getClientFeedback(clientId: string): Promise<TherapistFeedback[]> {
    const results = await db
      .select()
      .from(therapistFeedback)
      .where(eq(therapistFeedback.clientId, clientId))
      .orderBy(desc(therapistFeedback.createdAt));
    return results;
  }

  async getFeedbackForTherapist(therapistId: string, clientId: string): Promise<TherapistFeedback[]> {
    const results = await db
      .select()
      .from(therapistFeedback)
      .where(and(
        eq(therapistFeedback.therapistId, therapistId),
        eq(therapistFeedback.clientId, clientId)
      ))
      .orderBy(desc(therapistFeedback.createdAt));
    return results;
  }

  // Password reset tokens
  async createPasswordResetToken(userId: string): Promise<PasswordResetToken> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    const [created] = await db
      .insert(passwordResetTokens)
      .values({ userId, token, expiresAt })
      .returning();
    return created;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [result] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return result || undefined;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async cleanExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  // Password update
  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // Homework completions
  async getHomeworkCompletion(userId: string, weekNumber: number): Promise<HomeworkCompletion | undefined> {
    const [result] = await db
      .select()
      .from(homeworkCompletions)
      .where(and(
        eq(homeworkCompletions.userId, userId),
        eq(homeworkCompletions.weekNumber, weekNumber)
      ));
    return result || undefined;
  }

  async upsertHomeworkCompletion(userId: string, weekNumber: number, completedItems: number[]): Promise<HomeworkCompletion> {
    const completedItemsJson = JSON.stringify(completedItems);
    const existing = await this.getHomeworkCompletion(userId, weekNumber);
    
    if (existing) {
      const [updated] = await db
        .update(homeworkCompletions)
        .set({ completedItems: completedItemsJson, updatedAt: new Date() })
        .where(eq(homeworkCompletions.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(homeworkCompletions)
        .values({ userId, weekNumber, completedItems: completedItemsJson })
        .returning();
      return created;
    }
  }

  async getAllHomeworkCompletions(userId: string): Promise<HomeworkCompletion[]> {
    return await db
      .select()
      .from(homeworkCompletions)
      .where(eq(homeworkCompletions.userId, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all related data for the user
    // Order matters due to foreign key constraints
    await db.delete(homeworkCompletions).where(eq(homeworkCompletions.userId, userId));
    await db.delete(weekReflections).where(eq(weekReflections.userId, userId));
    await db.delete(dailyCheckins).where(eq(dailyCheckins.userId, userId));
    await db.delete(weekCompletions).where(eq(weekCompletions.userId, userId));
    await db.delete(therapistFeedback).where(eq(therapistFeedback.clientId, userId));
    await db.delete(weekFeeWaivers).where(eq(weekFeeWaivers.clientId, userId));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await db.delete(payments).where(eq(payments.userId, userId));
    await db.delete(therapistClients).where(eq(therapistClients.clientId, userId));
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
