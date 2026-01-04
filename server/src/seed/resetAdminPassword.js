import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

// Usage:
// MONGO_URI="your_atlas_uri" ADMIN_EMAIL="admin@..." ADMIN_PASSWORD="NewPass123!" node ./src/seed/resetAdminPassword.js

const email = process.env.ADMIN_EMAIL || process.argv[2] || "admin@mentorlink.io";
const newPassword = process.env.ADMIN_PASSWORD || process.argv[3] || "Admin123!";

(async () => {
  try {
    await connectDB();

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Try to find an existing admin by email
    let user = await User.findOne({ email });

    if (user) {
      user.passwordHash = passwordHash;
      await user.save();
      console.log(`✅ Password updated for: ${email}`);
      process.exit(0);
    }

    // If not found, create a new admin user
    user = await User.create({
      fullName: "System Admin",
      email,
      passwordHash,
      role: "admin",
      status: "verified",
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email:", email);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
