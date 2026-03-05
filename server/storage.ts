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
  dismissedGuidanceSuggestions,
  passwordResetTokens,
  homeworkCompletions,
  exerciseAnswers,
  weekReviews,
  pushSubscriptions,
  notificationPreferences,
  relapseAutopsies,
  mentorItemReviews,
  weeklySummaries,
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
  type ExerciseAnswer,
  type WeekReview,
  type PushSubscription,
  type NotificationPreference,
  type RelapseAutopsy,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, sql, inArray } from "drizzle-orm";
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
  upsertWeekReflection(userId: string, weekNumber: number, data: { q1?: string; q2?: string; q3?: string; q4?: string; q5?: string; q6?: string }): Promise<WeekReflection>;

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
  addTherapistFeedback(therapistId: string, clientId: string, feedbackType: string, content: string, weekNumber?: number, checkinDateKey?: string, status?: string, subject?: string): Promise<TherapistFeedback>;
  updateTherapistFeedback(feedbackId: string, updates: { content?: string; subject?: string; status?: string; sentAt?: Date; editedAt?: Date; editedBy?: string }): Promise<TherapistFeedback | undefined>;
  getDraftMessages(therapistId: string, clientId: string): Promise<TherapistFeedback[]>;
  getClientFeedback(clientId: string): Promise<TherapistFeedback[]>;
  getFeedbackForTherapist(therapistId: string, clientId: string): Promise<TherapistFeedback[]>;
  getFeedbackById(feedbackId: string): Promise<TherapistFeedback | undefined>;
  updateFeedbackContent(feedbackId: string, content: string, editedBy: string): Promise<TherapistFeedback | undefined>;
  // Dismissed guidance suggestions
  dismissSuggestion(therapistId: string, clientId: string, suggestionId: string): Promise<void>;
  getDismissedSuggestions(therapistId: string, clientId: string): Promise<string[]>;

  // Password reset tokens
  createPasswordResetToken(userId: string): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  cleanExpiredTokens(): Promise<void>;

  // Password update
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;

  // Exercise answers
  getExerciseAnswers(userId: string, weekNumber: number): Promise<ExerciseAnswer | undefined>;
  upsertExerciseAnswers(userId: string, weekNumber: number, answers: string): Promise<ExerciseAnswer>;
  getAllExerciseAnswers(userId: string): Promise<ExerciseAnswer[]>;

  // Homework completions
  getHomeworkCompletion(userId: string, weekNumber: number): Promise<HomeworkCompletion | undefined>;
  upsertHomeworkCompletion(userId: string, weekNumber: number, completedItems: number[]): Promise<HomeworkCompletion>;
  getAllHomeworkCompletions(userId: string): Promise<HomeworkCompletion[]>;

  // User deletion
  deleteUser(userId: string): Promise<void>;

  // Week reviews
  getWeekReview(clientId: string, weekNumber: number): Promise<WeekReview | undefined>;
  createWeekReview(therapistId: string, clientId: string, weekNumber: number, reviewNotes: string): Promise<WeekReview>;
  getAllWeekReviewsForClient(clientId: string): Promise<WeekReview[]>;
  getPendingReviewsForTherapist(therapistId: string): Promise<Array<{clientId: string; clientName: string; weekNumber: number; completedAt: Date}>>;
  getOverdueReviews(hoursThreshold: number): Promise<Array<{therapistId: string; therapistName: string; clientId: string; clientName: string; weekNumber: number; completedAt: Date; hoursPending: number}>>;

  // Push subscriptions
  savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  deletePushSubscription(userId: string, endpoint: string): Promise<void>;
  getAllPushSubscriptionsForCheckinReminders(): Promise<Array<{userId: string; endpoint: string; p256dh: string; auth: string; checkinReminderTime: string}>>;

  // Notification preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined>;
  upsertNotificationPreferences(userId: string, data: Partial<{checkinReminderEnabled: boolean; checkinReminderTime: string; feedbackNotificationsEnabled: boolean; weeklyProgressEnabled: boolean; nudgeEnabled: boolean}>): Promise<NotificationPreference>;

  // Relapse autopsies
  createRelapseAutopsy(userId: string, data: Partial<RelapseAutopsy>): Promise<RelapseAutopsy>;
  updateRelapseAutopsy(id: string, userId: string, data: Partial<RelapseAutopsy>): Promise<RelapseAutopsy | undefined>;
  getRelapseAutopsies(userId: string): Promise<RelapseAutopsy[]>;
  getRelapseAutopsy(id: string): Promise<RelapseAutopsy | undefined>;
  completeRelapseAutopsy(id: string, userId: string): Promise<RelapseAutopsy | undefined>;
  markAutopsyReviewed(id: string): Promise<RelapseAutopsy | undefined>;
  getUnreviewedAutopsiesForClients(clientIds: string[]): Promise<Array<{userId: string; count: number}>>;

  // Mentor item reviews
  markItemReviewed(therapistId: string, clientId: string, itemType: string, itemKey: string): Promise<void>;
  getItemReviews(therapistId: string, clientId: string): Promise<Array<{itemType: string; itemKey: string; reviewedAt: Date | null}>>;
  getUnreviewedItemCountsForClients(therapistId: string, clientIds: string[]): Promise<Record<string, number>>;

  // Weekly summaries
  saveWeeklySummary(therapistId: string, clientId: string, weekNumber: number, summaryContent: string): Promise<void>;
  getWeeklySummary(clientId: string, weekNumber: number): Promise<{summaryContent: string; createdAt: Date | null} | undefined>;
  getWeeklySummaries(clientId: string): Promise<Array<{weekNumber: number; createdAt: Date | null}>>;

  // Inactive clients for nudge system
  getInactiveClients(daysSince: number): Promise<Array<{id: string; email: string; firstName: string | null; lastName: string | null; lastCheckinDate: string | null}>>;
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
    data: { q1?: string; q2?: string; q3?: string; q4?: string; q5?: string; q6?: string }
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
    weekNumber?: number,
    checkinDateKey?: string,
    status?: string,
    subject?: string
  ): Promise<TherapistFeedback> {
    const resolvedStatus = status ?? "sent";
    const [created] = await db
      .insert(therapistFeedback)
      .values({
        therapistId,
        clientId,
        feedbackType,
        content,
        weekNumber,
        checkinDateKey,
        status: resolvedStatus,
        sentAt: resolvedStatus === "sent" ? new Date() : null,
        subject: subject ?? null,
      })
      .returning();
    return created;
  }

  async updateTherapistFeedback(
    feedbackId: string,
    updates: { content?: string; subject?: string; status?: string; sentAt?: Date; editedAt?: Date; editedBy?: string }
  ): Promise<TherapistFeedback | undefined> {
    const [updated] = await db
      .update(therapistFeedback)
      .set(updates)
      .where(eq(therapistFeedback.id, feedbackId))
      .returning();
    return updated;
  }

  async getDraftMessages(therapistId: string, clientId: string): Promise<TherapistFeedback[]> {
    return db
      .select()
      .from(therapistFeedback)
      .where(and(
        eq(therapistFeedback.therapistId, therapistId),
        eq(therapistFeedback.clientId, clientId),
        eq(therapistFeedback.status, "draft")
      ))
      .orderBy(desc(therapistFeedback.createdAt));
  }

  async updateFeedbackContent(feedbackId: string, content: string, editedBy: string): Promise<TherapistFeedback | undefined> {
    const [updated] = await db
      .update(therapistFeedback)
      .set({ content, editedAt: new Date(), editedBy })
      .where(eq(therapistFeedback.id, feedbackId))
      .returning();
    return updated;
  }

  async getClientFeedback(clientId: string): Promise<TherapistFeedback[]> {
    return db
      .select()
      .from(therapistFeedback)
      .where(and(
        eq(therapistFeedback.clientId, clientId),
        eq(therapistFeedback.status, "sent")
      ))
      .orderBy(desc(therapistFeedback.createdAt));
  }

  async getFeedbackById(feedbackId: string): Promise<TherapistFeedback | undefined> {
    const [result] = await db
      .select()
      .from(therapistFeedback)
      .where(eq(therapistFeedback.id, feedbackId));
    return result;
  }

  async getFeedbackForTherapist(therapistId: string, clientId: string): Promise<TherapistFeedback[]> {
    return db
      .select()
      .from(therapistFeedback)
      .where(and(
        eq(therapistFeedback.therapistId, therapistId),
        eq(therapistFeedback.clientId, clientId)
      ))
      .orderBy(desc(therapistFeedback.createdAt));
  }

  async dismissSuggestion(therapistId: string, clientId: string, suggestionId: string): Promise<void> {
    await db
      .insert(dismissedGuidanceSuggestions)
      .values({ therapistId, clientId, suggestionId })
      .onConflictDoNothing();
  }

  async getDismissedSuggestions(therapistId: string, clientId: string): Promise<string[]> {
    const rows = await db
      .select({ suggestionId: dismissedGuidanceSuggestions.suggestionId })
      .from(dismissedGuidanceSuggestions)
      .where(and(
        eq(dismissedGuidanceSuggestions.therapistId, therapistId),
        eq(dismissedGuidanceSuggestions.clientId, clientId)
      ));
    return rows.map(r => r.suggestionId);
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

  async getExerciseAnswers(userId: string, weekNumber: number): Promise<ExerciseAnswer | undefined> {
    const [result] = await db
      .select()
      .from(exerciseAnswers)
      .where(and(eq(exerciseAnswers.userId, userId), eq(exerciseAnswers.weekNumber, weekNumber)));
    return result || undefined;
  }

  async getAllExerciseAnswers(userId: string): Promise<ExerciseAnswer[]> {
    const results = await db
      .select()
      .from(exerciseAnswers)
      .where(eq(exerciseAnswers.userId, userId))
      .orderBy(exerciseAnswers.weekNumber);
    return results;
  }

  async upsertExerciseAnswers(userId: string, weekNumber: number, answers: string): Promise<ExerciseAnswer> {
    const existing = await this.getExerciseAnswers(userId, weekNumber);
    if (existing) {
      const [updated] = await db
        .update(exerciseAnswers)
        .set({ answers, updatedAt: new Date() })
        .where(eq(exerciseAnswers.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(exerciseAnswers)
        .values({ userId, weekNumber, answers })
        .returning();
      return created;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all related data for the user
    // Order matters due to foreign key constraints
    await db.delete(exerciseAnswers).where(eq(exerciseAnswers.userId, userId));
    await db.delete(homeworkCompletions).where(eq(homeworkCompletions.userId, userId));
    await db.delete(weekReflections).where(eq(weekReflections.userId, userId));
    await db.delete(dailyCheckins).where(eq(dailyCheckins.userId, userId));
    await db.delete(weekCompletions).where(eq(weekCompletions.userId, userId));
    await db.delete(therapistFeedback).where(eq(therapistFeedback.clientId, userId));
    await db.delete(weekFeeWaivers).where(eq(weekFeeWaivers.clientId, userId));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await db.delete(payments).where(eq(payments.userId, userId));
    await db.delete(therapistClients).where(eq(therapistClients.clientId, userId));
    await db.delete(weekReviews).where(eq(weekReviews.clientId, userId));
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Week reviews implementation
  async getWeekReview(clientId: string, weekNumber: number): Promise<WeekReview | undefined> {
    const [result] = await db
      .select()
      .from(weekReviews)
      .where(and(
        eq(weekReviews.clientId, clientId),
        eq(weekReviews.weekNumber, weekNumber)
      ));
    return result || undefined;
  }

  async createWeekReview(therapistId: string, clientId: string, weekNumber: number, reviewNotes: string): Promise<WeekReview> {
    const [review] = await db
      .insert(weekReviews)
      .values({ therapistId, clientId, weekNumber, reviewNotes })
      .returning();
    return review;
  }

  async getAllWeekReviewsForClient(clientId: string): Promise<WeekReview[]> {
    return await db
      .select()
      .from(weekReviews)
      .where(eq(weekReviews.clientId, clientId))
      .orderBy(weekReviews.weekNumber);
  }

  async getPendingReviewsForTherapist(therapistId: string): Promise<Array<{clientId: string; clientName: string; weekNumber: number; completedAt: Date}>> {
    // Get all clients assigned to this therapist
    const clientAssignments = await db
      .select({ clientId: therapistClients.clientId })
      .from(therapistClients)
      .where(eq(therapistClients.therapistId, therapistId));

    if (clientAssignments.length === 0) return [];

    const clientIds = clientAssignments.map(a => a.clientId);

    // Get all week completions for these clients that don't have reviews
    const results: Array<{clientId: string; clientName: string; weekNumber: number; completedAt: Date}> = [];

    for (const clientId of clientIds) {
      const client = await this.getUser(clientId);
      if (!client) continue;

      // Get completed weeks for this client
      const completions = await db
        .select()
        .from(weekCompletions)
        .where(eq(weekCompletions.userId, clientId));

      // Get reviewed weeks for this client
      const reviews = await db
        .select()
        .from(weekReviews)
        .where(eq(weekReviews.clientId, clientId));

      const reviewedWeeks = new Set(reviews.map(r => r.weekNumber));

      // Also consider a week "reviewed" if its individual items are all reviewed
      const itemReviews = await this.getItemReviews(therapistId, clientId);
      const itemReviewTypes = new Set(itemReviews.map(ir => `${ir.itemType}:${ir.itemKey}`));
      
      const reflections = await db.select().from(weekReflections).where(eq(weekReflections.userId, clientId));
      const exercises = await db.select().from(exerciseAnswers).where(eq(exerciseAnswers.userId, clientId));

      // Find completions without reviews
      for (const completion of completions) {
        if (reviewedWeeks.has(completion.weekNumber)) continue;

        // Check if all items for this week are individually reviewed
        const hasReflection = reflections.some(r => r.weekNumber === completion.weekNumber);
        const hasExercise = exercises.some(e => e.weekNumber === completion.weekNumber);
        
        const reflectionOk = !hasReflection || itemReviewTypes.has(`reflection:${completion.weekNumber}`);
        const exerciseOk = !hasExercise || itemReviewTypes.has(`exercise:${completion.weekNumber}`);

        if (!(reflectionOk && exerciseOk) && completion.completedAt) {
          results.push({
            clientId: client.id,
            clientName: client.name || client.email,
            weekNumber: completion.weekNumber,
            completedAt: completion.completedAt
          });
        }
      }
    }

    // Sort by completedAt (oldest first for urgency)
    results.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    return results;
  }

  async getOverdueReviews(hoursThreshold: number): Promise<Array<{therapistId: string; therapistName: string; clientId: string; clientName: string; weekNumber: number; completedAt: Date; hoursPending: number}>> {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - hoursThreshold * 60 * 60 * 1000);

    // Get all week completions older than threshold
    const allCompletions = await db
      .select()
      .from(weekCompletions)
      .where(lt(weekCompletions.completedAt, thresholdDate));

    // Get all reviews
    const allReviews = await db.select().from(weekReviews);
    const reviewedSet = new Set(allReviews.map(r => `${r.clientId}-${r.weekNumber}`));

    // Get all client-therapist assignments
    const allAssignments = await db.select().from(therapistClients);
    const clientToTherapist = new Map(allAssignments.map(a => [a.clientId, a.therapistId]));

    const results: Array<{therapistId: string; therapistName: string; clientId: string; clientName: string; weekNumber: number; completedAt: Date; hoursPending: number}> = [];

    // Cache per-client data to avoid redundant queries
    const clientReflectionsCache = new Map<string, Set<number>>();
    const clientExercisesCache = new Map<string, Set<number>>();
    const clientItemReviewsCache = new Map<string, Set<string>>();

    for (const completion of allCompletions) {
      const key = `${completion.userId}-${completion.weekNumber}`;
      if (reviewedSet.has(key)) continue; // Already reviewed via weekReviews table

      const therapistId = clientToTherapist.get(completion.userId);
      if (!therapistId) continue; // No therapist assigned

      // Check item-level reviews (same logic as getPendingReviewsForTherapist)
      const cacheKey = `${therapistId}:${completion.userId}`;

      if (!clientReflectionsCache.has(completion.userId)) {
        const reflections = await db.select({ weekNumber: weekReflections.weekNumber }).from(weekReflections).where(eq(weekReflections.userId, completion.userId));
        clientReflectionsCache.set(completion.userId, new Set(reflections.map(r => r.weekNumber)));
      }
      if (!clientExercisesCache.has(completion.userId)) {
        const exercises = await db.select({ weekNumber: exerciseAnswers.weekNumber }).from(exerciseAnswers).where(eq(exerciseAnswers.userId, completion.userId));
        clientExercisesCache.set(completion.userId, new Set(exercises.map(e => e.weekNumber)));
      }
      if (!clientItemReviewsCache.has(cacheKey)) {
        const itemReviews = await this.getItemReviews(therapistId, completion.userId);
        clientItemReviewsCache.set(cacheKey, new Set(itemReviews.map(ir => `${ir.itemType}:${ir.itemKey}`)));
      }

      const reflectionWeeks = clientReflectionsCache.get(completion.userId)!;
      const exerciseWeeks = clientExercisesCache.get(completion.userId)!;
      const itemReviewTypes = clientItemReviewsCache.get(cacheKey)!;

      const hasReflection = reflectionWeeks.has(completion.weekNumber);
      const hasExercise = exerciseWeeks.has(completion.weekNumber);
      const reflectionOk = !hasReflection || itemReviewTypes.has(`reflection:${completion.weekNumber}`);
      const exerciseOk = !hasExercise || itemReviewTypes.has(`exercise:${completion.weekNumber}`);

      // Skip if all items are individually reviewed (mentor has already actioned this week)
      if (reflectionOk && exerciseOk) continue;

      const client = await this.getUser(completion.userId);
      const therapist = await this.getUser(therapistId);
      if (!client || !therapist || !completion.completedAt) continue;

      const hoursPending = Math.floor((now.getTime() - completion.completedAt.getTime()) / (1000 * 60 * 60));

      results.push({
        therapistId,
        therapistName: therapist.name || therapist.email,
        clientId: completion.userId,
        clientName: client.name || client.email,
        weekNumber: completion.weekNumber,
        completedAt: completion.completedAt,
        hoursPending
      });
    }

    // Sort by hours pending (most overdue first)
    results.sort((a, b) => b.hoursPending - a.hoursPending);
    return results;
  }

  async savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription> {
    const existing = await db.select().from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
    if (existing.length > 0) {
      const [updated] = await db.update(pushSubscriptions)
        .set({ p256dh, auth })
        .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
        .returning();
      return updated;
    }
    const [sub] = await db.insert(pushSubscriptions).values({ userId, endpoint, p256dh, auth }).returning();
    return sub;
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  }

  async getAllPushSubscriptionsForCheckinReminders(): Promise<Array<{userId: string; endpoint: string; p256dh: string; auth: string; checkinReminderTime: string}>> {
    const results = await db.select({
      userId: pushSubscriptions.userId,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      checkinReminderTime: notificationPreferences.checkinReminderTime,
    })
    .from(pushSubscriptions)
    .innerJoin(notificationPreferences, eq(pushSubscriptions.userId, notificationPreferences.userId))
    .innerJoin(users, eq(pushSubscriptions.userId, users.id))
    .where(and(
      eq(notificationPreferences.checkinReminderEnabled, true),
      eq(users.role, "client"),
      eq(users.subscriptionStatus, "active")
    ));
    return results.map(r => ({
      ...r,
      checkinReminderTime: r.checkinReminderTime || "20:00",
    }));
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined> {
    const [pref] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return pref;
  }

  async upsertNotificationPreferences(userId: string, data: Partial<{checkinReminderEnabled: boolean; checkinReminderTime: string; feedbackNotificationsEnabled: boolean; weeklyProgressEnabled: boolean; nudgeEnabled: boolean}>): Promise<NotificationPreference> {
    const existing = await this.getNotificationPreferences(userId);
    if (existing) {
      const [updated] = await db.update(notificationPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(notificationPreferences)
      .values({ userId, ...data })
      .returning();
    return created;
  }
  // Relapse autopsies
  async createRelapseAutopsy(userId: string, data: Partial<RelapseAutopsy>): Promise<RelapseAutopsy> {
    const [autopsy] = await db.insert(relapseAutopsies).values({
      userId,
      date: data.date || new Date().toISOString().slice(0, 10),
      lapseOrRelapse: data.lapseOrRelapse || "lapse",
      summary: data.summary || "",
      whenStarted: data.whenStarted || "",
      duration: data.duration || "",
      context: data.context || "",
      triggers: data.triggers || "",
      emotions: data.emotions || "",
      thoughts: data.thoughts || "",
      body: data.body || "",
      boundariesBroken: data.boundariesBroken || "",
      warningSigns: data.warningSigns || "",
      decisionPoints: data.decisionPoints || "",
      immediateActions: data.immediateActions || "",
      ruleChanges: data.ruleChanges || "",
      environmentChanges: data.environmentChanges || "",
      supportPlan: data.supportPlan || "",
      next24HoursPlan: data.next24HoursPlan || "",
      status: data.status || "draft",
    }).returning();
    return autopsy;
  }

  async updateRelapseAutopsy(id: string, userId: string, data: Partial<RelapseAutopsy>): Promise<RelapseAutopsy | undefined> {
    const [updated] = await db.update(relapseAutopsies)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(relapseAutopsies.id, id), eq(relapseAutopsies.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async getRelapseAutopsies(userId: string): Promise<RelapseAutopsy[]> {
    return db.select().from(relapseAutopsies)
      .where(eq(relapseAutopsies.userId, userId))
      .orderBy(desc(relapseAutopsies.createdAt));
  }

  async getRelapseAutopsy(id: string): Promise<RelapseAutopsy | undefined> {
    const [autopsy] = await db.select().from(relapseAutopsies).where(eq(relapseAutopsies.id, id));
    return autopsy || undefined;
  }

  async completeRelapseAutopsy(id: string, userId: string): Promise<RelapseAutopsy | undefined> {
    const [updated] = await db.update(relapseAutopsies)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(relapseAutopsies.id, id), eq(relapseAutopsies.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async markAutopsyReviewed(id: string): Promise<RelapseAutopsy | undefined> {
    const [updated] = await db.update(relapseAutopsies)
      .set({ reviewedByTherapist: true, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(relapseAutopsies.id, id))
      .returning();
    return updated || undefined;
  }

  async getUnreviewedAutopsiesForClients(clientIds: string[]): Promise<Array<{userId: string; count: number}>> {
    if (clientIds.length === 0) return [];
    const results = await db.select({
      userId: relapseAutopsies.userId,
      count: sql<number>`count(*)::int`,
    })
      .from(relapseAutopsies)
      .where(and(
        inArray(relapseAutopsies.userId, clientIds),
        eq(relapseAutopsies.status, "completed"),
        eq(relapseAutopsies.reviewedByTherapist, false),
      ))
      .groupBy(relapseAutopsies.userId);
    return results;
  }
  async markItemReviewed(therapistId: string, clientId: string, itemType: string, itemKey: string): Promise<void> {
    await db.insert(mentorItemReviews)
      .values({ therapistId, clientId, itemType, itemKey })
      .onConflictDoUpdate({
        target: [mentorItemReviews.therapistId, mentorItemReviews.clientId, mentorItemReviews.itemType, mentorItemReviews.itemKey],
        set: { reviewedAt: new Date() },
      });
  }

  async getItemReviews(therapistId: string, clientId: string): Promise<Array<{itemType: string; itemKey: string; reviewedAt: Date | null}>> {
    const results = await db.select({
      itemType: mentorItemReviews.itemType,
      itemKey: mentorItemReviews.itemKey,
      reviewedAt: mentorItemReviews.reviewedAt,
    })
      .from(mentorItemReviews)
      .where(and(
        eq(mentorItemReviews.therapistId, therapistId),
        eq(mentorItemReviews.clientId, clientId),
      ));
    return results;
  }
  async getUnreviewedItemCountsForClients(therapistId: string, clientIds: string[]): Promise<Record<string, number>> {
    if (clientIds.length === 0) return {};

    // Batch: get all reviews for this therapist across all clients
    const allReviews = await db.select({
      clientId: mentorItemReviews.clientId,
      itemType: mentorItemReviews.itemType,
      itemKey: mentorItemReviews.itemKey,
    })
      .from(mentorItemReviews)
      .where(and(
        eq(mentorItemReviews.therapistId, therapistId),
        inArray(mentorItemReviews.clientId, clientIds),
      ));
    const reviewedSet = new Set(allReviews.map(r => `${r.clientId}:${r.itemType}:${r.itemKey}`));

    // Batch: get all check-ins for these clients
    const allCheckins = await db.select({ userId: dailyCheckins.userId, dateKey: dailyCheckins.dateKey })
      .from(dailyCheckins)
      .where(inArray(dailyCheckins.userId, clientIds));

    // Batch: get completed weeks per client so we only flag completed-week items
    const allCompletions = await db.select({ userId: weekCompletions.userId, weekNumber: weekCompletions.weekNumber })
      .from(weekCompletions)
      .where(inArray(weekCompletions.userId, clientIds));
    const completedWeeksByClient = new Map<string, Set<number>>();
    for (const wc of allCompletions) {
      if (!completedWeeksByClient.has(wc.userId)) completedWeeksByClient.set(wc.userId, new Set());
      completedWeeksByClient.get(wc.userId)!.add(wc.weekNumber);
    }

    // Batch: get all reflections for these clients
    const allReflections = await db.select({ userId: weekReflections.userId, weekNumber: weekReflections.weekNumber })
      .from(weekReflections)
      .where(inArray(weekReflections.userId, clientIds));

    // Batch: get all exercises for these clients
    const allExercises = await db.select({ userId: exerciseAnswers.userId, weekNumber: exerciseAnswers.weekNumber })
      .from(exerciseAnswers)
      .where(inArray(exerciseAnswers.userId, clientIds));

    // Batch: get all week reviews for these clients
    const allWeekReviews = await db.select({ clientId: weekReviews.clientId, weekNumber: weekReviews.weekNumber })
      .from(weekReviews)
      .where(inArray(weekReviews.clientId, clientIds));
    const weekReviewedSet = new Set(allWeekReviews.map(wr => `${wr.clientId}:${wr.weekNumber}`));

    const counts: Record<string, number> = {};

    for (const c of allCheckins) {
      if (!reviewedSet.has(`${c.userId}:checkin:${c.dateKey}`)) {
        counts[c.userId] = (counts[c.userId] || 0) + 1;
      }
    }
    for (const r of allReflections) {
      const clientCompleted = completedWeeksByClient.get(r.userId);
      if (clientCompleted && clientCompleted.has(r.weekNumber) && !weekReviewedSet.has(`${r.userId}:${r.weekNumber}`) && !reviewedSet.has(`${r.userId}:reflection:${r.weekNumber}`)) {
        counts[r.userId] = (counts[r.userId] || 0) + 1;
      }
    }
    for (const e of allExercises) {
      const clientCompleted = completedWeeksByClient.get(e.userId);
      if (clientCompleted && clientCompleted.has(e.weekNumber) && !weekReviewedSet.has(`${e.userId}:${e.weekNumber}`) && !reviewedSet.has(`${e.userId}:exercise:${e.weekNumber}`)) {
        counts[e.userId] = (counts[e.userId] || 0) + 1;
      }
    }

    return counts;
  }

  async getInactiveClients(daysSince: number): Promise<Array<{id: string; email: string; firstName: string | null; lastName: string | null; lastCheckinDate: string | null}>> {
    const allClients = await db.select().from(users).where(eq(users.role, "client"));
    const cutoff = new Date(Date.now() - daysSince * 86400000);

    const results: Array<{id: string; email: string; firstName: string | null; lastName: string | null; lastCheckinDate: string | null}> = [];

    for (const client of allClients) {
      if (!client.isActive) continue;

      const clientCheckins = await db.select()
        .from(dailyCheckins)
        .where(eq(dailyCheckins.userId, client.id))
        .orderBy(desc(dailyCheckins.checkinDate))
        .limit(1);

      if (clientCheckins.length === 0) {
        const createdAt = client.createdAt ? new Date(client.createdAt) : new Date();
        if (createdAt < cutoff) {
          results.push({
            id: client.id,
            email: client.email,
            firstName: client.firstName,
            lastName: client.lastName,
            lastCheckinDate: null,
          });
        }
        continue;
      }

      const lastCheckin = clientCheckins[0];
      const lastDate = lastCheckin.checkinDate instanceof Date
        ? lastCheckin.checkinDate
        : new Date(String(lastCheckin.checkinDate));

      if (lastDate < cutoff) {
        results.push({
          id: client.id,
          email: client.email,
          firstName: client.firstName,
          lastName: client.lastName,
          lastCheckinDate: lastDate.toISOString().slice(0, 10),
        });
      }
    }

    return results;
  }

  async saveWeeklySummary(therapistId: string, clientId: string, weekNumber: number, summaryContent: string): Promise<void> {
    await db.insert(weeklySummaries)
      .values({ therapistId, clientId, weekNumber, summaryContent })
      .onConflictDoUpdate({
        target: [weeklySummaries.clientId, weeklySummaries.weekNumber],
        set: { summaryContent, therapistId, createdAt: new Date() },
      });
  }

  async getWeeklySummary(clientId: string, weekNumber: number): Promise<{summaryContent: string; createdAt: Date | null} | undefined> {
    const [result] = await db.select({
      summaryContent: weeklySummaries.summaryContent,
      createdAt: weeklySummaries.createdAt,
    })
      .from(weeklySummaries)
      .where(and(
        eq(weeklySummaries.clientId, clientId),
        eq(weeklySummaries.weekNumber, weekNumber),
      ));
    return result || undefined;
  }

  async getWeeklySummaries(clientId: string): Promise<Array<{weekNumber: number; createdAt: Date | null}>> {
    return db.select({
      weekNumber: weeklySummaries.weekNumber,
      createdAt: weeklySummaries.createdAt,
    })
      .from(weeklySummaries)
      .where(eq(weeklySummaries.clientId, clientId));
  }
}

export const storage = new DatabaseStorage();
