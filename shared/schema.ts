import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, date, unique, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoles = ["admin", "therapist", "client", "parent"] as const;
export type UserRole = typeof userRoles[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").notNull().default("client"), // admin, therapist, client, parent

  // Program type: 'adult' (default) or 'adolescent'
  programType: text("program_type").default("adult"),

  // Client-specific fields
  startDate: date("start_date"), // When client's 16-week program starts

  // Adolescent-specific fields
  dateOfBirth: date("date_of_birth"), // Used for age verification on adolescent accounts
  parentEmail: text("parent_email"),   // Parent email recorded at adolescent registration
  parentName: text("parent_name"),     // Parent name recorded at adolescent registration

  // Therapist licensing fields
  licenseState: text("license_state"),
  licenseNumber: text("license_number"),
  licenseAttestation: boolean("license_attestation").default(false),
  licenseAttestationDate: timestamp("license_attestation_date"),
  termsAccepted: boolean("terms_accepted").default(false),
  termsAcceptedDate: timestamp("terms_accepted_date"),

  // Subscription/payment status
  subscriptionStatus: text("subscription_status").default("active"), // active, paused, cancelled, pending_consent, suspended
  allFeesWaived: boolean("all_fees_waived").default(false),

  // Stripe integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Therapist-Client assignments (many-to-many)
export const therapistClients = pgTable("therapist_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => [
  unique("therapist_client_unique").on(table.therapistId, table.clientId),
]);

// Payment records for tracking fees
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "subscription" for therapists, "week_fee" for clients
  weekNumber: integer("week_number"), // For client week fees
  amount: integer("amount").notNull(), // In cents
  status: text("status").notNull().default("pending"), // pending, completed, waived, failed
  stripePaymentId: text("stripe_payment_id"),
  assignedTherapistId: varchar("assigned_therapist_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Week fee waivers (admin can waive specific week fees for clients)
export const weekFeeWaivers = pgTable("week_fee_waivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  waivedAt: timestamp("waived_at").defaultNow(),
  waivedBy: varchar("waived_by").references(() => users.id),
}, (table) => [
  unique("week_waiver_unique").on(table.clientId, table.weekNumber),
]);

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Parental consent tokens — sent via email to parent when adolescent registers
export const parentConsentTokens = pgTable("parent_consent_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  token: varchar("token", { length: 128 }).notNull().unique(),
  parentEmail: text("parent_email").notNull(),
  parentName: text("parent_name").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, denied, revoked
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type ParentConsentToken = typeof parentConsentTokens.$inferSelect;

// Parent-Client relationships — created when parent approves consent
export const parentClientRelationships = pgTable("parent_client_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  approvedAt: timestamp("approved_at").defaultNow(),
}, (table) => [
  unique("parent_client_unique").on(table.parentId, table.clientId),
]);

export type ParentClientRelationship = typeof parentClientRelationships.$inferSelect;

// Parent-Mentor messages (threaded per teen)
export const parentMessages = pgTable("parent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id), // the teen
  content: text("content").notNull(),
  sentBy: text("sent_by").notNull(), // 'parent' or 'mentor'
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

export type ParentMessage = typeof parentMessages.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

// Role-specific registration schemas
export const registerTherapistSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  licenseState: z.string().min(2, "License state is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseAttestation: z.literal(true, {
    errorMap: () => ({ message: "You must attest that your license is in good standing" }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms and conditions" }),
  }),
});

export const registerClientSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  therapistId: z.string().optional(),
});

export const registerAdolescentSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  therapistId: z.string().min(1, "Please select a mentor"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  stillInHighSchool: z.boolean().optional(),
  parentName: z.string().min(1, "Parent/guardian full name is required"),
  parentEmail: z.string().email("Please enter a valid parent email"),
});

export type RegisterAdolescentInput = z.infer<typeof registerAdolescentSchema>;

