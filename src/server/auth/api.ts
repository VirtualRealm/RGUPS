import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "../db";
import { productionConfigIssues } from "../runtime-config.mjs";
import { hashPassword, verifyPassword, tokenHash } from "./crypto";
import {
  registrationSchema,
  loginSchema,
  emailSchema,
  passwordSchema,
  profileSchema,
  tokenSchema,
} from "./validation";
import {
  ApiError,
  assertMutation,
  readJson,
  readSession,
  requireSession,
  requireAdmin,
  accountDto,
  makeSession,
  writeSession,
  clearSession,
  limit,
  type AuthSession,
} from "./session";
import { mailConfigured, sendAccountLink } from "./mail";
import lessons from "@/content/schedule-lessons.json";
import teachers from "@/content/teachers.json";
import { moscowToday, weekDates } from "@/lib/filters";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
const agent = (r: NextRequest) => r.headers.get("user-agent") || "";
async function notify(
  user: { id: string; email: string },
  purpose: "ACTIVATE" | "RESET_PASSWORD",
) {
  try {
    return await sendAccountLink(user, purpose);
  } catch {
    return false;
  }
}
async function dashboard(session: AuthSession, date: string) {
  const db = getDb(),
    account = accountDto(session),
    user = session.user;
  const selectedGroup =
    account.group ||
    (account.affiliation?.groupId
      ? await db.group.findUnique({
          where: { id: account.affiliation.groupId },
          select: { id: true, code: true },
        })
      : null);
  const active = user.status === "ACTIVE" && Boolean(user.emailVerifiedAt);
  const student =
    active && account.roles.includes("STUDENT") ? user.student : null;
  const teacher =
    active && account.roles.includes("TEACHER") ? user.teacher : null;
  const personal = lessons.lessons.filter((l) =>
    teacher
      ? Boolean(teacher.scheduleName && l.teacher === teacher.scheduleName)
      : Boolean(selectedGroup && l.groups.includes(selectedGroup.code)),
  );
  const week = weekDates(date);
  const schedule = personal.filter((l) => week.includes(l.date));
  const future = personal
    .filter(
      (l) =>
        l.date > date ||
        (l.date === date &&
          l.endsAt >
            new Intl.DateTimeFormat("en-GB", {
              timeZone: "Europe/Moscow",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date())),
    )
    .sort((a, b) => (a.date + a.startsAt).localeCompare(b.date + b.startsAt));
  const groupId = account.group?.id;
  const courses = await db.course.findMany({
    where: teacher
      ? { teachers: { some: { teacherId: teacher.id } } }
      : student && groupId
        ? { status: "PUBLISHED", groups: { some: { groupId } } }
        : { id: { in: [] } },
    select: {
      id: true,
      title: true,
      description: true,
      semester: true,
      academicYear: true,
      status: true,
      groups: { select: { group: { select: { id: true, code: true } } } },
      _count: { select: { materials: true, assignments: true } },
    },
    orderBy: { title: "asc" },
  });
  const grades = student
    ? await db.gradeRecord.findMany({
        where: { studentId: student.id },
        include: {
          course: { select: { title: true } },
          teacher: {
            select: { firstName: true, lastName: true, middleName: true },
          },
        },
        orderBy: { assessedAt: "desc" },
      })
    : [];
  const assignments =
    student && courses.length
      ? await db.assignment.findMany({
          where: {
            courseId: { in: courses.map((c) => c.id) },
            status: "PUBLISHED",
          },
          select: {
            id: true,
            title: true,
            dueAt: true,
            maxScore: true,
            course: { select: { title: true } },
            submissions: {
              where: { studentId: student.id },
              select: { id: true, status: true, score: true, feedback: true },
            },
          },
          orderBy: { dueAt: "asc" },
        })
      : [];
  const reviewCount = teacher
    ? await db.submission.count({
        where: {
          status: "SUBMITTED",
          assignment: {
            course: { teachers: { some: { teacherId: teacher.id } } },
          },
        },
      })
    : 0;
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return {
    account,
    selectedGroup,
    schedule,
    nextLesson: future[0] || null,
    date,
    sourceDate: lessons.verifiedAt,
    courses,
    grades: grades.map((g) => ({
      id: g.id,
      subject: g.course.title,
      semester: g.semester,
      controlType: g.controlType,
      grade: g.grade,
      teacher: [g.teacher.lastName, g.teacher.firstName, g.teacher.middleName]
        .filter(Boolean)
        .join(" "),
      date: g.assessedAt,
    })),
    assignments,
    reviewCount,
    notifications,
    subjects: [...new Set(personal.map((l) => l.subject))].sort(),
    groups: [...new Set(personal.flatMap((l) => l.groups))].sort(),
  };
}
async function get(request: NextRequest, action: string) {
  const db = getDb();
  if (action === "config")
    return json({ enabled: true, mail: mailConfigured() });
  if (action === "groups")
    return json({
      groups: await db.group.findMany({
        where: { isActive: true },
        select: { id: true, code: true, specialization: true },
        orderBy: { code: "asc" },
      }),
    });
  const session = await requireSession(request);
  if (action === "me") return json({ account: accountDto(session) });
  if (action === "dashboard") {
    const date = request.nextUrl.searchParams.get("date") || moscowToday();
    if (!weekDates(date).length) throw new ApiError(400, "Некорректная дата");
    return json(await dashboard(session, date));
  }
  if (action === "profile")
    return json({
      account: accountDto(session),
      birthDate: session.user.birthDate?.toISOString().slice(0, 10) || "",
      studentNumber:
        session.user.student?.studentNumber ||
        session.user.affiliationRequests[0]?.studentNumber ||
        "",
    });
  if (action === "sessions") {
    const rows = await db.session.findMany({
      where: {
        userId: session.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        authVersion: session.user.authVersion,
      },
      select: {
        id: true,
        deviceLabel: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
        remembered: true,
      },
      orderBy: { createdAt: "desc" },
    });
    await db.session.updateMany({
      where: {
        id: session.id,
        lastSeenAt: { lt: new Date(Date.now() - 300000) },
      },
      data: { lastSeenAt: new Date() },
    });
    return json({
      sessions: rows.map((s) => ({ ...s, current: s.id === session.id })),
    });
  }
  if (action === "admin/requests") {
    requireAdmin(session);
    return json({
      requests: await db.affiliationRequest.findMany({
        where: { status: "PENDING" },
        select: {
          id: true,
          requestedRole: true,
          createdAt: true,
          studentNumber: true,
          group: { select: { code: true } },
          user: {
            select: {
              firstName: true,
              lastName: true,
              middleName: true,
              email: true,
              birthDate: true,
              emailVerifiedAt: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      teachers: teachers.teachers.map((t) => ({ id: t.id, name: t.name })),
      scheduleTeachers: [
        ...new Set(lessons.lessons.map((l) => l.teacher).filter(Boolean)),
      ].sort(),
    });
  }
  throw new ApiError(404, "Раздел не найден");
}
async function post(request: NextRequest, action: string) {
  assertMutation(request);
  const input = await readJson(request),
    db = getDb();
  const network =
    process.env.TRUST_PROXY === "1"
      ? request.headers.get("x-real-ip") || "unknown"
      : "local";
  // Logout must remain available even when anonymous requests are throttled.
  if (action === "logout") {
    const session = await readSession(request);
    if (session)
      await db.session.updateMany({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    const response = json({ ok: true });
    clearSession(response);
    return response;
  }
  const actions = [
    "register",
    "login",
    "reset-request",
    "verify-email",
    "reset-password",
    "resend-verification",
    "profile",
    "revoke-session",
    "change-password",
    "notification-read",
    "admin/review",
  ];
  if (!actions.includes(action)) throw new ApiError(404, "Действие не найдено");
  if (process.env.TRUST_PROXY === "1" && action !== "revoke-session")
    await limit(`network:${network}`, 200);
  if (action === "register") {
    const data = registrationSchema.parse(input);
    if (process.env.TRUST_PROXY === "1") await limit(`register:${network}`, 15);
    await limit(`register:${data.email}`, 4);
    if (
      data.requestedRole === "STUDENT" &&
      !(await db.group.findFirst({
        where: { id: data.groupId, isActive: true },
      }))
    )
      throw new ApiError(400, "Выберите действующую группу");
    const passwordHash = await hashPassword(data.password);
    const previous = await readSession(request);
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName || null,
          birthDate: new Date(data.birthDate + "T00:00:00Z"),
          affiliationRequests: {
            create: {
              requestedRole: data.requestedRole,
              ...(data.requestedRole === "STUDENT"
                ? { groupId: data.groupId, studentNumber: data.studentNumber }
                : {}),
            },
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "ACCOUNT_REGISTERED",
          entityType: "User",
          entityId: user.id,
          safeMetadata: { requestedRole: data.requestedRole },
        },
      });
      if (previous)
        await tx.session.updateMany({
          where: { id: previous.id },
          data: { revokedAt: new Date() },
        });
      return {
        user,
        session: await makeSession(
          tx,
          user.id,
          user.authVersion,
          data.remember,
          agent(request),
        ),
      };
    });
    const sent = await notify(result.user, "ACTIVATE");
    const response = json(
      {
        ok: true,
        emailSent: sent,
        message: sent
          ? "Аккаунт создан. Подтвердите e-mail и дождитесь проверки принадлежности к университету."
          : "Аккаунт создан. Отправка письма пока недоступна; его можно запросить в кабинете позже.",
      },
      201,
    );
    writeSession(response, result.session);
    return response;
  }
  if (action === "login") {
    const data = loginSchema.parse(input);
    await limit(`login:${data.email}`, 8);
    const user = await db.user.findUnique({ where: { email: data.email } });
    if (
      !(await verifyPassword(data.password, user?.passwordHash || null)) ||
      !user ||
      ["SUSPENDED", "ARCHIVED"].includes(user.status)
    )
      throw new ApiError(401, "Неверный e-mail или пароль");
    const old = await readSession(request);
    const session = await db.$transaction(async (tx) => {
      const current = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      if (
        current.passwordHash !== user.passwordHash ||
        current.authVersion !== user.authVersion ||
        ["SUSPENDED", "ARCHIVED"].includes(current.status)
      )
        throw new ApiError(401, "Повторите вход");
      if (old)
        await tx.session.updateMany({
          where: { id: old.id },
          data: { revokedAt: new Date() },
        });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "ACCOUNT_LOGIN",
          entityType: "User",
          entityId: user.id,
        },
      });
      return makeSession(
        tx,
        user.id,
        user.authVersion,
        data.remember,
        agent(request),
      );
    });
    const response = json({ ok: true });
    writeSession(response, session);
    return response;
  }
  if (action === "reset-request") {
    const { email } = z.object({ email: emailSchema }).strict().parse(input);
    await limit(`reset:${email}`, 3);
    if (!mailConfigured())
      throw new ApiError(
        503,
        "Отправка писем пока не настроена. Обратитесь к администратору портала.",
      );
    const user = await db.user.findUnique({ where: { email } });
    if (user && !["SUSPENDED", "ARCHIVED"].includes(user.status))
      await notify(user, "RESET_PASSWORD");
    return json({
      ok: true,
      message:
        "Если для этого адреса существует доступный аккаунт, письмо с инструкцией отправлено.",
    });
  }
  if (action === "verify-email" || action === "reset-password") {
    const data = (
      action === "verify-email"
        ? z.object({ token: tokenSchema }).strict()
        : z.object({ token: tokenSchema, password: passwordSchema }).strict()
    ).parse(input);
    await limit(
      `token:${process.env.TRUST_PROXY === "1" ? network : tokenHash(data.token)}`,
      30,
    );
    const purpose = action === "verify-email" ? "ACTIVATE" : "RESET_PASSWORD";
    const passwordHash =
      "password" in data && typeof data.password === "string"
        ? await hashPassword(data.password)
        : null;
    await db.$transaction(async (tx) => {
      const token = await tx.oneTimeToken.findUnique({
        where: { tokenHash: tokenHash(data.token) },
        include: { user: { select: { status: true } } },
      });
      if (
        !token ||
        token.purpose !== purpose ||
        token.consumedAt ||
        token.expiresAt <= new Date() ||
        ["SUSPENDED", "ARCHIVED"].includes(token.user.status)
      )
        throw new ApiError(
          400,
          "Ссылка недействительна или срок её действия истёк",
        );
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${token.userId}::uuid FOR UPDATE`;
      const consumed = await tx.oneTimeToken.updateMany({
        where: {
          id: token.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new ApiError(400, "Ссылка уже использована");
      if (passwordHash) {
        await tx.oneTimeToken.updateMany({
          where: {
            userId: token.userId,
            purpose: "RESET_PASSWORD",
            consumedAt: null,
          },
          data: { consumedAt: new Date() },
        });
        await tx.user.update({
          where: { id: token.userId },
          data: { passwordHash, authVersion: { increment: 1 } },
        });
        await tx.session.updateMany({
          where: { userId: token.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } else
        await tx.user.update({
          where: { id: token.userId },
          data: { emailVerifiedAt: new Date() },
        });
      await tx.auditLog.create({
        data: {
          actorId: token.userId,
          action: passwordHash ? "PASSWORD_RESET" : "EMAIL_VERIFIED",
          entityType: "User",
          entityId: token.userId,
        },
      });
    });
    const response = json({
      ok: true,
      message: passwordHash
        ? "Пароль изменён. Войдите с новым паролем."
        : "E-mail подтверждён. Заявку на принадлежность проверит администратор.",
    });
    if (passwordHash) clearSession(response);
    return response;
  }
  if (action === "logout") {
    const session = await readSession(request);
    if (session)
      await db.session.updateMany({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    const response = json({ ok: true });
    clearSession(response);
    return response;
  }
  const session = await requireSession(request),
    user = session.user;
  if (action === "resend-verification") {
    await limit(`verify:${user.id}`, 3);
    if (user.emailVerifiedAt)
      return json({ ok: true, message: "E-mail уже подтверждён" });
    if (!(await notify(user, "ACTIVATE")))
      throw new ApiError(
        503,
        "Отправка письма пока недоступна. Повторите позже.",
      );
    return json({ ok: true, message: "Письмо отправлено" });
  }
  if (action === "profile") {
    const data = profileSchema.parse(input);
    if (user.status !== "PENDING")
      throw new ApiError(
        409,
        "Подтверждённые ФИО изменяются через учебную часть",
      );
    const updated = await db.user.updateMany({
      where: { id: user.id, status: "PENDING" },
      data: { ...data, middleName: data.middleName || null },
    });
    if (!updated.count)
      throw new ApiError(
        409,
        "Подтверждённые ФИО изменяются через учебную часть",
      );
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "PROFILE_UPDATED",
        entityType: "User",
        entityId: user.id,
      },
    });
    return json({ ok: true, message: "Профиль сохранён" });
  }
  if (action === "revoke-session") {
    const { id, others } = z
      .object({
        id: z.string().uuid().optional(),
        others: z.boolean().optional(),
      })
      .strict()
      .refine((v) => Boolean(v.id) !== Boolean(v.others))
      .parse(input);
    const result = await db.session.updateMany({
      where: {
        userId: user.id,
        ...(others ? { id: { not: session.id } } : { id }),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    if (!others && !result.count) throw new ApiError(404, "Сессия не найдена");
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "SESSIONS_REVOKED",
        entityType: "User",
        entityId: user.id,
      },
    });
    const response = json({ ok: true });
    if (id === session.id) clearSession(response);
    return response;
  }
  if (action === "change-password") {
    const data = z
      .object({
        currentPassword: z.string().min(1).max(128),
        password: passwordSchema,
      })
      .strict()
      .parse(input);
    await limit(`password:${user.id}`, 5);
    if (!(await verifyPassword(data.currentPassword, user.passwordHash)))
      throw new ApiError(400, "Текущий пароль неверен");
    const passwordHash = await hashPassword(data.password);
    const renewed = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`;
      const changed = await tx.user.updateMany({
        where: { id: user.id, authVersion: user.authVersion },
        data: { passwordHash, authVersion: { increment: 1 } },
      });
      if (changed.count !== 1) throw new ApiError(409, "Повторите вход");
      await tx.oneTimeToken.updateMany({
        where: { userId: user.id, purpose: "RESET_PASSWORD", consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PASSWORD_CHANGED",
          entityType: "User",
          entityId: user.id,
        },
      });
      return makeSession(
        tx,
        user.id,
        user.authVersion + 1,
        session.remembered,
        agent(request),
      );
    });
    const response = json({
      ok: true,
      message: "Пароль изменён. Входы на остальных устройствах завершены.",
    });
    writeSession(response, renewed);
    return response;
  }
  if (action === "notification-read") {
    const { id } = z.object({ id: z.string().uuid() }).strict().parse(input);
    await db.notification.updateMany({
      where: { id, userId: user.id },
      data: { readAt: new Date() },
    });
    return json({ ok: true });
  }
  if (action === "admin/review") {
    requireAdmin(session);
    const data = z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["APPROVED", "REJECTED"]),
        note: z.string().trim().max(500).default(""),
        publicTeacherId: z.string().optional(),
        scheduleName: z.string().optional(),
      })
      .strict()
      .parse(input);
    await db.$transaction(async (tx) => {
      const applicant = await tx.affiliationRequest.findUnique({
        where: { id: data.id },
        select: { userId: true },
      });
      if (!applicant) throw new ApiError(409, "Заявка уже обработана");
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${applicant.userId}::uuid FOR UPDATE`;
      const row = await tx.affiliationRequest.findUnique({
        where: { id: data.id },
        include: { user: true, group: true },
      });
      if (!row || row.status !== "PENDING")
        throw new ApiError(409, "Заявка уже обработана");
      if (row.userId === user.id)
        throw new ApiError(403, "Свою заявку подтверждать нельзя");
      if (data.decision === "APPROVED") {
        if (!row.user.emailVerifiedAt || row.user.status !== "PENDING")
          throw new ApiError(
            409,
            "Сначала необходимо подтверждение e-mail и доступный аккаунт",
          );
        if (
          row.requestedRole === "TEACHER" &&
          (!teachers.teachers.some((t) => t.id === data.publicTeacherId) ||
            (data.scheduleName &&
              !lessons.lessons.some((l) => l.teacher === data.scheduleName)))
        )
          throw new ApiError(
            400,
            "Выберите подтверждённого преподавателя и корректную запись расписания",
          );
        if (
          row.requestedRole === "STUDENT" &&
          (!row.group?.isActive || !row.studentNumber || !row.user.birthDate)
        )
          throw new ApiError(
            400,
            "Проверьте группу, дату рождения и номер билета",
          );
      }
      const updated = await tx.affiliationRequest.updateMany({
        where: { id: row.id, status: "PENDING" },
        data: {
          status: data.decision,
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNote: data.note || null,
        },
      });
      if (updated.count !== 1) throw new ApiError(409, "Заявка уже обработана");
      if (data.decision === "APPROVED") {
        const names = {
          firstName: row.user.firstName,
          lastName: row.user.lastName,
          middleName: row.user.middleName,
          birthDate: row.user.birthDate,
        };
        if (row.requestedRole === "STUDENT")
          await tx.studentProfile.create({
            data: {
              ...names,
              birthDate: row.user.birthDate!,
              userId: row.userId,
              studentNumber: row.studentNumber!,
              memberships: {
                create: { groupId: row.groupId!, validFrom: new Date() },
              },
            },
          });
        else if (row.requestedRole === "TEACHER")
          await tx.teacherProfile.create({
            data: {
              ...names,
              userId: row.userId,
              publicTeacherId: data.publicTeacherId,
              scheduleName: data.scheduleName || null,
            },
          });
        else throw new ApiError(400, "Недопустимая роль заявки");
        await tx.userRole.create({
          data: {
            userId: row.userId,
            role: row.requestedRole,
            grantedById: user.id,
          },
        });
        await tx.user.update({
          where: { id: row.userId },
          data: { status: "ACTIVE" },
        });
      }
      await tx.notification.create({
        data: {
          userId: row.userId,
          title:
            data.decision === "APPROVED"
              ? "Принадлежность подтверждена"
              : "Заявка отклонена",
          body: data.note || "Статус вашей заявки обновлён.",
          href: "/dashboard",
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "AFFILIATION_" + data.decision,
          entityType: "AffiliationRequest",
          entityId: row.id,
        },
      });
    });
    return json({ ok: true });
  }
  throw new ApiError(404, "Действие не найдено");
}
export async function portalApi(request: NextRequest, action: string) {
  try {
    if (
      process.env.NODE_ENV === "production" &&
      productionConfigIssues(process.env).length
    )
      throw new ApiError(
        503,
        "Сервер регистрации ещё не настроен. Обратитесь к администратору.",
      );
    if (!process.env.DATABASE_URL)
      throw new ApiError(503, "Сервер аккаунтов ещё не настроен");
    return request.method === "GET"
      ? await get(request, action)
      : await post(request, action);
  } catch (error) {
    if (error instanceof ApiError)
      return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return json(
        { error: error.issues[0]?.message || "Проверьте поля формы" },
        400,
      );
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    )
      return json(
        {
          error:
            "Не удалось сохранить данные. Проверьте их или используйте вход в существующий аккаунт.",
        },
        409,
      );
    console.error(
      "Portal request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json({ error: "Сервис временно недоступен. Повторите позже." }, 503);
  }
}
