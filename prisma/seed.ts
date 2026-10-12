import "dotenv/config";
import lessons from "../src/content/schedule-lessons.json";
import schedules from "../src/content/schedule.json";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL before seeding.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
async function main() {
  const codes=[...new Set([...lessons.lessons.flatMap(l=>l.groups),...schedules.changes.map(l=>l.group)])].filter(code=>/-[2-3][0-9][1-9]$/.test(code));
  for(const code of codes){
    const year=2000+Number(code.slice(-3,-1));
    const entry=lessons.lessons.find(l=>l.groups.includes(code));
    const values={specialization:entry?'ВО · группа из опубликованного расписания':'СПО · группа из опубликованных замен',course:entry?.course||Math.max(1,2026-year+1),yearStarted:year,isActive:true};
    await db.group.upsert({where:{code},create:{code,...values},update:{}});
  }
  for (const [slug, title] of [
    ["retraining", "Профессиональная переподготовка"],
    ["skills", "Повышение квалификации"],
    ["training", "Подготовка"],
  ])
    await db.programCategory.upsert({
      where: { slug },
      create: { slug, title },
      update: {},
    });
  console.log(
    "Seed completed: published timetable groups and program categories; no user accounts created.",
  );
}
main().finally(() => db.$disconnect());
