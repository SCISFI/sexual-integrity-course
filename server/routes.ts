import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Helper to check roles
  const requireRole = (role: string) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Standard Therapist/Mentor Client Data Route
  app.get(
    "/api/therapist/clients/:clientId/progress",
    requireRole("therapist"),
    async (req, res) => {
      try {
        const { clientId } = req.params;
        const user = await storage.getUser(clientId);
        if (!user || user.role !== "client")
          return res.status(404).json({ message: "Client not found" });

        const completedWeeks = await storage.getCompletedWeeks(clientId);
        const checkins = await storage.getUserCheckinHistory(clientId, 30);
        const reflections = await storage.getAllWeekReflections(clientId);

        res.json({ client: user, completedWeeks, checkins, reflections });
      } catch (error) {
        res.status(500).json({ message: "Failed to load data" });
      }
    },
  );

  // Standard Admin Client List Route
  app.get("/api/admin/clients", requireRole("admin"), async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      // Map therapists to clients for the dashboard view
      const clientsWithTherapists = await Promise.all(
        clients.map(async (client) => {
          const therapists = await storage.getTherapistsForClient(client.id);
          return { ...client, therapists };
        }),
      );
      res.json({ clients: clientsWithTherapists });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Standard Admin Mentor List Route
  app.get("/api/admin/therapists", requireRole("admin"), async (req, res) => {
    try {
      const therapists = await storage.getAllTherapists();
      res.json({ therapists });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mentors" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
