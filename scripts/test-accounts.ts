import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile, unlink } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword, tokenHash } from "../src/server/auth/crypto";

// Explicitly local integration fixtures only: no real email delivery or production DB.
if (!process.env.DATABASE_URL) {
  const local = JSON.parse(
    readFileSync(".local/dev-db/connection.json", "utf8"),
  );
  process.env.DATABASE_URL = local.DATABASE_URL;
  process.env.MAIL_MODE ||= "local";
}
const origin = new URL(process.env.APP_URL || "http://127.0.0.1:3000").origin;
assert(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
assert(
  ["127.0.0.1", "localhost"].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  ),
);
assert.equal(process.env.MAIL_MODE, "local");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const run = randomUUID().slice(0, 8),
  password = `Fixture-${randomUUID()}`;
const emails = ["student", "teacher", "admin", "other"].map(
  (s) => `${s}-${run}@example.invalid`,
);
const ids: string[] = [],
  courseIds: string[] = [],
  subjectIds: string[] = [];
let checks = 0;
async function call(
  action: string,
  body?: unknown,
  cookie = "",
  headers: Record<string, string> = {},
) {
  const r = await fetch(`${origin}/api/portal/${action}/`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: origin,
      "X-Portal-Request": "1",
      "Content-Type": "application/json",
      Cookie: cookie,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error",
  });
  const data = await r.json();
  return {
    status: r.status,
    data,
    cookie: r.headers.get("set-cookie")?.split(";")[0] || "",
    headers: r.headers,
  };
}
function status(
  r: Awaited<ReturnType<typeof call>>,
  expected: number,
  label: string,
) {
  assert.equal(r.status, expected, `${label}: ${JSON.stringify(r.data)}`);
  checks++;
}
async function mailToken(email: string, purpose: string) {
  const files = await readdir(".local/mail");
  const messages = await Promise.all(
    files.map(async (name) => ({
      name,
      data: JSON.parse(await readFile(`.local/mail/${name}`, "utf8")),
    })),
  );
  const active = await db.oneTimeToken.findFirstOrThrow({
    where: {
      user: { email },
      purpose: purpose as "ACTIVATE" | "RESET_PASSWORD",
      consumedAt: null,
    },
  });
  const message = messages.find(
    (m) =>
      m.data.to === email &&
      m.data.purpose === purpose &&
      tokenHash(
        new URLSearchParams(new URL(m.data.url).hash.slice(1)).get("token")!,
      ) === active.tokenHash,
  );
  assert(message, "Local email was not created");
  return new URLSearchParams(new URL(message.data.url).hash.slice(1)).get(
    "token",
  )!;
}
async function main() {
  try {
    status(await call("me"), 401, "anonymous data");
    status(
      await call("register", {}, "", { Origin: "https://untrusted.invalid" }),
      403,
      "CSRF origin",
    );
    status(
      await call("register", {}, "", { "X-Portal-Request": "" }),
      403,
      "CSRF header",
    );
    status(
      await call("register", { extra: "x".repeat(17000) }),
      413,
      "body limit",
    );
    status(
      await call("register", { requestedRole: "ADMIN" }),
      400,
      "privileged role",
    );
    const groups = (await call("groups")).data.groups;
    assert(groups.length > 10);
    const groupId =
      groups.find((g: { code: string }) => g.code === "ВДЖУ-241")?.id ||
      groups[0].id;
    const form = {
      firstName: "Тестовый",
      lastName: "Пользователь",
      middleName: "",
      birthDate: "2000-01-01",
      password,
      requestedRole: "STUDENT",
      groupId,
      studentNumber: `TEST-${run}`,
      remember: true,
    };
    const registered = await call("register", { ...form, email: emails[0] });
    status(registered, 201, "student registration");
    let studentCookie = registered.cookie;
    assert.match(registered.headers.get("set-cookie")!, /HttpOnly/i);
    assert.match(registered.headers.get("set-cookie")!, /SameSite=lax/i);
    assert.match(registered.headers.get("set-cookie")!, /Max-Age=2592000/);
    assert.equal(registered.data.emailSent, true);
    const student = (await call("me", undefined, studentCookie)).data.account;
    ids.push(student.id);
    assert.deepEqual(student.roles, []);
    assert.equal(student.status, "PENDING");
    const hash = (
      await db.user.findUniqueOrThrow({ where: { id: student.id } })
    ).passwordHash;
    assert.match(hash!, /^\$argon2id\$/);
    assert.notEqual(hash, password);
    assert.equal(
      await db.session.count({
        where: { tokenHash: tokenHash(studentCookie.split("=")[1]) },
      }),
      1,
    );
    status(
      await call("admin/requests", undefined, studentCookie),
      403,
      "student admin denied",
    );
    const secondLogin = await call("login", {
      email: emails[0],
      password,
      remember: false,
    });
    status(secondLogin, 200, "new browser login");
    assert(!/Max-Age/i.test(secondLogin.headers.get("set-cookie")!));
    status(
      await call("me", undefined, studentCookie),
      200,
      "remembered browser remains valid",
    );
    status(
      await call("revoke-session", { others: true }, studentCookie),
      200,
      "revoke other browser",
    );
    status(
      await call("me", undefined, secondLogin.cookie),
      401,
      "revoked browser denied",
    );

    const teacherReg = await call("register", {
      ...form,
      groupId: undefined,
      studentNumber: undefined,
      email: emails[1],
      requestedRole: "TEACHER",
      remember: false,
    });
    status(teacherReg, 201, "teacher registration");
    const teacherCookie = teacherReg.cookie;
    const teacher = (await call("me", undefined, teacherCookie)).data.account;
    ids.push(teacher.id);
    assert.deepEqual(teacher.roles, []);
    assert.equal(
      await db.teacherProfile.count({ where: { userId: teacher.id } }),
      0,
    );
    const teacherSession = (await call("sessions", undefined, teacherCookie))
      .data.sessions[0];
    status(
      await call("revoke-session", { id: teacherSession.id }, studentCookie),
      404,
      "foreign device protected",
    );

    const admin = await db.user.create({
      data: {
        email: emails[2],
        passwordHash: await hashPassword(password),
        firstName: "Тестовый",
        lastName: "Администратор",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: { create: { role: "ADMIN" } },
      },
    });
    ids.push(admin.id);
    const adminCookie = (
      await call("login", { email: emails[2], password, remember: false })
    ).cookie;
    const studentRequest = await db.affiliationRequest.findFirstOrThrow({
      where: { userId: student.id },
    });
    status(
      await call(
        "admin/review",
        { id: studentRequest.id, decision: "APPROVED" },
        adminCookie,
      ),
      409,
      "unverified email cannot activate",
    );
    for (const email of emails.slice(0, 2)) {
      const token = await mailToken(email, "ACTIVATE");
      status(await call("verify-email", { token }), 200, "email verification");
      status(
        await call("verify-email", { token }),
        400,
        "activation replay denied",
      );
    }
    status(
      await call(
        "admin/review",
        { id: studentRequest.id, decision: "APPROVED" },
        adminCookie,
      ),
      200,
      "student affiliation approved",
    );
    status(
      await call(
        "admin/review",
        { id: studentRequest.id, decision: "APPROVED" },
        adminCookie,
      ),
      409,
      "double approval denied",
    );
    const adminData = (await call("admin/requests", undefined, adminCookie))
      .data;
    const teacherRequest = await db.affiliationRequest.findFirstOrThrow({
      where: { userId: teacher.id },
    });
    status(
      await call(
        "admin/review",
        { id: teacherRequest.id, decision: "APPROVED" },
        adminCookie,
      ),
      400,
      "teacher mapping required",
    );
    const used = new Set(
      (
        await db.teacherProfile.findMany({ select: { publicTeacherId: true } })
      ).map((t) => t.publicTeacherId),
    );
    const publicTeacherId = adminData.teachers.find(
      (t: { id: string }) => !used.has(t.id),
    ).id;
    status(
      await call(
        "admin/review",
        {
          id: teacherRequest.id,
          decision: "APPROVED",
          publicTeacherId,
          scheduleName: adminData.scheduleTeachers[0],
        },
        adminCookie,
      ),
      200,
      "teacher affiliation approved",
    );
    const approved = (await call("me", undefined, studentCookie)).data.account;
    assert.deepEqual(approved.roles, ["STUDENT"]);
    assert.equal(approved.group.id, groupId);
    const studentProfile = await db.studentProfile.findUniqueOrThrow({
      where: { userId: student.id },
    });
    const teacherProfile = await db.teacherProfile.findUniqueOrThrow({
      where: { userId: teacher.id },
    });
    const other = await db.user.create({
      data: {
        email: emails[3],
        passwordHash: hash,
        firstName: "Другой",
        lastName: "Студент",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: { create: { role: "STUDENT" } },
        student: {
          create: {
            firstName: "Другой",
            lastName: "Студент",
            birthDate: new Date("2000-01-01"),
            studentNumber: `OTHER-${run}`,
            memberships: { create: { groupId, validFrom: new Date() } },
          },
        },
      },
    });
    ids.push(other.id);
    const otherCookie = (
      await call("login", { email: emails[3], password, remember: false })
    ).cookie;
    const subject = await db.subject.create({
      data: { code: `TEST-${run}`, title: "Интеграционная проверка" },
    });
    subjectIds.push(subject.id);
    const course = await db.course.create({
      data: {
        subjectId: subject.id,
        title: "Тестовый курс",
        academicYear: 2026,
        semester: 1,
        status: "PUBLISHED",
        groups: { create: { groupId } },
        teachers: { create: { teacherId: teacherProfile.id } },
      },
    });
    courseIds.push(course.id);
    await db.gradeRecord.create({
      data: {
        studentId: studentProfile.id,
        teacherId: teacherProfile.id,
        courseId: course.id,
        semester: 1,
        controlType: "EXAM",
        grade: "5",
        assessedAt: new Date(),
      },
    });
    const mine = (await call("dashboard", undefined, studentCookie)).data;
    assert.equal(mine.grades.length, 1);
    assert.equal(mine.courses.length, 1);
    assert.equal(
      (await call("dashboard", undefined, otherCookie)).data.grades.length,
      0,
    );
    checks++;
    status(
      await call(
        "profile",
        { firstName: "Подмена", lastName: "Данных" },
        studentCookie,
      ),
      409,
      "verified identity cannot self-edit",
    );
    const stale = studentCookie;
    status(
      await call("reset-request", { email: emails[0] }),
      200,
      "request before password change",
    );
    const obsoleteReset = await mailToken(emails[0], "RESET_PASSWORD");
    const password2 = `Changed-${randomUUID()}`;
    const changed = await call(
      "change-password",
      { currentPassword: password, password: password2 },
      studentCookie,
    );
    status(changed, 200, "password change");
    studentCookie = changed.cookie;
    status(
      await call("me", undefined, stale),
      401,
      "previous session revoked on change",
    );
    status(
      await call("me", undefined, studentCookie),
      200,
      "new current session",
    );
    status(
      await call("reset-password", { token: obsoleteReset, password }),
      400,
      "change invalidates old recovery link",
    );
    status(
      await call("login", { email: emails[0], password, remember: false }),
      401,
      "old password denied",
    );
    const known = await call("reset-request", { email: emails[0] });
    const unknown = await call("reset-request", {
      email: `absent-${run}@example.invalid`,
    });
    assert.deepEqual(known.data, unknown.data);
    status(known, 200, "neutral recovery response");
    const resetToken = await mailToken(emails[0], "RESET_PASSWORD"),
      password3 = `Reset-${randomUUID()}`;
    status(
      await call("reset-password", { token: resetToken, password: password3 }),
      200,
      "password reset",
    );
    status(
      await call("reset-password", { token: resetToken, password: password3 }),
      400,
      "reset replay denied",
    );
    status(
      await call("me", undefined, studentCookie),
      401,
      "reset revokes sessions",
    );
    const finalLogin = await call("login", {
      email: emails[0],
      password: password3,
      remember: true,
    });
    status(finalLogin, 200, "recovered account login");
    status(await call("logout", {}, finalLogin.cookie), 200, "logout");
    status(
      await call("me", undefined, finalLogin.cookie),
      401,
      "logout revokes token",
    );
    const absent = `throttled-${run}@example.invalid`;
    for (let i = 0; i < 8; i++)
      status(
        await call("login", { email: absent, password, remember: false }),
        401,
        "unknown password rejected",
      );
    status(
      await call("login", { email: absent, password, remember: false }),
      429,
      "login throttling",
    );
    const audit = JSON.stringify(
      await db.auditLog.findMany({ where: { actorId: { in: ids } } }),
    );
    for (const secret of [password, password2, password3, resetToken])
      assert(!audit.includes(secret));
    console.log(
      `PASS: ${checks} HTTP/security checks; registration, sessions, approvals, grade isolation and recovery.`,
    );
  } finally {
    // Remove only UUIDs created by this test, respecting relations. Never reset the database.
    const found = await db.user.findMany({
      where: { email: { in: emails } },
      select: { id: true },
    });
    const userIds = found.map((u) => u.id);
    const students = (
      await db.studentProfile.findMany({ where: { userId: { in: userIds } } })
    ).map((s) => s.id);
    await db.gradeRecord.deleteMany({ where: { courseId: { in: courseIds } } });
    await db.courseGroup.deleteMany({ where: { courseId: { in: courseIds } } });
    await db.courseTeacher.deleteMany({
      where: { courseId: { in: courseIds } },
    });
    await db.course.deleteMany({ where: { id: { in: courseIds } } });
    await db.subject.deleteMany({ where: { id: { in: subjectIds } } });
    await db.studentGroupMembership.deleteMany({
      where: { studentId: { in: students } },
    });
    await db.studentProfile.deleteMany({ where: { userId: { in: userIds } } });
    await db.teacherProfile.deleteMany({ where: { userId: { in: userIds } } });
    await db.affiliationRequest.deleteMany({
      where: { userId: { in: userIds } },
    });
    await db.notification.deleteMany({ where: { userId: { in: userIds } } });
    await db.session.deleteMany({ where: { userId: { in: userIds } } });
    await db.oneTimeToken.deleteMany({ where: { userId: { in: userIds } } });
    await db.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await db.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    for (const name of await readdir(".local/mail").catch(() => [])) {
      const file = `.local/mail/${name}`,
        message = JSON.parse(await readFile(file, "utf8"));
      if (emails.includes(message.to)) await unlink(file);
    }
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
