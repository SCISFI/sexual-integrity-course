import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Week reflections - stores answers to the 4 reflection questions per week
export const weekReflections = pgTable("week_reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  q1: text("q1").default(""),
  q2: text("q2").default(""),
  q3: text("q3").default(""),
  q4: text("q4").default(""),
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

// Daily check-ins
export const dailyCheckins = pgTable("daily_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  dateKey: varchar("date_key", { length: 10 }).notNull(), // YYYY-MM-DD
  mood: integer("mood"), // 1-10
  triggers: text("triggers").default(""),
  wins: text("wins").default(""),
  tomorrow: text("tomorrow").default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("daily_checkins_user_date_unique").on(table.userId, table.dateKey),
]);

// Week completion tracking
export const weekCompletions = pgTable("week_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekNumber: integer("week_number").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
}, (table) => [
  unique("week_completions_user_week_unique").on(table.userId, table.weekNumber),
]);

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
