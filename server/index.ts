import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { passport, hashPassword } from "./auth";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Initialize Stripe schema and sync on startup
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    if (webhookBaseUrl && webhookBaseUrl !== 'https://undefined') {
      try {
        const result = await stripeSync.findOrCreateManagedWebhook(
          `${webhookBaseUrl}/api/stripe/webhook`
        );
        if (result?.webhook?.url) {
          console.log(`Webhook configured: ${result.webhook.url}`);
        } else {
          console.log('Webhook setup returned without URL, continuing...');
        }
      } catch (webhookError) {
        console.log('Webhook setup skipped:', webhookError);
      }
    } else {
      console.log('Skipping webhook setup - no domain available');
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

// Seed accounts if they don't exist (only when ADMIN_SEED_PASSWORD env var is set)
async function seedAccountsIfNeeded() {
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!seedPassword) {
    console.log("Account seeding skipped: ADMIN_SEED_PASSWORD not set");
    return;
  }

  const hashedPassword = await hashPassword(seedPassword);

  // Define accounts to seed
  const accounts = [
    { email: "ken@scifsi.com", name: "Ken (Admin)", role: "admin" },
    { email: "ken-therapist@scifsi.com", name: "Ken (Therapist)", role: "therapist" },
    { email: "therapist.tester@example.com", name: "Test Therapist", role: "therapist" },
    { email: "client.tester@example.com", name: "Test Client", role: "client" },
  ];

  try {
    for (const account of accounts) {
      const result = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [account.email]
      );

      if (result.rows.length === 0) {
        console.log(`Creating ${account.role} account: ${account.email}`);
        
        if (account.role === "client") {
          // Assign client to tester therapist
          const therapist = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            ["therapist.tester@example.com"]
          );
          const therapistId = therapist.rows[0]?.id || null;
          const startDate = new Date().toISOString().split('T')[0]; // Just the date part
          await pool.query(
            `INSERT INTO users (email, password, name, role, start_date) VALUES ($1, $2, $3, $4, $5)`,
            [account.email, hashedPassword, account.name, account.role, startDate]
          );
          if (therapistId) {
            // Create therapist-client relationship
            const newClient = await pool.query("SELECT id FROM users WHERE email = $1", [account.email]);
            await pool.query(
              `INSERT INTO therapist_clients (therapist_id, client_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [therapistId, newClient.rows[0].id]
            );
          }
        } else {
          await pool.query(
            `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)`,
            [account.email, hashedPassword, account.name, account.role]
          );
        }
        console.log(`  ${account.role} account created.`);
      } else {
        console.log(`${account.role} account ${account.email} already exists`);
      }
    }
    console.log("Account seeding complete.");
  } catch (error) {
    console.error("Failed to seed accounts:", error);
  }
}

// Stripe initialization moved to async IIFE below

// Register Stripe webhook route BEFORE express.json()
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('Webhook body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Now apply JSON middleware for all other routes
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Stripe before setting up routes
  await initStripe();

  // Seed accounts if needed
  await seedAccountsIfNeeded();

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