// Insert schemas for new tables
export const insertTherapistClientSchema = createInsertSchema(therapistClients).omit({
  id: true,
  assignedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertWeekFeeWaiverSchema = createInsertSchema(weekFeeWaivers).omit({
  id: true,
  waivedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterTherapistInput = z.infer<typeof registerTherapistSchema>;
export type RegisterClientInput = z.infer<typeof registerClientSchema>;

export type TherapistClient = typeof therapistClients.$inferSelect;
export type InsertTherapistClient = z.infer<typeof insertTherapistClientSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type WeekFeeWaiver = typeof weekFeeWaivers.$inferSelect;
export type InsertWeekFeeWaiver = z.infer<typeof insertWeekFeeWaiverSchema>;

// Week reflections - stores answers to the 4 reflection questions per week
export const weekReflections = pgTable("week_reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  q1: text("q1").default(""),
  q2: text("q2").default(""),
  q3: text("q3").default(""),
  q4: text("q4").default(""),
  q5: text("q5").default(""),
  q6: text("q6").default(""),
  qBiblical: text("q_biblical").default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("week_reflections_user_week_unique").on(table.userId, table.weekNumber),
]);

// Commitment statements per week
export const commitments = pgTable("commitments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  statement: text("statement").default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("commitments_user_week_unique").on(table.userId, table.weekNumber),
]);

// Daily check-ins - comprehensive self-monitoring
export const dailyCheckins = pgTable("daily_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  dateKey: varchar("date_key", { length: 10 }).notNull(), // YYYY-MM-DD

  // Morning check-in items (JSON array of checked item IDs)
  morningChecks: text("morning_checks").default("[]"),

  // HALT check items (JSON array of checked item IDs)
  haltChecks: text("halt_checks").default("[]"),

  // Current state levels
  urgeLevel: integer("urge_level").default(0), // 0-10
  moodLevel: integer("mood_level").default(0), // 0-10

  // Evening reflection items (JSON array of checked item IDs)
  eveningChecks: text("evening_checks").default("[]"),

  // Journal entry
  journalEntry: text("journal_entry").default(""),

  updatedAt: timestamp("updated_at").defaultNow(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Week completion tracking
export const weekCompletions = pgTable("week_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
}, (table) => [
  unique("week_completions_user_week_unique").on(table.userId, table.weekNumber),
]);

// Therapist feedback on client work
export const therapistFeedback = pgTable("therapist_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  weekNumber: integer("week_number"),
  checkinDateKey: varchar("checkin_date_key", { length: 50 }),
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(), // 'general', 'week', 'checkin', 'guidance'
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("sent"), // 'draft' or 'sent'
  sentAt: timestamp("sent_at"),
  subject: varchar("subject", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
  editedBy: varchar("edited_by").references(() => users.id),
});

export type TherapistFeedback = typeof therapistFeedback.$inferSelect;

// Dismissed guidance suggestions — mentor can dismiss non-urgent suggestions
export const dismissedGuidanceSuggestions = pgTable("dismissed_guidance_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  suggestionId: varchar("suggestion_id", { length: 100 }).notNull(),
  dismissedAt: timestamp("dismissed_at").defaultNow(),
}, (table) => [
  unique("dismissed_suggestion_unique").on(table.therapistId, table.clientId, table.suggestionId),
]);

export type DismissedGuidanceSuggestion = typeof dismissedGuidanceSuggestions.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Insert schemas
export const insertWeekReflectionSchema = createInsertSchema(weekReflections).omit({
  id: true,
  updatedAt: true,
});

export const insertCommitmentSchema = createInsertSchema(commitments).omit({
  id: true,
  updatedAt: true,
});

export const insertDailyCheckinSchema = createInsertSchema(dailyCheckins).omit({
  id: true,
  updatedAt: true,
});

export const insertWeekCompletionSchema = createInsertSchema(weekCompletions).omit({
  id: true,
  completedAt: true,
});

// Types
export type WeekReflection = typeof weekReflections.$inferSelect;
export type InsertWeekReflection = z.infer<typeof insertWeekReflectionSchema>;

export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;

export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = z.infer<typeof insertDailyCheckinSchema>;

export type WeekCompletion = typeof weekCompletions.$inferSelect;
export type InsertWeekCompletion = z.infer<typeof insertWeekCompletionSchema>;

// Homework checklist completions - tracks which homework items are done per week
export const homeworkCompletions = pgTable("homework_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  completedItems: text("completed_items").default("[]"), // JSON array of completed item indices
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("homework_completions_user_week_unique").on(table.userId, table.weekNumber),
]);

export const exerciseAnswers = pgTable("exercise_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  answers: text("answers").default("{}"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("exercise_answers_user_week_unique").on(table.userId, table.weekNumber),
]);

export const insertHomeworkCompletionSchema = createInsertSchema(homeworkCompletions).omit({
  id: true,
  updatedAt: true,
});

