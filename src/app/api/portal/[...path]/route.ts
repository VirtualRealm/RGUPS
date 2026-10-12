import { NextRequest } from "next/server";
import { portalApi } from "@/server/auth/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: NextRequest, context: Context) {
  return portalApi(request, (await context.params).path.join("/"));
}
export async function POST(request: NextRequest, context: Context) {
  return portalApi(request, (await context.params).path.join("/"));
}
