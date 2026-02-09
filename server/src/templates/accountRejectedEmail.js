import { buildBrandedEmail } from "./brandedEmailLayout.js";

export const accountRejectedEmail = ({ name, role }) => {
  const safeName = name || "there";

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">
      Thank you for your interest in MentorLink and for submitting your ${role || "user"} application.
    </p>
    <p style="margin:0 0 16px 0;">
      After carefully reviewing your information, we’re not able to verify your account at this time.
    </p>
    <p style="margin:0 0 16px 0;">
      This may be due to missing or inconsistent details. You’re welcome to review your information and apply again in the future.
    </p>
    <p style="margin:0;">
      If you believe this decision was made in error, you can reply to this email with any additional context.
    </p>
  `;

  const footerHtml = `
    <p style="margin:0;">
      We appreciate your time and interest in MentorLink.
    </p>
  `;

  return buildBrandedEmail({
    safeName,
    title: "Update on your MentorLink application",
    metaTitle: "Application Update",
    bodyHtml,
    buttonLabel: undefined,
    buttonUrl: undefined,
    footerHtml,
  });
};
