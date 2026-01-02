import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    type: { type: String },
    range: { type: String },
    generatedText: { type: String },
    title: {
      type: String,
      required: true,
      default: function () {
        // Prefer a short summary if present, otherwise trim the generated text.
        if (this.summary) return this.summary;
        if (this.generatedText) return this.generatedText.slice(0, 120);
        return `Report ${new Date().toISOString()}`;
      },
    },
    htmlReport: { type: String },
    pdfContent: { type: String }, // base64
    summary: { type: String },
    insights: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Ensure backward compatibility: if an existing document lacks a title, populate it before save
ReportSchema.pre("save", function (next) {
  if (!this.title) {
    if (this.summary) this.title = this.summary;
    else if (this.generatedText) this.title = this.generatedText.slice(0, 120);
    else this.title = `Report ${new Date().toISOString()}`;
  }
  next();
});

export default mongoose.model("Report", ReportSchema);
