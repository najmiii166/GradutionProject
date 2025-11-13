import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

(async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || "admin@mentorlink.io";
    const password = process.env.ADMIN_PASSWORD || "Admin123!";
    const fullName = "System Admin";

    let admin = await User.findOne({ email });
    if (admin) {
      console.log(`⚠️ Admin already exists: ${email}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    admin = await User.create({
      fullName,
      email,
      passwordHash,
      role: "admin",
      status: "verified"
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
})();
