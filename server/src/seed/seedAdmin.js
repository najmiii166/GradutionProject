// server/src/seed/seedAdmin.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const ensureAdminExists = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@mentorlink.io";
    const password = process.env.ADMIN_PASSWORD || "Admin123!";
    const fullName = "System Admin";
    // Always ensure admin exists and has the configured password.
    // Use findOneAndUpdate with upsert so we can both create and update the admin user.
    const passwordHash = await bcrypt.hash(password, 12);

    const update = {
      fullName,
      email,
      passwordHash,
      role: "admin",
      status: "verified",
    };

    await User.findOneAndUpdate({ role: "admin" }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    console.log(`🌱 Admin ensured: ${email}`);
  } catch (err) {
    console.error("❌ Error ensuring admin user exists:", err);
  }
};
