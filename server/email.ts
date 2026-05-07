import nodemailer from "nodemailer";
import crypto from "crypto";

// ==================== RESET TOKEN STORE ====================
// In-memory store for password reset tokens (works in both mock and DB mode)
// Token → { userId, email, expiresAt }
const resetTokens: Map<string, { userId: string; email: string; expiresAt: Date }> = new Map();

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(userId: string, email: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  resetTokens.set(token, { userId, email, expiresAt });
  return token;
}

export function validateResetToken(token: string): { userId: string; email: string } | null {
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (entry.expiresAt < new Date()) {
    resetTokens.delete(token);
    return null;
  }
  return { userId: entry.userId, email: entry.email };
}

export function consumeResetToken(token: string): { userId: string; email: string } | null {
  const entry = validateResetToken(token);
  if (entry) resetTokens.delete(token);
  return entry;
}

// ==================== EMAIL TRANSPORT ====================

let transporter: nodemailer.Transporter | null = null;
let testAccountUser = "";
let testAccountPass = "";
let testAccountPreviewUrl = "";

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    // Production SMTP
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: smtpUser, pass: smtpPass },
    });
    console.log("[email] Using production SMTP transport");
  } else {
    // Development: use Ethereal test account (emails visible at https://ethereal.email)
    const testAccount = await nodemailer.createTestAccount();
    testAccountUser = testAccount.user;
    testAccountPass = testAccount.pass;
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("[email] Using Ethereal test transport (dev mode)");
    console.log(`[email] Preview emails at: https://ethereal.email (user: ${testAccount.user})`);
  }

  return transporter;
}

// ==================== EMAIL SENDERS ====================

const APP_NAME = "Nutri-Intel";
const APP_URL = process.env.APP_URL || "http://localhost:5000";

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  language: "en" | "ar" = "en"
): Promise<void> {
  const t = getEmailTranslations(language);
  const resetLink = `${APP_URL}/reset-password?token=${token}`;

  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_FROM || "noreply@nutri-intel.com"}>`,
    to: email,
    subject: t.subject,
    html: buildPasswordResetHtml(t, resetLink),
    text: `${t.body}\n\n${resetLink}\n\n${t.expiry}`,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`[email] Password reset email preview: ${preview}`);
    testAccountPreviewUrl = preview;
  }
}

function buildPasswordResetHtml(t: ReturnType<typeof getEmailTranslations>, resetLink: string): string {
  const isRtl = t.dir === "rtl";
  return `<!DOCTYPE html>
<html dir="${t.dir}" lang="${t.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${t.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;direction:${t.dir}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700">${APP_NAME}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 32px;text-align:${isRtl ? "right" : "left"}">
          <h2 style="color:#111827;margin:0 0 16px;font-size:22px">${t.heading}</h2>
          <p style="color:#374151;line-height:1.6;margin:0 0 24px">${t.body}</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetLink}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600">${t.buttonText}</a>
          </div>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px">${t.expiry}</p>
          <p style="color:#6b7280;font-size:13px;margin:0">${t.ignore}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
          <p style="color:#9ca3af;font-size:12px;margin:0">${t.linkNote}<br/><a href="${resetLink}" style="color:#16a34a;word-break:break-all">${resetLink}</a></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">&copy; ${new Date().getFullYear()} ${APP_NAME}. ${t.rights}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function getEmailTranslations(language: "en" | "ar") {
  if (language === "ar") {
    return {
      lang: "ar",
      dir: "rtl" as const,
      subject: "إعادة تعيين كلمة المرور - Nutri-Intel",
      heading: "إعادة تعيين كلمة المرور",
      body: "لقد تلقينا طلبًا لإعادة تعيين كلمة مرور حسابك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.",
      buttonText: "إعادة تعيين كلمة المرور",
      expiry: "ينتهي هذا الرابط خلال ساعة واحدة.",
      ignore: "إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.",
      linkNote: "أو انسخ هذا الرابط في متصفحك:",
      rights: "جميع الحقوق محفوظة.",
    };
  }
  return {
    lang: "en",
    dir: "ltr" as const,
    subject: "Password Reset - Nutri-Intel",
    heading: "Reset Your Password",
    body: "We received a request to reset your account password. Click the button below to create a new password.",
    buttonText: "Reset Password",
    expiry: "This link expires in 1 hour.",
    ignore: "If you didn't request a password reset, you can safely ignore this email.",
    linkNote: "Or copy this link into your browser:",
    rights: "All rights reserved.",
  };
}

// Export preview URL for test routes
export function getLastPreviewUrl(): string {
  return testAccountPreviewUrl;
}
