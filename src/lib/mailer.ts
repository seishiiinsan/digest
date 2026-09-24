import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  const url = process.env.SMTP_URL;
  if (!url) throw new Error("SMTP_URL manquante");
  transporter ??= nodemailer.createTransport(url);
  return transporter;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail(mail: Mail): Promise<void> {
  await getTransporter().sendMail({ from: process.env.MAIL_FROM ?? "Digest <digest@localhost>", ...mail });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function actionMail(to: string, subject: string, intro: string, action: string, url: string, outro: string): Mail {
  return {
    to,
    subject,
    text: `${intro}\n\n${action} : ${url}\n\n${outro}`,
    html: `<p>${escapeHtml(intro)}</p><p><a href="${escapeHtml(url)}">${escapeHtml(action)}</a></p><p>${escapeHtml(outro)}</p>`,
  };
}

export function verificationMail(to: string, url: string): Mail {
  return actionMail(
    to,
    "Confirmez votre adresse email",
    "Bienvenue sur Digest. Confirmez votre adresse pour activer votre compte.",
    "Confirmer mon adresse",
    url,
    "Si vous n'avez pas créé de compte, ignorez ce message.",
  );
}

export function resetPasswordMail(to: string, url: string): Mail {
  return actionMail(
    to,
    "Réinitialisez votre mot de passe",
    "Une réinitialisation du mot de passe de votre compte Digest a été demandée.",
    "Choisir un nouveau mot de passe",
    url,
    "Ce lien est valable 30 minutes et ne sert qu'une fois. Si vous n'êtes pas à l'origine de la demande, ignorez ce message.",
  );
}
