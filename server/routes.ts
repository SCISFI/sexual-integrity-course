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

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@integrityprotocol.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
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
        if (err)
          return res
            .status(500)
            .json({ message: "Login failed after registration" });
        const { password: _, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/register/therapist", async (req, res) => {
    try {
      const parsed = registerTherapistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
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
      if (existingUser)
        return res.status(400).json({ message: "Email already registered" });
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
      req.login(user, (err) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Login failed after registration" });
        const { password: _, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
      });
    } catch (error) {
      console.error("Therapist registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  const DEFAULT_THERAPIST_EMAIL = "ken-therapist@scifsi.com";

  app.post("/api/auth/register/client", async (req, res) => {
    try {
      const parsed = registerClientSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({
            message: parsed.error.errors[0]?.message || "Invalid input",
          });
      const {
        email,
        password,
        name,
        therapistId: selectedTherapistId,
      } = parsed.data;
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser)
        return res.status(400).json({ message: "Email already registered" });
      let therapistId = selectedTherapistId;
      if (!therapistId) {
        const defaultTherapist = await storage.getUserByEmail(
          DEFAULT_THERAPIST_EMAIL,
        );
        if (defaultTherapist && defaultTherapist.role === "therapist")
          therapistId = defaultTherapist.id;
      }
      let therapist = null;
      if (therapistId) therapist = await storage.getUser(therapistId);
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
      await storage.assignTherapistToClient(therapist.id, user.id);
      req.login(user, (err) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Login failed after registration" });
        const { password: _, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
      });
    } catch (error) {
      console.error("Client registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get("/api/therapists/available", async (req, res) => {
    try {
      const therapists = await storage.getUsersByRole("therapist");
      const admins = await storage.getUsersByRole("admin");
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
      res.status(500).json({ message: "Failed to fetch therapists" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: parsed.error.errors[0]?.message || "Invalid input" });
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err)
        return res.status(500).json({ message: "Authentication failed" });
      if (!user)
        return res
          .status(401)
          .json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        const { password: _, ...safeUser } = user;
        return res.json({ user: safeUser });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      req.session.destroy((err) => {
        if (err)
          return res.status(500).json({ message: "Session cleanup failed" });
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

  // PROGRESS ENDPOINTS
  app.get("/api/progress/reflection/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      const userId = (req.user as any).id;
      const reflection = await storage.getWeekReflection(userId, weekNumber);
      res.json({ reflection: reflection || null });
    } catch (error) {
      res.status(500).json({ message: "Failed to get reflection" });
    }
  });

  app.put("/api/progress/reflection/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      const userId = (req.user as any).id;
      const { q1, q2, q3, q4 } = req.body;
      const reflection = await storage.upsertWeekReflection(
        userId,
        weekNumber,
        { q1, q2, q3, q4 },
      );
      res.json({ reflection });
    } catch (error) {
      res.status(500).json({ message: "Failed to save reflection" });
    }
  });

  app.get("/api/progress/exercises/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      const userId = (req.user as any).id;
      const exerciseData = await storage.getExerciseAnswers(userId, weekNumber);
      res.json({
        answers: exerciseData ? JSON.parse(exerciseData.answers || "{}") : {},
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get exercise answers" });
    }
  });

  app.put("/api/progress/exercises/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      const userId = (req.user as any).id;
      const { answers } = req.body;
      const result = await storage.upsertExerciseAnswers(
        userId,
        weekNumber,
        JSON.stringify(answers || {}),
      );
      res.json({ answers: JSON.parse(result.answers || "{}") });
    } catch (error) {
      res.status(500).json({ message: "Failed to save exercise answers" });
    }
  });

  app.get("/api/progress/homework/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      const userId = (req.user as any).id;
      const homework = await storage.getHomeworkCompletion(userId, weekNumber);
      const completedItems = homework
        ? JSON.parse(homework.completedItems || "[]")
        : [];
      res.json({ completedItems });
    } catch (error) {
      res.status(500).json({ message: "Failed to get homework completion" });
    }
  });

  app.put("/api/progress/homework/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      const userId = (req.user as any).id;
      const { completedItems } = req.body;
      const homework = await storage.upsertHomeworkCompletion(
        userId,
        weekNumber,
        completedItems,
      );
      res.json({ homework });
    } catch (error) {
      res.status(500).json({ message: "Failed to save homework completion" });
    }
  });

  app.put("/api/progress/checkin/:dateKey", requireAuth, async (req, res) => {
    try {
      const { dateKey } = req.params;
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
      res.status(500).json({ message: "Failed to save check-in" });
    }
  });

  app.get("/api/progress/checkin-history", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 30;
      const checkins = await storage.getUserCheckinHistory(userId, limit);
      res.json({ checkins });
    } catch (error) {
      res.status(500).json({ message: "Failed to get check-in history" });
    }
  });

  app.get("/api/progress/completions", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const completedWeeks = await storage.getCompletedWeeks(userId);
      res.json({ completedWeeks });
    } catch (error) {
      res.status(500).json({ message: "Failed to get completions" });
    }
  });

  app.post("/api/progress/completions/:week", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.week, 10);
      const userId = (req.user as any).id;
      const completion = await storage.markWeekComplete(userId, weekNumber);
      res.json({ completion });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark week complete" });
    }
  });

  app.get("/api/my-feedback", requireRole("client"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const feedback = await storage.getClientFeedback(userId);
      res.json({ feedback });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // RELAPSE AUTOPSY CLIENT ENDPOINTS
  app.get("/api/relapse-autopsies", requireRole("client"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const autopsies = await storage.getRelapseAutopsies(userId);
      res.json({ autopsies });
    } catch (error) {
      res.status(500).json({ message: "Failed to get relapse autopsies" });
    }
  });

  app.post(
    "/api/relapse-autopsies",
    requireRole("client"),
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const autopsy = await storage.createRelapseAutopsy(userId, req.body);
        res.status(201).json({ autopsy });
      } catch (error) {
        res.status(500).json({ message: "Failed to create relapse autopsy" });
      }
    },
  );

  app.post(
    "/api/relapse-autopsies/:id/complete",
    requireRole("client"),
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const { id } = req.params;
        const autopsy = await storage.completeRelapseAutopsy(id, userId);
        res.json({ autopsy });
      } catch (error) {
        res.status(500).json({ message: "Failed to complete autopsy" });
      }
    },
  );

  // THERAPIST ENDPOINTS
  app.get(
    "/api/therapist/clients",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const clients = await storage.getClientsForTherapist(therapistId);
        const enriched = await Promise.all(
          clients.map(async (c) => {
            const completedWeeks = await storage.getCompletedWeeks(c.id);
            return { ...c, completedWeeks, currentWeek: 1 };
          }),
        );
        res.json({ clients: enriched });
      } catch (error) {
        res.status(500).json({ message: "Failed to get clients" });
      }
    },
  );

  app.get(
    "/api/therapist/clients/:clientId/progress",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const clients = await storage.getClientsForTherapist(therapistId);
        if (!clients.some((c) => c.id === clientId))
          return res.status(403).json({ message: "Unauthorized" });

        const completedWeeks = await storage.getCompletedWeeks(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 30);
        const reflections = await storage.getAllWeekReflections(clientId);
        const homeworkCompletions =
          await storage.getAllHomeworkCompletions(clientId);
        const feedback = await storage.getFeedbackForTherapist(
          therapistId,
          clientId,
        );
        const exerciseAnswers = await storage.getAllExerciseAnswers(clientId);
        const relapseAutopsies = await storage.getRelapseAutopsies(clientId);

        res.json({
          completedWeeks,
          checkins,
          reflections,
          homeworkCompletions,
          feedback,
          exerciseAnswers,
          relapseAutopsies,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to get client progress" });
      }
    },
  );

  // START: NEW CONTEXT-SPECIFIC FEEDBACK ROUTE
  app.post(
    "/api/therapist/clients/:clientId/generate-feedback",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const { weekNumber, checkinDateKey, relapseAutopsyId } = req.body;

        const clients = await storage.getClientsForTherapist(therapistId);
        if (!clients.some((c) => c.id === clientId))
          return res.status(403).json({ message: "Not authorized" });

        const clientUser = await storage.getUser(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 14);
        const reflections = await storage.getAllWeekReflections(clientId);
        const autopsies = await storage.getRelapseAutopsies(clientId);

        let contextInfo = `Client Name: ${clientUser?.name || "Client"}\n`;
        let focusTitle = "General Progress";

        if (relapseAutopsyId) {
          const autopsy = autopsies.find(
            (a) => a.id === parseInt(relapseAutopsyId),
          );
          if (autopsy) {
            focusTitle = `RELAPSE AUTOPSY (${autopsy.lapseOrRelapse})`;
            contextInfo += `\nFOCUS: RELAPSE AUTOPSY DETAILS
          Type: ${autopsy.lapseOrRelapse}
          Description: ${autopsy.situationDescription}
          Triggers Identified: ${autopsy.triggers}
          Prevention Plan: ${autopsy.preventionPlan}`;
          }
        } else if (checkinDateKey) {
          const checkin = checkins.find((c) => c.dateKey === checkinDateKey);
          if (checkin) {
            focusTitle = `DAILY CHECK-IN (${checkinDateKey})`;
            contextInfo += `\nFOCUS: DAILY CHECK-IN DETAILS
          Mood: ${checkin.moodLevel}/10, Urge: ${checkin.urgeLevel}/10
          Journal Entry: ${checkin.journalEntry || "No entry provided"}`;
          }
        } else if (weekNumber) {
          const weekRefl = reflections.find((r) => r.weekNumber === weekNumber);
          focusTitle = `WEEK ${weekNumber} SUMMARY`;
          contextInfo += `\nFOCUS: WEEKLY REFLECTION
        Key Insight: ${weekRefl?.q1 || "Not submitted"}`;
        }

        const prompt = `You are a supportive mentor for the SC-IFSI Integrity Protocol. 
      Draft a professional, empathetic response for the following ${focusTitle}:

      ${contextInfo}

      Instructions: Speak directly to the client. If this is an Autopsy, focus on the Prevention Plan. Keep under 150 words.`;

        const { getCoachResponse } = await import("./ai_coach");
        const draft = await getCoachResponse(prompt, weekNumber || 1);
        res.json({ draft });
      } catch (error) {
        console.error("AI Feedback Error:", error);
        res
          .status(500)
          .json({ message: "Failed to generate specific feedback." });
      }
    },
  );
  // END: NEW CONTEXT-SPECIFIC FEEDBACK ROUTE

  app.post(
    "/api/therapist/clients/:clientId/feedback",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const { clientId } = req.params;
        const { feedbackType, content, weekNumber, checkinDateKey } = req.body;
        const feedback = await storage.addTherapistFeedback(
          therapistId,
          clientId,
          feedbackType,
          content,
          weekNumber,
          checkinDateKey,
        );
        res.status(201).json({ feedback });
      } catch (error) {
        res.status(500).json({ message: "Failed to add feedback" });
      }
    },
  );

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
        res.status(500).json({ message: "Failed to get pending reviews" });
      }
    },
  );

  // AI ENCOURAGEMENT
  app.get("/api/ai/encouragement", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const weekNumber = parseInt(req.query.week as string) || 1;
      const today = new Date().toISOString().split("T")[0];
      const checkin = await storage.getDailyCheckin(user.id, today);
      const { getAIEncouragement } = await import("./aiService");
      const encouragement = await getAIEncouragement(weekNumber, {
        mood: checkin?.moodLevel ?? undefined,
        urgeLevel: checkin?.urgeLevel ?? undefined,
      });
      res.json({ encouragement, weekNumber });
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI encouragement" });
    }
  });

  app.get("/api/progress/unlocked-weeks", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== "client")
        return res.json({
          unlockedWeeks: [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ],
        });
      res.json({ unlockedWeeks: [1, 2, 3] }); // Placeholder logic
    } catch (error) {
      res.status(500).json({ message: "Failed to get unlocked weeks" });
    }
  });

  // STRIPE / PAYMENT PLACEHOLDERS
  app.get("/api/payments/config", async (req, res) => {
    res.json({ publishableKey: "pk_test_placeholder" });
  });

  app.get(
    "/api/payments/week/:weekNumber/status",
    requireRole("client"),
    async (req, res) => {
      const weekNumber = parseInt(req.params.weekNumber);
      if (weekNumber === 1)
        return res.json({ needsPayment: false, reason: "week_1_free" });
      res.json({ needsPayment: true });
    },
  );

  app.post("/api/ai/coach", requireAuth, async (req, res) => {
    const { message, weekNumber } = req.body;
    const { getCoachResponse } = await import("./ai_coach");
    const reply = await getCoachResponse(message, weekNumber || 1);
    res.json({ reply });
  });

  startCheckinReminderScheduler();
  return httpServer;
}
