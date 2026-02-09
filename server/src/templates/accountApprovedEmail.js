import { brandColor, buildBrandedEmail } from "./brandedEmailLayout.js";

export const accountApprovedEmail = ({ name, role, loginUrl }) => {
  const safeName = name || "there";

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">
      Great news — your ${role || "user"} account has been <strong>approved</strong> and verified by our team.
    </p>
    <p style="margin:0 0 16px 0;">
      You can now sign in to MentorLink, complete your profile, and start using the platform.
    </p>
    <p style="margin:0;">
      If you did not create this account, you can safely ignore this email.
    </p>
  `;

  const footerHtml = `
    <p style="margin:0;">
      Having trouble with the button above? Copy and paste this link into your browser:
    </p>
    <p style="margin:8px 0 0 0; word-break:break-all;">
      <a href="${loginUrl}" style="color:${brandColor}; text-decoration:underline;">${loginUrl}</a>
    </p>
  `;

  return buildBrandedEmail({
    safeName,
    title: "Your MentorLink account has been approved",
    metaTitle: "Account Approved",
    bodyHtml,
    buttonLabel: "Go to MentorLink",
    buttonUrl: loginUrl,
    footerHtml,
  });
};
