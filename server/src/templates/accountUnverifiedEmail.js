import { buildBrandedEmail } from "./brandedEmailLayout.js";

export const accountUnverifiedEmail = ({ name, role, reason }) => {
  const safeName = name || "there";
  const safeReason = reason && reason.trim() ? reason.trim() : null;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">
      We’re writing to let you know that your ${role || "user"} account is no longer verified on MentorLink.
    </p>
    <p style="margin:0 0 16px 0;">
      This action means you won't be able to access verified-only features until the issue is resolved.
    </p>
    ${safeReason ? `<p style="margin:0 0 16px 0;"><strong>Reason provided:</strong> ${safeReason}</p>` : ""}
    <p style="margin:0 0 16px 0;">
      If you believe this was a mistake or you’d like to appeal, please contact our support team through the Help Center in your MentorLink dashboard.
    </p>
  `;

  const footerHtml = `
    <p style="margin:0;">
      We’re here to help if you have questions.
    </p>
  `;

  return buildBrandedEmail({
    safeName,
    title: "Your MentorLink account status changed",
    metaTitle: "Account Status Update",
    bodyHtml,
    buttonLabel: undefined,
    buttonUrl: undefined,
    footerHtml,
  });
};
