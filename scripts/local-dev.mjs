#!/usr/bin/env node
// Install as scripts/local-dev.mjs; run from the project root with pnpm dev:local.
// Development only: PGlite uses the PostgreSQL protocol but is not a production server.
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { open, readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { resolve, dirname, delimiter, join } from "node:path";

const project = process.cwd();
const requireProject = createRequire(resolve(project, "package.json"));
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 24 || (major === 24 && minor < 7)) {
  console.error("Требуется Node.js 24.7 или новее: в нём доступен Argon2.");
  process.exit(1);
}
const env = { ...process.env };
let child, db, socketServer, lock, lockPath, closing;
let stopRequested = false;
let databaseSecret = "";

function say(message) {
  console.log(`[portal] ${message}`);
}
function safeError(error) {
  let message = error instanceof Error ? error.message : String(error);
  message = message.replace(
    /postgres(?:ql)?:\/\/[^\s"']+/gi,
    "[DATABASE_URL скрыт]",
  );
  if (databaseSecret)
    message = message.split(databaseSecret).join("[секрет скрыт]");
  return message;
}
function portValue(value, fallback) {
  const port = value == null || value === "" ? fallback : Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error(
      "PORTAL_PORT / PORTAL_DB_PORT должны быть целыми числами от 1024 до 65535.",
    );
  return port;
}
async function packageBin(name, binName) {
  const packagePath = requireProject.resolve(`${name}/package.json`);
  const metadata = JSON.parse(await readFile(packagePath, "utf8"));
  const relative =
    typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.[binName];
  if (!relative)
    throw new Error(`Не найдена команда ${binName}; выполните pnpm install.`);
  return resolve(dirname(packagePath), relative);
}
function pipeSafe(stream, target) {
  let pending = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split("\n");
    pending = lines.pop() || "";
    for (const line of lines) target.write(safeError(line) + "\n");
  });
  stream.on("end", () => {
    if (pending) target.write(safeError(pending));
  });
}
async function run(label, executable, args) {
  if (stopRequested) return;
  say(label);
  const current = spawn(process.execPath, [executable, ...args], {
    cwd: project,
    env,
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    windowsHide: true,
    detached: process.platform !== "win32",
  });
  child = current;
  pipeSafe(current.stdout, process.stdout);
  pipeSafe(current.stderr, process.stderr);
  try {
    const [code, signal] = await once(current, "exit");
    if (!stopRequested && code !== 0)
      throw new Error(
        `${label}: процесс завершился ${signal ? `по ${signal}` : `с кодом ${code}`}.`,
      );
  } finally {
    if (child === current) child = undefined;
  }
}
async function stopChild() {
  const current = child;
  if (!current || current.exitCode !== null || !current.pid) return;
  if (process.platform === "win32") {
    // Next dev starts a worker, so stop the owned process tree, not only its CLI.
    const killer = spawn(
      "taskkill",
      ["/PID", String(current.pid), "/T", "/F"],
      {
        stdio: "ignore",
        windowsHide: true,
        shell: false,
      },
    );
    await once(killer, "exit").catch(() => {});
  } else {
    try {
      process.kill(-current.pid, "SIGTERM");
    } catch {
      /* already stopped */
    }
    let timer;
    await Promise.race([
      once(current, "exit").catch(() => {}),
      new Promise((done) => {
        timer = setTimeout(done, 5000);
      }),
    ]);
    clearTimeout(timer);
    if (current.exitCode === null) {
      try {
        process.kill(-current.pid, "SIGKILL");
      } catch {
        /* already stopped */
      }
    }
  }
}
async function shutdown() {
  if (closing) return closing;
  closing = (async () => {
    await stopChild();
    await socketServer?.stop().catch((e) => console.error(safeError(e)));
    await db?.close().catch((e) => console.error(safeError(e)));
    if (lock) {
      await lock.close();
      await unlink(lockPath).catch(() => {});
      lock = undefined;
    }
  })();
  return closing;
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (stopRequested) return;
    stopRequested = true;
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    say("Завершаем приложение и сохраняем локальную базу…");
    // If startup is still opening the database, let it settle before finally
    // closes it. Exiting immediately can interrupt PGlite initialization.
    void stopChild();
  });
}

