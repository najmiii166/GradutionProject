import mongoose from "mongoose";

const StudentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    major: { type: String, required: true },
    semester: { type: String, required: true },          
    idCardUrl: { type: String, required: true } 
    
  },
  { timestamps: true }
);

export default mongoose.model("StudentProfile", StudentProfileSchema);
