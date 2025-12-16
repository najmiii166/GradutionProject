// server/src/seed/seedAdmin.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const ensureAdminExists = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@mentorlink.io";
    const password = process.env.ADMIN_PASSWORD || "Admin123!";
    const fullName = "System Admin";

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      console.log("✅ Admin user already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      fullName,
      email,
      passwordHash,
      role: "admin",
      status: "verified",
    });

    console.log("🌱 Admin user seeded successfully!");
  } catch (err) {
    console.error("❌ Error ensuring admin user exists:", err);
  }
};
