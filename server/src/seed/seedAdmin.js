// server/src/seed/seedAdmin.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const ensureAdminExists = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@mentorlink.io";
    const password = process.env.ADMIN_PASSWORD || "Admin123!";
    const fullName = "System Admin";
    // Always ensure admin exists and has the configured password.
    // Use the email as the upsert filter to avoid duplicate key errors when an admin
    // was previously created with the same email but different role value.
    const passwordHash = await bcrypt.hash(password, 12);

    const update = {
      fullName,
      email,
      passwordHash,
      role: "admin",
      status: "verified",
    };

    // Upsert by email (idempotent). If another document with the same email exists
    // but different role, this will update that document to be the admin instead
    // of trying to insert and triggering a duplicate-key error on the email index.
    await User.findOneAndUpdate({ email }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    console.log(`🌱 Admin ensured: ${email}`);
  } catch (err) {
    console.error("❌ Error ensuring admin user exists:", err);
  }
};