try {
  // Existing shell settings take precedence over .env. No secrets are written to .env.
  const dotenv = requireProject("dotenv");
  const loaded = dotenv.config({
    path: resolve(project, ".env"),
    processEnv: env,
    quiet: true,
  });
  if (loaded.error && loaded.error.code !== "ENOENT") throw loaded.error;
  env.PATH = [
    resolve(project, "node_modules/.bin"),
    env.PATH || env.Path || "",
  ].join(delimiter);
  env.NODE_ENV = "development";
  delete env.PORTAL_STATIC_EXPORT;
  delete env.NEXT_PUBLIC_PORTAL_DEMO;
  const configuredUrl = env.APP_URL ? new URL(env.APP_URL) : null;
  if (
    configuredUrl &&
    (configuredUrl.protocol !== "http:" ||
      !["127.0.0.1", "localhost"].includes(configuredUrl.hostname))
  )
    throw new Error(
      "Для dev:local APP_URL должен быть http://127.0.0.1:<порт> или http://localhost:<порт>. Публичный HTTPS URL оставьте в окружении production.",
    );
  const appPort = portValue(
    env.PORTAL_PORT || env.PORT || configuredUrl?.port,
    3000,
  );
  const origin = new URL(configuredUrl?.origin || "http://127.0.0.1");
  origin.port = String(appPort);
  env.APP_URL = origin.origin;
  if (!env.MAIL_MODE && !(env.SMTP_HOST && env.SMTP_FROM))
    env.MAIL_MODE = "local";

  if (env.DATABASE_URL?.trim()) {
    say(
      "Используем DATABASE_URL из окружения или .env. Автоматический PGlite не запускается.",
    );
  } else {
    // Resolve dependencies through Prisma, without coupling to a pnpm store version/path.
    const requirePrisma = createRequire(
      requireProject.resolve("prisma/package.json"),
    );
    const requireDev = createRequire(requirePrisma.resolve("@prisma/dev"));
    const { PGlite } = requireDev("@electric-sql/pglite");
    const { PGLiteSocketServer } = requireDev("@electric-sql/pglite-socket");
    const directory = resolve(project, ".local/dev-db");
    const configPath = join(directory, "connection.json");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    lockPath = join(directory, "server.lock");
    try {
      lock = await open(lockPath, "wx", 0o600);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let owner = "неизвестен";
      try {
        owner = JSON.parse(await readFile(lockPath, "utf8")).pid;
      } catch {
        /* damaged lock */
      }
      throw new Error(
        `Локальная база уже заблокирована (PID: ${owner}). Завершите прежний dev:local. После аварийного завершения проверьте, что этот PID больше не работает, затем удалите только ${lockPath}. Данные базы удалять не нужно.`,
      );
    }
    await lock.writeFile(
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
    );
    let previous;
    try {
      previous = JSON.parse(await readFile(configPath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT")
        throw new Error(
          "Повреждён .local/dev-db/connection.json; не запускаем базу с неизвестной конфигурацией.",
        );
    }
    databaseSecret = previous?.password || randomBytes(32).toString("hex");
    if (!/^[a-f0-9]{64}$/.test(databaseSecret))
      throw new Error("Некорректный секрет локальной базы.");
    const dbPort = portValue(env.PORTAL_DB_PORT, 55434);
    db = await PGlite.create(join(directory, "data"), {
      postgresOptions: ["-c", "shared_buffers=16MB", "-c", "work_mem=1MB"],
    });
    const role = await db.query(
      "SELECT 1 FROM pg_roles WHERE rolname = 'postgres'",
    );
    await db.exec(
      `${role.rows.length ? "ALTER" : "CREATE"} ROLE postgres WITH LOGIN SUPERUSER PASSWORD '${databaseSecret}'`,
    );
    await db.exec("SET ROLE postgres");
    socketServer = new PGLiteSocketServer({
      db,
      host: "127.0.0.1",
      port: dbPort,
      maxConnections: 10,
      debug: false,
      inspect: false,
    });
    await socketServer.start();
    env.DATABASE_URL = `postgresql://postgres:${databaseSecret}@127.0.0.1:${dbPort}/template1?sslmode=disable`;
    const { Client } = requireProject("pg");
    const probe = new Client({ connectionString: env.DATABASE_URL });
    try {
      await probe.connect();
      const result = await probe.query(
        "SELECT EXTRACT(EPOCH FROM clock_timestamp()) * 1000 AS milliseconds",
      );
      const skew = Math.abs(Number(result.rows[0].milliseconds) - Date.now());
      if (skew > 30000)
        say(
          `Внимание: часы JS и базы расходятся примерно на ${Math.round(skew / 1000)} с; проверьте системное время.`,
        );
    } finally {
      await probe.end();
    }
    await writeFile(
      configPath,
      JSON.stringify(
        {
          developmentOnly: true,
          password: databaseSecret,
          DATABASE_URL: env.DATABASE_URL,
          pid: process.pid,
          port: dbPort,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    say(
      `Локальная база готова: 127.0.0.1:${dbPort}. Данные: .local/dev-db/data. Только для разработки.`,
    );
  }
  const prisma = await packageBin("prisma", "prisma");
  await run("Генерация Prisma Client", prisma, ["generate"]);
  await run("Применение миграций", prisma, ["migrate", "deploy"]);
  await run("Заполнение справочников", await packageBin("tsx", "tsx"), [
    resolve(project, "prisma/seed.ts"),
  ]);
  say(
    `Откройте ${env.APP_URL}/. Ctrl+C завершает приложение и локальную базу.`,
  );
  if (env.MAIL_MODE === "local")
    say(
      "Тестовые письма сохраняются в .local/mail; наружу они не отправляются.",
    );
  await run("Запуск Next.js", await packageBin("next", "next"), [
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(appPort),
  ]);
} catch (error) {
  if (!stopRequested) {
    console.error(`[portal] ${safeError(error)}`);
    process.exitCode = 1;
  }
} finally {
  await shutdown();
}
