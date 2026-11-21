const nodemailer = require('nodemailer');

const APP_NAME = 'FactoryHub';
const FACTORY_NAME = 'مصنع الأصالة للملابس والنسيج';

// =========================
// SMTP configuration (env only — never hardcoded)
// =========================
const readSmtpConfig = () => ({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // SMTP_SECURE=true for implicit TLS (usually port 465).
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM
});

const isEmailConfigured = () => {
    const config = readSmtpConfig();
    return Boolean(config.host && config.port && config.user && config.pass && config.from);
};

let transporter = null;

const getTransporter = () => {
    if (transporter) {
        return transporter;
    }

    const config = readSmtpConfig();

    if (!isEmailConfigured()) {
        throw new Error(
            'Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, ' +
            'SMTP_USER, SMTP_PASS and SMTP_FROM in the server environment.'
        );
    }

    transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        },
        // Timeouts so a dead SMTP host fails the request instead of hanging.
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });

    return transporter;
};

// Optional startup check. Never throws (so a misconfigured SMTP server does not
// stop the API from booting) but always reports clearly server-side.
const verifyEmailConfig = async () => {
    if (!isEmailConfigured()) {
        console.warn(
            '[Email] SMTP is not fully configured. OTP emails cannot be sent. ' +
            'Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM.'
        );
        return false;
    }

    try {
        await getTransporter().verify();
        console.log('[Email] SMTP configuration verified.');
        return true;
    } catch (error) {
        // Deliberately do not print the raw error (it can contain the SMTP
        // host/user) beyond a short reason.
        console.error(
            '[Email] SMTP verification failed. OTP emails will fail until fixed.'
        );
        return false;
    }
};

const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

const buildOtpEmail = ({ otp, purpose }) => {
    const PURPOSE_TEXT = {
        REGISTRATION: {
            en: 'register your account',
            ar: 'إنشاء حسابك',
            subject: 'رمز تأكيد إنشاء الحساب'
        },
        LOGIN: {
            en: 'sign in to your account',
            ar: 'تسجيل الدخول إلى حسابك',
            subject: 'رمز تأكيد تسجيل الدخول'
        },
        PASSWORD_RESET: {
            en: 'reset your password',
            ar: 'إعادة تعيين كلمة المرور',
            subject: 'رمز إعادة تعيين كلمة المرور'
        }
    };

    const purposeText = PURPOSE_TEXT[purpose] || PURPOSE_TEXT.LOGIN;

    const purposeEn = purposeText.en;
    const purposeAr = purposeText.ar;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#0d1526;padding:28px 24px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">${APP_NAME}</div>
              <div style="font-size:13px;color:#93c5fd;margin-top:6px;">${escapeHtml(FACTORY_NAME)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;text-align:center;">
              <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px;">
                رمز التحقق / Verification Code
              </div>
              <div style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:20px;">
                استخدم الرمز التالي ${escapeHtml(purposeAr)}:
                <br />
                Use the code below to ${escapeHtml(purposeEn)}:
              </div>
              <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#2563eb;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:18px 12px;direction:ltr;">
                ${escapeHtml(otp)}
              </div>
              <div style="font-size:13px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;margin-top:20px;line-height:1.7;">
                الرمز صالح لمدة 5 دقائق فقط.
                <br />
                This code expires in <strong>5 minutes</strong>.
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:18px;line-height:1.7;">
                لأمانك، لا تشارك هذا الرمز مع أي شخص.
                <br />
                For your security, never share this code with anyone.
                <br />
                فريق FactoryHub لن يطلب منك هذا الرمز أبداً.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 24px;text-align:center;font-size:11px;color:#94a3b8;">
              © ${new Date().getFullYear()} ${APP_NAME} — ${escapeHtml(FACTORY_NAME)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text =
        `${APP_NAME} verification code\n\n` +
        `Use this code to ${purposeEn}: ${otp}\n` +
        `\u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642: ${otp}\n\n` +
        `This code expires in 5 minutes.\n` +
        `For your security, never share this code with anyone.\n`;

    const subject = `${APP_NAME} — ${purposeText.subject} (${otp})`;

    return { subject, html, text };
};

// Send an OTP email. Throws on any failure so callers can refuse to let the
// user proceed. The OTP value is never logged here.
const sendOtpEmail = async ({ to, otp, purpose }) => {
    const config = readSmtpConfig();
    const { subject, html, text } = buildOtpEmail({ otp, purpose });

    try {
        const info = await getTransporter().sendMail({
            from: config.from,
            to,
            subject,
            text,
            html
        });

        return info;
    } catch (error) {
        // Re-throw a sanitised error: the raw nodemailer error can embed the
        // SMTP host/user/password. Keep the message generic for callers.
        const safeError = new Error('Failed to send verification email');
        safeError.cause = error;
        throw safeError;
    }
};

module.exports = {
    isEmailConfigured,
    verifyEmailConfig,
    sendOtpEmail,
    buildOtpEmail
};
