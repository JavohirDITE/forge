import { NextResponse } from "next/server";
import { db } from "@/server/db";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "x-api-key, content-type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Public Content Delivery API.
 *   GET /api/cdn/{spaceSlug}/{contentTypeApiId}?limit=20
 *   Header: x-api-key: forge_xxx
 *
 * Returns published entries only — this is the read side of the headless CMS.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ space: string; type: string }> },
) {
  const { space: spaceSlug, type: typeApiId } = await params;
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return json({ error: "Missing x-api-key header." }, 401);
  }

  const space = await db.space.findUnique({
    where: { slug: spaceSlug },
    select: { id: true },
  });
  if (!space) return json({ error: "Space not found." }, 404);

  const key = await db.apiKey.findFirst({
    where: { key: apiKey, spaceId: space.id },
    select: { id: true },
  });
  if (!key) return json({ error: "Invalid API key for this space." }, 403);

  const contentType = await db.contentType.findUnique({
    where: { spaceId_apiId: { spaceId: space.id, apiId: typeApiId } },
    select: { id: true, name: true, apiId: true },
  });
  if (!contentType) return json({ error: "Content type not found." }, 404);

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const [entries] = await Promise.all([
    db.entry.findMany({
      where: { contentTypeId: contentType.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
    db.apiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() },
    }),
  ]);

  return json(
    {
      meta: {
        space: spaceSlug,
        contentType: contentType.apiId,
        count: entries.length,
      },
      data: entries.map((e) => ({
        id: e.id,
        ...(e.data as object),
        _publishedAt: e.publishedAt,
        _updatedAt: e.updatedAt,
      })),
    },
    200,
  );
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: CORS });
}
