import { buildBrandedEmail } from "./brandedEmailLayout.js";

export const passwordResetEmail = ({ name, resetUrl }) => {
  const safeName = name || "there";

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">
      We received a request to reset your password. To keep your account secure, this link is only valid for the next <strong>20 minutes</strong>.
    </p>
    <p style="margin:0;">
      Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.
    </p>
  `;

  const footerHtml = `
    <p style="margin:0;">
      <strong>Security Tip:</strong> Never share your reset link with anyone. Our team will never ask for your password or reset link via email or social media.
    </p>
  `;

  return buildBrandedEmail({
    safeName,
    title: "Reset your MentorLink password",
    metaTitle: "Password Reset",
    bodyHtml,
    buttonLabel: "Reset Your Password",
    buttonUrl: resetUrl,
    footerHtml,
  });
};