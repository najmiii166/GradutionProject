export const brandColor = process.env.BRAND_COLOR_HEX || "#0ea5e9";

// no logo used; name text will appear instead

export function buildBrandedEmail({
  safeName,
  title,
  metaTitle,
  bodyHtml,
  buttonLabel,
  buttonUrl,
  footerHtml,
}) {
  const emailTitle = metaTitle || title || "MentorLink";

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${emailTitle}</title>
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100% !important; -ms-text-size-adjust: 100% !important; }
        table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        @media (max-width: 600px) {
          .outer { padding: 20px 12px !important; }
          .container { width: 100% !important; }
          .card { padding: 28px 18px !important; border-radius: 24px !important; }
          .brand-title { font-size: 22px !important; }
          .content { font-size: 15px !important; line-height: 1.7 !important; }
          .button-cell { padding-top: 4px !important; padding-bottom: 28px !important; }
          .btn-table { width: 100% !important; }
          .btn-link {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            text-align: center !important;
            padding: 16px 20px !important;
            font-size: 15px !important;
            border-radius: 14px !important;
          }
          .footer-stack { width: 100% !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="outer" style="padding:40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="container" style="max-width:600px;">
              <tr>
                <td>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="background:#ffffff;border-radius:40px;padding:48px;box-shadow:0 10px 40px rgba(0,0,0,0.04);border:1px solid #f1f5f9;">
                    <tr>
                      <td align="center" style="padding-bottom:32px;">
                        <h1 class="brand-title" style="margin:0; font-size:24px; font-weight:300; letter-spacing:-0.02em; color:#0f172a;">
                          Mentor<span style="color:${brandColor}; font-weight:600;">Link</span>
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td class="content" style="font-size:16px; line-height:1.6; color:#475569; padding-bottom:24px;">
                        <p style="margin:0 0 16px 0;">Hello ${safeName},</p>
                        ${bodyHtml}
                      </td>
                    </tr>
                    ${
                      buttonUrl
                        ? `<tr>
                      <td align="center" class="button-cell" style="padding-top:8px; padding-bottom:40px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn-table" style="margin:0 auto;">
                          <tr>
                            <td align="center" bgcolor="${brandColor}" style="border-radius:16px; box-shadow:0 10px 15px -3px rgba(14, 165, 233, 0.3);">
                              <a class="btn-link" href="${buttonUrl}" style="display:inline-block; padding:16px 40px; border-radius:16px; font-weight:600; font-size:15px; color:#ffffff; background:${brandColor}; text-decoration:none;">
                                ${buttonLabel || "Open MentorLink"}
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>`
                        : ""
                    }
                    <tr>
                      <td style="font-size:13px; line-height:1.6; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:24px;">
                        ${
                          footerHtml ||
                          `<p style="margin:0;">
                            © ${new Date().getFullYear()} MentorLink. All rights reserved.
                          </p>`
                        }
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="footer-stack" style="max-width:600px; margin-top:24px;">
              <tr>
                <td align="center" style="font-size:12px; color:#94a3b8; line-height:1.5;">
                  <p style="margin:0;">© ${new Date().getFullYear()} MentorLink. All rights reserved.</p>
                  <p style="margin:4px 0 0 0;">Expertise Meets Ambition.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}
