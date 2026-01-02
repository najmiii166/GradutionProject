import { body } from "express-validator";

export const mentorRegisterRules = [
  body("fullName").isString().isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isStrongPassword({ minLength: 8 }),
  body("institution").notEmpty(),
  body("faculty").notEmpty(),
  body("department").notEmpty(),
  body("yearsOfExperience").isInt({ min: 0 }),
  body("bio").optional().isLength({ max: 1000 }),
  body("expertiseAreas").optional().isArray(),
  body("university").optional().isString(),
];

export const studentRegisterRules = [
  body("fullName").isString().isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isStrongPassword({ minLength: 8 }),
  body("university").notEmpty(),
  body("major").notEmpty(),
  body("semester").notEmpty(),
  // NEW: mentorship areas (comma separated string from frontend)
  body("mentorshipAreas").optional().isString(),
];

export const loginRules = [
  body("email").isEmail(),
  body("password").isString().isLength({ min: 8 }),
];
