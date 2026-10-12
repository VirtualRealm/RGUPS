import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import { appOrigin } from "./session";
import { newToken, tokenHash } from "./crypto";
export function mailConfigured() {
  return (
    Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM) ||
    (process.env.MAIL_MODE === "local" &&
      ["127.0.0.1", "localhost"].includes(new URL(appOrigin()).hostname))
  );
}
export async function sendAccountLink(
  user: { id: string; email: string },
  purpose: "ACTIVATE" | "RESET_PASSWORD",
) {
  if (!mailConfigured()) return false;
  const token = newToken();
  const db = getDb();
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`;
    await tx.oneTimeToken.updateMany({
      where: { userId: user.id, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.oneTimeToken.create({
      data: {
        userId: user.id,
        purpose,
        tokenHash: tokenHash(token),
        expiresAt: new Date(
          Date.now() + (purpose === "ACTIVATE" ? 86400 : 3600) * 1000,
        ),
      },
    });
  });
  const url = `${appOrigin()}/${purpose === "ACTIVATE" ? "verify-email" : "password-reset"}/#token=${token}`;
  const subject =
    purpose === "ACTIVATE"
      ? "Подтверждение e-mail — РГУПС · Воронеж"
      : "Восстановление доступа — РГУПС · Воронеж";
  const text = `${subject}\n\nОткройте ссылку и подтвердите действие:\n${url}\n\nСсылка одноразовая. Если вы не запрашивали это действие, проигнорируйте письмо.`;
  if (process.env.MAIL_MODE === "local") {
    if (!["127.0.0.1", "localhost"].includes(new URL(appOrigin()).hostname))
      throw new Error("Local mail is restricted to loopback");
    const dir = path.resolve(".local/mail");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, randomUUID() + ".json"),
      JSON.stringify({ to: user.email, subject, text, purpose, url }, null, 2),
      { mode: 0o600 },
    );
  } else {
    const { default: nodemailer } = await import("nodemailer");
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject,
      text,
    });
  }
  return true;
}
