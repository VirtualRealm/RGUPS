import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { productionConfigIssues } from "@/server/runtime-config.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    if (
      process.env.NODE_ENV === "production" &&
      productionConfigIssues(process.env).length
    )
      throw new Error("Configuration not ready");
    await getDb().user.findFirst({ select: { authVersion: true } });
    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
