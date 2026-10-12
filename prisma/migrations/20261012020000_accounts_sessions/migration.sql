ALTER TABLE "User" ADD COLUMN "firstName" VARCHAR(80) NOT NULL DEFAULT '', ADD COLUMN "lastName" VARCHAR(80) NOT NULL DEFAULT '', ADD COLUMN "middleName" VARCHAR(80), ADD COLUMN "birthDate" DATE, ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TeacherProfile" ADD COLUMN "publicTeacherId" TEXT, ADD COLUMN "scheduleName" TEXT;
CREATE UNIQUE INDEX "TeacherProfile_publicTeacherId_key" ON "TeacherProfile"("publicTeacherId");
ALTER TABLE "Session" ADD COLUMN "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN "deviceLabel" VARCHAR(120) NOT NULL DEFAULT 'Браузер', ADD COLUMN "remembered" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AffiliationRequest" ADD COLUMN "groupId" UUID, ADD COLUMN "studentNumber" VARCHAR(30), ADD COLUMN "reviewNote" VARCHAR(500);
ALTER TABLE "AffiliationRequest" ADD CONSTRAINT "AffiliationRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "AffiliationRequest_pending_user" ON "AffiliationRequest"("userId") WHERE "status" = 'PENDING';
CREATE TABLE "AuthRateLimit" ("key" VARCHAR(64) NOT NULL, "attempts" INTEGER NOT NULL DEFAULT 0, "resetsAt" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key"));
CREATE INDEX "AuthRateLimit_resetsAt_idx" ON "AuthRateLimit"("resetsAt");
