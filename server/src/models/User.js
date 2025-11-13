import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["student", "mentor", "admin"], required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true,  lowercase: true },
    passwordHash: { type: String, required: true },
    university: { type: String },

    status: { type: String, enum: ["pending", "verified", "rejected", "suspended"], default: "pending" },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", UserSchema);
