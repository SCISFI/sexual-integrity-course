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

          const prompt = `Write a short, warm, encouraging message (2-3 sentences) for someone in a recovery program who hasn't checked in for ${daysSince} days. Be supportive, not judgmental. Don't mention specific details about their program. Focus on the value of showing up and the strength it takes to continue. Do not provide medical advice.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          });

          const encouragement =
            response.text ||
            "Every day is a new opportunity. We're here for you whenever you're ready to check in.";

          const loginUrl = process.env.REPLIT_DEV_DOMAIN
            ? `https://${process.env.REPLIT_DEV_DOMAIN}/login`
            : process.env.REPLIT_DOMAINS
              ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/login`
              : undefined;

          const { sendNudgeEmail } = await import("./emailService");
          await sendNudgeEmail(
            client.email,
            client.firstName || undefined,
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
      const { q1, q2, q3, q4 } = req.body;
      const reflection = await storage.upsertWeekReflection(
        userId,
        weekNumber,
        { q1, q2, q3, q4 },
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
  app.get("/api/progress/checkin-stats", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const checkins = await storage.getUserCheckinHistory(userId, 365); // Get up to a year of data

      if (checkins.length === 0) {
        return res.json({
          totalCheckins: 0,
          currentStreak: 0,
          longestStreak: 0,
          averageMood: 0,
          averageUrge: 0,
          dailyCompletionRate: 0,
          recentCheckins: [],
        });
      }

      // Calculate streaks
      const sortedDates = checkins
        .map((c) => c.dateKey)
        .sort()
        .reverse();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 1;
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      // Check if there's a checkin today or yesterday to start streak
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays = Math.round(
            (prevDate.getTime() - currDate.getTime()) / 86400000,
          );
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round(
          (prevDate.getTime() - currDate.getTime()) / 86400000,
        );
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      // Calculate averages
      const moodValues = checkins
        .filter((c) => c.moodLevel !== null)
        .map((c) => c.moodLevel!);
      const urgeValues = checkins
        .filter((c) => c.urgeLevel !== null)
        .map((c) => c.urgeLevel!);
      const averageMood =
        moodValues.length > 0
          ? Math.round(
              (moodValues.reduce((a, b) => a + b, 0) / moodValues.length) * 10,
            ) / 10
          : 0;
      const averageUrge =
        urgeValues.length > 0
          ? Math.round(
              (urgeValues.reduce((a, b) => a + b, 0) / urgeValues.length) * 10,
            ) / 10
          : 0;

      // Daily completion rate - percentage of days with check-ins
      // Uses a 14-day window, but caps at days since first check-in for new users
      const nowDate = new Date();
      const oldestCheckinDate = checkins[0]?.dateKey
        ? new Date(checkins[0].dateKey)
        : nowDate;
      const daysSinceStart = Math.max(
        1,
        Math.ceil(
          (nowDate.getTime() - oldestCheckinDate.getTime()) / 86400000,
        ) + 1,
      );
      const windowSize = Math.min(14, daysSinceStart);

      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - windowSize + 1);
      const recentDates = new Set(
        checkins
          .filter((c) => new Date(c.dateKey) >= windowStart)
          .map((c) => c.dateKey),
      );
      const dailyCompletionRate = Math.round(
        (recentDates.size / windowSize) * 100,
      );

      // Get last 14 days for trend charts
      const recentCheckins = checkins.slice(-14).map((c) => ({
        date: c.dateKey,
        mood: c.moodLevel,
        urge: c.urgeLevel,
      }));

      res.json({
        totalCheckins: checkins.length,
        currentStreak,
        longestStreak,
        averageMood,
        averageUrge,
        dailyCompletionRate,
        recentCheckins,
      });
    } catch (error) {
      console.error("Get checkin stats error:", error);
      res.status(500).json({ message: "Failed to get checkin statistics" });
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

        res.json({
          completedWeeks,
          checkins,
          reflections,
          homeworkCompletions,
          feedback,
          exerciseAnswers: exerciseAnswersData,
          relapseAutopsies,
          itemReviews,
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
    1: "Welcome & Understanding CSBD",
    2: "Understanding Your Cycle & Triggers",
    3: "Cognitive Restructuring",
    4: "Self-Regulation & Impulse Management",
    5: "Understanding Shame & Guilt",
    6: "Relationships, Attachment & Intimacy",
    7: "Problem-Solving & Communication",
    8: "Relapse Prevention - Part 1",
    9: "Introduction to ACT & Psychological Flexibility",
    10: "Cognitive Defusion",
    11: "Values Clarification",
    12: "Acceptance & Mindfulness",
    13: "Committed Action",
    14: "Self-as-Context & Identity",
    15: "Comprehensive Relapse Prevention",
    16: "Integration & Moving Forward",
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

        const checkins = await storage.getCheckins(clientId);
        const weekReflection = await storage.getWeekReflection(
          clientId,
          weekNumber,
        );
        const homeworkCompletions = await storage.getHomeworkCompletions(
          clientId,
          weekNumber,
        );
        const feedbackList = await storage.getFeedbackForClient(clientId);
        const relapseHistory = await storage.getRelapseAutopsies(clientId);

        const weekCheckins = checkins.filter((c) => {
          const dateStr =
            c.checkinDate instanceof Date
              ? c.checkinDate.toISOString().slice(0, 10)
              : String(c.checkinDate).slice(0, 10);
          const checkinTime = new Date(dateStr).getTime();
          const startDate = client.weekStartDate
            ? new Date(client.weekStartDate)
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
        const hwDone = homeworkCompletions?.length || 0;

        let contextInfo = `Client: ${client.firstName || ""} ${client.lastName || ""}\nWeek ${weekNumber}: ${WEEK_TITLES[weekNumber] || "Unknown"}\n`;
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

        const prompt = `You are a professional mentor writing a weekly progress summary report for a client in a Sexual Integrity recovery program. This summary will be included in a formal PDF report.

