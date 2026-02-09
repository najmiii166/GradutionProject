import { GoogleGenerativeAI } from "@google/generative-ai";

function buildPrompt(message, language) {
  const lang = language === "so" ? "Somali" : "English";
  return `You are MentorLink's coaching assistant.
- Answer concisely in ${lang}.
- Avoid sensitive data (no emails, phone numbers, IDs, URLs).
- Do not invent facts beyond the user's message.
- Provide explanations, short steps, and tips when relevant.

User message:
${message}`;
}

function geminiFallback(language) {
  return language === "so"
    ? "Adeegga AI-ga si ku-meelgaar ah uma shaqaynayo, balse waxaan kaa caawin karaa hagidda madalka iyo talooyinka guud."
    : "The AI service is temporarily unavailable, but I can still help with platform guidance and general tips.";
}

export async function generateAssistantReply({ message, language }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return geminiFallback(language);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = buildPrompt(message, language);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = (response?.text?.() || "").trim();
    // strip any accidental markdown fences
    const cleaned = text.replace(/^```+[\s\S]*?```+$/g, "").trim();
    return cleaned || geminiFallback(language);
  } catch (err) {
    console.error("AskAssistant Gemini error:", err);
    return geminiFallback(language);
  }
}

export default { generateAssistantReply };
