/** Validate deployment settings without returning or logging secret values.
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function productionConfigIssues(env) {
  const issues = [];
  let origin;
  try {
    origin = new URL(env.APP_URL || "");
    if (
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      origin.pathname !== "/"
    )
      issues.push(
        "APP_URL must be an HTTPS origin without a path or credentials",
      );
    if (
      ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) ||
      origin.hostname.endsWith(".invalid") ||
      origin.hostname.endsWith(".example")
    )
      issues.push("APP_URL must use the real deployment domain");
  } catch {
    issues.push("APP_URL is required");
  }
  try {
    const db = new URL(env.DATABASE_URL || "");
    if (
      !["postgres:", "postgresql:"].includes(db.protocol) ||
      !db.hostname ||
      !db.pathname.slice(1)
    )
      issues.push("DATABASE_URL must address a PostgreSQL database");
    if (
      !db.password ||
      /^(local_dev_change_me|change_me|password|postgres)$/i.test(
        decodeURIComponent(db.password),
      )
    )
      issues.push("DATABASE_URL requires a non-default database password");
  } catch {
    issues.push("DATABASE_URL is required and must be a valid URL");
  }
  if (env.MAIL_MODE !== "smtp")
    issues.push("MAIL_MODE must be smtp in production");
  if (!env.SMTP_HOST?.trim()) issues.push("SMTP_HOST is required");
  if (!env.SMTP_FROM || !/^[^\r\n]+@[^\r\n]+$/.test(env.SMTP_FROM))
    issues.push("SMTP_FROM is required");
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    issues.push("SMTP_PORT must be a valid port");
  if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD))
    issues.push("SMTP_USER and SMTP_PASSWORD must be configured together");
  if (env.NEXT_PUBLIC_PORTAL_DEMO === "1" || env.PORTAL_STATIC_EXPORT === "1")
    issues.push("Demo/static mode must be disabled for the account server");
  if (env.TRUST_PROXY && !["0", "1"].includes(env.TRUST_PROXY))
    issues.push("TRUST_PROXY must be 0 or 1");
  return issues;
}
