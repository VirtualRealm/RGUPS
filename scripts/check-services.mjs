import { productionConfigIssues } from "../src/server/runtime-config.mjs";
import { Client } from "pg";
import nodemailer from "nodemailer";
const issues = productionConfigIssues(process.env);
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
try {
  await client.connect();
  await client.query('SELECT "authVersion" FROM "User" LIMIT 1');
  console.log("Database and account schema: ready");
} catch {
  console.error(
    "Database/schema check failed. Check connection settings and applied migrations.",
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
const port = Number(process.env.SMTP_PORT || 587);
const mail = nodemailer.createTransport({
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
try {
  await mail.verify();
  console.log(
    "SMTP connection/authentication: ready. No email sent; sender acceptance still needs an actual activation test.",
  );
} catch {
  console.error("SMTP verification failed. Check host, TLS and credentials.");
  process.exitCode = 1;
} finally {
  mail.close();
}