export type HomeworkCompletion = typeof homeworkCompletions.$inferSelect;
export type InsertHomeworkCompletion = z.infer<typeof insertHomeworkCompletionSchema>;

export const insertExerciseAnswerSchema = createInsertSchema(exerciseAnswers).omit({
  id: true,
  updatedAt: true,
});

export type ExerciseAnswer = typeof exerciseAnswers.$inferSelect;
export type InsertExerciseAnswer = z.infer<typeof insertExerciseAnswerSchema>;

// Week reviews - tracks therapist reviews of client week completions
export const weekReviews = pgTable("week_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  reviewNotes: text("review_notes").default(""),
  reviewedAt: timestamp("reviewed_at").defaultNow(),
}, (table) => [
  unique("week_reviews_client_week_unique").on(table.clientId, table.weekNumber),
]);

export const insertWeekReviewSchema = createInsertSchema(weekReviews).omit({
  id: true,
  reviewedAt: true,
});

export type WeekReview = typeof weekReviews.$inferSelect;
export type InsertWeekReview = z.infer<typeof insertWeekReviewSchema>;

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// Notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  checkinReminderEnabled: boolean("checkin_reminder_enabled").default(true),
  checkinReminderTime: text("checkin_reminder_time").default("20:00"),
  feedbackNotificationsEnabled: boolean("feedback_notifications_enabled").default(true),
  weeklyProgressEnabled: boolean("weekly_progress_enabled").default(true),
  nudgeEnabled: boolean("nudge_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  updatedAt: true,
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

// Weekly summary reports
export const weeklySummaries = pgTable("weekly_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  summaryContent: text("summary_content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("weekly_summaries_client_week_unique").on(table.clientId, table.weekNumber),
]);

export type WeeklySummary = typeof weeklySummaries.$inferSelect;

// Mentor item reviews - tracks individual review of check-ins, reflections, exercises
export const mentorItemReviews = pgTable("mentor_item_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  itemType: varchar("item_type", { length: 30 }).notNull(),
  itemKey: varchar("item_key", { length: 50 }).notNull(),
  reviewedAt: timestamp("reviewed_at").defaultNow(),
}, (table) => [
  unique("mentor_item_reviews_unique").on(table.therapistId, table.clientId, table.itemType, table.itemKey),
]);

export type MentorItemReview = typeof mentorItemReviews.$inferSelect;

// Relapse autopsies - client-submitted relapse analysis forms
export const relapseAutopsies = pgTable("relapse_autopsies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(),
  lapseOrRelapse: varchar("lapse_or_relapse", { length: 20 }).notNull(),
  summary: text("summary").default(""),
  whenStarted: text("when_started").default(""),
  duration: text("duration").default(""),
  context: text("context").default(""),
  triggers: text("triggers").default(""),
  emotions: text("emotions").default(""),
  thoughts: text("thoughts").default(""),
  body: text("body").default(""),
  boundariesBroken: text("boundaries_broken").default(""),
  warningSigns: text("warning_signs").default(""),
  decisionPoints: text("decision_points").default(""),
  immediateActions: text("immediate_actions").default(""),
  ruleChanges: text("rule_changes").default(""),
  environmentChanges: text("environment_changes").default(""),
  supportPlan: text("support_plan").default(""),
  next24HoursPlan: text("next_24_hours_plan").default(""),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  completedAt: timestamp("completed_at"),
  reviewedByTherapist: boolean("reviewed_by_therapist").default(false),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRelapseAutopsySchema = createInsertSchema(relapseAutopsies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type RelapseAutopsy = typeof relapseAutopsies.$inferSelect;
export type InsertRelapseAutopsy = z.infer<typeof insertRelapseAutopsySchema>;

// Cohorts — group clients together for batch analytics and management
export const cohorts = pgTable("cohorts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cohortMemberships = pgTable("cohort_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cohortId: varchar("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addedBy: varchar("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("cohort_memberships_cohort_user_unique").on(table.cohortId, table.userId),
]);

export const insertCohortSchema = createInsertSchema(cohorts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCohortMembershipSchema = createInsertSchema(cohortMemberships).omit({
  id: true,
  createdAt: true,
});

export type Cohort = typeof cohorts.$inferSelect;
export type InsertCohort = z.infer<typeof insertCohortSchema>;
export type CohortMembership = typeof cohortMemberships.$inferSelect;
export type InsertCohortMembership = z.infer<typeof insertCohortMembershipSchema>;

// Export chat models
export * from "./models/chat";
