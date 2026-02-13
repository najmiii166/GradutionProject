// src/services/mailer.js
import { Resend } from "resend";
import { passwordResetEmail } from "../templates/passwordResetEmail.js";
import { accountApprovedEmail } from "../templates/accountApprovedEmail.js";
import { accountRejectedEmail } from "../templates/accountRejectedEmail.js";
import { accountUnverifiedEmail } from "../templates/accountUnverifiedEmail.js";

const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

const appUrl = (process.env.APP_URL || "http://localhost:5174").replace(/\/$/, "");
const defaultFrom =
  process.env.MAIL_FROM || "MentorLink Notifications <no-reply@mentorlink.app>";

export async function sendPasswordResetEmail({ to, name, token }) {
  if (!resendClient) {
    throw new Error(
      "Resend API key missing. Set RESEND_API_KEY to send transactional emails."
    );
  }

  const html = passwordResetEmail({
    name,
    resetUrl: `${appUrl}/reset-password?token=${token}`,
  });

  await resendClient.emails.send({
    from: defaultFrom,
    to,
    subject: "Reset your MentorLink password",
    html,
  });
}

// New: Welcome email when an admin approves a user account
export async function sendUserApprovedEmail({ to, name, role }) {
  if (!resendClient) {
    throw new Error(
      "Resend API key missing. Set RESEND_API_KEY to send transactional emails."
    );
  }

  const loginUrl = `${appUrl}/login`;

  const html = accountApprovedEmail({ name, role, loginUrl });

  await resendClient.emails.send({
    from: defaultFrom,
    to,
    subject: "Welcome to MentorLink",
    html,
  });
}

// New: Rejection email when an admin cannot verify a user account
export async function sendUserRejectedEmail({ to, name, role }) {
  if (!resendClient) {
    throw new Error(
      "Resend API key missing. Set RESEND_API_KEY to send transactional emails."
    );
  }

  const html = accountRejectedEmail({ name, role });

  await resendClient.emails.send({
    from: defaultFrom,
    to,
    subject: "Update on your MentorLink application",
    html,
  });
}

// New: Unverified email when an admin revokes verification (ban/suspension)
export async function sendUserUnverifiedEmail({ to, name, role, reason }) {
  if (!resendClient) {
    throw new Error(
      "Resend API key missing. Set RESEND_API_KEY to send transactional emails."
    );
  }

  const html = accountUnverifiedEmail({ name, role, reason });

  await resendClient.emails.send({
    from: defaultFrom,
    to,
    subject: "Account status update",
    html,
  });
}
