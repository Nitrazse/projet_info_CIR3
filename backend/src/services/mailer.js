import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to, code) {
  await transporter.sendMail({
    from:    `"Plateforme PFA3" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Votre code de vérification — PFA3',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
        <h2 style="color:#1a1a2e;">Vérification de votre compte</h2>
        <p>Voici votre code de vérification à 4 chiffres :</p>
        <div style="font-size:2.8rem;font-weight:bold;letter-spacing:0.8rem;
                    text-align:center;padding:1.5rem;background:#f0f4ff;
                    border-radius:10px;color:#2563eb;margin:1.5rem 0;">
          ${code}
        </div>
        <p style="color:#555;">Ce code expire dans <strong>3 minutes</strong>.</p>
        <p style="color:#999;font-size:0.85rem;">
          Si vous n'avez pas créé de compte sur PFA3, ignorez cet email.
        </p>
      </div>
    `,
  });
}
