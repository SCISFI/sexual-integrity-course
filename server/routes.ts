import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { passport, hashPassword } from "./auth";
import {
  registerSchema,
  loginSchema,
  registerTherapistSchema,
  registerClientSchema,
  type UserRole,
} from "@shared/schema";
import { z } from "zod";
import webpush from "web-push";
import { generateWeeklySummaryPDF } from "./pdf-service";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@integrityprotocol.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

function startNudgeScheduler() {
  const nudgedToday = new Set<string>();
  let lastNudgeDate = "";

  setInterval(async () => {
    try {
      const now = new Date();
      const dateKey = now.toISOString().split("T")[0];
      const currentHour = now.getUTCHours();

      if (currentHour !== 14) return;

      if (dateKey !== lastNudgeDate) {
        nudgedToday.clear();
        lastNudgeDate = dateKey;
      }

      const inactiveClients = await storage.getInactiveClients(3);

      for (const client of inactiveClients) {
        if (nudgedToday.has(client.id)) continue;
        nudgedToday.add(client.id);

        const prefs = await storage.getNotificationPreferences(client.id);
        if (prefs && !prefs.nudgeEnabled) continue;

        const daysSince = client.lastCheckinDate
          ? Math.floor(
              (Date.now() - new Date(client.lastCheckinDate).getTime()) /
                86400000,
            )
          : 7;

        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
            httpOptions: {
              apiVersion: "",
              baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
            },
          });

          const prompt = `Write a short, warm message (2-3 sentences) for someone in The Integrity Protocol recovery program who hasn't checked in for ${daysSince} days. Be supportive, not judgmental. Don't mention specific details about their program. Focus on the value of showing up and the strength it takes to continue. Do not provide medical advice. TONE: Keep language grounded and measured. Do NOT use power words like "fantastic," "excellent," "amazing," "incredible," "outstanding," "extraordinary," "wonderful," or "remarkable." Simple, honest encouragement only.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          });

          const encouragement =
            response.text ||
            "Every day is a new opportunity. We're here for you whenever you're ready to check in.";

          const loginUrl = process.env.REPLIT_DEV_DOMAIN
            ? `https://${process.env.REPLIT_DEV_DOMAIN}/login?redirect=/daily-checkin`
            : process.env.REPLIT_DOMAINS
              ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/login?redirect=/daily-checkin`
              : undefined;

          const { sendNudgeEmail } = await import("./emailService");
          await sendNudgeEmail(
            client.email,
            client.name || undefined,
            encouragement,
            daysSince,
            loginUrl,
          );
        } catch (nudgeError) {
          console.error(`Failed to send nudge to ${client.email}:`, nudgeError);
        }
      }
    } catch (error) {
      console.error("Nudge scheduler error:", error);
    }
  }, 60000);
  console.log(
    "Inactivity nudge scheduler started (checking every minute at 14:00 UTC)",
  );
}

function startCheckinReminderScheduler() {
  const sentToday = new Set<string>();
  let lastDateKey = "";

  setInterval(async () => {
    try {
      const now = new Date();
      const currentHour = now.getUTCHours().toString().padStart(2, "0");
      const currentMinute = now.getUTCMinutes().toString().padStart(2, "0");
      const currentTime = `${currentHour}:${currentMinute}`;
      const dateKey = now.toISOString().split("T")[0];

      if (dateKey !== lastDateKey) {
        sentToday.clear();
        lastDateKey = dateKey;
      }

      const subscriptions =
        await storage.getAllPushSubscriptionsForCheckinReminders();

      for (const sub of subscriptions) {
        const reminderTime = sub.checkinReminderTime || "20:00";
        const key = `${sub.userId}-${sub.endpoint}`;

        if (sentToday.has(key)) continue;

        const [reminderHour] = reminderTime.split(":");
        const [currentHourParsed] = currentTime.split(":");

        if (reminderHour === currentHourParsed) {
          sentToday.add(key);

          const existingCheckin = await storage.getDailyCheckin(
            sub.userId,
            dateKey,
          );
          if (existingCheckin) continue;

          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({
                title: "Daily Check-in Reminder",
                body: "Take a moment for your daily check-in. How are you doing today?",
                url: "/daily-checkin",
                tag: "checkin-reminder",
              }),
            );
          } catch (pushError: any) {
            if (pushError.statusCode === 410 || pushError.statusCode === 404) {
              await storage.deletePushSubscription(sub.userId, sub.endpoint);
            }
          }
        }
      }
    } catch (error) {
      console.error("Check-in reminder scheduler error:", error);
    }
  }, 60000);

  console.log("Check-in reminder scheduler started (checking every minute)");
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Legacy register endpoint (defaults to client)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "Invalid input",
        });
      }

      const { email, password, name } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const today = new Date().toISOString().split("T")[0];
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: "client",
        startDate: today,
      });

      req.login(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Login failed after registration" });
        }
        const { password: _, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  // =====================================================
  // Staff-only AI Draft Assistant (v2 Hybrid)
  // =====================================================

  app.post(
    "/api/staff/clients/:clientId/ai-draft",
    requireRole("admin", "therapist"), // adjust later if needed
    async (req, res) => {
      try {
        const staffUser = req.user as any;
        const clientId = req.params.clientId;

        const focusRaw = (req.body?.focus ?? "").toString().trim();
        const toneRaw = (req.body?.tone ?? "").toString().trim();
        const constraintsRaw = (req.body?.constraints ?? "").toString().trim();

        if (!clientId) {
          return res.status(400).json({ message: "clientId is required" });
        }

        if (!focusRaw) {
          return res.status(400).json({ message: "focus is required" });
        }

        const { generateStaffDraft } = await import("./aiService");

        const draftText = await generateStaffDraft({
          focus: focusRaw,
          tone: toneRaw || "neutral",
          constraints:
            constraintsRaw ||
            "Avoid shame language. No diagnosis. No risk scoring.",
        });

        return res.json({
          draftText,
          disclaimer:
            "Staff-only draft. Not client-visible. Review and edit before use.",
        });
      } catch (error) {
        console.error("Staff AI draft error:", error);
        return res
          .status(500)
          .json({ message: "Failed to generate staff draft" });
      }
    },
  );
  // Register as therapist
  app.post("/api/auth/register/therapist", async (req, res) => {
    try {
      const parsed = registerTherapistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "Invalid input",
        });
      }

      const {
        email,
        password,
        name,
        licenseState,
        licenseNumber,
        licenseAttestation,
        termsAccepted,
      } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: "therapist",
        licenseState,
        licenseNumber,
        licenseAttestation,
        licenseAttestationDate: new Date(),
        termsAccepted,
        termsAcceptedDate: new Date(),
      });

      console.log(
        `Therapist registered: ${email} - terms accepted: ${termsAccepted} at ${new Date().toISOString()}`,
      );

      req.login(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Login failed after registration" });
        }
        const { password: _, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
      });
    } catch (error) {
      console.error("Therapist registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Default therapist email - clients are assigned here if they don't select one
  const DEFAULT_THERAPIST_EMAIL = "ken-therapist@scifsi.com";

  // Register as client
  app.post("/api/auth/register/client", async (req, res) => {
    try {
      const parsed = registerClientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "Invalid input",
        });
      }

      const {
        email,
        password,
        name,
        therapistId: selectedTherapistId,
      } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Use selected therapist or default to primary therapist
      let therapistId = selectedTherapistId;
      if (!therapistId) {
        const defaultTherapist = await storage.getUserByEmail(
          DEFAULT_THERAPIST_EMAIL,
        );
        if (defaultTherapist && defaultTherapist.role === "therapist") {
          therapistId = defaultTherapist.id;
        }
      }

      // Verify the therapist exists and is a therapist or admin
      let therapist = null;
      if (therapistId) {
        therapist = await storage.getUser(therapistId);
      }
      if (
        !therapist ||
        (therapist.role !== "therapist" && therapist.role !== "admin")
      ) {
        return res
          .status(400)
          .json({ message: "No available therapist found" });
      }

      const hashedPassword = await hashPassword(password);
      const today = new Date().toISOString().split("T")[0];
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: "client",
        startDate: today,
      });

      // Assign the client to the therapist (therapist is validated to exist above)
      await storage.assignTherapistToClient(therapist.id, user.id);

      req.login(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Login failed after registration" });
        }
        const { password: _, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
      });
    } catch (error) {
      console.error("Client registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Get available therapists for client registration (public endpoint)
  app.get("/api/therapists/available", async (req, res) => {
    try {
      const therapists = await storage.getUsersByRole("therapist");
      // Also include admins as they can act as therapists
      const admins = await storage.getUsersByRole("admin");

      // Return id, name, and credentials for selection
      const availableTherapists = [...therapists, ...admins]
        .filter(
          (t) =>
            t.subscriptionStatus === "active" ||
            t.role === "admin" ||
            t.allFeesWaived,
        )
        .map((t) => ({
          id: t.id,
          name: t.name || t.email.split("@")[0],
          licenseState: t.licenseState || null,
          isAdmin: t.role === "admin",
        }));

      res.json({ therapists: availableTherapists });
    } catch (error) {
      console.error("Error fetching available therapists:", error);
      res.status(500).json({ message: "Failed to fetch therapists" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.errors[0]?.message || "Invalid input",
      });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication failed" });
      }
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        const { password: _, ...safeUser } = user;
        return res.json({ user: safeUser });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session cleanup failed" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const { password: _, ...safeUser } = req.user;
      return res.json({ user: safeUser });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  app.get("/api/auth/check", (req, res) => {
    res.json({ authenticated: req.isAuthenticated() });
  });

  // =======================================
  // Progress API endpoints
  // =======================================

  // Week reflections
  app.get("/api/progress/reflection/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const reflection = await storage.getWeekReflection(userId, weekNumber);
      res.json({ reflection: reflection || null });
    } catch (error) {
      console.error("Get reflection error:", error);
      res.status(500).json({ message: "Failed to get reflection" });
    }
  });

  app.put("/api/progress/reflection/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const { q1, q2, q3, q4, q5, q6 } = req.body;
      const reflection = await storage.upsertWeekReflection(
        userId,
        weekNumber,
        { q1, q2, q3, q4, q5, q6 },
      );
      res.json({ reflection });
    } catch (error) {
      console.error("Save reflection error:", error);
      res.status(500).json({ message: "Failed to save reflection" });
    }
  });

  // Exercise answers
  app.get("/api/progress/exercises/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const exerciseData = await storage.getExerciseAnswers(userId, weekNumber);
      res.json({
        answers: exerciseData ? JSON.parse(exerciseData.answers || "{}") : {},
      });
    } catch (error) {
      console.error("Get exercise answers error:", error);
      res.status(500).json({ message: "Failed to get exercise answers" });
    }
  });

  app.put("/api/progress/exercises/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const { answers } = req.body;
      const result = await storage.upsertExerciseAnswers(
        userId,
        weekNumber,
        JSON.stringify(answers || {}),
      );
      res.json({ answers: JSON.parse(result.answers || "{}") });
    } catch (error) {
      console.error("Save exercise answers error:", error);
      res.status(500).json({ message: "Failed to save exercise answers" });
    }
  });

  // Commitments
  app.get("/api/progress/commitment/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const commitment = await storage.getCommitment(userId, weekNumber);
      res.json({ commitment: commitment || null });
    } catch (error) {
      console.error("Get commitment error:", error);
      res.status(500).json({ message: "Failed to get commitment" });
    }
  });

  app.put("/api/progress/commitment/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const { statement } = req.body;
      const commitment = await storage.upsertCommitment(
        userId,
        weekNumber,
        statement || "",
      );
      res.json({ commitment });
    } catch (error) {
      console.error("Save commitment error:", error);
      res.status(500).json({ message: "Failed to save commitment" });
    }
  });

  // Homework completions
  app.get("/api/progress/homework/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const homework = await storage.getHomeworkCompletion(userId, weekNumber);
      const completedItems = homework
        ? JSON.parse(homework.completedItems || "[]")
        : [];
      res.json({ completedItems });
    } catch (error) {
      console.error("Get homework error:", error);
      res.status(500).json({ message: "Failed to get homework completion" });
    }
  });

  app.put("/api/progress/homework/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const { completedItems } = req.body;
      if (!Array.isArray(completedItems)) {
        return res
          .status(400)
          .json({ message: "completedItems must be an array" });
      }
      // Validate all items are non-negative integers
      const validItems = completedItems.every(
        (item) =>
          typeof item === "number" && Number.isInteger(item) && item >= 0,
      );
      if (!validItems) {
        return res.status(400).json({
          message: "completedItems must be an array of non-negative integers",
        });
      }
      const homework = await storage.upsertHomeworkCompletion(
        userId,
        weekNumber,
        completedItems,
      );
      res.json({ homework });
    } catch (error) {
      console.error("Save homework error:", error);
      res.status(500).json({ message: "Failed to save homework completion" });
    }
  });

  // Daily check-ins
  app.get("/api/progress/checkin/:dateKey", requireAuth, async (req, res) => {
    try {
      const { dateKey } = req.params;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return res
          .status(400)
          .json({ message: "Invalid date format (use YYYY-MM-DD)" });
      }
      const userId = (req.user as any).id;
      const checkin = await storage.getDailyCheckin(userId, dateKey);
      res.json({ checkin: checkin || null });
    } catch (error) {
      console.error("Get checkin error:", error);
      res.status(500).json({ message: "Failed to get check-in" });
    }
  });

  app.put("/api/progress/checkin/:dateKey", requireAuth, async (req, res) => {
    try {
      const { dateKey } = req.params;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return res
          .status(400)
          .json({ message: "Invalid date format (use YYYY-MM-DD)" });
      }
      const userId = (req.user as any).id;
      const {
        morningChecks,
        haltChecks,
        urgeLevel,
        moodLevel,
        eveningChecks,
        journalEntry,
      } = req.body;
      const checkin = await storage.upsertDailyCheckin(userId, dateKey, {
        morningChecks:
          morningChecks !== undefined
            ? JSON.stringify(morningChecks)
            : undefined,
        haltChecks:
          haltChecks !== undefined ? JSON.stringify(haltChecks) : undefined,
        urgeLevel:
          urgeLevel !== undefined ? parseInt(urgeLevel, 10) : undefined,
        moodLevel:
          moodLevel !== undefined ? parseInt(moodLevel, 10) : undefined,
        eveningChecks:
          eveningChecks !== undefined
            ? JSON.stringify(eveningChecks)
            : undefined,
        journalEntry,
      });
      res.json({ checkin });
    } catch (error) {
      console.error("Save checkin error:", error);
      res.status(500).json({ message: "Failed to save check-in" });
    }
  });

  // Get check-in history for therapist analysis
  app.get("/api/progress/checkin-history", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 30;
      const checkins = await storage.getUserCheckinHistory(userId, limit);
      res.json({ checkins });
    } catch (error) {
      console.error("Get checkin history error:", error);
      res.status(500).json({ message: "Failed to get check-in history" });
    }
  });

  // Week completions
  app.get("/api/progress/completions", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const completedWeeks = await storage.getCompletedWeeks(userId);
      res.json({ completedWeeks });
    } catch (error) {
      console.error("Get completions error:", error);
      res.status(500).json({ message: "Failed to get completions" });
    }
  });

  app.post("/api/progress/completions/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }
      const userId = (req.user as any).id;
      const user = req.user as any;
      const completion = await storage.markWeekComplete(userId, weekNumber);

      // Send notification to assigned therapist(s)
      try {
        const therapists = await storage.getTherapistsForClient(userId);
        if (therapists.length > 0) {
          const { sendWeekCompletionNotification } = await import(
            "./emailService"
          );
          const dashboardLink = `${req.protocol}://${req.get("host")}/therapist/clients/${userId}`;
          const loginUrl = `${req.protocol}://${req.get("host")}/login`;
          const clientName = user.name || user.email || "Client";

          for (const therapist of therapists) {
            if (therapist.email) {
              await sendWeekCompletionNotification(
                therapist.email,
                therapist.name || undefined,
                clientName,
                weekNumber,
                dashboardLink,
                loginUrl,
              );
            }
          }
        }
      } catch (notifyError) {
        console.error("Failed to send therapist notification:", notifyError);
        // Don't fail the request if notification fails
      }

      res.json({ completion });
    } catch (error) {
      console.error("Mark complete error:", error);
      res.status(500).json({ message: "Failed to mark week complete" });
    }
  });

  // Get check-in statistics for progress dashboard
  function computeCheckinStats(checkins: Array<{ dateKey: string; moodLevel: number | null; urgeLevel: number | null }>, programStartDate?: Date | string | null) {
    if (checkins.length === 0) {
      return {
        totalCheckins: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageMood: 0,
        averageUrge: 0,
        dailyCompletionRate: 0,
        recentCheckins: [],
      };
    }

    const sortedDates = checkins.map((c) => c.dateKey).sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
        if (diffDays === 1) { currentStreak++; } else { break; }
      }
    }

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
      if (diffDays === 1) { tempStreak++; } else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    const moodValues = checkins.filter((c) => c.moodLevel !== null).map((c) => c.moodLevel!);
    const urgeValues = checkins.filter((c) => c.urgeLevel !== null).map((c) => c.urgeLevel!);
    const averageMood = moodValues.length > 0 ? Math.round((moodValues.reduce((a, b) => a + b, 0) / moodValues.length) * 10) / 10 : 0;
    const averageUrge = urgeValues.length > 0 ? Math.round((urgeValues.reduce((a, b) => a + b, 0) / urgeValues.length) * 10) / 10 : 0;

    const nowDate = new Date();
    const oldestCheckinDate = checkins[0]?.dateKey ? new Date(checkins[0].dateKey) : nowDate;
    const daysSinceStart = Math.max(1, Math.ceil((nowDate.getTime() - oldestCheckinDate.getTime()) / 86400000) + 1);
    const windowSize = Math.min(14, daysSinceStart);

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowSize + 1);
    windowStart.setUTCHours(0, 0, 0, 0);
    const recentDates = new Set(checkins.filter((c) => new Date(c.dateKey) >= windowStart).map((c) => c.dateKey));
    const dailyCompletionRate = Math.round((recentDates.size / windowSize) * 100);

    const recentCheckins = checkins.slice(-14).map((c) => ({ date: c.dateKey, mood: c.moodLevel, urge: c.urgeLevel }));

    return { totalCheckins: checkins.length, currentStreak, longestStreak, averageMood, averageUrge, dailyCompletionRate, recentCheckins, windowSize };
  }

  app.get("/api/progress/checkin-stats", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      const checkins = await storage.getUserCheckinHistory(userId, 365);
      res.json(computeCheckinStats(checkins, user?.startDate || user?.createdAt));
    } catch (error) {
      console.error("Get checkin stats error:", error);
      res.status(500).json({ message: "Failed to get checkin statistics" });
    }
  });

  // ── Relapse Autopsy (client-facing) ──────────────────────────────────────
  app.get("/api/relapse-autopsies", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const autopsies = await storage.getRelapseAutopsies(userId);
      res.json({ autopsies });
    } catch (error) {
      console.error("Get autopsies error:", error);
      res.status(500).json({ message: "Failed to get autopsies" });
    }
  });

  app.post("/api/relapse-autopsies", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const autopsy = await storage.createRelapseAutopsy(userId, req.body);
      res.json({ autopsy });
    } catch (error) {
      console.error("Create autopsy error:", error);
      res.status(500).json({ message: "Failed to create autopsy" });
    }
  });

  app.put("/api/relapse-autopsies/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const updated = await storage.updateRelapseAutopsy(id, userId, req.body);
      if (!updated) return res.status(404).json({ message: "Autopsy not found" });
      res.json({ autopsy: updated });
    } catch (error) {
      console.error("Update autopsy error:", error);
      res.status(500).json({ message: "Failed to update autopsy" });
    }
  });

  app.post("/api/relapse-autopsies/:id/complete", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const completed = await storage.completeRelapseAutopsy(id, userId);
      if (!completed) return res.status(404).json({ message: "Autopsy not found" });
      res.json({ autopsy: completed });
    } catch (error) {
      console.error("Complete autopsy error:", error);
      res.status(500).json({ message: "Failed to complete autopsy" });
    }
  });

  app.get("/api/therapist/clients/:clientId/checkin-stats", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const { clientId } = req.params;
      const clients = await storage.getClientsForTherapist(therapistId);
      if (!clients.some((c) => c.id === clientId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const client = await storage.getUser(clientId);
      const checkins = await storage.getUserCheckinHistory(clientId, 365);
      res.json(computeCheckinStats(checkins, client?.startDate || client?.createdAt));
    } catch (error) {
      console.error("Get client checkin stats error:", error);
      res.status(500).json({ message: "Failed to get checkin statistics" });
    }
  });

  app.get("/api/therapist/clients/:clientId/completions", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const { clientId } = req.params;
      const clients = await storage.getClientsForTherapist(therapistId);
      if (!clients.some((c) => c.id === clientId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const completedWeeks = await storage.getCompletedWeeks(clientId);
      res.json({ completedWeeks });
    } catch (error) {
      console.error("Get client completions error:", error);
      res.status(500).json({ message: "Failed to get completions" });
    }
  });

  const MENTOR_WEEK_GUIDANCE: Record<number, { weekTitle: string; detail: string; action: string }> = {
    1: { weekTitle: "The Moment You Stop Pretending", detail: "Week 1 sets the tone for everything that follows. Watch for intellectualizing — clients who discuss the concepts without connecting them to their own specific behavior. Vague reflection answers here predict surface-level engagement throughout the program.", action: "In your first feedback, ask for one concrete example from their own life. Push past abstractions. 'Can you give me a specific moment when this was true for you?' is always the right question." },
    2: { weekTitle: "Nothing About This Is Random", detail: "Pattern recognition requires specificity. Clients who describe their triggers in vague terms ('stress,' 'loneliness') haven't done the mapping work yet. The goal is the exact sequence — what happened, then what, then what.", action: "Ask them to walk through the sequence of their most recent urge from the beginning. If they can't, they're still in the general. Get them specific." },
    3: { weekTitle: "Your Mind Is Not Telling You the Truth", detail: "The most common deflection in Week 3: 'I already knew about cognitive distortions.' Knowing the concept is not the same as catching it in the moment. The work is self-recognition, not comprehension.", action: "Ask them to name the distortion they use most often. Then ask for a recent example. Textbook answers mean they haven't applied it to themselves yet." },
    4: { weekTitle: "When the Urge Hits", detail: "This is where CBT theory is supposed to meet real-time practice. The question isn't whether they read about urge management — it's whether they tried the tools when an urge actually appeared.", action: "Ask: 'What did you do the last time an urge hit?' If the answer is 'I didn't have any urges,' push harder. If the answer is 'I just waited,' that's important information." },
    5: { weekTitle: "Shame Is Not Your Conscience", detail: "High-resistance week. Shame activates avoidance, and the clients who need this material most are often the ones who go quiet during Week 5. A sudden increase in missed check-ins or shorter reflection answers during this week is a clinical signal.", action: "If you see avoidance behavior this week, name it directly. 'I notice you've been quieter since starting Week 5' is a clinical observation, not an accusation. Name what you see." },
    6: { weekTitle: "The People You've Been Living Around", detail: "Relationship patterns surface codependency, enabling relationships, and isolation. The common deflection is externalization — making the week entirely about what others need to change. Watch for it.", action: "Focus your feedback on what they can control. 'What would it look like for you to change your role in that dynamic?' Not what others need to do differently." },
    7: { weekTitle: "What Needs to Be Said", detail: "Emotionally demanding week. Some clients underestimate it; some perform. Both are forms of avoidance. The emotional difficulty of this week is the point — disclosure and honesty have real emotional weight.", action: "Validate the difficulty without minimizing it. 'This is hard for a reason' is more useful than praise. The quality of effort here matters more than polish." },
    8: { weekTitle: "The Architecture of Not Going Back", detail: "The quality of their CBT relapse prevention plan directly predicts their vulnerability. Vague plans ('I'll call someone') are not plans. They're intentions without structure. Plans have specifics: who, when, what exactly.", action: "Look for specificity. Do they have actual rules with actual consequences? Real names and numbers, not general intentions? Challenge every vague element directly." },
    9: { weekTitle: "What Fighting Has Cost You", detail: "Week 9 is the pivot point from CBT to ACT. The framework shifts from fighting behaviors to examining what the behavior has cost them. Clients often feel disoriented here — the model they've been using for 8 weeks has changed.", action: "Normalize the disorientation in your feedback. 'This week asks you to look at it differently than you have been — that's uncomfortable on purpose.' Don't let them mistake the shift for regression." },
    10: { weekTitle: "Your Thoughts Don't Have Permission", detail: "Cognitive defusion exercises feel strange at first. Clients often dismiss them as silly or ineffective before they've genuinely tried them. The goal is changing the relationship to thoughts, not eliminating them.", action: "Ask specifically: did they try the exercises or just read about them? Engagement with the experiential work is what matters here. 'Reading about swimming isn't swimming.'" },
    11: { weekTitle: "The Part of You That Doesn't Change", detail: "The emotional core of the ACT phase. Watch for aspirational values — they describe who clients want to be rather than what they actually care about. Genuine values show up in behavior. Aspirational values don't.", action: "Ask: 'How did this value show up in something you actually did this week?' Ground values in behavior, not aspiration. If they can't answer, the value may not be theirs yet." },
    12: { weekTitle: "What You're Actually Living For", detail: "Week 12 makes the gap between stated values and actual behavior visible. That gap is where the work lives. Clients who can articulate it clearly are ready to close it. Clients who avoid the question aren't.", action: "Ask them to identify one specific place where their behavior didn't align with a stated value this week. The honesty of that answer is more important than the answer itself." },
    13: { weekTitle: "Stop Running", detail: "Avoidance is the engine of the addiction cycle. Week 13 targets it directly. Clients who've spent years fighting their internal experience often resist the acceptance framework — it feels like giving up. It isn't.", action: "Ask what they're still avoiding — not thoughts, but actions, feelings, conversations. Avoidance shows up in behavior, not just mental experience." },
    14: { weekTitle: "From Knowing to Doing", detail: "Insight without behavior change is just self-awareness. Week 14 is about what they've actually done differently — not what they've learned to say about themselves, but how their behavior has changed.", action: "Ask for one specific behavioral change they made this week. Not a plan to change — something they actually did differently. 'I decided to' doesn't count. 'I did' counts." },
    15: { weekTitle: "Protect What You've Built", detail: "With one week remaining, some clients coast. The maintenance plan for life after the program is as important as anything in the curriculum. This is where the program's gains are preserved or lost.", action: "Push for specificity: what triggers will still be present after the program ends? What support structures will remain? What's the plan when the accountability structure of this program is gone?" },
    16: { weekTitle: "Who You've Become", detail: "This is closure, not completion in the sense of 'finished.' The goal is helping the client articulate who they are now — not just what they learned, but what has actually changed about how they see themselves.", action: "Ask: 'What's the most important thing that changed about how you see yourself?' The depth of that answer is the measure of the work they've done." },
  };

  type MentorSuggestion = {
    id: string;
    priority: "urgent" | "followup" | "curriculum" | "recognition";
    title: string;
    detail: string;
    action: string;
  };

  app.get("/api/therapist/clients/:clientId/suggestions", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const { clientId } = req.params;

      const clients = await storage.getClientsForTherapist(therapistId);
      if (!clients.some((c) => c.id === clientId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const client = await storage.getUser(clientId);
      const checkins = await storage.getUserCheckinHistory(clientId, 30);
      const completedWeeks = await storage.getCompletedWeeks(clientId);
      const relapseAutopsies = await storage.getRelapseAutopsies(clientId);
      const dismissedIds = await storage.getDismissedSuggestions(therapistId, clientId);

      const { analyzeTrends } = await import("./trendAnalysis");
      const trends = analyzeTrends(checkins);
      const suggestions: MentorSuggestion[] = [];

      const unreviewedAutopsies = relapseAutopsies.filter(
        (a) => a.status === "completed" && !a.reviewedByTherapist,
      );
      if (unreviewedAutopsies.length > 0) {
        suggestions.push({
          id: "unreviewed-autopsy",
          priority: "urgent",
          title: `${unreviewedAutopsies.length} Relapse Autopsy Submission${unreviewedAutopsies.length > 1 ? "s" : ""} Needs Review`,
          detail: `Your client submitted a relapse autopsy on ${unreviewedAutopsies[0].date}${unreviewedAutopsies.length > 1 ? ` and ${unreviewedAutopsies.length - 1} more` : ""}. They took the right step. Now it's your turn.`,
          action: "Go to the Autopsies tab. Read it carefully, then respond. Your response is what keeps them engaged in the program after a setback.",
        });
      }

      if (checkins.length > 0) {
        const lastCheckin = checkins[checkins.length - 1];
        const daysSince = Math.floor(
          (Date.now() - new Date(lastCheckin.dateKey).getTime()) / 86400000,
        );
        if (daysSince >= 3) {
          suggestions.push({
            id: "checkin-gap",
            priority: "urgent",
            title: `No Check-in for ${daysSince} Days`,
            detail: `Absence from check-ins is one of the earliest behavioral warning signs before a relapse. The longer the gap, the harder the re-entry. Last check-in: ${lastCheckin.dateKey}.`,
            action: "Reach out directly with a specific question — not 'how are you doing?' but 'what happened to your check-in this week?' Specificity signals that you noticed.",
          });
        }
      } else {
        suggestions.push({
          id: "no-checkins",
          priority: "urgent",
          title: "No Check-ins Recorded Yet",
          detail: "Client has not completed any daily check-ins. Without check-in data, you have no view into what's happening day to day.",
          action: "Make daily check-ins a clear expectation in your first feedback message. Frame it as non-negotiable, not optional.",
        });
      }

      if (
        trends.urge.trend === "increasing" &&
        trends.urge.difference >= 2
      ) {
        suggestions.push({
          id: "urge-spike",
          priority: "urgent",
          title: "Urge Intensity Is Rising",
          detail: `Urge levels have increased by ${trends.urge.difference} points on average over the past two weeks (${trends.urge.firstHalfAvg}/10 → ${trends.urge.secondHalfAvg}/10). This is a clinical flag.`,
          action: "Initiate contact before they do. Ask what's changed recently — routine, relationships, stress. Review their coping plan. Don't wait.",
        });
      }

      if (trends.mood.trend === "decreasing") {
        suggestions.push({
          id: "mood-decline",
          priority: "followup",
          title: "Mood Has Been Declining",
          detail: `Average mood dropped by ${Math.abs(trends.mood.difference)} points over the past two weeks (${trends.mood.firstHalfAvg}/10 → ${trends.mood.secondHalfAvg}/10). Low mood is a known vulnerability factor for relapse.`,
          action: "Acknowledge the dip in your next feedback. Ask what's been weighing on them. Don't normalize it — naming it is the first move.",
        });
      }

      if (trends.checkinConsistency.rate < 50 && checkins.length >= 5) {
        suggestions.push({
          id: "low-consistency",
          priority: "followup",
          title: `Check-in Rate Is ${trends.checkinConsistency.rate}%`,
          detail: `Client checked in on ${trends.checkinConsistency.rate}% of tracked days (${trends.checkinConsistency.totalCheckins} of ${trends.checkinConsistency.daysCovered} days). You can't track patterns you don't have data for.`,
          action: "Name it directly in your next message. 'Daily check-ins aren't optional' is the message. Ask specifically what's getting in the way.",
        });
      }

      if (client?.startDate) {
        const daysSinceStart = Math.floor(
          (Date.now() - new Date(client.startDate).getTime()) / 86400000,
        );
        const expectedWeek = Math.min(16, Math.floor(daysSinceStart / 7) + 1);
        if (completedWeeks.length < expectedWeek - 1 && completedWeeks.length < 16) {
          suggestions.push({
            id: "curriculum-behind",
            priority: "followup",
            title: "Behind on Curriculum Pace",
            detail: `Based on start date, client should be approaching Week ${expectedWeek} but has completed ${completedWeeks.length} week${completedWeeks.length !== 1 ? "s" : ""}. Falling behind is often avoidance, not logistics.`,
            action: "Ask what's blocking them. Is it time, or is it the content? A curriculum week they're avoiding is usually the one they most need to do.",
          });
        }
      }

      const activeWeek = Math.min(16, completedWeeks.length + 1);
      
      // Check if client has finished all work for the active week but hasn't marked it complete
      const [reflection, exercise, homework] = await Promise.all([
        storage.getWeekReflection(clientId, activeWeek),
        storage.getExerciseAnswers(clientId, activeWeek),
        storage.getHomeworkCompletion(clientId, activeWeek),
      ]);
      const hasReflection = !!(reflection?.q1 || reflection?.q2 || reflection?.q3 || reflection?.q4);
      const hasExercise = !!exercise?.answers && exercise.answers !== "{}";
      const hasHomework = !!homework?.completedItems && homework.completedItems !== "[]";

      if (hasReflection && hasExercise && hasHomework) {
        suggestions.push({
          id: "submit-week-nudge",
          priority: "urgent",
          title: "Week Work Ready for Submission",
          detail: `Client has drafted a reflection, completed exercises, and checked off homework for Week ${activeWeek}, but the week is not yet marked complete.`,
          action: "Nudge the client to click 'Complete Week' so you can officially review their work and they can progress to the next module.",
        });
      }

      // Curriculum guidance for the most recently completed week
      const lastCompletedWeek = completedWeeks.length > 0 ? Math.max(...completedWeeks) : 0;
      if (lastCompletedWeek > 0) {
        const weekGuide = MENTOR_WEEK_GUIDANCE[lastCompletedWeek];
        if (weekGuide) {
          suggestions.push({
            id: `curriculum-w${lastCompletedWeek}`,
            priority: "curriculum",
            title: `Week ${lastCompletedWeek}: ${weekGuide.weekTitle}`,
            detail: weekGuide.detail,
            action: weekGuide.action,
          });
        }
      }

      const positiveSignals: string[] = [];
      const currentStreakDays = (() => {
        if (checkins.length === 0) return 0;
        const sorted = [...checkins].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        if (sorted[0].dateKey !== today && sorted[0].dateKey !== yesterday) return 0;
        let streak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const prev = new Date(sorted[i - 1].dateKey);
          const curr = new Date(sorted[i].dateKey);
          const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diff === 1) streak++;
          else break;
        }
        return streak;
      })();

      if (currentStreakDays >= 7) positiveSignals.push(`${currentStreakDays}-day check-in streak`);
      if (trends.mood.trend === "increasing") positiveSignals.push(`mood improving (+${trends.mood.difference} pts over two weeks)`);
      if (trends.urge.trend === "decreasing") positiveSignals.push(`urge intensity declining (${Math.abs(trends.urge.difference)} pts)`);
      if (trends.checkinConsistency.rate >= 80) positiveSignals.push(`${trends.checkinConsistency.rate}% check-in consistency`);

      if (positiveSignals.length >= 2) {
        suggestions.push({
          id: "positive-momentum",
          priority: "recognition",
          title: "Real Positive Momentum",
          detail: positiveSignals.join(" · ") + ". These are measurable signals of progress, not just optimism.",
          action: "Name exactly what you're seeing in your next feedback message. Specific observation beats vague encouragement every time. Tell them what the data shows.",
        });
      }

      const priorityOrder: MentorSuggestion["priority"][] = ["urgent", "followup", "curriculum", "recognition"];
      suggestions.sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));

      // Filter out dismissed suggestions (all priorities, including urgent)
      const filteredSuggestions = suggestions.filter(
        (s) => !dismissedIds.includes(s.id)
      );

      res.json({ suggestions: filteredSuggestions });
    } catch (error) {
      console.error("Get mentor suggestions error:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Batch endpoint: urgent suggestion counts for all clients (drives dashboard "Need Attention")
  app.get("/api/therapist/urgent-suggestion-counts", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const clients = await storage.getClientsForTherapist(therapistId);
      const urgentCounts: Record<string, number> = {};

      for (const client of clients) {
        const [dismissedIds, checkins, autopsies] = await Promise.all([
          storage.getDismissedSuggestions(therapistId, client.id),
          storage.getUserCheckinHistory(client.id, 30),
          storage.getRelapseAutopsies(client.id),
        ]);

        let urgentCount = 0;

        // Unreviewed relapse autopsies
        const unreviewedAutopsies = autopsies.filter(
          (a) => a.status === "completed" && !a.reviewedByTherapist,
        );
        if (unreviewedAutopsies.length > 0 && !dismissedIds.includes("unreviewed-autopsy")) {
          urgentCount++;
        }

        // Check-in gap or no check-ins at all
        if (checkins.length === 0) {
          if (!dismissedIds.includes("no-checkins")) urgentCount++;
        } else {
          const lastCheckin = checkins[checkins.length - 1];
          const daysSince = Math.floor(
            (Date.now() - new Date(lastCheckin.dateKey).getTime()) / 86400000,
          );
          if (daysSince >= 3 && !dismissedIds.includes("checkin-gap")) urgentCount++;
        }

        // curriculum-behind (client is trailing their expected week based on start date)
        if (client.startDate) {
          const daysSinceStart = Math.floor(
            (Date.now() - new Date(client.startDate).getTime()) / 86400000,
          );
          const expectedWeek = Math.min(16, Math.floor(daysSinceStart / 7) + 1);
          if (completedWeeks.length < expectedWeek - 1) {
            urgentCount++;
          }
        }

        // week-completion-nudge (client has completed all items for a week but hasn't marked it complete)
        const lastCompletedWeek = completedWeeks.length > 0 ? Math.max(...completedWeeks) : 0;
        const currentActiveWeek = Math.min(16, lastCompletedWeek + 1);
        const [reflection, exercise, homework] = await Promise.all([
          storage.getWeekReflection(client.id, currentActiveWeek),
          storage.getExerciseAnswers(client.id, currentActiveWeek),
          storage.getHomeworkCompletion(client.id, currentActiveWeek),
        ]);
        const hasReflection = !!(reflection?.q1 || reflection?.q2 || reflection?.q3 || reflection?.q4);
        const hasExercise = !!exercise?.answers && exercise.answers !== "{}";
        const hasHomework = !!homework?.completedItems && homework.completedItems !== "[]";
        
        if (hasReflection && hasExercise && hasHomework && !completedWeeks.includes(currentActiveWeek)) {
          urgentCount++;
        }

        urgentCounts[client.id] = urgentCount;
      }

      res.json({ urgentCounts });
    } catch (error) {
      console.error("Get urgent suggestion counts error:", error);
      res.status(500).json({ message: "Failed to get urgent counts" });
    }
  });

  app.get("/api/admin/clients/:clientId/checkin-stats", requireRole("admin"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getUser(clientId);
      const checkins = await storage.getUserCheckinHistory(clientId, 365);
      res.json(computeCheckinStats(checkins, client?.startDate || client?.createdAt));
    } catch (error) {
      console.error("Get admin client checkin stats error:", error);
      res.status(500).json({ message: "Failed to get checkin statistics" });
    }
  });

  app.get("/api/admin/clients/:clientId/completions-data", requireRole("admin"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const completedWeeks = await storage.getCompletedWeeks(clientId);
      res.json({ completedWeeks });
    } catch (error) {
      console.error("Get admin client completions error:", error);
      res.status(500).json({ message: "Failed to get completions" });
    }
  });

  // Client feedback endpoint
  app.get("/api/my-feedback", requireRole("client"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const feedback = await storage.getClientFeedback(userId);
      res.json({ feedback });
    } catch (error) {
      console.error("Fetch client feedback error:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // =======================================
  // Admin API endpoints
  // =======================================

  // Get all therapists
  app.get("/api/admin/therapists", requireRole("admin"), async (req, res) => {
    try {
      const therapists = await storage.getUsersByRole("therapist");
      const safeTherapists = therapists.map((t) => {
        const { password: _, ...safe } = t;
        return safe;
      });
      res.json({ therapists: safeTherapists });
    } catch (error) {
      console.error("Get therapists error:", error);
      res.status(500).json({ message: "Failed to get therapists" });
    }
  });

  // Get all clients
  app.get("/api/admin/clients", requireRole("admin"), async (req, res) => {
    try {
      const clients = await storage.getUsersByRole("client");
      const safeClients = await Promise.all(
        clients.map(async (c) => {
          const { password: _, ...safe } = c;
          const therapists = await storage.getTherapistsForClient(c.id);
          const waivedWeeks = await storage.getWaivedWeeks(c.id);
          return {
            ...safe,
            therapists: therapists.map((t) => ({
              id: t.id,
              name: t.name,
              email: t.email,
            })),
            waivedWeeks,
          };
        }),
      );
      res.json({ clients: safeClients });
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  // Create therapist (admin can create therapist accounts)
  app.post("/api/admin/therapists", requireRole("admin"), async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res
          .status(400)
          .json({ message: "Email, password, and name are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: "therapist",
      });

      const { password: _, ...safeUser } = user;
      res.status(201).json({ therapist: safeUser });
    } catch (error) {
      console.error("Create therapist error:", error);
      res.status(500).json({ message: "Failed to create therapist" });
    }
  });

  // Update therapist settings (admin only)
  app.patch(
    "/api/admin/therapists/:therapistId",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { therapistId } = req.params;
        const { allFeesWaived } = req.body;

        const user = await storage.getUser(therapistId);
        if (!user) {
          return res.status(404).json({ message: "Therapist not found" });
        }

        if (user.role !== "therapist") {
          return res.status(400).json({ message: "User is not a therapist" });
        }

        if (allFeesWaived !== undefined && typeof allFeesWaived !== "boolean") {
          return res
            .status(400)
            .json({ message: "allFeesWaived must be a boolean" });
        }

        const updateData: any = {};
        if (allFeesWaived !== undefined)
          updateData.allFeesWaived = allFeesWaived;

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ message: "No valid fields to update" });
        }

        const updatedUser = await storage.updateUser(therapistId, updateData);
        if (!updatedUser) {
          return res
            .status(500)
            .json({ message: "Failed to update therapist" });
        }

        const { password: _, ...safeUser } = updatedUser;
        res.json({ therapist: safeUser });
      } catch (error) {
        console.error("Update therapist error:", error);
        res.status(500).json({ message: "Failed to update therapist" });
      }
    },
  );

  // Delete therapist (admin only) - requires reassigning clients first
  app.delete(
    "/api/admin/therapists/:therapistId",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { therapistId } = req.params;
        const { reassignToTherapistId } = req.body;

        const therapist = await storage.getUser(therapistId);
        if (!therapist) {
          return res.status(404).json({ message: "Therapist not found" });
        }

        if (therapist.role !== "therapist") {
          return res.status(400).json({ message: "User is not a therapist" });
        }

        // Check if therapist has assigned clients
        const clients = await storage.getClientsForTherapist(therapistId);

        if (clients.length > 0) {
          if (!reassignToTherapistId) {
            return res.status(400).json({
              message:
                "Therapist has assigned clients. Provide reassignToTherapistId to reassign them.",
              clientCount: clients.length,
            });
          }

          // Validate reassignment target is not the same as the therapist being deleted
          if (reassignToTherapistId === therapistId) {
            return res.status(400).json({
              message: "Cannot reassign clients to the therapist being deleted",
            });
          }

          // Verify reassignment target exists and is a therapist
          const targetTherapist = await storage.getUser(reassignToTherapistId);
          if (
            !targetTherapist ||
            (targetTherapist.role !== "therapist" &&
              targetTherapist.role !== "admin")
          ) {
            return res
              .status(400)
              .json({ message: "Invalid reassignment target" });
          }

          // Reassign all clients to new therapist
          for (const client of clients) {
            await storage.removeTherapistFromClient(therapistId, client.id);
            await storage.assignTherapistToClient(
              reassignToTherapistId,
              client.id,
            );
          }
          console.log(
            `Reassigned ${clients.length} clients from ${therapist.email} to ${targetTherapist.email}`,
          );
        }

        // Delete the therapist account
        await storage.deleteUser(therapistId);
        console.log(
          `Admin deleted therapist: ${therapist.email} (${therapistId})`,
        );

        res.json({
          message: "Therapist deleted successfully",
          reassignedClients: clients.length,
        });
      } catch (error) {
        console.error("Delete therapist error:", error);
        res.status(500).json({ message: "Failed to delete therapist" });
      }
    },
  );

  // Create client (admin can create client accounts)
  app.post("/api/admin/clients", requireRole("admin"), async (req, res) => {
    try {
      const { email, password, name, startDate, therapistId } = req.body;
      if (!email || !password || !name) {
        return res
          .status(400)
          .json({ message: "Email, password, and name are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const clientStartDate =
        startDate || new Date().toISOString().split("T")[0];
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: "client",
        startDate: clientStartDate,
      });

      // Assign therapist if provided and valid
      if (therapistId && therapistId !== "" && therapistId !== "none") {
        const therapist = await storage.getUser(therapistId);
        if (
          !therapist ||
          (therapist.role !== "therapist" && therapist.role !== "admin")
        ) {
          console.error(
            `Invalid therapist ID provided for client creation: ${therapistId}`,
          );
          // Don't fail the whole operation, just skip assignment
        } else {
          await storage.assignTherapistToClient(therapistId, user.id);
        }
      }

      const { password: _, ...safeUser } = user;
      res.status(201).json({ client: safeUser });
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Update client (start date, fees waived, etc.)
  app.patch(
    "/api/admin/clients/:clientId",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { clientId } = req.params;
        const {
          startDate,
          allFeesWaived,
          subscriptionStatus,
          name,
          therapistId,
        } = req.body;

        // Basic validation
        if (startDate !== undefined && typeof startDate !== "string") {
          return res.status(400).json({ message: "Invalid startDate format" });
        }
        if (allFeesWaived !== undefined && typeof allFeesWaived !== "boolean") {
          return res
            .status(400)
            .json({ message: "allFeesWaived must be a boolean" });
        }
        if (therapistId !== undefined && typeof therapistId !== "string") {
          return res
            .status(400)
            .json({ message: "Invalid therapistId format" });
        }

        // Validate therapist if provided
        if (therapistId !== undefined && therapistId !== "") {
          const therapist = await storage.getUser(therapistId);
          if (
            !therapist ||
            (therapist.role !== "therapist" && therapist.role !== "admin")
          ) {
            return res
              .status(400)
              .json({ message: "Invalid therapist selected" });
          }
        }

        const updateData: any = {};
        // Convert empty strings to null for date fields
        if (startDate !== undefined)
          updateData.startDate = startDate === "" ? null : startDate;
        if (allFeesWaived !== undefined)
          updateData.allFeesWaived = allFeesWaived;
        if (subscriptionStatus !== undefined)
          updateData.subscriptionStatus = subscriptionStatus;
        if (name !== undefined) updateData.name = name;

        const user = await storage.updateUser(clientId, updateData);
        if (!user) {
          return res.status(404).json({ message: "Client not found" });
        }

        // Handle therapist assignment if provided
        if (therapistId !== undefined) {
          // Remove current therapist assignments and add the new one
          await storage.removeAllTherapistsFromClient(clientId);
          if (therapistId) {
            await storage.assignTherapistToClient(therapistId, clientId);
          }
        }

        const { password: _, ...safeUser } = user;
        res.json({ client: safeUser });
      } catch (error: any) {
        console.error("Update client error:", error);
        console.error("Update client error details:", {
          clientId: req.params.clientId,
          body: req.body,
          errorMessage: error?.message,
          errorStack: error?.stack,
        });
        res
          .status(500)
          .json({ message: "Failed to update client", error: error?.message });
      }
    },
  );

  // Assign therapist to client
  app.post("/api/admin/assignments", requireRole("admin"), async (req, res) => {
    try {
      const { therapistId, clientId } = req.body;
      if (!therapistId || !clientId) {
        return res
          .status(400)
          .json({ message: "Both therapistId and clientId are required" });
      }

      const assignment = await storage.assignTherapistToClient(
        therapistId,
        clientId,
      );
      res.status(201).json({ assignment });
    } catch (error) {
      console.error("Assign therapist error:", error);
      res.status(500).json({ message: "Failed to assign therapist" });
    }
  });

  // Remove therapist from client
  app.delete(
    "/api/admin/assignments",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { therapistId, clientId } = req.body;
        if (!therapistId || !clientId) {
          return res
            .status(400)
            .json({ message: "Both therapistId and clientId are required" });
        }

        await storage.removeTherapistFromClient(therapistId, clientId);
        res.json({ message: "Assignment removed" });
      } catch (error) {
        console.error("Remove therapist error:", error);
        res.status(500).json({ message: "Failed to remove assignment" });
      }
    },
  );

  // Therapist departure - reassign all clients to new therapist (or admin)
  app.post(
    "/api/admin/therapist-departure",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { departingTherapistId, newTherapistId } = req.body;
        if (!departingTherapistId || typeof departingTherapistId !== "string") {
          return res
            .status(400)
            .json({ message: "Valid departingTherapistId is required" });
        }
        if (!newTherapistId || typeof newTherapistId !== "string") {
          return res
            .status(400)
            .json({ message: "Valid newTherapistId is required" });
        }

        // Verify departing therapist exists and is a therapist
        const departingTherapist = await storage.getUser(departingTherapistId);
        if (!departingTherapist || departingTherapist.role !== "therapist") {
          return res
            .status(400)
            .json({ message: "Departing user is not a valid therapist" });
        }

        // Verify new therapist exists and is a therapist or admin
        const newTherapist = await storage.getUser(newTherapistId);
        if (
          !newTherapist ||
          (newTherapist.role !== "therapist" && newTherapist.role !== "admin")
        ) {
          return res
            .status(400)
            .json({ message: "New therapist must be a therapist or admin" });
        }

        // Get all clients for departing therapist
        const clients =
          await storage.getClientsForTherapist(departingTherapistId);

        // Reassign each client to the new therapist
        for (const client of clients) {
          await storage.removeTherapistFromClient(
            departingTherapistId,
            client.id,
          );
          await storage.assignTherapistToClient(newTherapistId, client.id);
        }

        res.json({
          message: `Successfully reassigned ${clients.length} clients to ${newTherapist.name || newTherapist.email}`,
          reassignedCount: clients.length,
        });
      } catch (error) {
        console.error("Therapist departure error:", error);
        res.status(500).json({ message: "Failed to reassign clients" });
      }
    },
  );

  // Get client progress and work for admin
  app.get(
    "/api/admin/clients/:clientId/progress",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { clientId } = req.params;

        const user = await storage.getUser(clientId);
        if (!user || user.role !== "client") {
          return res.status(404).json({ message: "Client not found" });
        }

        const completedWeeks = await storage.getCompletedWeeks(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 60);
        const reflections = await storage.getAllWeekReflections(clientId);
        const homeworkCompletions =
          await storage.getAllHomeworkCompletions(clientId);
        const feedback = await storage.getClientFeedback(clientId);
        const exerciseAnswersData =
          await storage.getAllExerciseAnswers(clientId);

        // Get therapist info
        const therapists = await storage.getTherapistsForClient(clientId);

        res.json({
          client: {
            id: user.id,
            name: user.name,
            email: user.email,
            startDate: user.startDate,
            allFeesWaived: user.allFeesWaived,
          },
          completedWeeks,
          checkins,
          reflections,
          homeworkCompletions,
          feedback,
          exerciseAnswers: exerciseAnswersData,
          therapists,
        });
      } catch (error) {
        console.error("Get admin client progress error:", error);
        res.status(500).json({ message: "Failed to get client progress" });
      }
    },
  );

  // Reset a completed week for a client (admin only)
  app.delete(
    "/api/admin/clients/:clientId/completions/:weekNumber",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { clientId, weekNumber } = req.params;
        const weekNum = parseInt(weekNumber, 10);
        console.log(
          `Admin reset week request: clientId=${clientId}, week=${weekNum}`,
        );

        if (isNaN(weekNum) || weekNum < 1 || weekNum > 16) {
          return res.status(400).json({ message: "Invalid week number" });
        }

        const user = await storage.getUser(clientId);
        if (!user || user.role !== "client") {
          console.log(
            `Reset week failed: client not found or wrong role - ${user?.role}`,
          );
          return res.status(404).json({ message: "Client not found" });
        }

        console.log(
          `Resetting week ${weekNum} for client ${user.email} (${clientId})`,
        );
        await storage.resetWeekCompletion(clientId, weekNum);
        console.log(
          `Week ${weekNum} reset successfully for client ${user.email}`,
        );
        res.json({ message: `Week ${weekNum} has been reset for the client` });
      } catch (error) {
        console.error("Reset week completion error:", error);
        res.status(500).json({ message: "Failed to reset week completion" });
      }
    },
  );

  // Add admin feedback for a client
  app.post(
    "/api/admin/clients/:clientId/feedback",
    requireRole("admin"),
    async (req, res) => {
      try {
        const adminId = (req.user as any).id;
        const { clientId } = req.params;
        const { feedbackType, content, weekNumber } = req.body;

        if (!content || !feedbackType) {
          return res
            .status(400)
            .json({ message: "Feedback type and content are required" });
        }

        const user = await storage.getUser(clientId);
        if (!user || user.role !== "client") {
          return res.status(404).json({ message: "Client not found" });
        }

        const feedback = await storage.addTherapistFeedback(
          adminId,
          clientId,
          feedbackType,
          content,
          weekNumber,
        );

        res.status(201).json({ feedback });

        try {
          if (user.email) {
            const { sendFeedbackNotification } = await import("./emailService");
            const adminData = req.user as any;
            const loginUrl = `${req.protocol}://${req.get("host")}/login`;
            await sendFeedbackNotification(
              user.email,
              user.name || undefined,
              adminData.name || "Your mentor",
              weekNumber,
              loginUrl,
            );
          }
        } catch (notifyError) {
          console.error("Failed to send feedback notification:", notifyError);
        }
      } catch (error) {
        console.error("Add admin feedback error:", error);
        res.status(500).json({ message: "Failed to add feedback" });
      }
    },
  );

  // Admin edit any feedback comment
  app.put(
    "/api/admin/feedback/:feedbackId",
    requireRole("admin"),
    async (req, res) => {
      try {
        const adminId = (req.user as any).id;
        const { feedbackId } = req.params;
        const editSchema = z.object({ content: z.string().min(1, "Content is required").max(10000) });
        const parsed = editSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
        }

        const updated = await storage.updateFeedbackContent(feedbackId, parsed.data.content.trim(), adminId);
        if (!updated) {
          return res.status(404).json({ message: "Feedback not found" });
        }

        res.json({ feedback: updated });
      } catch (error) {
        console.error("Admin edit feedback error:", error);
        res.status(500).json({ message: "Failed to update feedback" });
      }
    },
  );

  // Waive week fee for client
  app.post("/api/admin/waivers", requireRole("admin"), async (req, res) => {
    try {
      const { clientId, weekNumber } = req.body;
      if (!clientId || weekNumber === undefined) {
        return res
          .status(400)
          .json({ message: "clientId and weekNumber are required" });
      }

      const adminId = (req.user as any).id;
      const waiver = await storage.waiveWeekFee(clientId, weekNumber, adminId);
      res.status(201).json({ waiver });
    } catch (error) {
      console.error("Waive fee error:", error);
      res.status(500).json({ message: "Failed to waive fee" });
    }
  });

  // Remove week waiver
  app.delete("/api/admin/waivers", requireRole("admin"), async (req, res) => {
    try {
      const { clientId, weekNumber } = req.body;
      if (!clientId || weekNumber === undefined) {
        return res
          .status(400)
          .json({ message: "clientId and weekNumber are required" });
      }

      await storage.removeWeekWaiver(clientId, weekNumber);
      res.json({ message: "Waiver removed" });
    } catch (error) {
      console.error("Remove waiver error:", error);
      res.status(500).json({ message: "Failed to remove waiver" });
    }
  });

  // Get revenue by therapist (for kickback calculations)
  app.get("/api/admin/revenue", requireRole("admin"), async (req, res) => {
    try {
      const revenueData = await storage.getRevenueByTherapist();
      res.json({ revenue: revenueData });
    } catch (error) {
      console.error("Get revenue error:", error);
      res.status(500).json({ message: "Failed to get revenue data" });
    }
  });

  // Delete a client (admin only)
  app.delete(
    "/api/admin/clients/:clientId",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { clientId } = req.params;

        const user = await storage.getUser(clientId);
        if (!user) {
          return res.status(404).json({ message: "Client not found" });
        }

        if (user.role !== "client") {
          return res
            .status(400)
            .json({ message: "Can only delete client accounts" });
        }

        await storage.deleteUser(clientId);
        console.log(`Admin deleted client: ${user.email} (${clientId})`);

        res.json({ message: "Client deleted successfully" });
      } catch (error) {
        console.error("Delete client error:", error);
        res.status(500).json({ message: "Failed to delete client" });
      }
    },
  );

  // =======================================
  // Therapist API endpoints
  // =======================================

  // Get assigned clients for therapist
  app.get(
    "/api/therapist/clients",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const clients = await storage.getClientsForTherapist(therapistId);

        const enrichedClients = await Promise.all(
          clients.map(async (c) => {
            const { password: _, ...safe } = c;
            const completedWeeks = await storage.getCompletedWeeks(c.id);

            // Calculate current week based on start date
            let currentWeek = 1;
            if (c.startDate) {
              const daysSinceStart = Math.floor(
                (Date.now() - new Date(c.startDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              currentWeek = Math.min(
                16,
                Math.max(1, Math.floor(daysSinceStart / 7) + 1),
              );
            }

            return {
              ...safe,
              completedWeeks,
              currentWeek,
            };
          }),
        );

        res.json({ clients: enrichedClients });
      } catch (error) {
        console.error("Get therapist clients error:", error);
        res.status(500).json({ message: "Failed to get clients" });
      }
    },
  );

  // Get client progress (for therapist viewing their assigned clients)
  app.get(
    "/api/therapist/clients/:clientId/progress",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;

        // Verify therapist is assigned to this client
        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res
            .status(403)
            .json({ message: "Not authorized to view this client" });
        }

        const completedWeeks = await storage.getCompletedWeeks(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 30);
        const reflections = await storage.getAllWeekReflections(clientId);
        const homeworkCompletions =
          await storage.getAllHomeworkCompletions(clientId);
        const feedback = await storage.getFeedbackForTherapist(
          therapistId,
          clientId,
        );
        const exerciseAnswersData =
          await storage.getAllExerciseAnswers(clientId);
        const relapseAutopsies = await storage.getRelapseAutopsies(clientId);
        const itemReviews = await storage.getItemReviews(therapistId, clientId);
        const weekReviews = await storage.getAllWeekReviewsForClient(clientId);

        res.json({
          completedWeeks,
          checkins,
          reflections,
          homeworkCompletions,
          feedback,
          exerciseAnswers: exerciseAnswersData,
          relapseAutopsies,
          itemReviews,
          weekReviews,
        });
      } catch (error) {
        console.error("Get client progress error:", error);
        res.status(500).json({ message: "Failed to get client progress" });
      }
    },
  );

  // Mark item as reviewed by mentor
  app.post(
    "/api/therapist/clients/:clientId/review-item",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const { itemType, itemKey } = req.body;

        if (!itemType || !itemKey) {
          return res
            .status(400)
            .json({ message: "itemType and itemKey are required" });
        }

        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res.status(403).json({ message: "Not authorized" });
        }

        await storage.markItemReviewed(
          therapistId,
          clientId,
          itemType,
          itemKey,
        );
        res.json({ success: true });
      } catch (error) {
        console.error("Mark item reviewed error:", error);
        res.status(500).json({ message: "Failed to mark item as reviewed" });
      }
    },
  );

  const WEEK_TITLES: Record<number, string> = {
    1: "The Moment You Stop Pretending",
    2: "Nothing About This Is Random",
    3: "Your Mind Is Not Telling You the Truth",
    4: "When the Urge Hits",
    5: "Shame Is Not Your Conscience",
    6: "The People You've Been Living Around",
    7: "What Needs to Be Said",
    8: "The Architecture of Not Going Back",
    9: "What Fighting Has Cost You",
    10: "Your Thoughts Don't Have Permission",
    11: "The Part of You That Doesn't Change",
    12: "What You're Actually Living For",
    13: "Stop Running",
    14: "From Knowing to Doing",
    15: "Protect What You've Built",
    16: "Who You've Become",
  };

  app.post(
    "/api/therapist/clients/:clientId/weekly-summary/:weekNumber",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const weekNumber = parseInt(req.params.weekNumber);

        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res.status(403).json({ message: "Not authorized" });
        }

        const client = await storage.getUser(clientId);
        const therapist = await storage.getUser(therapistId);
        if (!client || !therapist) {
          return res.status(404).json({ message: "User not found" });
        }

        const checkins = await storage.getUserCheckinHistory(clientId, 365);
        const weekReflection = await storage.getWeekReflection(
          clientId,
          weekNumber,
        );
        const homeworkRecord = await storage.getHomeworkCompletion(
          clientId,
          weekNumber,
        );
        const feedbackList = await storage.getFeedbackForTherapist(therapistId, clientId);
        const relapseHistory = await storage.getRelapseAutopsies(clientId);

        const weekCheckins = checkins.filter((c) => {
          const dateStr =
            c.checkinDate instanceof Date
              ? c.checkinDate.toISOString().slice(0, 10)
              : String(c.checkinDate).slice(0, 10);
          const checkinTime = new Date(dateStr).getTime();
          const startDate = client.startDate
            ? new Date(client.startDate)
            : new Date(client.createdAt || Date.now());
          const weekStart = new Date(
            startDate.getTime() + (weekNumber - 1) * 7 * 86400000,
          );
          const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
          return (
            checkinTime >= weekStart.getTime() &&
            checkinTime < weekEnd.getTime()
          );
        });

        const avgMood =
          weekCheckins.length > 0
            ? Math.round(
                (weekCheckins.reduce((s, c) => s + (c.moodLevel || 5), 0) /
                  weekCheckins.length) *
                  10,
              ) / 10
            : 0;
        const avgUrge =
          weekCheckins.length > 0
            ? Math.round(
                (weekCheckins.reduce((s, c) => s + (c.urgeLevel || 0), 0) /
                  weekCheckins.length) *
                  10,
              ) / 10
            : 0;

        const hwTotal = 11;
        const hwDone = JSON.parse(homeworkRecord?.completedItems || '[]').length || 0;

        let contextInfo = `Client: ${client.name || ""}\nWeek ${weekNumber}: ${WEEK_TITLES[weekNumber] || "Unknown"}\n`;
        contextInfo += `Check-ins: ${weekCheckins.length}/7 days, Avg Mood: ${avgMood}/10, Avg Urge: ${avgUrge}/10\n`;
        contextInfo += `Homework: ${hwDone}/${hwTotal} completed\n`;

        if (weekReflection) {
          contextInfo += `\nWeek Reflection:\n`;
          if (weekReflection.q1)
            contextInfo += `- Key learning: "${weekReflection.q1}"\n`;
          if (weekReflection.q2)
            contextInfo += `- What went well: "${weekReflection.q2}"\n`;
          if (weekReflection.q3)
            contextInfo += `- Challenges: "${weekReflection.q3}"\n`;
          if (weekReflection.q4)
            contextInfo += `- Goals for next week: "${weekReflection.q4}"\n`;
          if (weekReflection.q5)
            contextInfo += `- Additional insight: "${weekReflection.q5}"\n`;
          if (weekReflection.q6)
            contextInfo += `- Future vision: "${weekReflection.q6}"\n`;
        }

        const journalEntries = weekCheckins
          .filter((c) => c.journalEntry)
          .map((c) => c.journalEntry);
        if (journalEntries.length > 0) {
          contextInfo += `\nJournal entries:\n`;
          journalEntries.forEach((entry) => {
            contextInfo += `- "${entry?.slice(0, 200)}"\n`;
          });
        }

        const weekFeedback = feedbackList.filter(
          (f) => f.weekNumber === weekNumber,
        );
        if (weekFeedback.length > 0) {
          contextInfo += `\nMentor feedback given this week: ${weekFeedback.length} messages\n`;
        }

        const completedAutopsies = relapseHistory.filter(
          (a) => a.status === "completed",
        );
        if (completedAutopsies.length > 0) {
          contextInfo += `\nRelapse/Lapse History: ${completedAutopsies.length} total incidents\n`;
        }

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        const prompt = `You are a professional mentor writing a weekly progress summary report for a client in The Integrity Protocol recovery program. This summary will be included in a formal PDF report.

${contextInfo}

Write a comprehensive but concise weekly summary (200-300 words) that includes:
1. A brief overview of the client's engagement this week (check-in consistency, homework completion)
2. Key observations from their reflections and journal entries
3. Notable mood/urge patterns
4. Strengths demonstrated this week
5. Areas to focus on next week
6. An encouraging closing statement

Tone: Professional, warm, and supportive. Write in third person ("The client..." or use their name).
${Number(weekNumber) <= 3 ? 'IMPORTANT: This is an early week (Week ' + weekNumber + '). Keep tone grounded and steady. Do NOT use power words like "fantastic," "excellent," "amazing," "incredible," "outstanding," "extraordinary," "wonderful," or "remarkable." The client is just beginning — acknowledge effort simply without excessive praise.' : 'Avoid overusing power words like "fantastic," "excellent," "amazing." Use them only when genuinely warranted by significant progress.'}
Do not provide medical advice. This is an educational program, not therapy.

Write the summary now:`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const summaryContent = response.text || "Unable to generate summary.";

        await storage.saveWeeklySummary(
          therapistId,
          clientId,
          weekNumber,
          summaryContent,
        );

        res.json({ summaryContent });
      } catch (error) {
        console.error("Generate weekly summary error:", error);
        res.status(500).json({ message: "Failed to generate weekly summary" });
      }
    },
  );

  app.get(
    "/api/therapist/clients/:clientId/weekly-summary/:weekNumber",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const weekNumber = parseInt(req.params.weekNumber);

        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res.status(403).json({ message: "Not authorized" });
        }

        const summary = await storage.getWeeklySummary(clientId, weekNumber);
        if (!summary) {
          return res.status(404).json({ message: "No summary found" });
        }

        res.json(summary);
      } catch (error) {
        console.error("Get weekly summary error:", error);
        res.status(500).json({ message: "Failed to get weekly summary" });
      }
    },
  );

  app.get(
    "/api/therapist/clients/:clientId/weekly-summary/:weekNumber/pdf",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const weekNumber = parseInt(req.params.weekNumber);

        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res.status(403).json({ message: "Not authorized" });
        }

        const summary = await storage.getWeeklySummary(clientId, weekNumber);
        if (!summary) {
          return res.status(404).json({ message: "No summary generated yet" });
        }

        const client = await storage.getUser(clientId);
        const therapist = await storage.getUser(therapistId);
        if (!client || !therapist) {
          return res.status(404).json({ message: "User not found" });
        }

        const checkins = await storage.getUserCheckinHistory(clientId, 365);
        const homeworkRecord = await storage.getHomeworkCompletion(
          clientId,
          weekNumber,
        );

        const startDate = client.startDate
          ? new Date(client.startDate)
          : new Date(client.createdAt || Date.now());
        const weekCheckins = checkins.filter((c) => {
          const dateStr =
            c.checkinDate instanceof Date
              ? c.checkinDate.toISOString().slice(0, 10)
              : String(c.checkinDate).slice(0, 10);
          const checkinTime = new Date(dateStr).getTime();
          const weekStart = new Date(
            startDate.getTime() + (weekNumber - 1) * 7 * 86400000,
          );
          const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
          return (
            checkinTime >= weekStart.getTime() &&
            checkinTime < weekEnd.getTime()
          );
        });

        const avgMood =
          weekCheckins.length > 0
            ? Math.round(
                (weekCheckins.reduce((s, c) => s + (c.moodLevel || 5), 0) /
                  weekCheckins.length) *
                  10,
              ) / 10
            : 0;
        const avgUrge =
          weekCheckins.length > 0
            ? Math.round(
                (weekCheckins.reduce((s, c) => s + (c.urgeLevel || 0), 0) /
                  weekCheckins.length) *
                  10,
              ) / 10
            : 0;

        const hwTotal = 11;
        const hwDone = JSON.parse(homeworkRecord?.completedItems || '[]').length || 0;

        const pdfBuffer = await generateWeeklySummaryPDF({
          clientName: client.name || client.email,
          weekNumber,
          weekTitle: WEEK_TITLES[weekNumber] || `Week ${weekNumber}`,
          summaryContent: summary.summaryContent,
          checkinStats: {
            totalDays: 7,
            completedDays: weekCheckins.length,
            avgMood,
            avgUrge,
          },
          homeworkCompletion: `${hwDone}/${hwTotal}`,
          hasReflection: true,
          mentorName: therapist.name || therapist.email,
          generatedDate: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="week-${weekNumber}-summary-${client.name?.split(' ')[0] || "client"}.pdf"`,
        );
        res.send(pdfBuffer);
      } catch (error) {
        console.error("Download PDF error:", error);
        res.status(500).json({ message: "Failed to generate PDF" });
      }
    },
  );

  app.get(
    "/api/therapist/clients/:clientId/weekly-summaries",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;

        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res.status(403).json({ message: "Not authorized" });
        }

        const summaries = await storage.getWeeklySummaries(clientId);
        res.json({ summaries });
      } catch (error) {
        console.error("Get weekly summaries error:", error);
        res.status(500).json({ message: "Failed to get summaries" });
      }
    },
  );

  app.get(
    "/api/client/weekly-summary/:weekNumber/pdf",
    requireRole("client"),
    async (req, res) => {
      try {
        const clientId = (req.user as any).id;
        const weekNumber = parseInt(req.params.weekNumber);

        const summary = await storage.getWeeklySummary(clientId, weekNumber);
        if (!summary) {
          return res.status(404).json({ message: "No summary available" });
        }

        const client = await storage.getUser(clientId);
        if (!client) {
          return res.status(404).json({ message: "User not found" });
        }

        const therapists = await storage.getTherapistsForClient(clientId);
        let mentorName = "N/A";
        if (therapists.length > 0) {
          const therapist = therapists[0];
          mentorName = therapist.name || therapist.email;
        }

        const checkins = await storage.getUserCheckinHistory(clientId, 365);
        const homeworkRecord = await storage.getHomeworkCompletion(
          clientId,
          weekNumber,
        );

        const startDate = client.startDate
          ? new Date(client.startDate)
          : new Date(client.createdAt || Date.now());
        const weekCheckins = checkins.filter((c) => {
          const dateStr =
            c.checkinDate instanceof Date
              ? c.checkinDate.toISOString().slice(0, 10)
              : String(c.checkinDate).slice(0, 10);
          const checkinTime = new Date(dateStr).getTime();
          const weekStart = new Date(
            startDate.getTime() + (weekNumber - 1) * 7 * 86400000,
          );
          const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
          return (
            checkinTime >= weekStart.getTime() &&
            checkinTime < weekEnd.getTime()
          );
        });

        const avgMood =
          weekCheckins.length > 0
            ? Math.round(
                (weekCheckins.reduce((s, c) => s + (c.moodLevel || 5), 0) /
                  weekCheckins.length) *
                  10,
              ) / 10
            : 0;
        const avgUrge =
          weekCheckins.length > 0
            ? Math.round(
                (weekCheckins.reduce((s, c) => s + (c.urgeLevel || 0), 0) /
                  weekCheckins.length) *
                  10,
              ) / 10
            : 0;

        const hwTotal = 11;
        const hwDone = JSON.parse(homeworkRecord?.completedItems || '[]').length || 0;

        const pdfBuffer = await generateWeeklySummaryPDF({
          clientName: client.name || client.email,
          weekNumber,
          weekTitle: WEEK_TITLES[weekNumber] || `Week ${weekNumber}`,
          summaryContent: summary.summaryContent,
          checkinStats: {
            totalDays: 7,
            completedDays: weekCheckins.length,
            avgMood,
            avgUrge,
          },
          homeworkCompletion: `${hwDone}/${hwTotal}`,
          hasReflection: true,
          mentorName,
          generatedDate: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="week-${weekNumber}-summary.pdf"`,
        );
        res.send(pdfBuffer);
      } catch (error) {
        console.error("Client download PDF error:", error);
        res.status(500).json({ message: "Failed to generate PDF" });
      }
    },
  );

  app.get(
    "/api/client/weekly-summaries",
    requireRole("client"),
    async (req, res) => {
      try {
        const clientId = (req.user as any).id;
        const summaries = await storage.getWeeklySummaries(clientId);
        res.json({ summaries });
      } catch (error) {
        console.error("Client get summaries error:", error);
        res.status(500).json({ message: "Failed to get summaries" });
      }
    },
  );

  // Add therapist feedback for a client
  app.post(
    "/api/therapist/clients/:clientId/feedback",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const { feedbackType, content, weekNumber, checkinDateKey, status, subject } = req.body;

        if (!content || !feedbackType) {
          return res
            .status(400)
            .json({ message: "Content and type are required" });
        }

        // Verify therapist is assigned to this client
        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res.status(403).json({
            message: "Not authorized to message this client",
          });
        }

        const resolvedStatus = status === "draft" ? "draft" : "sent";

        const feedback = await storage.addTherapistFeedback(
          therapistId,
          clientId,
          feedbackType,
          content,
          weekNumber,
          checkinDateKey,
          resolvedStatus,
          subject,
        );

        // Only auto-mark reviewed and send email when actually sending (not drafting)
        if (resolvedStatus === "sent") {
          try {
            if (feedbackType === 'checkin' && checkinDateKey) {
              await storage.markItemReviewed(therapistId, clientId, 'checkin', checkinDateKey);
            } else if (feedbackType === 'week' && weekNumber) {
              await storage.markItemReviewed(therapistId, clientId, 'reflection', String(weekNumber));
              await storage.markItemReviewed(therapistId, clientId, 'exercise', String(weekNumber));
              // Ensure a week-level review record exists so the "Weeks Needing Review" banner clears
              try {
                const existingWeekReview = await storage.getWeekReview(clientId, weekNumber);
                if (!existingWeekReview) {
                  await storage.createWeekReview(therapistId, clientId, weekNumber, "");
                }
              } catch (weekReviewErr) {
                console.error("Auto-create week review error (non-fatal):", weekReviewErr);
              }
              try {
                const clientData = await storage.getUser(clientId);
                if (clientData?.startDate) {
                  const startMs = new Date(clientData.startDate).getTime();
                  const weekStartMs = startMs + (weekNumber - 1) * 7 * 86400000;
                  const weekEndMs = weekStartMs + 7 * 86400000;
                  const allCheckins = await storage.getUserCheckinHistory(clientId, 365);
                  for (const c of allCheckins) {
                    const cMs = new Date(c.dateKey).getTime();
                    if (cMs >= weekStartMs && cMs < weekEndMs) {
                      await storage.markItemReviewed(therapistId, clientId, 'checkin', c.dateKey);
                    }
                  }
                }
              } catch (weekCheckinErr) {
                console.error("Auto-mark week check-ins error (non-fatal):", weekCheckinErr);
              }
            }
          } catch (reviewErr) {
            console.error("Auto-mark reviewed error (non-fatal):", reviewErr);
          }
        }

        res.status(201).json({ feedback });

        // Send email only when status is 'sent'
        if (resolvedStatus === "sent") {
          try {
            const clientData = await storage.getUser(clientId);
            if (clientData && clientData.email) {
              const therapistData = req.user as any;
              const loginUrl = `${req.protocol}://${req.get("host")}/dashboard`;
              if (feedbackType === 'guidance' && subject) {
                const { sendMentorMessage } = await import("./emailService");
                await sendMentorMessage(
                  clientData.email,
                  clientData.name || undefined,
                  therapistData.name || "Your mentor",
                  subject,
                  content,
                  loginUrl,
                );
              } else {
                const { sendFeedbackNotification } = await import("./emailService");
                await sendFeedbackNotification(
                  clientData.email,
                  clientData.name || undefined,
                  therapistData.name || "Your mentor",
                  weekNumber,
                  loginUrl,
                );
              }
            }
          } catch (notifyError) {
            console.error("Failed to send message notification:", notifyError);
          }
        }
      } catch (error) {
        console.error("Add therapist feedback error:", error);
        res.status(500).json({ message: "Failed to add message" });
      }
    },
  );

  // Update (or promote from draft to sent) a therapist message
  app.put(
    "/api/therapist/clients/:clientId/feedback/:feedbackId",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId, feedbackId } = req.params;
        const { content, subject, status } = req.body;

        const existing = await storage.getFeedbackById(feedbackId);
        if (!existing || existing.therapistId !== therapistId || existing.clientId !== clientId) {
          return res.status(404).json({ message: "Message not found" });
        }

        const isPromoting = existing.status === "draft" && status === "sent";
        const updates: any = { editedAt: new Date(), editedBy: therapistId };
        if (content !== undefined) updates.content = content;
        if (subject !== undefined) updates.subject = subject;
        if (status !== undefined) updates.status = status;
        if (isPromoting) updates.sentAt = new Date();

        const updated = await storage.updateTherapistFeedback(feedbackId, updates);

        res.json({ feedback: updated });

        // Send email when promoting draft to sent
        if (isPromoting && updated) {
          try {
            const clientData = await storage.getUser(clientId);
            if (clientData && clientData.email) {
              const therapistData = req.user as any;
              const loginUrl = `${req.protocol}://${req.get("host")}/dashboard`;
              const messageSubject = updated.subject || "A message from your mentor";
              const messageContent = updated.content;
              const { sendMentorMessage } = await import("./emailService");
              await sendMentorMessage(
                clientData.email,
                clientData.name || undefined,
                therapistData.name || "Your mentor",
                messageSubject,
                messageContent,
                loginUrl,
              );
            }
          } catch (notifyError) {
            console.error("Failed to send message on promotion:", notifyError);
          }
        }
      } catch (error) {
        console.error("Update therapist feedback error:", error);
        res.status(500).json({ message: "Failed to update message" });
      }
    },
  );

  // Get draft messages for a client
  app.get(
    "/api/therapist/clients/:clientId/messages/drafts",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;

        const clients = await storage.getClientsForTherapist(therapistId);
        if (!clients.some((c) => c.id === clientId)) {
          return res.status(403).json({ message: "Not authorized" });
        }

        const drafts = await storage.getDraftMessages(therapistId, clientId);
        res.json({ drafts });
      } catch (error) {
        console.error("Get draft messages error:", error);
        res.status(500).json({ message: "Failed to get drafts" });
      }
    },
  );

  // Generate AI guidance message draft
  app.post(
    "/api/therapist/clients/:clientId/generate-guidance-message",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const { suggestionId, suggestionTitle, suggestionDetail, suggestionAction } = req.body;

        const clients = await storage.getClientsForTherapist(therapistId);
        if (!clients.some((c) => c.id === clientId)) {
          return res.status(403).json({ message: "Not authorized" });
        }

        const client = await storage.getUser(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 14);
        const completedWeeks = await storage.getCompletedWeeks(clientId);
        const currentWeek = Math.min(16, completedWeeks.length + 1);

        const { analyzeTrends, formatTrendReportForAI } = await import("./trendAnalysis");
        const trendReport = analyzeTrends(
          checkins.map((c) => ({ 
            moodLevel: c.moodLevel ?? null, 
            urgeLevel: c.urgeLevel ?? null, 
            dateKey: c.dateKey,
            eveningChecks: c.eveningChecks,
            haltChecks: c.haltChecks
          }))
        );
        const trendStatsBlock = formatTrendReportForAI(trendReport);

        const defaultSubjects: Record<string, string> = {
          "unreviewed-autopsy": "After your relapse autopsy",
          "checkin-gap": "Checking in on you",
          "no-checkins": "Let's get started",
          "submit-week-nudge": "Ready to submit your week?",
          "urge-spike": "I noticed something in your data",
          "mood-decline": "Checking in",
          "low-consistency": "Daily check-ins",
          "curriculum-behind": "Your curriculum progress",
          "positive-momentum": "Your progress this week",
        };
        const defaultSubject = defaultSubjects[suggestionId]
          || (suggestionId.startsWith("curriculum-w") ? `On Week ${currentWeek}` : "A note on your progress");

        const prompt = `You are an expert recovery mentor writing directly to a client. Write a personal, direct message to ${client?.name || "them"} (150–220 words).

${trendStatsBlock}

GUIDANCE SITUATION:
- Title: ${suggestionTitle}
- Detail: ${suggestionDetail}
- Mentor context (what to address — do NOT copy literally or turn into a question): ${suggestionAction}

WRITING RULES:
- Write in second person ("you", "your") — address them directly
- Reference specific data from the context when available (e.g., their check-in rate, week number, trend direction).
- IMPORTANT: Review the VULNERABILITIES section in the statistics above. If there are missing habits (e.g., missing sleep, exercise, or connection) or frequent HALT-BS factors (e.g., frequent stress or loneliness), address these as specific areas for growth or observation.
- Do NOT invent statistics not shown above.
- Do NOT use power words: fantastic, amazing, incredible, proud, honored, grateful
- Do NOT give medical advice or diagnoses
- Short paragraphs (2–3 sentences max). No bullet points. No headers.
- Tone: direct, warm, honest — like a mentor who genuinely knows this person and isn't afraid to name what they see
- Do NOT include any questions anywhere in the message. Clients cannot reply — questions serve no purpose and create frustration.
- End with a clear, encouraging statement or a concrete next step.

Write only the message body. No salutation, no sign-off, no subject line.`;

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
          httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL },
        });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        const draftText = (response.text || "").trim();

        res.json({ subject: defaultSubject, draftText });
      } catch (error) {
        console.error("Generate guidance message error:", error);
        res.status(500).json({ message: "Failed to generate message" });
      }
    },
  );

  // Dismiss a guidance suggestion
  app.post(
    "/api/therapist/clients/:clientId/dismiss-suggestion",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const { suggestionId } = req.body;

        if (!suggestionId) {
          return res.status(400).json({ message: "suggestionId is required" });
        }

        const clients = await storage.getClientsForTherapist(therapistId);
        if (!clients.some((c) => c.id === clientId)) {
          return res.status(403).json({ message: "Not authorized" });
        }

        await storage.dismissSuggestion(therapistId, clientId, suggestionId);
        res.json({ success: true });
      } catch (error) {
        console.error("Dismiss suggestion error:", error);
        res.status(500).json({ message: "Failed to dismiss suggestion" });
      }
    },
  );

  // Generate AI feedback draft for a client
  app.post(
    "/api/therapist/clients/:clientId/generate-feedback",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const { weekNumber } = req.body;

        // Verify therapist is assigned to this client
        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res
            .status(403)
            .json({ message: "Not authorized for this client" });
        }

        // Gather client data for context
        const clientUser = await storage.getUser(clientId);
        const completedWeeks = await storage.getCompletedWeeks(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 30);
        const reflections = await storage.getAllWeekReflections(clientId);
        const relapseHistory = await storage.getRelapseAutopsies(clientId);

        // Get specific week reflection if weekNumber provided
        let weekReflection: (typeof reflections)[0] | null = null;
        if (weekNumber) {
          weekReflection =
            reflections.find((r) => r.weekNumber === weekNumber) || null;
        }

        // Build context for AI using pre-computed trend analysis
        const { analyzeTrends, formatTrendReportForAI } = await import("./trendAnalysis");
        const trendReport = analyzeTrends(
          checkins.map((c) => ({ 
            moodLevel: c.moodLevel ?? null, 
            urgeLevel: c.urgeLevel ?? null, 
            dateKey: c.dateKey,
            eveningChecks: c.eveningChecks,
            haltChecks: c.haltChecks
          }))
        );
        const trendStatsBlock = formatTrendReportForAI(trendReport);

        const recentCheckins = checkins.slice(0, 14);
        const journalEntries = recentCheckins
          .filter((c) => c.journalEntry)
          .map((c) => c.journalEntry)
          .slice(0, 3);

        // Generate AI feedback using Gemini
        if (
          !process.env.AI_INTEGRATIONS_GEMINI_API_KEY ||
          !process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
        ) {
          return res.status(503).json({
            message:
              "AI feedback generation is not available. Please contact support.",
          });
        }

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        const clientName = clientUser?.name || "the client";

        let contextInfo = `Client: ${clientName}
Completed weeks: ${completedWeeks.length} of 16

${trendStatsBlock}
`;

        if (weekReflection) {
          contextInfo += `\nWeek ${weekNumber} Reflection:\n`;
          if (weekReflection.q1)
            contextInfo += `- Key insight: "${weekReflection.q1}"\n`;
          if (weekReflection.q2)
            contextInfo += `- What went well: "${weekReflection.q2}"\n`;
          if (weekReflection.q3)
            contextInfo += `- Challenges faced: "${weekReflection.q3}"\n`;
          if (weekReflection.q4)
            contextInfo += `- Goals for next week: "${weekReflection.q4}"\n`;
          if (weekReflection.q5)
            contextInfo += `- Additional insight: "${weekReflection.q5}"\n`;
          if (weekReflection.q6)
            contextInfo += `- Future vision: "${weekReflection.q6}"\n`;
        }

        if (journalEntries.length > 0) {
          contextInfo += `\nRecent journal entries:\n`;
          journalEntries.forEach((entry, i) => {
            contextInfo += `- "${entry?.slice(0, 200)}${entry && entry.length > 200 ? "..." : ""}"\n`;
          });
        }

        // Relapse history context
        const completedAutopsies = relapseHistory.filter(
          (a) => a.status === "completed",
        );
        if (completedAutopsies.length > 0) {
          contextInfo += `\nRelapse/Lapse History (${completedAutopsies.length} total incidents):\n`;
          completedAutopsies.slice(0, 3).forEach((a) => {
            contextInfo += `- ${a.date} (${a.lapseOrRelapse}): triggers="${a.triggers?.slice(0, 100) || "N/A"}", warning signs="${a.warningSigns?.slice(0, 100) || "N/A"}"\n`;
          });
        }

        const prompt = `You are a supportive mentor providing feedback to a client in The Integrity Protocol recovery program. You are writing feedback for Week ${weekNumber}. Always reference this as Week ${weekNumber}.

Based on the following client information, write a personalized, encouraging feedback message.

${contextInfo}

Guidelines:
- Speak directly to the client using "you" language
- Be direct yet encouraging and supportive
- Reference specific details from their reflections or journal entries when available
- Acknowledge their progress and effort based ONLY on the pre-computed statistics provided above
- CRITICAL: Do NOT contradict the statistics. If mood/urge is described as "stable" or "consistently at X", do NOT describe it as improving or declining. If data is "insufficient", say more data is needed.
- If there is relapse history, sensitively reference patterns and how the client's current progress relates to their recovery journey
- Offer gentle guidance or suggestions based on their challenges
- Keep the message focused and under 250 words
- Do not provide medical advice or crisis intervention
- Do NOT include any questions anywhere in the message. Clients cannot reply — questions serve no purpose and create frustration.
- End with an encouraging statement or a concrete next step.
${Number(weekNumber) <= 3 ? '- TONE: This is an early week (Week ' + weekNumber + '). Keep tone grounded and steady. Do NOT use power words like "fantastic," "excellent," "amazing," "incredible," "outstanding," "extraordinary," "wonderful," or "remarkable." Acknowledge effort simply.' : '- TONE: Be warm and supportive but measured. Avoid overusing power words like "fantastic," "excellent," "amazing." Reserve them for genuinely significant milestones.'}

Write the feedback message now:`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const draft =
          response.text ||
          "Unable to generate feedback. Please write your own message.";

        res.json({ draft });
      } catch (error) {
        console.error("Generate AI feedback error:", error);
        res
          .status(500)
          .json({ message: "Failed to generate AI feedback draft" });
      }
    },
  );

  // Get pending reviews for therapist (week completions awaiting review)
  app.get(
    "/api/therapist/pending-reviews",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const pendingReviews =
          await storage.getPendingReviewsForTherapist(therapistId);
        res.json({ pendingReviews });
      } catch (error) {
        console.error("Get pending reviews error:", error);
        res.status(500).json({ message: "Failed to get pending reviews" });
      }
    },
  );

  // Submit a week review for a client
  app.post(
    "/api/therapist/clients/:clientId/review/:weekNumber",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId, weekNumber } = req.params;
        const { reviewNotes } = req.body;
        const weekNum = parseInt(weekNumber);

        if (isNaN(weekNum) || weekNum < 1 || weekNum > 16) {
          return res.status(400).json({ message: "Invalid week number" });
        }

        // Verify therapist is assigned to this client
        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res
            .status(403)
            .json({ message: "Not authorized to review this client" });
        }

        // Check if already reviewed
        const existingReview = await storage.getWeekReview(clientId, weekNum);
        if (existingReview) {
          return res
            .status(400)
            .json({ message: "This week has already been reviewed" });
        }

        const review = await storage.createWeekReview(
          therapistId,
          clientId,
          weekNum,
          reviewNotes || "",
        );

        // Auto-mark all items for this week as reviewed
        try {
          await storage.markItemReviewed(therapistId, clientId, 'reflection', String(weekNum));
          await storage.markItemReviewed(therapistId, clientId, 'exercise', String(weekNum));
          const clientData = await storage.getUser(clientId);
          if (clientData?.startDate) {
            const startMs = new Date(clientData.startDate).getTime();
            const weekStartMs = startMs + (weekNum - 1) * 7 * 86400000;
            const weekEndMs = weekStartMs + 7 * 86400000;
            const allCheckins = await storage.getUserCheckinHistory(clientId, 365);
            for (const c of allCheckins) {
              const cMs = new Date(c.dateKey).getTime();
              if (cMs >= weekStartMs && cMs < weekEndMs) {
                await storage.markItemReviewed(therapistId, clientId, 'checkin', c.dateKey);
              }
            }
          }
        } catch (reviewMarkErr) {
          console.error("Auto-mark items reviewed error (non-fatal):", reviewMarkErr);
        }

        res.status(201).json({ review });
      } catch (error) {
        console.error("Submit week review error:", error);
        res.status(500).json({ message: "Failed to submit review" });
      }
    },
  );

  // Get reviews for a specific client (for therapist view)
  app.get(
    "/api/therapist/clients/:clientId/reviews",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;

        // Verify therapist is assigned to this client
        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res
            .status(403)
            .json({ message: "Not authorized to view this client" });
        }

        const reviews = await storage.getAllWeekReviewsForClient(clientId);
        res.json({ reviews });
      } catch (error) {
        console.error("Get client reviews error:", error);
        res.status(500).json({ message: "Failed to get reviews" });
      }
    },
  );

  // Admin: Get overdue reviews (reviews pending > 48 hours)
  app.get(
    "/api/admin/overdue-reviews",
    requireRole("admin"),
    async (req, res) => {
      try {
        const hoursThreshold = parseInt(req.query.hours as string) || 48;
        const overdueReviews = await storage.getOverdueReviews(hoursThreshold);
        res.json({ overdueReviews });
      } catch (error) {
        console.error("Get overdue reviews error:", error);
        res.status(500).json({ message: "Failed to get overdue reviews" });
      }
    },
  );

  // =====================================================
  // AI (v2 Hybrid) — Client AI Disabled + Safe Prompt Library
  // =====================================================
  //
  // v2 decision:
  // - No client-facing AI coaching endpoints.
  // - Clients may access a non-personalized Prompt Library.
  // - Any AI assistance must be staff-only drafts (added separately).

  // Client-facing AI endpoints are intentionally removed in v2
  // so the app does not "respond" to disclosures or interpret user content.
  app.get("/api/ai/encouragement", requireAuth, (_req, res) => {
    return res.status(410).json({
      error: "Removed in v2",
      message:
        "Client-facing AI coaching is disabled. Use /api/prompts/library instead.",
    });
  });

  app.get("/api/ai/technique", requireAuth, (_req, res) => {
    return res.status(410).json({
      error: "Removed in v2",
      message:
        "Client-facing AI coaching is disabled. Use /api/prompts/library instead.",
    });
  });

  // Client-safe Prompt Library (non-personalized, no inference)
  app.get("/api/prompts/library", requireAuth, (_req, res) => {
    return res.json({
      version: "v2",
      disclaimer:
        "Structured reflection prompts. Not therapy. Not crisis support.",
      prompts: [
        {
          id: "reset_5",
          title: "5-Minute Reset",
          body: "Pause. Breathe slowly for 60 seconds. Name the urge without fighting it. Then choose one small integrity action you can do in the next 5 minutes.",
        },
        {
          id: "values_check",
          title: "Values Check",
          body: "What kind of man do I want to be in the next hour? What choice aligns with that—even if I don’t feel like it?",
        },
        {
          id: "connection_plan",
          title: "Connection Plan",
          body: "Who is one safe person I can connect with today? What is a low-pressure message I can send in the next 3 minutes?",
        },
        {
          id: "urge_map",
          title: "Urge Map",
          body: "What happened right before the urge? (place, time, emotion, stress level). What do I actually need right now—rest, reassurance, connection, or structure?",
        },
        {
          id: "repair_step",
          title: "Repair Step",
          body: "What is one repair action I can take today—apology, honesty, a boundary, or a practical responsibility?",
        },
        {
          id: "next_right_thing",
          title: "Next Right Thing",
          body: "List three possible integrity actions. Pick the smallest one you will actually do within 10 minutes. Do it now.",
        },
        {
          id: "environment_shift",
          title: "Environment Shift",
          body: "Change your environment for 10 minutes: stand up, move rooms, go outside, or start a simple task. Momentum beats debate.",
        },
      ],
    });
  });

  // NOTE: Staff-only AI draft endpoint will be added separately.
  // It must be role-gated and assignment-gated (staff only, never client-visible).
  // Example target endpoint (do not add yet until role check is confirmed):
  // POST /api/staff/clients/:clientId/ai-draft

  // =======================================
  // Week access API (for time-based unlocking)
  // =======================================

  // Get unlocked weeks for current user
  app.get("/api/progress/unlocked-weeks", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== "client") {
        // Non-clients can access all weeks
        return res.json({
          unlockedWeeks: [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ],
        });
      }

      if (!user.startDate) {
        // No start date set, only week 1 available
        return res.json({ unlockedWeeks: [1] });
      }

      const startDate = new Date(user.startDate);
      const today = new Date();
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Calculate which weeks are unlocked (week N unlocks after (N-1) * 7 days)
      const unlockedWeeks: number[] = [];
      for (let week = 1; week <= 16; week++) {
        const daysRequired = (week - 1) * 7;
        if (daysSinceStart >= daysRequired) {
          unlockedWeeks.push(week);
        }
      }

      res.json({ unlockedWeeks });
    } catch (error) {
      console.error("Get unlocked weeks error:", error);
      res.status(500).json({ message: "Failed to get unlocked weeks" });
    }
  });

  // =======================================
  // Payment API endpoints
  // =======================================

  // Get Stripe publishable key
  app.get("/api/payments/config", async (req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Get Stripe config error:", error);
      res.status(500).json({ message: "Failed to get payment config" });
    }
  });

  // List available products and prices
  app.get("/api/payments/products", async (req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      const rows = await stripeService.listProductsWithPrices();

      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: [],
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }

      res.json({ products: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("List products error:", error);
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  // Get Stripe price IDs for frontend
  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const { pool } = await import("./db");

      // Query for therapist subscription price
      const therapistResult = await pool.query(`
        SELECT p.id as price_id 
        FROM stripe.prices p
        JOIN stripe.products pr ON p.product = pr.id
        WHERE pr.name = 'Therapist Monthly Subscription' 
        AND p.active = true
        LIMIT 1
      `);

      // Query for client week price
      const weekResult = await pool.query(`
        SELECT p.id as price_id 
        FROM stripe.prices p
        JOIN stripe.products pr ON p.product = pr.id
        WHERE pr.name = 'Weekly Lesson Access' 
        AND p.active = true
        LIMIT 1
      `);

      const therapistPriceId = therapistResult.rows[0]?.price_id || null;
      const weekPriceId = weekResult.rows[0]?.price_id || null;

      res.json({ therapistPriceId, weekPriceId });
    } catch (error) {
      console.error("Error fetching stripe config:", error);
      res.status(500).json({ message: "Failed to fetch stripe configuration" });
    }
  });

  // Create checkout session for therapist subscription
  app.post(
    "/api/payments/checkout/subscription",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const user = req.user as any;
        let { priceId } = req.body;

        const { stripeService } = await import("./stripeService");
        const { getUncachableStripeClient } = await import("./stripeClient");
        const stripe = await getUncachableStripeClient();

        // If priceId not provided, look up the Therapist Subscription price
        if (!priceId) {
          const products = await stripe.products.search({
            query: "name:'Therapist Monthly Subscription'",
          });
          if (products.data.length === 0) {
            return res.status(500).json({
              message: "Therapist subscription product not found in Stripe",
            });
          }
          const prices = await stripe.prices.list({
            product: products.data[0].id,
            active: true,
            limit: 1,
          });
          if (prices.data.length === 0) {
            return res.status(500).json({
              message: "Therapist subscription price not found in Stripe",
            });
          }
          priceId = prices.data[0].id;
        }

        // Create or get customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: { userId: user.id, role: user.role },
          });
          await storage.updateUser(user.id, { stripeCustomerId: customer.id });
          customerId = customer.id;
        }

        const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
        const session = await stripeService.createTherapistSubscriptionCheckout(
          customerId,
          priceId,
          `${baseUrl}/therapist?payment=success`,
          `${baseUrl}/therapist?payment=cancelled`,
        );

        res.json({ url: session.url });
      } catch (error) {
        console.error("Create subscription checkout error:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
      }
    },
  );

  // Create checkout session for client week payment
  app.post(
    "/api/payments/checkout/week",
    requireRole("client"),
    async (req, res) => {
      try {
        const user = req.user as any;
        const { weekNumber } = req.body;
        let { priceId } = req.body;

        // Check if account is cancelled - prevent future purchases
        if (user.subscriptionStatus === "cancelled") {
          return res.status(403).json({
            message:
              "Your account has been cancelled. You cannot purchase additional weeks.",
          });
        }

        if (!weekNumber) {
          return res.status(400).json({ message: "Week number is required" });
        }

        // If priceId not provided, look up the Weekly Lesson Access price
        if (!priceId) {
          const { getUncachableStripeClient } = await import("./stripeClient");
          const stripe = await getUncachableStripeClient();
          const products = await stripe.products.search({
            query: "name:'Weekly Lesson Access'",
          });
          if (products.data.length === 0) {
            return res
              .status(500)
              .json({ message: "Week access product not found in Stripe" });
          }
          const prices = await stripe.prices.list({
            product: products.data[0].id,
            active: true,
            limit: 1,
          });
          if (prices.data.length === 0) {
            return res
              .status(500)
              .json({ message: "Week access price not found in Stripe" });
          }
          priceId = prices.data[0].id;
        }

        // Check if week fee is waived
        const waivedWeeks = await storage.getWaivedWeeks(user.id);
        if (waivedWeeks.includes(weekNumber) || user.allFeesWaived) {
          return res.json({
            waived: true,
            message: "This week's fee has been waived",
          });
        }

        // Check if already paid
        const hasPaid = await storage.hasWeekPayment(user.id, weekNumber);
        if (hasPaid) {
          return res.json({
            alreadyPaid: true,
            message: "This week has already been paid for",
          });
        }

        const { stripeService } = await import("./stripeService");
        const { getUncachableStripeClient } = await import("./stripeClient");
        const stripe = await getUncachableStripeClient();

        // Create or get customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: { userId: user.id, role: user.role },
          });
          await storage.updateUser(user.id, { stripeCustomerId: customer.id });
          customerId = customer.id;
        }

        // Get the assigned therapist for revenue tracking
        const therapists = await storage.getTherapistsForClient(user.id);
        const therapistId = therapists.length > 0 ? therapists[0].id : null;

        const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
        const session = await stripeService.createWeekPaymentCheckout(
          customerId,
          priceId,
          weekNumber,
          user.id,
          therapistId,
          `${baseUrl}/week/${weekNumber}?payment=success`,
          `${baseUrl}/week/${weekNumber}?payment=cancelled`,
        );

        res.json({ url: session.url });
      } catch (error) {
        console.error("Create week payment checkout error:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
      }
    },
  );

  // Confirm and record a completed week payment (verifies with Stripe first)
  app.post(
    "/api/payments/confirm-week",
    requireRole("client"),
    async (req, res) => {
      try {
        const user = req.user as any;
        const { weekNumber, sessionId } = req.body;

        if (!weekNumber || typeof weekNumber !== "number") {
          return res
            .status(400)
            .json({ message: "Valid week number is required" });
        }

        if (!sessionId || typeof sessionId !== "string") {
          return res
            .status(400)
            .json({ message: "Stripe session ID is required" });
        }

        // Check if already recorded by week number
        const alreadyPaid = await storage.hasWeekPayment(user.id, weekNumber);
        if (alreadyPaid) {
          return res.json({
            success: true,
            message: "Payment already recorded",
          });
        }

        // Check if this specific Stripe session was already processed (idempotency)
        const existingPayment = await storage.getPaymentByStripeId(sessionId);
        if (existingPayment) {
          return res.json({
            success: true,
            message: "Payment already recorded",
          });
        }

        // Verify the specific checkout session with Stripe
        const { stripeService } = await import("./stripeService");
        const verification = await stripeService.verifyWeekPaymentSession(
          sessionId,
          user.id,
          weekNumber,
        );

        if (!verification.verified) {
          return res
            .status(400)
            .json({ message: "Payment not verified with Stripe" });
        }

        // Also check idempotency by paymentId (payment_intent) if different from sessionId
        if (verification.paymentId && verification.paymentId !== sessionId) {
          const existingByPaymentId = await storage.getPaymentByStripeId(
            verification.paymentId,
          );
          if (existingByPaymentId) {
            return res.json({
              success: true,
              message: "Payment already recorded",
            });
          }
        }

        // Create payment record with verified data from Stripe
        await storage.createPayment({
          userId: user.id,
          type: "week_fee",
          weekNumber,
          amount: verification.amount || 1499,
          status: "completed",
          assignedTherapistId: verification.therapistId || undefined,
          stripePaymentId: verification.paymentId || sessionId,
        });

        res.json({ success: true });
      } catch (error) {
        console.error("Confirm week payment error:", error);
        res.status(500).json({ message: "Failed to confirm payment" });
      }
    },
  );

  // Get subscription status for current user
  app.get("/api/payments/subscription", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      // Include fee waiver status for therapists
      if (!user.stripeSubscriptionId) {
        return res.json({
          subscription: null,
          allFeesWaived: user.allFeesWaived || false,
        });
      }

      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getSubscription(
        user.stripeSubscriptionId,
      );

      // Get live subscription details from Stripe for cancel_at_period_end status
      const subscriptionDetails = await stripeService.getSubscriptionDetails(
        user.stripeSubscriptionId,
      );

      res.json({
        subscription,
        allFeesWaived: user.allFeesWaived || false,
        cancelAtPeriodEnd: subscriptionDetails?.cancelAtPeriodEnd || false,
        periodEnd: subscriptionDetails?.periodEnd || null,
      });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ message: "Failed to get subscription" });
    }
  });

  // Create customer portal session
  app.post("/api/payments/portal", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      if (!user.stripeCustomerId) {
        return res.status(400).json({ message: "No payment profile found" });
      }

      const { stripeService } = await import("./stripeService");
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/dashboard`,
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Create portal session error:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // Cancel therapist subscription (no refund - active until period end)
  app.post(
    "/api/account/cancel-subscription",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const user = req.user as any;

        if (!user.stripeSubscriptionId) {
          return res
            .status(400)
            .json({ message: "No active subscription found" });
        }

        const { stripeService } = await import("./stripeService");
        const result = await stripeService.cancelSubscriptionAtPeriodEnd(
          user.stripeSubscriptionId,
        );

        if (!result.success) {
          return res
            .status(500)
            .json({ message: result.error || "Failed to cancel subscription" });
        }

        console.log(
          `Therapist ${user.email} cancelled subscription - access until ${result.periodEnd}`,
        );

        res.json({
          message: "Subscription cancelled",
          accessEndsAt: result.periodEnd,
          noRefund: true,
        });
      } catch (error) {
        console.error("Cancel subscription error:", error);
        res.status(500).json({ message: "Failed to cancel subscription" });
      }
    },
  );

  // Cancel client account (deactivate - no refunds on already-paid weeks)
  app.post("/api/account/cancel", requireRole("client"), async (req, res) => {
    try {
      const user = req.user as any;

      // Update user status to cancelled
      await storage.updateUser(user.id, { subscriptionStatus: "cancelled" });

      console.log(`User ${user.email} (${user.role}) cancelled their account`);

      // Logout the user
      req.logout((err) => {
        if (err) {
          console.error("Logout error during cancellation:", err);
        }
      });

      res.json({
        message: "Account cancelled successfully",
        noRefund: true,
        note: "You will retain access to any previously paid weeks.",
      });
    } catch (error) {
      console.error("Cancel account error:", error);
      res.status(500).json({ message: "Failed to cancel account" });
    }
  });

  // Check if client needs to pay for a specific week
  app.get(
    "/api/payments/week/:weekNumber/status",
    requireRole("client"),
    async (req, res) => {
      try {
        const user = req.user as any;
        const weekNumber = parseInt(req.params.weekNumber);

        if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
          return res.status(400).json({ message: "Invalid week number" });
        }

        // Week 1 is always free to help men start their journey
        if (weekNumber === 1) {
          return res.json({ needsPayment: false, reason: "week_1_free" });
        }

        // Check if all fees are waived
        if (user.allFeesWaived) {
          return res.json({ needsPayment: false, reason: "all_fees_waived" });
        }

        // Check if this week's fee is waived
        const waivedWeeks = await storage.getWaivedWeeks(user.id);
        if (waivedWeeks.includes(weekNumber)) {
          return res.json({ needsPayment: false, reason: "week_fee_waived" });
        }

        // Check if already paid
        const hasPaid = await storage.hasWeekPayment(user.id, weekNumber);
        if (hasPaid) {
          return res.json({ needsPayment: false, reason: "already_paid" });
        }

        res.json({ needsPayment: true });
      } catch (error) {
        console.error("Check week payment status error:", error);
        res.status(500).json({ message: "Failed to check payment status" });
      }
    },
  );

  // =======================================
  // Password Reset API endpoints
  // =======================================

  // Request password reset (user self-service)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          message:
            "If an account exists with this email, you will receive a password reset link.",
        });
      }

      // Clean expired tokens first
      await storage.cleanExpiredTokens();

      // Create reset token
      const tokenRecord = await storage.createPasswordResetToken(user.id);

      // Build reset link
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const resetLink = `${baseUrl}/reset-password?token=${tokenRecord.token}`;

      // Send email
      const loginUrl = `${baseUrl}/login`;
      const { sendPasswordResetEmail } = await import("./emailService");
      await sendPasswordResetEmail(
        user.email,
        resetLink,
        user.name || undefined,
        loginUrl,
      );

      res.json({
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res
        .status(500)
        .json({ message: "Failed to process password reset request" });
    }
  });

  // Verify reset token
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res
          .status(400)
          .json({ valid: false, message: "Token is required" });
      }

      const tokenRecord = await storage.getPasswordResetToken(token);

      if (!tokenRecord) {
        return res.json({ valid: false, message: "Invalid or expired token" });
      }

      if (tokenRecord.usedAt) {
        return res.json({
          valid: false,
          message: "This reset link has already been used",
        });
      }

      if (new Date(tokenRecord.expiresAt) < new Date()) {
        return res.json({
          valid: false,
          message: "This reset link has expired",
        });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Verify reset token error:", error);
      res.status(500).json({ valid: false, message: "Failed to verify token" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res
          .status(400)
          .json({ message: "Token and password are required" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });
      }

      const tokenRecord = await storage.getPasswordResetToken(token);

      if (!tokenRecord) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      if (tokenRecord.usedAt) {
        return res
          .status(400)
          .json({ message: "This reset link has already been used" });
      }

      if (new Date(tokenRecord.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This reset link has expired" });
      }

      // Update password
      const hashedPassword = await hashPassword(password);
      const user = await storage.updateUserPassword(
        tokenRecord.userId,
        hashedPassword,
      );

      if (!user) {
        return res.status(400).json({ message: "Failed to update password" });
      }

      // Mark token as used
      await storage.markTokenAsUsed(tokenRecord.id);

      // Send confirmation email
      const loginUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}/login`;
      const { sendPasswordChangedConfirmation } = await import(
        "./emailService"
      );
      await sendPasswordChangedConfirmation(
        user.email,
        user.name || undefined,
        loginUrl,
      );

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Change password for logged-in users (all roles)
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "New password must be at least 6 characters" });
      }

      // Verify current password
      const bcrypt = await import("bcrypt");
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(
        user.id,
        hashedPassword,
      );

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      // Send confirmation email
      const loginUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}/login`;
      const { sendPasswordChangedConfirmation } = await import(
        "./emailService"
      );
      await sendPasswordChangedConfirmation(
        user.email,
        user.name || undefined,
        loginUrl,
      );

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Admin reset user password (admin can reset any user's password)
  app.post(
    "/api/admin/reset-password/:userId",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
          return res.status(400).json({ message: "New password is required" });
        }

        if (newPassword.length < 6) {
          return res
            .status(400)
            .json({ message: "Password must be at least 6 characters" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Update password
        const hashedPassword = await hashPassword(newPassword);
        const updatedUser = await storage.updateUserPassword(
          userId,
          hashedPassword,
        );

        if (!updatedUser) {
          return res.status(500).json({ message: "Failed to update password" });
        }

        // Optionally send notification to user
        const loginUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}/login`;
        const { sendPasswordChangedConfirmation } = await import(
          "./emailService"
        );
        await sendPasswordChangedConfirmation(
          user.email,
          user.name || undefined,
          loginUrl,
        );

        res.json({ message: "Password has been reset successfully" });
      } catch (error) {
        console.error("Admin reset password error:", error);
        res.status(500).json({ message: "Failed to reset password" });
      }
    },
  );

  // ===== Push Notification Routes =====

  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
  });

  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Invalid subscription data" });
      }
      const userId = req.user!.id;
      await storage.savePushSubscription(
        userId,
        endpoint,
        keys.p256dh,
        keys.auth,
      );
      await storage.upsertNotificationPreferences(userId, {});
      res.json({ message: "Subscribed to notifications" });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  app.post("/api/push/unsubscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint required" });
      }
      const userId = req.user!.id;
      await storage.deletePushSubscription(userId, endpoint);
      res.json({ message: "Unsubscribed from notifications" });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  app.get("/api/push/status", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const subs = await storage.getPushSubscriptions(userId);
      const prefs = await storage.getNotificationPreferences(userId);
      res.json({
        subscribed: subs.length > 0,
        preferences: prefs || {
          checkinReminderEnabled: true,
          checkinReminderTime: "20:00",
          feedbackNotificationsEnabled: true,
          weeklyProgressEnabled: true,
          nudgeEnabled: true,
        },
      });
    } catch (error) {
      console.error("Push status error:", error);
      res.status(500).json({ message: "Failed to get notification status" });
    }
  });

  app.put("/api/push/preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const {
        checkinReminderEnabled,
        checkinReminderTime,
        feedbackNotificationsEnabled,
        weeklyProgressEnabled,
        nudgeEnabled,
      } = req.body;
      const prefs = await storage.upsertNotificationPreferences(userId, {
        checkinReminderEnabled,
        checkinReminderTime,
        feedbackNotificationsEnabled,
        weeklyProgressEnabled,
        nudgeEnabled,
      });
      res.json(prefs);
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Start the check-in reminder scheduler
  startCheckinReminderScheduler();
  startNudgeScheduler();
  // NEW: SMART AI FEEDBACK GENERATOR
  app.post(
    "/api/therapist/generate-checkin-feedback",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const { clientId, dateKey } = req.body;

        // 1. Fetch the specific check-in, history, and relapse data for context
        const [history, user, relapseHistory] = await Promise.all([
          storage.getUserCheckinHistory(clientId, 30),
          storage.getUser(clientId),
          storage.getRelapseAutopsies(clientId),
        ]);

        const specificCheckin = history.find((c) => c.dateKey === dateKey);

        if (!specificCheckin) {
          return res
            .status(404)
            .json({ message: "Check-in not found for this date." });
        }

        // 2. Pre-compute trend analysis using utility
        const { analyzeTrends, formatTrendReportForAI } = await import("./trendAnalysis");
        const checkinTrendReport = analyzeTrends(
          history.map((c) => ({ moodLevel: c.moodLevel ?? null, urgeLevel: c.urgeLevel ?? null, dateKey: c.dateKey }))
        );
        const checkinTrendStatsBlock = formatTrendReportForAI(checkinTrendReport);

        const completedAutopsies = relapseHistory.filter(
          (a) => a.status === "completed",
        );
        let relapseContext = "";
        if (completedAutopsies.length > 0) {
          relapseContext = `\nRELAPSE HISTORY (${completedAutopsies.length} incidents):
${completedAutopsies
  .slice(0, 3)
  .map(
    (a) =>
      `- ${a.date} (${a.lapseOrRelapse}): triggers="${a.triggers?.slice(0, 80) || "N/A"}"`,
  )
  .join("\n")}`;
        }

        // 3. AI Prompt with pre-computed trend awareness
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        const prompt = `
        You are an expert recovery mentor providing feedback for ${user?.name || "the client"}.

        TARGET CHECK-IN (${dateKey}):
        - Mood: ${specificCheckin.moodLevel}/10
        - Urge: ${specificCheckin.urgeLevel}/10
        - Journal: "${specificCheckin.journalEntry || "No entry"}"

        ${checkinTrendStatsBlock}
        ${relapseContext}

        INSTRUCTIONS:
        1. Write a 2-3 sentence encouraging comment.
        2. Reference how today's mood or urge compares to the pre-computed statistics above.
        3. CRITICAL: Do NOT contradict the statistics. If a metric is described as "stable" or "consistently at X", do NOT say it is improving or declining. If data is "insufficient", state that more data is needed.
        4. If there is relapse history, sensitively reference patterns and how today's check-in relates to known triggers or risk factors.
        5. Mention check-in consistency if notably high or low.
        6. End with a specific, supportive statement or encouragement. Do NOT include any questions — clients cannot reply to these messages.
        7. TONE: Be warm but measured. Do NOT use power words like "fantastic," "excellent," "amazing," "incredible," "outstanding," "extraordinary," "wonderful," or "remarkable." Keep language grounded and steady. Acknowledge effort simply.
      `;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        res.json({ draft: response.text });
      } catch (error) {
        console.error("Smart AI Feedback Error:", error);
        res.status(500).json({ message: "Failed to generate smart feedback" });
      }
    },
  );
  // Mark a relapse autopsy as reviewed by therapist
  app.post(
    "/api/therapist/clients/:clientId/autopsies/:autopsyId/review",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId, autopsyId } = req.params;

        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res.status(403).json({ message: "Not authorized" });
        }

        const autopsy = await storage.getRelapseAutopsy(autopsyId);
        if (!autopsy || autopsy.userId !== clientId) {
          return res.status(404).json({ message: "Autopsy not found" });
        }

        const updated = await storage.markAutopsyReviewed(autopsyId);
        res.json({ autopsy: updated });
      } catch (error) {
        console.error("Mark autopsy reviewed error:", error);
        res.status(500).json({ message: "Failed to mark autopsy as reviewed" });
      }
    },
  );

  // Get unreviewed autopsy counts for therapist's clients (for dashboard badges)
  app.get(
    "/api/therapist/unreviewed-autopsies",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const clients = await storage.getClientsForTherapist(therapistId);
        const clientIds = clients.map((c) => c.id);
        const unreviewedArr =
          await storage.getUnreviewedAutopsiesForClients(clientIds);
        const unreviewedCounts: Record<string, number> = {};
        for (const item of unreviewedArr) {
          unreviewedCounts[item.userId] = item.count;
        }
        res.json({ unreviewedCounts });
      } catch (error) {
        console.error("Get unreviewed autopsies error:", error);
        res.status(500).json({ message: "Failed to get unreviewed autopsies" });
      }
    },
  );

  // Get unreviewed item counts (check-ins, reflections, exercises) per client
  app.get(
    "/api/therapist/unreviewed-items",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const clients = await storage.getClientsForTherapist(therapistId);
        const clientIds = clients.map((c) => c.id);
        const counts = await storage.getUnreviewedItemCountsForClients(therapistId, clientIds);
        res.json({ unreviewedItemCounts: counts });
      } catch (error) {
        console.error("Get unreviewed items error:", error);
        res.status(500).json({ message: "Failed to get unreviewed item counts" });
      }
    },
  );

  // Generate AI feedback draft for a relapse autopsy with trend analysis
  app.post(
    "/api/therapist/generate-autopsy-feedback",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId, autopsyId } = req.body;

        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res
            .status(403)
            .json({ message: "Not authorized for this client" });
        }

        const [autopsy, allAutopsies, checkins, user] = await Promise.all([
          storage.getRelapseAutopsy(autopsyId),
          storage.getRelapseAutopsies(clientId),
          storage.getUserCheckinHistory(clientId, 60),
          storage.getUser(clientId),
        ]);

        if (!autopsy || autopsy.userId !== clientId) {
          return res.status(404).json({ message: "Autopsy not found" });
        }

        const pastAutopsies = allAutopsies.filter(
          (a) => a.id !== autopsyId && a.status === "completed",
        );

        const trendAnalysis: string[] = [];

        if (pastAutopsies.length > 0) {
          trendAnalysis.push(
            `Total past relapses/lapses: ${pastAutopsies.length}`,
          );

          const triggerFrequency: Record<string, number> = {};
          const allTriggers = [autopsy, ...pastAutopsies];
          for (const a of allTriggers) {
            if (a.triggers) {
              const triggerWords = a.triggers
                .toLowerCase()
                .split(/[,;\n]+/)
                .map((t) => t.trim())
                .filter(Boolean);
              for (const t of triggerWords) {
                triggerFrequency[t] = (triggerFrequency[t] || 0) + 1;
              }
            }
          }
          const recurring = Object.entries(triggerFrequency)
            .filter(([, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          if (recurring.length > 0) {
            trendAnalysis.push(
              `Recurring triggers: ${recurring.map(([t, c]) => `"${t}" (${c}x)`).join(", ")}`,
            );
          }

          const lapseCount =
            pastAutopsies.filter((a) => a.lapseOrRelapse === "lapse").length +
            (autopsy.lapseOrRelapse === "lapse" ? 1 : 0);
          const relapseCount =
            pastAutopsies.filter((a) => a.lapseOrRelapse === "relapse").length +
            (autopsy.lapseOrRelapse === "relapse" ? 1 : 0);
          trendAnalysis.push(
            `Pattern: ${lapseCount} lapses, ${relapseCount} relapses`,
          );

          if (pastAutopsies.length >= 2) {
            const sorted = [...pastAutopsies, autopsy].sort((a, b) =>
              a.date.localeCompare(b.date),
            );
            const gaps: number[] = [];
            for (let i = 1; i < sorted.length; i++) {
              const diff =
                (new Date(sorted[i].date).getTime() -
                  new Date(sorted[i - 1].date).getTime()) /
                (1000 * 60 * 60 * 24);
              gaps.push(diff);
            }
            const avgGap = Math.round(
              gaps.reduce((s, g) => s + g, 0) / gaps.length,
            );
            const latestGap = gaps[gaps.length - 1];
            trendAnalysis.push(`Average days between incidents: ${avgGap}`);
            if (latestGap < avgGap) {
              trendAnalysis.push(
                `ALERT: Latest gap (${Math.round(latestGap)} days) is shorter than average — frequency may be increasing`,
              );
            } else if (latestGap > avgGap) {
              trendAnalysis.push(
                `POSITIVE: Latest gap (${Math.round(latestGap)} days) is longer than average — showing improvement`,
              );
            }
          }

          const contextFreq: Record<string, number> = {};
          for (const a of allTriggers) {
            if (a.context) {
              const words = a.context
                .toLowerCase()
                .split(/[,;\n]+/)
                .map((t) => t.trim())
                .filter(Boolean);
              for (const w of words) {
                contextFreq[w] = (contextFreq[w] || 0) + 1;
              }
            }
          }
          const recurringContexts = Object.entries(contextFreq)
            .filter(([, c]) => c > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
          if (recurringContexts.length > 0) {
            trendAnalysis.push(
              `Recurring contexts/situations: ${recurringContexts.map(([c, n]) => `"${c}" (${n}x)`).join(", ")}`,
            );
          }
        }

        const { analyzeTrends, formatTrendReportForAI } = await import("./trendAnalysis");
        const autopsyTrendReport = analyzeTrends(
          checkins.map((c) => ({ moodLevel: c.moodLevel ?? null, urgeLevel: c.urgeLevel ?? null, dateKey: c.dateKey }))
        );
        const autopsyTrendStatsBlock = formatTrendReportForAI(autopsyTrendReport);
        trendAnalysis.push(autopsyTrendStatsBlock);

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        const prompt = `You are an expert recovery mentor providing feedback on a relapse autopsy for ${user?.name || "the client"}.

THIS RELAPSE AUTOPSY (${autopsy.date}):
- Type: ${autopsy.lapseOrRelapse}
- Summary: "${autopsy.summary || "Not provided"}"
- Triggers: "${autopsy.triggers || "Not provided"}"
- Emotions: "${autopsy.emotions || "Not provided"}"
- Thoughts: "${autopsy.thoughts || "Not provided"}"
- Warning signs missed: "${autopsy.warningSigns || "Not provided"}"
- Boundaries broken: "${autopsy.boundariesBroken || "Not provided"}"
- Decision points: "${autopsy.decisionPoints || "Not provided"}"
- Immediate actions planned: "${autopsy.immediateActions || "Not provided"}"
- Rule changes: "${autopsy.ruleChanges || "Not provided"}"
- Support plan: "${autopsy.supportPlan || "Not provided"}"
- Next 24h plan: "${autopsy.next24HoursPlan || "Not provided"}"

TREND ANALYSIS FROM PAST HISTORY:
${trendAnalysis.length > 0 ? trendAnalysis.join("\n") : "This is the client's first reported incident."}

PAST AUTOPSY SUMMARIES (most recent first):
${
  pastAutopsies
    .slice(0, 5)
    .map(
      (a) =>
        `- ${a.date} (${a.lapseOrRelapse}): "${a.summary?.slice(0, 150) || "No summary"}"`,
    )
    .join("\n") || "None"
}

INSTRUCTIONS:
1. Acknowledge the courage it takes to complete a relapse autopsy honestly.
2. Specifically reference patterns or recurring triggers from past incidents if any exist.
3. If frequency is increasing, address this directly but compassionately.
4. Validate their identified warning signs and suggest additions based on patterns you see.
5. Affirm their action plan and add specific, practical suggestions.
6. Reference their mood/urge trends from check-in data if relevant.
7. CRITICAL: Do NOT contradict the pre-computed statistics in the TREND ANALYSIS section. If a metric is described as "stable" or "consistently at X", do NOT say it is improving or declining.
8. Keep the tone urgent but supportive — this needs immediate, caring attention.
9. Under 300 words. Speak directly to the client using "you" language.
10. Do not provide medical advice or crisis intervention.
11. TONE: Be warm but measured. Do NOT use power words like "fantastic," "excellent," "amazing," "incredible." Keep language grounded and honest. This is a relapse autopsy — be compassionate without being patronizing.
12. End with an encouraging statement or a concrete next step. Do NOT include any questions anywhere in the message — clients cannot reply, so questions only create frustration.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        res.json({ draft: response.text });
      } catch (error) {
        console.error("Generate autopsy feedback error:", error);
        res
          .status(500)
          .json({ message: "Failed to generate autopsy feedback" });
      }
    },
  );

  return httpServer;
}
