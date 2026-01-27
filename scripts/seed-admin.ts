import { pool } from "../server/db";
import bcrypt from "bcrypt";

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function seedAdmin() {
  const adminEmail = "ken@scifsi.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const adminName = "Ken (Admin)";

  if (!adminPassword) {
    console.error("ADMIN_SEED_PASSWORD environment variable is required");
    process.exit(1);
  }

  console.log("Checking if admin account exists...");

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [adminEmail]
  );

  if (existingUser.rows.length > 0) {
    console.log(`Admin account ${adminEmail} already exists. Skipping.`);
  } else {
    console.log(`Creating admin account: ${adminEmail}`);
    const hashedPassword = await hashPassword(adminPassword);
    await pool.query(
      `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)`,
      [adminEmail, hashedPassword, adminName, "admin"]
    );
    console.log("Admin account created successfully!");
    console.log("Remember to change your password after first login.");
  }

  await pool.end();
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin:", error);
  process.exit(1);
});
