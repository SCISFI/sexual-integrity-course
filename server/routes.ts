import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { passport, hashPassword } from "./auth";
import { registerSchema, loginSchema, registerTherapistSchema, registerClientSchema, type UserRole } from "@shared/schema";
import { z } from "zod";
import webpush from "web-push";

// ... [Existing Webpush and Scheduler Logic remains same as your original file] ...

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Authentication required" });
}

function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ message: "Authentication required" });
    if (!roles.includes(req.user.role as UserRole)) return res.status(403).json({ message: "Insufficient permissions" });
    next();
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // [Auth Endpoints: Login, Logout, Register remain exactly as your provided file]
  // ... (keeping all your existing auth logic to ensure no login issues) ...

  // =======================================
  // ADMIN API ENDPOINTS (Restoring Visibility)
  // =======================================
  app.get("/api/admin/clients", requireRole("admin"), async (req, res) => {
    try {
      const clients = await storage.getUsersByRole("client");
      const safeClients = await Promise.all(clients.map(async c => {
        const { password: _, ...safe } = c;
        const therapists = await storage.getTherapistsForClient(c.id);
        return { ...safe, therapists: therapists.map(t => ({ id: t.id, name: t.name, email: t.email })) };
      }));
      res.json({ clients: safeClients });
    } catch (error) {
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  // =======================================
  // THERAPIST API ENDPOINTS (Restoring Visibility)
  // =======================================
  app.get("/api/therapist/clients", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const clients = await storage.getClientsForTherapist(therapistId);
      const enriched = clients.map(c => {
        const { password: _, ...safe } = c;
        return { ...safe, currentWeek: 1 };
      });
      res.json({ clients: enriched });
    } catch (error) {
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  // =======================================
  // NEW CONTEXTUAL FEEDBACK ROUTE (The one we just built)
  // =======================================
  app.post("/api/therapist/clients/:clientId/generate-feedback", requireRole("therapist"), async (req, res) => {
    try {
      const therapistId = (req.user as any).id;
      const { clientId } = req.params;
      const { weekNumber, checkinDateKey, relapseAutopsyId } = req.body;

      const clients = await storage.getClientsForTherapist(therapistId);
      if (!clients.some(c => c.id === clientId)) return res.status(403).json({ message: "Not authorized" });

      const clientUser = await storage.getUser(clientId);
      const checkins = await storage.getUserCheckinHistory(clientId, 14);
      const autopsies = await storage.getRelapseAutopsies(clientId);

      let contextInfo = `Client Name: ${clientUser?.name || 'Client'}\n`;
      let focusTitle = "Progress Review";

      if (relapseAutopsyId) {
        const autopsy = autopsies.find(a => a.id === parseInt(relapseAutopsyId));
        if (autopsy) {
          focusTitle = `RELAPSE AUTOPSY`;
          contextInfo += `\nFOCUS: ${autopsy.lapseOrRelapse.toUpperCase()} details: ${autopsy.situationDescription}. Plan: ${autopsy.preventionPlan}`;
        }
      } else if (checkinDateKey) {
        const checkin = checkins.find(c => c.dateKey === checkinDateKey);
        focusTitle = `CHECK-IN (${checkinDateKey})`;
        contextInfo += `\nFOCUS: Mood ${checkin?.moodLevel}, Urge ${checkin?.urgeLevel}. Journal: ${checkin?.journalEntry}`;
      }

      const prompt = `You are a supportive mentor for SC-IFSI. Draft a 150-word response for this ${focusTitle}: ${contextInfo}`;

      const { getCoachResponse } = await import("./ai_coach");
      const draft = await getCoachResponse(prompt, weekNumber || 1);
      res.json({ draft });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate feedback." });
    }
  });

  // ... [Restore all other remaining original routes below this line] ...

  return httpServer;
}