${contextInfo}

Write a comprehensive but concise weekly summary (200-300 words) that includes:
1. A brief overview of the client's engagement this week (check-in consistency, homework completion)
2. Key observations from their reflections and journal entries
3. Notable mood/urge patterns
4. Strengths demonstrated this week
5. Areas to focus on next week
6. An encouraging closing statement

Tone: Professional, warm, and supportive. Write in third person ("The client..." or use their name).
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

        const checkins = await storage.getCheckins(clientId);
        const homeworkCompletions = await storage.getHomeworkCompletions(
          clientId,
          weekNumber,
        );

        const startDate = client.weekStartDate
          ? new Date(client.weekStartDate)
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
        const hwDone = homeworkCompletions?.length || 0;

        const pdfBuffer = await generateWeeklySummaryPDF({
          clientName:
            `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
            client.email,
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
          mentorName:
            `${therapist.firstName || ""} ${therapist.lastName || ""}`.trim() ||
            therapist.email,
          generatedDate: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="week-${weekNumber}-summary-${client.firstName || "client"}.pdf"`,
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
          mentorName =
            `${therapist.firstName || ""} ${therapist.lastName || ""}`.trim() ||
            therapist.email;
        }

        const checkins = await storage.getCheckins(clientId);
        const homeworkCompletions = await storage.getHomeworkCompletions(
          clientId,
          weekNumber,
        );

        const startDate = client.weekStartDate
          ? new Date(client.weekStartDate)
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
        const hwDone = homeworkCompletions?.length || 0;

        const pdfBuffer = await generateWeeklySummaryPDF({
          clientName:
            `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
            client.email,
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
        const { feedbackType, content, weekNumber, checkinDateKey } = req.body;

        if (!content || !feedbackType) {
          return res
            .status(400)
            .json({ message: "Feedback type and content are required" });
        }

        // Verify therapist is assigned to this client
        const clients = await storage.getClientsForTherapist(therapistId);
        const isAssigned = clients.some((c) => c.id === clientId);
        if (!isAssigned) {
          return res.status(403).json({
            message: "Not authorized to provide feedback for this client",
          });
        }

        const feedback = await storage.addTherapistFeedback(
          therapistId,
          clientId,
          feedbackType,
          content,
          weekNumber,
          checkinDateKey,
        );

        res.status(201).json({ feedback });

        // Send email notification to the client
        try {
          const clientData = await storage.getUser(clientId);
          if (clientData && clientData.email) {
            const { sendFeedbackNotification } = await import("./emailService");
            const therapistData = req.user as any;
            const loginUrl = `${req.protocol}://${req.get("host")}/login`;
            await sendFeedbackNotification(
              clientData.email,
              clientData.name || undefined,
              therapistData.name || "Your mentor",
              weekNumber,
              loginUrl,
            );
          }
        } catch (notifyError) {
          console.error("Failed to send feedback notification:", notifyError);
          // Don't fail the request if notification fails
        }
      } catch (error) {
        console.error("Add therapist feedback error:", error);
        res.status(500).json({ message: "Failed to add feedback" });
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

        // Build context for AI
        const recentCheckins = checkins.slice(0, 14);
        const avgMood =
          recentCheckins.length > 0
            ? recentCheckins
                .filter((c) => c.moodLevel)
                .reduce((sum, c) => sum + (c.moodLevel || 0), 0) /
              recentCheckins.filter((c) => c.moodLevel).length
            : null;
        const avgUrge =
          recentCheckins.length > 0
            ? recentCheckins
                .filter((c) => c.urgeLevel)
                .reduce((sum, c) => sum + (c.urgeLevel || 0), 0) /
              recentCheckins.filter((c) => c.urgeLevel).length
            : null;

        // Trend analysis: compare first half to second half of recent data
        const moodValues = recentCheckins
          .filter((c) => c.moodLevel !== null)
          .map((c) => c.moodLevel!);
        const urgeValues = recentCheckins
          .filter((c) => c.urgeLevel !== null)
          .map((c) => c.urgeLevel!);
        const olderMood = moodValues.slice(Math.floor(moodValues.length / 2));
        const newerMood = moodValues.slice(
          0,
          Math.floor(moodValues.length / 2),
        );
        const olderUrge = urgeValues.slice(Math.floor(urgeValues.length / 2));
        const newerUrge = urgeValues.slice(
          0,
          Math.floor(urgeValues.length / 2),
        );
        const moodTrend =
          newerMood.length > 0 && olderMood.length > 0
            ? newerMood.reduce((a, b) => a + b, 0) / newerMood.length >
              olderMood.reduce((a, b) => a + b, 0) / olderMood.length
              ? "improving"
              : "declining"
            : "stable";
        const urgeTrend =
          newerUrge.length > 0 && olderUrge.length > 0
            ? newerUrge.reduce((a, b) => a + b, 0) / newerUrge.length <
              olderUrge.reduce((a, b) => a + b, 0) / olderUrge.length
              ? "improving"
              : "increasing"
            : "stable";

        // Check-in consistency
        const last14Days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split("T")[0];
        });
        const checkinDates = new Set(checkins.map((c) => c.dateKey));
        const consistencyRate = Math.round(
          (last14Days.filter((d) => checkinDates.has(d)).length / 14) * 100,
        );

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
`;

        if (avgMood !== null) {
          contextInfo += `Recent average mood: ${avgMood.toFixed(1)}/10 (trend: ${moodTrend})\n`;
        }
        if (avgUrge !== null) {
          contextInfo += `Recent average urge level: ${avgUrge.toFixed(1)}/10 (trend: ${urgeTrend})\n`;
        }
        contextInfo += `Check-in consistency (14 days): ${consistencyRate}%\n`;

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

        const prompt = `You are a supportive mentor providing feedback to a client in a Sexual Integrity recovery program. Based on the following client information, write a personalized, encouraging feedback message.

