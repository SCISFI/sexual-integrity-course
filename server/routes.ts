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

      const { email, password, name, licenseState, licenseNumber, licenseAttestation } = parsed.data;

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

      const { email, password, name, therapistId } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Verify the selected therapist exists and is a therapist
      const therapist = await storage.getUser(therapistId);
      if (!therapist || therapist.role !== "therapist") {
        return res.status(400).json({ message: "Invalid therapist selected" });
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

      // Assign the client to the selected therapist
      await storage.assignTherapistToClient(therapistId, user.id);

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
      
      // Return only id, name for privacy
      const availableTherapists = [...therapists, ...admins]
        .filter(t => t.subscriptionStatus === "active" || t.role === "admin")
        .map(t => ({
          id: t.id,
          name: t.name || t.email.split("@")[0],
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
        therapists 
      });
    } catch (error) {
      console.error("Get admin client progress error:", error);
      res.status(500).json({ message: "Failed to get client progress" });
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
      const feedback = await storage.getFeedbackForTherapist(therapistId, clientId);
      
      res.json({ completedWeeks, checkins, reflections, feedback });
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
      const { feedbackType, content, weekNumber } = req.body;

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
        weekNumber
      );
      
      res.status(201).json({ feedback });
    } catch (error) {
      console.error("Add therapist feedback error:", error);
      res.status(500).json({ message: "Failed to add feedback" });
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
      const { priceId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
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
      const { priceId, weekNumber } = req.body;
      
      if (!priceId || !weekNumber) {
        return res.status(400).json({ message: "Price ID and week number are required" });
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
      
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripeService.createWeekPaymentCheckout(
        customerId,
        priceId,
        weekNumber,
        `${baseUrl}/week/${weekNumber}?payment=success`,
        `${baseUrl}/week/${weekNumber}?payment=cancelled`
      );
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Create week payment checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Get subscription status for current user
  app.get("/api/payments/subscription", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }
      
      const { stripeService } = await import("./stripeService");
      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription });
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

  // Check if client needs to pay for a specific week
  app.get("/api/payments/week/:weekNumber/status", requireRole("client"), async (req, res) => {
    try {
      const user = req.user as any;
      const weekNumber = parseInt(req.params.weekNumber);
      
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
        return res.status(400).json({ message: "Invalid week number" });
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
      const { sendPasswordResetEmail } = await import("./emailService");
      await sendPasswordResetEmail(user.email, resetLink, user.name || undefined);

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
      const { sendPasswordChangedConfirmation } = await import("./emailService");
      await sendPasswordChangedConfirmation(user.email, user.name || undefined);

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
      const { sendPasswordChangedConfirmation } = await import("./emailService");
      await sendPasswordChangedConfirmation(user.email, user.name || undefined);

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
      const { sendPasswordChangedConfirmation } = await import("./emailService");
      await sendPasswordChangedConfirmation(user.email, user.name || undefined);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Admin reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  return httpServer;
}
