import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { passport, hashPassword } from "./auth";
import { registerSchema, loginSchema, registerTherapistSchema, registerClientSchema, type UserRole } from "@shared/schema";
import { z } from "zod";
import webpush from "web-push";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@integrityprotocol.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

function startCheckinReminderScheduler() {
  const sentToday = new Set<string>();
  let lastDateKey = "";
  
  setInterval(async () => {
    try {
      const now = new Date();
      const currentHour = now.getUTCHours().toString().padStart(2, '0');
      const currentMinute = now.getUTCMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      const dateKey = now.toISOString().split('T')[0];
      
      if (dateKey !== lastDateKey) {
        sentToday.clear();
        lastDateKey = dateKey;
      }
      
      const subscriptions = await storage.getAllPushSubscriptionsForCheckinReminders();
      
      for (const sub of subscriptions) {
        const reminderTime = sub.checkinReminderTime || "20:00";
        const key = `${sub.userId}-${sub.endpoint}`;
        
        if (sentToday.has(key)) continue;
        
        const [reminderHour] = reminderTime.split(':');
        const [currentHourParsed] = currentTime.split(':');
        
        if (reminderHour === currentHourParsed) {
          sentToday.add(key);
          
          const existingCheckin = await storage.getDailyCheckin(sub.userId, dateKey);
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
              })
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
  app: Express
): Promise<Server> {
  
  // Legacy register endpoint (defaults to client)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: parsed.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { email, password, name } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const today = new Date().toISOString().split('T')[0];
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: "client",
        startDate: today,
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        const { password: _, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Register as therapist
  app.post("/api/auth/register/therapist", async (req, res) => {
    try {
      const parsed = registerTherapistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: parsed.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { email, password, name, licenseState, licenseNumber, licenseAttestation, termsAccepted } = parsed.data;

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
      
      console.log(`Therapist registered: ${email} - terms accepted: ${termsAccepted} at ${new Date().toISOString()}`);

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
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
          message: parsed.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { email, password, name, therapistId: selectedTherapistId } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Use selected therapist or default to primary therapist
      let therapistId = selectedTherapistId;
      if (!therapistId) {
        const defaultTherapist = await storage.getUserByEmail(DEFAULT_THERAPIST_EMAIL);
        if (defaultTherapist && defaultTherapist.role === "therapist") {
          therapistId = defaultTherapist.id;
        }
      }

      // Verify the therapist exists and is a therapist or admin
      let therapist = null;
      if (therapistId) {
        therapist = await storage.getUser(therapistId);
      }
      if (!therapist || (therapist.role !== "therapist" && therapist.role !== "admin")) {
        return res.status(400).json({ message: "No available therapist found" });
      }

      const hashedPassword = await hashPassword(password);
      const today = new Date().toISOString().split('T')[0];
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
          return res.status(500).json({ message: "Login failed after registration" });
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
        .filter(t => t.subscriptionStatus === "active" || t.role === "admin" || t.allFeesWaived)
        .map(t => ({
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
        message: parsed.error.errors[0]?.message || "Invalid input" 
      });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
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
      const reflection = await storage.upsertWeekReflection(userId, weekNumber, { q1, q2, q3, q4 });
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
      res.json({ answers: exerciseData ? JSON.parse(exerciseData.answers || "{}") : {} });
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
      const result = await storage.upsertExerciseAnswers(userId, weekNumber, JSON.stringify(answers || {}));
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
      const commitment = await storage.upsertCommitment(userId, weekNumber, statement || "");
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
      const completedItems = homework ? JSON.parse(homework.completedItems || "[]") : [];
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
        return res.status(400).json({ message: "completedItems must be an array" });
      }
      // Validate all items are non-negative integers
      const validItems = completedItems.every(item => 
        typeof item === 'number' && Number.isInteger(item) && item >= 0
      );
      if (!validItems) {
        return res.status(400).json({ message: "completedItems must be an array of non-negative integers" });
      }
      const homework = await storage.upsertHomeworkCompletion(userId, weekNumber, completedItems);
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
        return res.status(400).json({ message: "Invalid date format (use YYYY-MM-DD)" });
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
        return res.status(400).json({ message: "Invalid date format (use YYYY-MM-DD)" });
      }
      const userId = (req.user as any).id;
      const { morningChecks, haltChecks, urgeLevel, moodLevel, eveningChecks, journalEntry } = req.body;
      const checkin = await storage.upsertDailyCheckin(userId, dateKey, {
        morningChecks: morningChecks !== undefined ? JSON.stringify(morningChecks) : undefined,
        haltChecks: haltChecks !== undefined ? JSON.stringify(haltChecks) : undefined,
        urgeLevel: urgeLevel !== undefined ? parseInt(urgeLevel, 10) : undefined,
        moodLevel: moodLevel !== undefined ? parseInt(moodLevel, 10) : undefined,
        eveningChecks: eveningChecks !== undefined ? JSON.stringify(eveningChecks) : undefined,
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
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
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
          const { sendWeekCompletionNotification } = await import("./emailService");
          const dashboardLink = `${req.protocol}://${req.get('host')}/therapist/clients/${userId}`;
          const loginUrl = `${req.protocol}://${req.get('host')}/login`;
          const clientName = user.name || user.email || 'Client';
          
          for (const therapist of therapists) {
            if (therapist.email) {
              await sendWeekCompletionNotification(
                therapist.email,
                therapist.name || undefined,
                clientName,
                weekNumber,
                dashboardLink,
                loginUrl
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
      const sortedDates = checkins.map(c => c.dateKey).sort().reverse();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 1;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Check if there's a checkin today or yesterday to start streak
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
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
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      // Calculate averages
      const moodValues = checkins.filter(c => c.moodLevel !== null).map(c => c.moodLevel!);
      const urgeValues = checkins.filter(c => c.urgeLevel !== null).map(c => c.urgeLevel!);
      const averageMood = moodValues.length > 0 ? Math.round(moodValues.reduce((a, b) => a + b, 0) / moodValues.length * 10) / 10 : 0;
      const averageUrge = urgeValues.length > 0 ? Math.round(urgeValues.reduce((a, b) => a + b, 0) / urgeValues.length * 10) / 10 : 0;

      // Daily completion rate - percentage of days with check-ins
      // Uses a 14-day window, but caps at days since first check-in for new users
      const nowDate = new Date();
      const oldestCheckinDate = checkins[0]?.dateKey ? new Date(checkins[0].dateKey) : nowDate;
      const daysSinceStart = Math.max(1, Math.ceil((nowDate.getTime() - oldestCheckinDate.getTime()) / 86400000) + 1);
      const windowSize = Math.min(14, daysSinceStart);
      
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - windowSize + 1);
      const recentDates = new Set(
        checkins
          .filter(c => new Date(c.dateKey) >= windowStart)
          .map(c => c.dateKey)
      );
      const dailyCompletionRate = Math.round((recentDates.size / windowSize) * 100);

      // Get last 14 days for trend charts
      const recentCheckins = checkins.slice(-14).map(c => ({
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
  // Relapse Autopsy endpoints (client)
  // =======================================

  app.get("/api/relapse-autopsies", requireRole("client"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const autopsies = await storage.getRelapseAutopsies(userId);
      res.json({ autopsies });
    } catch (error) {
      console.error("Get relapse autopsies error:", error);
      res.status(500).json({ message: "Failed to get relapse autopsies" });
    }
  });

  app.post("/api/relapse-autopsies", requireRole("client"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const autopsy = await storage.createRelapseAutopsy(userId, req.body);
      res.status(201).json({ autopsy });
    } catch (error) {
      console.error("Create relapse autopsy error:", error);
      res.status(500).json({ message: "Failed to create relapse autopsy" });
    }
  });

  app.put("/api/relapse-autopsies/:id", requireRole("client"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const autopsy = await storage.updateRelapseAutopsy(id, userId, req.body);
      if (!autopsy) {
        return res.status(404).json({ message: "Relapse autopsy not found" });
      }
      res.json({ autopsy });
    } catch (error) {
      console.error("Update relapse autopsy error:", error);
      res.status(500).json({ message: "Failed to update relapse autopsy" });
    }
  });

  app.post("/api/relapse-autopsies/:id/complete", requireRole("client"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = req.user as any;
      const { id } = req.params;
      const autopsy = await storage.completeRelapseAutopsy(id, userId);
      if (!autopsy) {
        return res.status(404).json({ message: "Relapse autopsy not found" });
      }

      res.json({ autopsy });

      try {
        const therapists = await storage.getTherapistsForClient(userId);
        if (therapists.length > 0) {
          const { sendRelapseAutopsyNotification } = await import("./emailService");
          const clientName = user.name || user.email || 'Client';
          const loginUrl = `${req.protocol}://${req.get('host')}/login`;
          for (const therapist of therapists) {
            if (therapist.email) {
              const clientLink = `${req.protocol}://${req.get('host')}/therapist/clients/${userId}?tab=autopsies`;
              await sendRelapseAutopsyNotification(
                therapist.email,
                therapist.name || undefined,
                clientName,
                autopsy.lapseOrRelapse === "relapse" ? "Relapse" : "Lapse",
                clientLink,
                loginUrl
              );
            }
          }
        }
      } catch (notifyError) {
        console.error("Failed to send relapse autopsy notification:", notifyError);
      }
    } catch (error) {
      console.error("Complete relapse autopsy error:", error);
      res.status(500).json({ message: "Failed to complete relapse autopsy" });
    }
  });

  // =======================================
  // Admin API endpoints
  // =======================================

  // Get all therapists
  app.get("/api/admin/therapists", requireRole("admin"), async (req, res) => {
    try {
      const therapists = await storage.getUsersByRole("therapist");
      const safeTherapists = therapists.map(t => {
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
      const safeClients = await Promise.all(clients.map(async c => {
        const { password: _, ...safe } = c;
        const therapists = await storage.getTherapistsForClient(c.id);
        const waivedWeeks = await storage.getWaivedWeeks(c.id);
        return { ...safe, therapists: therapists.map(t => ({ id: t.id, name: t.name, email: t.email })), waivedWeeks };
      }));
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
        return res.status(400).json({ message: "Email, password, and name are required" });
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
  app.patch("/api/admin/therapists/:therapistId", requireRole("admin"), async (req, res) => {
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
      
      if (allFeesWaived !== undefined && typeof allFeesWaived !== 'boolean') {
        return res.status(400).json({ message: "allFeesWaived must be a boolean" });
      }
      
      const updateData: any = {};
      if (allFeesWaived !== undefined) updateData.allFeesWaived = allFeesWaived;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const updatedUser = await storage.updateUser(therapistId, updateData);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update therapist" });
      }
      
      const { password: _, ...safeUser } = updatedUser;
      res.json({ therapist: safeUser });
    } catch (error) {
      console.error("Update therapist error:", error);
      res.status(500).json({ message: "Failed to update therapist" });
    }
  });

  // Delete therapist (admin only) - requires reassigning clients first
  app.delete("/api/admin/therapists/:therapistId", requireRole("admin"), async (req, res) => {
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
            message: "Therapist has assigned clients. Provide reassignToTherapistId to reassign them.",
            clientCount: clients.length
          });
        }
        
        // Validate reassignment target is not the same as the therapist being deleted
        if (reassignToTherapistId === therapistId) {
          return res.status(400).json({ message: "Cannot reassign clients to the therapist being deleted" });
        }
        
        // Verify reassignment target exists and is a therapist
        const targetTherapist = await storage.getUser(reassignToTherapistId);
        if (!targetTherapist || (targetTherapist.role !== "therapist" && targetTherapist.role !== "admin")) {
          return res.status(400).json({ message: "Invalid reassignment target" });
        }
        
        // Reassign all clients to new therapist
        for (const client of clients) {
          await storage.removeTherapistFromClient(therapistId, client.id);
          await storage.assignTherapistToClient(reassignToTherapistId, client.id);
        }
        console.log(`Reassigned ${clients.length} clients from ${therapist.email} to ${targetTherapist.email}`);
      }
      
      // Delete the therapist account
      await storage.deleteUser(therapistId);
      console.log(`Admin deleted therapist: ${therapist.email} (${therapistId})`);
      
      res.json({ 
        message: "Therapist deleted successfully",
        reassignedClients: clients.length
      });
    } catch (error) {
      console.error("Delete therapist error:", error);
      res.status(500).json({ message: "Failed to delete therapist" });
    }
  });

  // Create client (admin can create client accounts)
  app.post("/api/admin/clients", requireRole("admin"), async (req, res) => {
    try {
      const { email, password, name, startDate, therapistId } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, password, and name are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const clientStartDate = startDate || new Date().toISOString().split('T')[0];
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
        if (!therapist || (therapist.role !== 'therapist' && therapist.role !== 'admin')) {
          console.error(`Invalid therapist ID provided for client creation: ${therapistId}`);
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
  app.patch("/api/admin/clients/:clientId", requireRole("admin"), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { startDate, allFeesWaived, subscriptionStatus, name, therapistId } = req.body;
      
      // Basic validation
      if (startDate !== undefined && typeof startDate !== 'string') {
        return res.status(400).json({ message: "Invalid startDate format" });
      }
      if (allFeesWaived !== undefined && typeof allFeesWaived !== 'boolean') {
        return res.status(400).json({ message: "allFeesWaived must be a boolean" });
      }
      if (therapistId !== undefined && typeof therapistId !== 'string') {
        return res.status(400).json({ message: "Invalid therapistId format" });
      }

      // Validate therapist if provided
      if (therapistId !== undefined && therapistId !== '') {
        const therapist = await storage.getUser(therapistId);
        if (!therapist || (therapist.role !== 'therapist' && therapist.role !== 'admin')) {
          return res.status(400).json({ message: "Invalid therapist selected" });
        }
      }
      
      const updateData: any = {};
      // Convert empty strings to null for date fields
      if (startDate !== undefined) updateData.startDate = startDate === '' ? null : startDate;
      if (allFeesWaived !== undefined) updateData.allFeesWaived = allFeesWaived;
      if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
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
        errorStack: error?.stack
      });
      res.status(500).json({ message: "Failed to update client", error: error?.message });
    }
  });

  // Assign therapist to client
  app.post("/api/admin/assignments", requireRole("admin"), async (req, res) => {
    try {
      const { therapistId, clientId } = req.body;
      if (!therapistId || !clientId) {
        return res.status(400).json({ message: "Both therapistId and clientId are required" });
      }

      const assignment = await storage.assignTherapistToClient(therapistId, clientId);
      res.status(201).json({ assignment });
    } catch (error) {
      console.error("Assign therapist error:", error);
      res.status(500).json({ message: "Failed to assign therapist" });
    }
  });

  // Remove therapist from client
  app.delete("/api/admin/assignments", requireRole("admin"), async (req, res) => {
    try {
      const { therapistId, clientId } = req.body;
      if (!therapistId || !clientId) {
        return res.status(400).json({ message: "Both therapistId and clientId are required" });
      }

      await storage.removeTherapistFromClient(therapistId, clientId);
      res.json({ message: "Assignment removed" });
    } catch (error) {
      console.error("Remove therapist error:", error);
      res.status(500).json({ message: "Failed to remove assignment" });
    }
  });

  // Therapist departure - reassign all clients to new therapist (or admin)
  app.post("/api/admin/therapist-departure", requireRole("admin"), async (req, res) => {
    try {
      const { departingTherapistId, newTherapistId } = req.body;
      if (!departingTherapistId || typeof departingTherapistId !== 'string') {
        return res.status(400).json({ message: "Valid departingTherapistId is required" });
      }
      if (!newTherapistId || typeof newTherapistId !== 'string') {
        return res.status(400).json({ message: "Valid newTherapistId is required" });
      }

      // Verify departing therapist exists and is a therapist
      const departingTherapist = await storage.getUser(departingTherapistId);
      if (!departingTherapist || departingTherapist.role !== "therapist") {
        return res.status(400).json({ message: "Departing user is not a valid therapist" });
      }

      // Verify new therapist exists and is a therapist or admin
      const newTherapist = await storage.getUser(newTherapistId);
      if (!newTherapist || (newTherapist.role !== "therapist" && newTherapist.role !== "admin")) {
        return res.status(400).json({ message: "New therapist must be a therapist or admin" });
      }

      // Get all clients for departing therapist
      const clients = await storage.getClientsForTherapist(departingTherapistId);
      
      // Reassign each client to the new therapist
      for (const client of clients) {
        await storage.removeTherapistFromClient(departingTherapistId, client.id);
        await storage.assignTherapistToClient(newTherapistId, client.id);
      }

      res.json({ 
        message: `Successfully reassigned ${clients.length} clients to ${newTherapist.name || newTherapist.email}`,
        reassignedCount: clients.length 
      });
    } catch (error) {
      console.error("Therapist departure error:", error);
      res.status(500).json({ message: "Failed to reassign clients" });
    }
  });

  // Get client progress and work for admin
  app.get("/api/admin/clients/:clientId/progress", requireRole("admin"), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const user = await storage.getUser(clientId);
      if (!user || user.role !== "client") {
        return res.status(404).json({ message: "Client not found" });
      }

      const completedWeeks = await storage.getCompletedWeeks(clientId);
      const checkins = await storage.getUserCheckinHistory(clientId, 60);
      const reflections = await storage.getAllWeekReflections(clientId);
      const homeworkCompletions = await storage.getAllHomeworkCompletions(clientId);
      const feedback = await storage.getClientFeedback(clientId);
      const exerciseAnswersData = await storage.getAllExerciseAnswers(clientId);
      
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
        therapists 
      });
    } catch (error) {
      console.error("Get admin client progress error:", error);
      res.status(500).json({ message: "Failed to get client progress" });
    }
  });

  // Reset a completed week for a client (admin only)
  app.delete("/api/admin/clients/:clientId/completions/:weekNumber", requireRole("admin"), async (req, res) => {
    try {
      const { clientId, weekNumber } = req.params;
      const weekNum = parseInt(weekNumber, 10);
      console.log(`Admin reset week request: clientId=${clientId}, week=${weekNum}`);
      
      if (isNaN(weekNum) || weekNum < 1 || weekNum > 16) {
        return res.status(400).json({ message: "Invalid week number" });
      }

      const user = await storage.getUser(clientId);
      if (!user || user.role !== "client") {
        console.log(`Reset week failed: client not found or wrong role - ${user?.role}`);
        return res.status(404).json({ message: "Client not found" });
      }

      console.log(`Resetting week ${weekNum} for client ${user.email} (${clientId})`);
      await storage.resetWeekCompletion(clientId, weekNum);
      console.log(`Week ${weekNum} reset successfully for client ${user.email}`);
      res.json({ message: `Week ${weekNum} has been reset for the client` });
    } catch (error) {
      console.error("Reset week completion error:", error);
      res.status(500).json({ message: "Failed to reset week completion" });
    }
  });

  // Add admin feedback for a client
  app.post("/api/admin/clients/:clientId/feedback", requireRole("admin"), async (req, res) => {
    try {
      const adminId = (req.user as any).id;
      const { clientId } = req.params;
      const { feedbackType, content, weekNumber } = req.body;

      if (!content || !feedbackType) {
        return res.status(400).json({ message: "Feedback type and content are required" });
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
        weekNumber
      );
      
      res.status(201).json({ feedback });

      try {
        if (user.email) {
          const { sendFeedbackNotification } = await import("./emailService");
          const adminData = req.user as any;
          const loginUrl = `${req.protocol}://${req.get('host')}/login`;
          await sendFeedbackNotification(
            user.email,
            user.name || undefined,
            adminData.name || 'Your mentor',
            weekNumber,
            loginUrl
          );
        }
      } catch (notifyError) {
        console.error("Failed to send feedback notification:", notifyError);
      }
    } catch (error) {
      console.error("Add admin feedback error:", error);
      res.status(500).json({ message: "Failed to add feedback" });
    }
  });

  // Waive week fee for client
  app.post("/api/admin/waivers", requireRole("admin"), async (req, res) => {
    try {
      const { clientId, weekNumber } = req.body;
      if (!clientId || weekNumber === undefined) {
        return res.status(400).json({ message: "clientId and weekNumber are required" });
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
        return res.status(400).json({ message: "clientId and weekNumber are required" });
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
  app.delete("/api/admin/clients/:clientId", requireRole("admin"), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const user = await storage.getUser(clientId);
      if (!user) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (user.role !== "client") {
        return res.status(400).json({ message: "Can only delete client accounts" });
      }
      
      await storage.deleteUser(clientId);
      console.log(`Admin deleted client: ${user.email} (${clientId})`);
      
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Delete client error:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // =======================================
  // Therapist API endpoints
  // =======================================

  // Get assigned clients for therapist
  app.get("/api/therapist/clients", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const clients = await storage.getClientsForTherapist(therapistId);
      
      const enrichedClients = await Promise.all(clients.map(async (c) => {
        const { password: _, ...safe } = c;
        const completedWeeks = await storage.getCompletedWeeks(c.id);
        
        // Calculate current week based on start date
        let currentWeek = 1;
        if (c.startDate) {
          const daysSinceStart = Math.floor((Date.now() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24));
          currentWeek = Math.min(16, Math.max(1, Math.floor(daysSinceStart / 7) + 1));
        }
        
        return { 
          ...safe, 
          completedWeeks, 
          currentWeek 
        };
      }));
      
      res.json({ clients: enrichedClients });
    } catch (error) {
      console.error("Get therapist clients error:", error);
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  // Get client progress (for therapist viewing their assigned clients)
  app.get("/api/therapist/clients/:clientId/progress", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const { clientId } = req.params;

      // Verify therapist is assigned to this client
      const clients = await storage.getClientsForTherapist(therapistId);
      const isAssigned = clients.some(c => c.id === clientId);
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized to view this client" });
      }

      const completedWeeks = await storage.getCompletedWeeks(clientId);
      const checkins = await storage.getUserCheckinHistory(clientId, 30);
      const reflections = await storage.getAllWeekReflections(clientId);
      const homeworkCompletions = await storage.getAllHomeworkCompletions(clientId);
      const feedback = await storage.getFeedbackForTherapist(therapistId, clientId);
      const exerciseAnswersData = await storage.getAllExerciseAnswers(clientId);
      const relapseAutopsiesData = await storage.getRelapseAutopsies(clientId);
      
      res.json({ completedWeeks, checkins, reflections, homeworkCompletions, feedback, exerciseAnswers: exerciseAnswersData, relapseAutopsies: relapseAutopsiesData });
    } catch (error) {
      console.error("Get client progress error:", error);
      res.status(500).json({ message: "Failed to get client progress" });
    }
  });

  // Add therapist feedback for a client
  app.post("/api/therapist/clients/:clientId/feedback", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const { clientId } = req.params;
      const { feedbackType, content, weekNumber, checkinDateKey } = req.body;

      if (!content || !feedbackType) {
        return res.status(400).json({ message: "Feedback type and content are required" });
      }

      // Verify therapist is assigned to this client
      const clients = await storage.getClientsForTherapist(therapistId);
      const isAssigned = clients.some(c => c.id === clientId);
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized to provide feedback for this client" });
      }

      const feedback = await storage.addTherapistFeedback(
        therapistId, 
        clientId, 
        feedbackType, 
        content, 
        weekNumber,
        checkinDateKey
      );
      
      res.status(201).json({ feedback });
      
      // Send email notification to the client
      try {
        const clientData = await storage.getUser(clientId);
        if (clientData && clientData.email) {
          const { sendFeedbackNotification } = await import("./emailService");
          const therapistData = req.user as any;
          const loginUrl = `${req.protocol}://${req.get('host')}/login`;
          await sendFeedbackNotification(
            clientData.email,
            clientData.name || undefined,
            therapistData.name || 'Your mentor',
            weekNumber,
            loginUrl
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
  });

  // Generate AI feedback draft for a client
  app.post("/api/therapist/clients/:clientId/generate-feedback", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const { clientId } = req.params;
      const { weekNumber } = req.body;

      // Verify therapist is assigned to this client
      const clients = await storage.getClientsForTherapist(therapistId);
      const isAssigned = clients.some(c => c.id === clientId);
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized for this client" });
      }

      // Gather client data for context
      const clientUser = await storage.getUser(clientId);
      const completedWeeks = await storage.getCompletedWeeks(clientId);
      const checkins = await storage.getUserCheckinHistory(clientId, 14); // Last 14 days
      const reflections = await storage.getAllWeekReflections(clientId);
      const allHomework = await storage.getAllHomeworkCompletions(clientId);
      const allExercises = await storage.getAllExerciseAnswers(clientId);
      
      // Get specific week reflection if weekNumber provided
      let weekReflection: typeof reflections[0] | null = null;
      if (weekNumber) {
        weekReflection = reflections.find(r => r.weekNumber === weekNumber) || null;
      }

      // Build context for AI
      const recentCheckins = checkins.slice(0, 7);
      const avgMood = recentCheckins.length > 0 
        ? recentCheckins.filter(c => c.moodLevel).reduce((sum, c) => sum + (c.moodLevel || 0), 0) / recentCheckins.filter(c => c.moodLevel).length
        : null;
      const avgUrge = recentCheckins.length > 0
        ? recentCheckins.filter(c => c.urgeLevel).reduce((sum, c) => sum + (c.urgeLevel || 0), 0) / recentCheckins.filter(c => c.urgeLevel).length
        : null;
      
      const journalEntries = recentCheckins
        .filter(c => c.journalEntry)
        .map(c => c.journalEntry)
        .slice(0, 3);
      
      // Analyze daily check-in honesty patterns
      const checkinDaysWithJournal = recentCheckins.filter(c => c.journalEntry && c.journalEntry.trim().length > 10).length;
      const totalCheckinDays = recentCheckins.length;

      // Generate AI feedback using Gemini
      if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY || !process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
        return res.status(503).json({ message: "AI feedback generation is not available. Please contact support." });
      }
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      const clientName = clientUser?.name || 'the client';
      
      let contextInfo = `Client: ${clientName}
Completed weeks: ${completedWeeks.length} of 16
`;

      if (avgMood !== null) {
        contextInfo += `Recent average mood: ${avgMood.toFixed(1)}/10\n`;
      }
      if (avgUrge !== null) {
        contextInfo += `Recent average urge level: ${avgUrge.toFixed(1)}/10\n`;
      }

      if (weekReflection) {
        contextInfo += `\nWeek ${weekNumber} Reflection:\n`;
        if (weekReflection.q1) contextInfo += `- Key insight: "${weekReflection.q1}"\n`;
        if (weekReflection.q2) contextInfo += `- What went well: "${weekReflection.q2}"\n`;
        if (weekReflection.q3) contextInfo += `- Challenges faced: "${weekReflection.q3}"\n`;
        if (weekReflection.q4) contextInfo += `- Goals for next week: "${weekReflection.q4}"\n`;
      }

      if (journalEntries.length > 0) {
        contextInfo += `\nRecent journal entries:\n`;
        journalEntries.forEach((entry, i) => {
          contextInfo += `- "${entry?.slice(0, 200)}${entry && entry.length > 200 ? '...' : ''}"\n`;
        });
      }

      // Analyze homework and exercise completion for effort assessment
      let effortAnalysis = '';
      const weeksToCheck = weekNumber ? [weekNumber] : completedWeeks.slice(-3);
      
      for (const wk of weeksToCheck) {
        const hw = allHomework.find(h => h.weekNumber === wk);
        const ex = allExercises.find(e => e.weekNumber === wk);
        const refl = reflections.find(r => r.weekNumber === wk);
        
        let weekIssues: string[] = [];
        
        // Check homework completion
        if (hw) {
          const items = JSON.parse(hw.completedItems || '[]');
          // We don't know total items, but if they checked very few that's a flag
          if (items.length === 0) {
            weekIssues.push('No homework items completed');
          }
        } else {
          weekIssues.push('No homework submission found');
        }
        
        // Check exercise answers
        if (ex) {
          const answers = JSON.parse(ex.answers || '{}');
          const filledFields = Object.values(answers).filter((v: any) => v && String(v).trim().length > 5);
          const totalFields = Object.keys(answers).length;
          if (totalFields > 0 && filledFields.length < totalFields * 0.5) {
            weekIssues.push(`Only ${filledFields.length} of ${totalFields} exercise fields filled in with meaningful responses`);
          } else if (totalFields === 0) {
            weekIssues.push('No exercise responses submitted');
          }
        } else {
          weekIssues.push('No exercise responses submitted');
        }
        
        // Check reflection depth
        if (refl) {
          const responses = [refl.q1, refl.q2, refl.q3, refl.q4].filter(q => q && q.trim().length > 10);
          if (responses.length < 2) {
            weekIssues.push(`Only ${responses.length} of 4 reflection questions answered with depth`);
          }
        } else {
          weekIssues.push('No reflection responses submitted');
        }
        
        if (weekIssues.length > 0) {
          effortAnalysis += `\nWeek ${wk} completion concerns:\n`;
          weekIssues.forEach(issue => {
            effortAnalysis += `- ${issue}\n`;
          });
        }
      }
      
      // Check daily journal writing frequency
      if (totalCheckinDays > 3 && checkinDaysWithJournal < totalCheckinDays * 0.3) {
        effortAnalysis += `\nJournal writing: Only ${checkinDaysWithJournal} of ${totalCheckinDays} recent check-in days included journal entries.\n`;
      }

      const prompt = `You are a supportive mentor providing feedback to a client in a Sexual Integrity recovery program. Based on the following client information, write a personalized feedback message.

${contextInfo}
${effortAnalysis ? `\nASSIGNMENT COMPLETION ANALYSIS:\n${effortAnalysis}` : ''}

Guidelines:
- Speak directly to the client using "you" language
- Be direct yet encouraging and supportive
- Reference specific details from their reflections or journal entries when available
- Acknowledge their progress and effort where genuine
- If the assignment completion analysis shows incomplete work (skipped exercises, shallow reflections, missing homework), address this directly but compassionately. Emphasize that the assignments are designed to help them, and encourage fuller engagement. Do not ignore evidence of minimal effort.
- Offer gentle guidance or suggestions based on their challenges
- Keep the message focused and under 300 words
- Do not provide medical advice or crisis intervention
- End with an encouraging note about their continued journey

Write the feedback message now:`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const draft = response.text || "Unable to generate feedback. Please write your own message.";

      res.json({ draft });
    } catch (error) {
      console.error("Generate AI feedback error:", error);
      res.status(500).json({ message: "Failed to generate AI feedback draft" });
    }
  });

  // Get pending reviews for therapist (week completions awaiting review)
  app.get("/api/therapist/pending-reviews", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const pendingReviews = await storage.getPendingReviewsForTherapist(therapistId);
      res.json({ pendingReviews });
    } catch (error) {
      console.error("Get pending reviews error:", error);
      res.status(500).json({ message: "Failed to get pending reviews" });
    }
  });

  // Submit a week review for a client
  app.post("/api/therapist/clients/:clientId/review/:weekNumber", requireRole("therapist"), async (req, res) => {
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
      const isAssigned = clients.some(c => c.id === clientId);
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized to review this client" });
      }

      // Check if already reviewed
      const existingReview = await storage.getWeekReview(clientId, weekNum);
      if (existingReview) {
        return res.status(400).json({ message: "This week has already been reviewed" });
      }

      const review = await storage.createWeekReview(therapistId, clientId, weekNum, reviewNotes || "");
      res.status(201).json({ review });
    } catch (error) {
      console.error("Submit week review error:", error);
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Get reviews for a specific client (for therapist view)
  app.get("/api/therapist/clients/:clientId/reviews", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const { clientId } = req.params;

      // Verify therapist is assigned to this client
      const clients = await storage.getClientsForTherapist(therapistId);
      const isAssigned = clients.some(c => c.id === clientId);
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized to view this client" });
      }

      const reviews = await storage.getAllWeekReviewsForClient(clientId);
      res.json({ reviews });
    } catch (error) {
      console.error("Get client reviews error:", error);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  // Admin: Get overdue reviews (reviews pending > 48 hours)
  app.get("/api/admin/overdue-reviews", requireRole("admin"), async (req, res) => {
    try {
      const hoursThreshold = parseInt(req.query.hours as string) || 48;
      const overdueReviews = await storage.getOverdueReviews(hoursThreshold);
      res.json({ overdueReviews });
    } catch (error) {
      console.error("Get overdue reviews error:", error);
      res.status(500).json({ message: "Failed to get overdue reviews" });
    }
  });

  // =======================================
  // AI Encouragement API
  // =======================================

  // Get AI encouragement for current week
  app.get("/api/ai/encouragement", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const weekNumber = parseInt(req.query.week as string) || 1;
      
      // Get user's current check-in data for context
      const today = new Date().toISOString().split('T')[0];
      const checkin = await storage.getDailyCheckin(user.id, today);
      const completedWeeks = await storage.getCompletedWeeks(user.id);
      
      const { getAIEncouragement } = await import("./aiService");
      const encouragement = await getAIEncouragement(weekNumber, {
        mood: checkin?.moodLevel ?? undefined,
        urgeLevel: checkin?.urgeLevel ?? undefined,
        completedWeeks: completedWeeks,
      });
      
      res.json({ encouragement, weekNumber });
    } catch (error) {
      console.error("AI encouragement error:", error);
      res.status(500).json({ message: "Failed to get AI encouragement" });
    }
  });

  // Get AI technique reminder
  app.get("/api/ai/technique", requireAuth, async (req, res) => {
    try {
      const weekNumber = parseInt(req.query.week as string) || 1;
      const techniqueName = req.query.technique as string | undefined;
      
      const { getAITechniqueReminder } = await import("./aiService");
      const reminder = await getAITechniqueReminder(weekNumber, techniqueName);
      
      res.json({ reminder, weekNumber });
    } catch (error) {
      console.error("AI technique reminder error:", error);
      res.status(500).json({ message: "Failed to get technique reminder" });
    }
  });

  // =======================================
  // Week access API (for time-based unlocking)
  // =======================================

  // Get unlocked weeks for current user
  app.get("/api/progress/unlocked-weeks", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== "client") {
        // Non-clients can access all weeks
        return res.json({ unlockedWeeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] });
      }

      if (!user.startDate) {
        // No start date set, only week 1 available
        return res.json({ unlockedWeeks: [1] });
      }

      const startDate = new Date(user.startDate);
      const today = new Date();
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
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
            prices: []
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
  app.post("/api/payments/checkout/subscription", requireRole("therapist"), async (req, res) => {
    try {
      const user = req.user as any;
      let { priceId } = req.body;
      
      const { stripeService } = await import("./stripeService");
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      // If priceId not provided, look up the Therapist Subscription price
      if (!priceId) {
        const products = await stripe.products.search({ query: "name:'Therapist Monthly Subscription'" });
        if (products.data.length === 0) {
          return res.status(500).json({ message: "Therapist subscription product not found in Stripe" });
        }
        const prices = await stripe.prices.list({ product: products.data[0].id, active: true, limit: 1 });
        if (prices.data.length === 0) {
          return res.status(500).json({ message: "Therapist subscription price not found in Stripe" });
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
      
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createTherapistSubscriptionCheckout(
        customerId,
        priceId,
        `${baseUrl}/therapist?payment=success`,
        `${baseUrl}/therapist?payment=cancelled`
      );
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Create subscription checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Create checkout session for client week payment
  app.post("/api/payments/checkout/week", requireRole("client"), async (req, res) => {
    try {
      const user = req.user as any;
      const { weekNumber } = req.body;
      let { priceId } = req.body;
      
      // Check if account is cancelled - prevent future purchases
      if (user.subscriptionStatus === 'cancelled') {
        return res.status(403).json({ message: "Your account has been cancelled. You cannot purchase additional weeks." });
      }
      
      if (!weekNumber) {
        return res.status(400).json({ message: "Week number is required" });
      }
      
      // If priceId not provided, look up the Weekly Lesson Access price
      if (!priceId) {
        const { getUncachableStripeClient } = await import("./stripeClient");
        const stripe = await getUncachableStripeClient();
        const products = await stripe.products.search({ query: "name:'Weekly Lesson Access'" });
        if (products.data.length === 0) {
          return res.status(500).json({ message: "Week access product not found in Stripe" });
        }
        const prices = await stripe.prices.list({ product: products.data[0].id, active: true, limit: 1 });
        if (prices.data.length === 0) {
          return res.status(500).json({ message: "Week access price not found in Stripe" });
        }
        priceId = prices.data[0].id;
      }
      
      // Check if week fee is waived
      const waivedWeeks = await storage.getWaivedWeeks(user.id);
      if (waivedWeeks.includes(weekNumber) || user.allFeesWaived) {
        return res.json({ waived: true, message: "This week's fee has been waived" });
      }
      
      // Check if already paid
      const hasPaid = await storage.hasWeekPayment(user.id, weekNumber);
      if (hasPaid) {
        return res.json({ alreadyPaid: true, message: "This week has already been paid for" });
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
      
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createWeekPaymentCheckout(
        customerId,
        priceId,
        weekNumber,
        user.id,
        therapistId,
        `${baseUrl}/week/${weekNumber}?payment=success`,
        `${baseUrl}/week/${weekNumber}?payment=cancelled`
      );
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Create week payment checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Confirm and record a completed week payment (verifies with Stripe first)
  app.post("/api/payments/confirm-week", requireRole("client"), async (req, res) => {
    try {
      const user = req.user as any;
      const { weekNumber, sessionId } = req.body;
      
      if (!weekNumber || typeof weekNumber !== 'number') {
        return res.status(400).json({ message: "Valid week number is required" });
      }
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ message: "Stripe session ID is required" });
      }

      // Check if already recorded by week number
      const alreadyPaid = await storage.hasWeekPayment(user.id, weekNumber);
      if (alreadyPaid) {
        return res.json({ success: true, message: "Payment already recorded" });
      }

      // Check if this specific Stripe session was already processed (idempotency)
      const existingPayment = await storage.getPaymentByStripeId(sessionId);
      if (existingPayment) {
        return res.json({ success: true, message: "Payment already recorded" });
      }

      // Verify the specific checkout session with Stripe
      const { stripeService } = await import("./stripeService");
      const verification = await stripeService.verifyWeekPaymentSession(sessionId, user.id, weekNumber);
      
      if (!verification.verified) {
        return res.status(400).json({ message: "Payment not verified with Stripe" });
      }

      // Also check idempotency by paymentId (payment_intent) if different from sessionId
      if (verification.paymentId && verification.paymentId !== sessionId) {
        const existingByPaymentId = await storage.getPaymentByStripeId(verification.paymentId);
        if (existingByPaymentId) {
          return res.json({ success: true, message: "Payment already recorded" });
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
  });

  // Get subscription status for current user
  app.get("/api/payments/subscription", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Include fee waiver status for therapists
      if (!user.stripeSubscriptionId) {
        return res.json({ subscription: null, allFeesWaived: user.allFeesWaived || false });
      }
      
      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      
      // Get live subscription details from Stripe for cancel_at_period_end status
      const subscriptionDetails = await stripeService.getSubscriptionDetails(user.stripeSubscriptionId);
      
      res.json({ 
        subscription, 
        allFeesWaived: user.allFeesWaived || false,
        cancelAtPeriodEnd: subscriptionDetails?.cancelAtPeriodEnd || false,
        periodEnd: subscriptionDetails?.periodEnd || null
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
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/dashboard`
      );
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Create portal session error:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // Cancel therapist subscription (no refund - active until period end)
  app.post("/api/account/cancel-subscription", requireRole("therapist"), async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }
      
      const { stripeService } = await import("./stripeService");
      const result = await stripeService.cancelSubscriptionAtPeriodEnd(user.stripeSubscriptionId);
      
      if (!result.success) {
        return res.status(500).json({ message: result.error || "Failed to cancel subscription" });
      }
      
      console.log(`Therapist ${user.email} cancelled subscription - access until ${result.periodEnd}`);
      
      res.json({ 
        message: "Subscription cancelled",
        accessEndsAt: result.periodEnd,
        noRefund: true
      });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

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
        note: "You will retain access to any previously paid weeks."
      });
    } catch (error) {
      console.error("Cancel account error:", error);
      res.status(500).json({ message: "Failed to cancel account" });
    }
  });

  // Check if client needs to pay for a specific week
  app.get("/api/payments/week/:weekNumber/status", requireRole("client"), async (req, res) => {
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
  });

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
        return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
      }

      // Clean expired tokens first
      await storage.cleanExpiredTokens();

      // Create reset token
      const tokenRecord = await storage.createPasswordResetToken(user.id);
      
      // Build reset link
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const resetLink = `${baseUrl}/reset-password?token=${tokenRecord.token}`;

      // Send email
      const loginUrl = `${baseUrl}/login`;
      const { sendPasswordResetEmail } = await import("./emailService");
      await sendPasswordResetEmail(user.email, resetLink, user.name || undefined, loginUrl);

      res.json({ message: "If an account exists with this email, you will receive a password reset link." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Verify reset token
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, message: "Token is required" });
      }

      const tokenRecord = await storage.getPasswordResetToken(token);
      
      if (!tokenRecord) {
        return res.json({ valid: false, message: "Invalid or expired token" });
      }

      if (tokenRecord.usedAt) {
        return res.json({ valid: false, message: "This reset link has already been used" });
      }

      if (new Date(tokenRecord.expiresAt) < new Date()) {
        return res.json({ valid: false, message: "This reset link has expired" });
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
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const tokenRecord = await storage.getPasswordResetToken(token);
      
      if (!tokenRecord) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      if (tokenRecord.usedAt) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      if (new Date(tokenRecord.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This reset link has expired" });
      }

      // Update password
      const hashedPassword = await hashPassword(password);
      const user = await storage.updateUserPassword(tokenRecord.userId, hashedPassword);

      if (!user) {
        return res.status(400).json({ message: "Failed to update password" });
      }

      // Mark token as used
      await storage.markTokenAsUsed(tokenRecord.id);

      // Send confirmation email
      const loginUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/login`;
      const { sendPasswordChangedConfirmation } = await import("./emailService");
      await sendPasswordChangedConfirmation(user.email, user.name || undefined, loginUrl);

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
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Verify current password
      const bcrypt = await import("bcrypt");
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      // Send confirmation email
      const loginUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/login`;
      const { sendPasswordChangedConfirmation } = await import("./emailService");
      await sendPasswordChangedConfirmation(user.email, user.name || undefined, loginUrl);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Admin reset user password (admin can reset any user's password)
  app.post("/api/admin/reset-password/:userId", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(userId, hashedPassword);

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      // Optionally send notification to user
      const loginUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/login`;
      const { sendPasswordChangedConfirmation } = await import("./emailService");
      await sendPasswordChangedConfirmation(user.email, user.name || undefined, loginUrl);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Admin reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

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
      await storage.savePushSubscription(userId, endpoint, keys.p256dh, keys.auth);
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
      const { checkinReminderEnabled, checkinReminderTime, feedbackNotificationsEnabled, weeklyProgressEnabled } = req.body;
      const prefs = await storage.upsertNotificationPreferences(userId, {
        checkinReminderEnabled,
        checkinReminderTime,
        feedbackNotificationsEnabled,
        weeklyProgressEnabled,
      });
      res.json(prefs);
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Start the check-in reminder scheduler
  startCheckinReminderScheduler();
  // New DeepSeek Coach Route
  app.post("/api/ai/coach", requireAuth, async (req, res) => {
    const { message, weekNumber } = req.body;
    const { getCoachResponse } = await import("./ai_coach");
    const reply = await getCoachResponse(message, weekNumber || 1);
    res.json({ reply });
  });
  return httpServer;
}
