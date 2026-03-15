import { buildBrandedEmail } from "./brandedEmailLayout.js";

export const accountApprovedEmail = ({ name, role, loginUrl }) => {
  const safeName = name || "there";

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">
      Great news — your ${role || "user"} account has been <strong>approved</strong> and verified by our team.
    </p>
    <p style="margin:0 0 16px 0;">
      You can now sign in to MentorLink,  and start using the platform.
    </p>
   
  `;

  const footerHtml = `
    <p style="margin:0; color:#64748b;">
      Welcome aboard — see you inside.
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
