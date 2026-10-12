import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const email = process.argv[2]?.trim().toLowerCase();
if (!email || process.argv[3] !== "--grant-admin")
  throw new Error(
    "Usage: pnpm accounts:admin user@example.org --grant-admin (existing email-verified account only)",
  );
if (!process.env.DATABASE_URL) {
  const local = JSON.parse(
    readFileSync(".local/dev-db/connection.json", "utf8"),
  );
  process.env.DATABASE_URL = local.DATABASE_URL;
}
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { email } });
      if (
        !user?.emailVerifiedAt ||
        ["SUSPENDED", "ARCHIVED"].includes(user.status)
      )
        throw new Error(
          "Account must exist, be email-verified and not suspended",
        );
      await tx.userRole.upsert({
        where: { userId_role: { userId: user.id, role: "ADMIN" } },
        create: { userId: user.id, role: "ADMIN" },
        update: {},
      });
      await tx.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE", authVersion: { increment: 1 } },
      });
      await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          action: "ADMIN_BOOTSTRAP_BY_OPERATOR",
          entityType: "User",
          entityId: user.id,
        },
      });
    });
    console.log(
      "Administrator role granted by database operator. All previous sessions revoked; sign in again.",
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Bootstrap failed");
  process.exitCode = 1;
});
