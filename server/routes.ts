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
  // =======================================
  // AUTHENTICATION (Restored from Original)
  // =======================================

  app.post("/api/auth/register/therapist", async (req, res) => {
    try {
      const parsed = registerTherapistSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "Invalid input",
        });
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
        if (err) return res.status(500).json({ message: "Login failed" });
        const { password: _, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid input" });
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ message: "Auth failed" });
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
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
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

  // =======================================
  // ADMIN API (Restored from Original)
  // =======================================

  app.get("/api/admin/clients", requireRole("admin"), async (req, res) => {
    try {
      const clients = await storage.getUsersByRole("client");
      const safeClients = await Promise.all(
        clients.map(async (c) => {
          const { password: _, ...safe } = c;
          const therapists = await storage.getTherapistsForClient(c.id);
          return {
            ...safe,
            therapists: therapists.map((t) => ({
              id: t.id,
              name: t.name,
              email: t.email,
            })),
          };
        }),
      );
      res.json({ clients: safeClients });
    } catch (error) {
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  app.get("/api/admin/therapists", requireRole("admin"), async (req, res) => {
    try {
      const therapists = await storage.getUsersByRole("therapist");
      res.json({
        therapists: therapists.map(({ password: _, ...safe }) => safe),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed" });
    }
  });

  app.get(
    "/api/admin/clients/:clientId/progress",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { clientId } = req.params;
        const user = await storage.getUser(clientId);
        if (!user) return res.status(404).json({ message: "Not found" });
        const completedWeeks = await storage.getCompletedWeeks(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 60);
        const reflections = await storage.getAllWeekReflections(clientId);
        const homeworkCompletions =
          await storage.getAllHomeworkCompletions(clientId);
        const feedback = await storage.getClientFeedback(clientId);
        const exerciseAnswers = await storage.getAllExerciseAnswers(clientId);
        const relapseAutopsies = await storage.getRelapseAutopsies(clientId);
        res.json({
          client: { id: user.id, name: user.name, email: user.email },
          completedWeeks,
          checkins,
          reflections,
          homeworkCompletions,
          feedback,
          exerciseAnswers,
          relapseAutopsies,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed" });
      }
    },
  );

  // =======================================
  // THERAPIST API (Now Allowing Admins)
  // =======================================

  app.get(
    "/api/therapist/clients",
    requireRole("therapist", "admin"),
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const role = (req.user as any).role;
        let clients;
        if (role === "admin") {
          clients = await storage.getUsersByRole("client");
        } else {
          clients = await storage.getClientsForTherapist(userId);
        }
        res.json({ clients: clients.map(({ password: _, ...safe }) => safe) });
      } catch (error) {
        res.status(500).json({ message: "Failed" });
      }
    },
  );

  app.get(
    "/api/therapist/clients/:clientId/progress",
    requireRole("therapist", "admin"),
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const role = (req.user as any).role;
        const { clientId } = req.params;

        if (role !== "admin") {
          const clients = await storage.getClientsForTherapist(userId);
          if (!clients.some((c) => c.id === clientId))
            return res.status(403).json({ message: "Unauthorized" });
        }

        const completedWeeks = await storage.getCompletedWeeks(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 30);
        const reflections = await storage.getAllWeekReflections(clientId);
        const homeworkCompletions =
          await storage.getAllHomeworkCompletions(clientId);
        const feedback = await storage.getClientFeedback(clientId);
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
        res.status(500).json({ message: "Failed" });
      }
    },
  );

  // =======================================
  // CONTEXTUAL AI FEEDBACK (NEW LOGIC)
  // =======================================

  app.post(
    "/api/therapist/clients/:clientId/generate-feedback",
    requireRole("therapist", "admin"),
    async (req, res) => {
      try {
        const { clientId } = req.params;
        const { weekNumber, checkinDateKey, relapseAutopsyId } = req.body;

        const clientUser = await storage.getUser(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 14);
        const reflections = await storage.getAllWeekReflections(clientId);
        const autopsies = await storage.getRelapseAutopsies(clientId);

        let contextInfo = `Client: ${clientUser?.name || "Client"}\n`;
        let focusTitle = "Progress Review";

        if (relapseAutopsyId) {
          const autopsy = autopsies.find(
            (a) => a.id === parseInt(relapseAutopsyId),
          );
          if (autopsy) {
            focusTitle = `RELAPSE AUTOPSY`;
            contextInfo += `\nFOCUS: ${autopsy.lapseOrRelapse}. Situation: ${autopsy.situationDescription}. Plan: ${autopsy.preventionPlan}`;
          }
        } else if (checkinDateKey) {
          const checkin = checkins.find((c) => c.dateKey === checkinDateKey);
          focusTitle = `CHECK-IN (${checkinDateKey})`;
          contextInfo += `\nMood: ${checkin?.moodLevel}, Urge: ${checkin?.urgeLevel}. Journal: ${checkin?.journalEntry}`;
        } else if (weekNumber) {
          const weekRefl = reflections.find((r) => r.weekNumber === weekNumber);
          focusTitle = `WEEK ${weekNumber}`;
          contextInfo += `\nInsight: ${weekRefl?.q1}`;
        }

        const prompt = `You are a mentor for SC-IFSI. Draft a 150-word response for this ${focusTitle}: ${contextInfo}. Be direct and supportive.`;
        const { getCoachResponse } = await import("./ai_coach");
        const draft = await getCoachResponse(prompt, weekNumber || 1);
        res.json({ draft });
      } catch (error) {
        res.status(500).json({ message: "AI Error" });
      }
    },
  );

  // =======================================
  // CLIENT PROGRESS (Restored from Original)
  // =======================================

  app.get("/api/progress/reflection/:week", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const refl = await storage.getWeekReflection(
      userId,
      parseInt(req.params.week),
    );
    res.json({ reflection: refl || null });
  });

  app.get("/api/relapse-autopsies", requireRole("client"), async (req, res) => {
    const userId = (req.user as any).id;
    const data = await storage.getRelapseAutopsies(userId);
    res.json({ autopsies: data });
  });

  app.post(
    "/api/relapse-autopsies",
    requireRole("client"),
    async (req, res) => {
      const userId = (req.user as any).id;
      const autopsy = await storage.createRelapseAutopsy(userId, req.body);
      res.status(201).json({ autopsy });
    },
  );

  // DeepSeek Coach Route
  app.post("/api/ai/coach", requireAuth, async (req, res) => {
    const { message, weekNumber } = req.body;
    const { getCoachResponse } = await import("./ai_coach");
    const reply = await getCoachResponse(message, weekNumber || 1);
    res.json({ reply });
  });

  startCheckinReminderScheduler();
  // UNIVERSAL ADMIN DATA MAGNET
  app.get(
    "/api/admin/clients/:clientId/progress",
    requireRole("admin"),
    async (req, res) => {
      try {
        const { clientId } = req.params;

        // We look up the user by ID and ensure we handle the ID type correctly
        const user = await storage.getUser(clientId);
        if (!user) {
          console.error(`Admin Fetch: User ${clientId} not found`);
          return res
            .status(404)
            .json({ message: "Client record not found in database" });
        }

        // Gather all related data for the full profile view
        const [therapists, completedWeeks, checkins, reflections, autopsies] =
          await Promise.all([
            storage.getTherapistsForClient(clientId),
            storage.getCompletedWeeks(clientId),
            storage.getUserCheckinHistory(clientId, 90), // Get 90 days for better overview
            storage.getAllWeekReflections(clientId),
            storage.getRelapseAutopsies(clientId),
          ]);

        // Send a complete package back to the frontend
        res.json({
          client: {
            ...user,
            therapists: therapists
              ? therapists.map((t) => ({
                  id: t.id,
                  name: t.name,
                  email: t.email,
                }))
              : [],
          },
          completedWeeks: completedWeeks || [],
          checkins: checkins || [],
          reflections: reflections || [],
          relapseAutopsies: autopsies || [],
        });
      } catch (error) {
        console.error("CRITICAL ADMIN PROGRESS ERROR:", error);
        res
          .status(500)
          .json({ message: "Server error while fetching client records" });
      }
    },
  );
  return httpServer;
}