${contextInfo}

Guidelines:
- Speak directly to the client using "you" language
- Be direct yet encouraging and supportive
- Reference specific details from their reflections or journal entries when available
- Acknowledge their progress and effort, referencing specific trends (mood improving/declining, urge trends, check-in consistency)
- If there is relapse history, sensitively reference patterns and how the client's current progress relates to their recovery journey
- Offer gentle guidance or suggestions based on their challenges
- Keep the message focused and under 250 words
- Do not provide medical advice or crisis intervention
- End with an encouraging note about their continued journey

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

        // 2. Format the history into a trend summary with analysis
        const trendSummary = history.map((h) => ({
          date: h.dateKey,
          mood: h.moodLevel,
          urge: h.urgeLevel,
        }));

        // Trend analysis
        const moodVals = history
          .filter((c) => c.moodLevel !== null)
          .map((c) => c.moodLevel!);
        const urgeVals = history
          .filter((c) => c.urgeLevel !== null)
          .map((c) => c.urgeLevel!);
        const olderMood = moodVals.slice(Math.floor(moodVals.length / 2));
        const newerMood = moodVals.slice(0, Math.floor(moodVals.length / 2));
        const olderUrge = urgeVals.slice(Math.floor(urgeVals.length / 2));
        const newerUrge = urgeVals.slice(0, Math.floor(urgeVals.length / 2));
        const moodDirection =
          newerMood.length > 0 && olderMood.length > 0
            ? newerMood.reduce((a, b) => a + b, 0) / newerMood.length >
              olderMood.reduce((a, b) => a + b, 0) / olderMood.length
              ? "improving"
              : "declining"
            : "stable";
        const urgeDirection =
          newerUrge.length > 0 && olderUrge.length > 0
            ? newerUrge.reduce((a, b) => a + b, 0) / newerUrge.length <
              olderUrge.reduce((a, b) => a + b, 0) / olderUrge.length
              ? "improving (decreasing)"
              : "worsening (increasing)"
            : "stable";

        // Relapse context
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

        // Check-in consistency
        const last14 = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split("T")[0];
        });
        const checkinSet = new Set(history.map((c) => c.dateKey));
        const consistency = Math.round(
          (last14.filter((d) => checkinSet.has(d)).length / 14) * 100,
        );

        // 3. AI Prompt with enhanced trend awareness
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

        PAST 30-DAY TRENDS:
        ${JSON.stringify(trendSummary)}
        - Mood trend: ${moodDirection}
        - Urge trend: ${urgeDirection}
        - Check-in consistency (14 days): ${consistency}%
        ${relapseContext}

        INSTRUCTIONS:
        1. Write a 2-3 sentence encouraging comment.
        2. Specifically reference how today's mood or urge compares to their past month's trends (mention if improving, declining, or stable).
        3. If there is relapse history, sensitively reference patterns and how today's check-in relates to known triggers or risk factors.
        4. Mention check-in consistency if notably high or low.
        5. End with a specific, supportive action.
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

        const recentMoodTrend = checkins
          .slice(0, 14)
          .filter((c) => c.moodLevel !== null);
        const recentUrgeTrend = checkins
          .slice(0, 14)
          .filter((c) => c.urgeLevel !== null);
        if (recentMoodTrend.length > 0) {
          const avgMood = (
            recentMoodTrend.reduce((s, c) => s + (c.moodLevel || 0), 0) /
            recentMoodTrend.length
          ).toFixed(1);
          trendAnalysis.push(`Recent 14-day avg mood: ${avgMood}/10`);
        }
        if (recentUrgeTrend.length > 0) {
          const avgUrge = (
            recentUrgeTrend.reduce((s, c) => s + (c.urgeLevel || 0), 0) /
            recentUrgeTrend.length
          ).toFixed(1);
          trendAnalysis.push(`Recent 14-day avg urge: ${avgUrge}/10`);
        }

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
7. Keep the tone urgent but supportive — this needs immediate, caring attention.
8. Under 300 words. Speak directly to the client using "you" language.
9. Do not provide medical advice or crisis intervention.`;

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
