import { body } from "express-validator";

export const mentorRegisterRules = [
  body("fullName").isString().isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isStrongPassword({ minLength: 8 }),
  body("institution").notEmpty(),
  body("faculty").notEmpty(),
  body("department").optional(),
  body("yearsOfExperience").isInt({ min: 0 }),
  body("bio").optional().isLength({ max: 1000 }),
  // Accept either an actual array (when sent as JSON) or a JSON/string payload
  body("expertiseAreas").optional().custom((value) => {
    if (Array.isArray(value)) return true;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        // allow comma-separated fallback (will be parsed server-side)
        return typeof value === "string";
      }
    }
    return false;
  }),
  body("university").optional().isString(),
];

export const studentRegisterRules = [
  body("fullName").isString().isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isStrongPassword({ minLength: 8 }),
  body("university").notEmpty(),
  // Frontend now sends `faculty` (key) instead of free-text `major`
  body("faculty").notEmpty(),
  body("semester").notEmpty(),
  // NEW: mentorship areas (comma separated string from frontend)
  body("mentorshipAreas").optional().isString(),
];

export const loginRules = [
  body("email").isEmail(),
  body("password").isString().isLength({ min: 8 }),
];
