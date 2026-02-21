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
                body: "Take a moment for your daily check-in.",
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
      console.error("Scheduler error:", error);
    }
  }, 60000);
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Authentication required" });
}

function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user)
      return res.status(401).json({ message: "Authentication required" });
    if (!roles.includes(req.user.role as UserRole))
      return res.status(403).json({ message: "Insufficient permissions" });
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Auth Logic
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

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const { password: _, ...safeUser } = req.user;
      return res.json({ user: safeUser });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // =======================================
  // ADMIN API - RESTORED MENTOR VISIBILITY
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

  // RESTORED: This is the route that shows Mentors/Therapists in the Admin panel
  app.get("/api/admin/therapists", requireRole("admin"), async (req, res) => {
    try {
      const therapists = await storage.getUsersByRole("therapist");
      const safeTherapists = therapists.map((t) => {
        const { password: _, ...safe } = t;
        return safe;
      });
      res.json({ therapists: safeTherapists });
    } catch (error) {
      res.status(500).json({ message: "Failed to get mentors" });
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
  // THERAPIST API
  // =======================================
  app.get(
    "/api/therapist/clients",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const therapistId = (req.user as any).id;
        const clients = await storage.getClientsForTherapist(therapistId);
        res.json({ clients: clients.map(({ password: _, ...safe }) => safe) });
      } catch (error) {
        res.status(500).json({ message: "Failed" });
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
        res.status(500).json({ message: "Failed" });
      }
    },
  );

  // CONTEXTUAL AI FEEDBACK
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
          return res.status(403).json({ message: "Unauthorized" });
        const clientUser = await storage.getUser(clientId);
        const autopsies = await storage.getRelapseAutopsies(clientId);
        let context = `Client: ${clientUser?.name}\n`;
        let focus = "General";
        if (relapseAutopsyId) {
          const autopsy = autopsies.find(
            (a) => a.id === parseInt(relapseAutopsyId),
          );
          if (autopsy) {
            focus = "Relapse Autopsy";
            context += `Details: ${autopsy.situationDescription}. Plan: ${autopsy.preventionPlan}`;
          }
        }
        const prompt = `You are a mentor. Draft 150 words of feedback for this ${focus}: ${context}`;
        const { getCoachResponse } = await import("./ai_coach");
        const draft = await getCoachResponse(prompt, weekNumber || 1);
        res.json({ draft });
      } catch (error) {
        res.status(500).json({ message: "AI Error" });
      }
    },
  );

  startCheckinReminderScheduler();
  return httpServer;
}
