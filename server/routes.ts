import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { passport, hashPassword } from "./auth";
import { registerSchema, loginSchema, registerTherapistSchema, registerClientSchema, type UserRole } from "@shared/schema";
import { z } from "zod";

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

      const { email, password, name } = parsed.data;

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

  // Register as client
  app.post("/api/auth/register/client", async (req, res) => {
    try {
      const parsed = registerClientSchema.safeParse(req.body);
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
      console.error("Client registration error:", error);
      res.status(500).json({ message: "Registration failed" });
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
      const completion = await storage.markWeekComplete(userId, weekNumber);
      res.json({ completion });
    } catch (error) {
      console.error("Mark complete error:", error);
      res.status(500).json({ message: "Failed to mark week complete" });
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

      // Assign therapist if provided
      if (therapistId) {
        await storage.assignTherapistToClient(therapistId, user.id);
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
      const { startDate, allFeesWaived, subscriptionStatus, name } = req.body;
      
      const updateData: any = {};
      if (startDate !== undefined) updateData.startDate = startDate;
      if (allFeesWaived !== undefined) updateData.allFeesWaived = allFeesWaived;
      if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
      if (name !== undefined) updateData.name = name;

      const user = await storage.updateUser(clientId, updateData);
      if (!user) {
        return res.status(404).json({ message: "Client not found" });
      }

      const { password: _, ...safeUser } = user;
      res.json({ client: safeUser });
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ message: "Failed to update client" });
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
      console.error("Remove assignment error:", error);
      res.status(500).json({ message: "Failed to remove assignment" });
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

  // =======================================
  // Therapist API endpoints
  // =======================================

  // Get assigned clients for therapist
  app.get("/api/therapist/clients", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const clients = await storage.getClientsForTherapist(therapistId);
      const safeClients = clients.map(c => {
        const { password: _, ...safe } = c;
        return safe;
      });
      res.json({ clients: safeClients });
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
      
      res.json({ completedWeeks, checkins });
    } catch (error) {
      console.error("Get client progress error:", error);
      res.status(500).json({ message: "Failed to get client progress" });
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

  return httpServer;
}
