import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { haveIBeenPwned } from "better-auth/plugins";
import { getPrisma } from "@/lib/db";
import { resetPasswordMail, sendMail, verificationMail } from "@/lib/mailer";
import { hashPassword, verifyPassword } from "@/lib/password";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";
import { hit, type RateLimitRule } from "@/lib/rate-limit";

const MINUTE = 60;

// Limites par email, en plus des limites par IP de Better Auth.
const emailRules: Record<string, RateLimitRule> = {
  "/sign-in/email": { max: 5, windowMs: 15 * MINUTE * 1000 },
  "/sign-up/email": { max: 3, windowMs: 60 * MINUTE * 1000 },
  "/request-password-reset": { max: 3, windowMs: 60 * MINUTE * 1000 },
  "/send-verification-email": { max: 3, windowMs: 60 * MINUTE * 1000 },
};

function createAuth() {
  const prisma = getPrisma();

  return betterAuth({
    baseURL: process.env.APP_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 30 * MINUTE,
      revokeSessionsOnPasswordReset: true,
      password: { hash: hashPassword, verify: verifyPassword },
      sendResetPassword: async ({ user, url }) => {
        await sendMail(resetPasswordMail(user.email, url));
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 24 * 60 * MINUTE,
      sendVerificationEmail: async ({ user, url }) => {
        await sendMail(verificationMail(user.email, url));
      },
    },
    user: {
      deleteUser: { enabled: true },
    },
    session: {
      expiresIn: 30 * 24 * 60 * MINUTE,
      updateAge: 24 * 60 * MINUTE,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: MINUTE,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 5 * MINUTE, max: 10 },
        "/sign-up/email": { window: 60 * MINUTE, max: 10 },
        "/request-password-reset": { window: 60 * MINUTE, max: 10 },
        "/reset-password": { window: 60 * MINUTE, max: 10 },
        "/send-verification-email": { window: 60 * MINUTE, max: 10 },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const rule = emailRules[ctx.path];
        const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : undefined;
        if (!rule || !email) return;
        if (!(await hit(prisma, `email:${ctx.path}:${email}`, rule))) {
          throw new APIError("TOO_MANY_REQUESTS", { message: "Trop de tentatives, réessayez plus tard." });
        }
      }),
    },
    plugins: [
      haveIBeenPwned({
        enabled: process.env.PASSWORD_BREACH_CHECK !== "false",
        customPasswordCompromisedMessage:
          "Ce mot de passe apparaît dans des fuites de données connues. Choisissez-en un autre.",
      }),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { auth?: Auth };

// Instance créée à la demande, comme le client Prisma.
export function getAuth(): Auth {
  globalForAuth.auth ??= createAuth();
  return globalForAuth.auth;
}
