import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { getDb } from "../db";
import { deviceLabel, newToken, tokenHash } from "./crypto";
import type { Prisma } from "@/generated/prisma/client";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function appOrigin() {
  const url = new URL(process.env.APP_URL || "http://127.0.0.1:3000");
  if (
    url.protocol !== "https:" &&
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  )
    throw new Error("APP_URL requires HTTPS");
  return url.origin;
}
export function cookieName() {
  return appOrigin().startsWith("https:")
    ? "__Host-portal_session"
    : "portal_session";
}
export const sessionInclude = {
  roles: true,
  student: {
    include: {
      memberships: { where: { validTo: null }, include: { group: true } },
    },
  },
  teacher: true,
  affiliationRequests: { orderBy: { createdAt: "desc" as const }, take: 1 },
} satisfies Prisma.UserInclude;
export async function readSession(request: NextRequest) {
  const token = request.cookies.get(cookieName())?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const session = await getDb().session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: { include: sessionInclude } },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.authVersion !== session.user.authVersion ||
    ["SUSPENDED", "ARCHIVED"].includes(session.user.status)
  )
    return null;
  if (session.lastSeenAt.getTime() < Date.now() - 300000)
    await getDb().session.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
        lastSeenAt: { lt: new Date(Date.now() - 300000) },
      },
      data: { lastSeenAt: new Date() },
    });
  return session;
}
export async function requireSession(request: NextRequest) {
  const session = await readSession(request);
  if (!session) throw new ApiError(401, "Войдите в личный кабинет");
  return session;
}
export type AuthSession = NonNullable<Awaited<ReturnType<typeof readSession>>>;
export function requireAdmin(session: AuthSession) {
  if (
    session.user.status !== "ACTIVE" ||
    !session.user.emailVerifiedAt ||
    !session.user.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r.role))
  )
    throw new ApiError(403, "Недостаточно прав");
}
export async function makeSession(
  tx: Prisma.TransactionClient,
  userId: string,
  authVersion: number,
  remember: boolean,
  agent: string,
) {
  const token = newToken(),
    duration = remember ? 30 * 86400 : 12 * 3600;
  const row = await tx.session.create({
    data: {
      userId,
      authVersion,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + duration * 1000),
      remembered: remember,
      deviceLabel: deviceLabel(agent),
    },
  });
  return { token, duration, remember, row };
}
export function writeSession(
  response: NextResponse,
  session: Awaited<ReturnType<typeof makeSession>>,
) {
  response.cookies.set(cookieName(), session.token, {
    httpOnly: true,
    secure: appOrigin().startsWith("https:"),
    sameSite: "lax",
    path: "/",
    ...(session.remember ? { maxAge: session.duration } : {}),
  });
}
export function clearSession(response: NextResponse) {
  response.cookies.set(cookieName(), "", {
    httpOnly: true,
    secure: appOrigin().startsWith("https:"),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
export function assertMutation(request: NextRequest) {
  if (
    request.headers.get("origin") !== appOrigin() ||
    request.headers.get("x-portal-request") !== "1"
  )
    throw new ApiError(403, "Запрос отклонён. Обновите страницу.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(415, "Ожидается JSON");
}
export async function readJson(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Пустой запрос");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new ApiError(413, "Слишком большой запрос");
    }
    chunks.push(chunk.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "Некорректный запрос");
  }
}
export async function limit(key: string, max = 8, windowSeconds = 900) {
  const db = getDb(),
    hash = tokenHash(key);
  const rows = await db.$queryRaw<
    { attempts: number }[]
  >`INSERT INTO "AuthRateLimit" ("key","attempts","resetsAt") VALUES (${hash},1,NOW() + (${windowSeconds} * INTERVAL '1 second')) ON CONFLICT ("key") DO UPDATE SET "attempts"=CASE WHEN "AuthRateLimit"."resetsAt" < NOW() THEN 1 ELSE "AuthRateLimit"."attempts"+1 END,"resetsAt"=CASE WHEN "AuthRateLimit"."resetsAt" < NOW() THEN NOW() + (${windowSeconds} * INTERVAL '1 second') ELSE "AuthRateLimit"."resetsAt" END RETURNING "attempts"`;
  if (rows[0].attempts > max)
    throw new ApiError(
      429,
      "Слишком много попыток. Попробуйте через 15 минут.",
    );
}
export function accountDto(session: AuthSession) {
  const u = session.user,
    r = u.affiliationRequests[0],
    group = u.student?.memberships[0]?.group;
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    middleName: u.middleName,
    displayName: [u.lastName, u.firstName, u.middleName]
      .filter(Boolean)
      .join(" "),
    status: u.status,
    emailVerified: Boolean(u.emailVerifiedAt),
    roles: u.roles.map((r) => r.role),
    affiliation: r
      ? {
          requestedRole: r.requestedRole,
          status: r.status,
          reviewNote: r.reviewNote,
          groupId: r.groupId,
        }
      : null,
    group: group ? { id: group.id, code: group.code } : null,
    teacher: u.teacher
      ? {
          publicTeacherId: u.teacher.publicTeacherId,
          scheduleName: u.teacher.scheduleName,
        }
      : null,
  };
}
