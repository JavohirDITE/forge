import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Forge…");
  const passwordHash = await bcrypt.hash("password123", 12);

  const demo = await db.user.upsert({
    where: { email: "demo@forge.app" },
    update: {},
    create: {
      email: "demo@forge.app",
      name: "Demo User",
      passwordHash,
      avatarColor: "#f97316",
    },
  });

  const space = await db.space.create({
    data: {
      name: "Demo Blog",
      slug: "demo-blog",
      description: "A sample space showcasing content modeling in Forge.",
      ownerId: demo.id,
      members: { create: { userId: demo.id, role: "OWNER" } },
      apiKeys: {
        create: { name: "Default key", key: `forge_${randomBytes(24).toString("hex")}` },
      },
    },
  });

  const blogPost = await db.contentType.create({
    data: {
      spaceId: space.id,
      name: "Blog Post",
      apiId: "blogPost",
      icon: "Newspaper",
      fields: {
        create: [
          { name: "Title", apiId: "title", type: "TEXT", required: true, order: 0 },
          { name: "Excerpt", apiId: "excerpt", type: "TEXT", order: 1 },
          { name: "Body", apiId: "body", type: "RICHTEXT", required: true, order: 2 },
          { name: "Cover Image", apiId: "coverImage", type: "MEDIA", order: 3 },
          {
            name: "Category",
            apiId: "category",
            type: "SELECT",
            order: 4,
            config: { options: ["Engineering", "Product", "Design"] },
          },
          { name: "Featured", apiId: "featured", type: "BOOLEAN", order: 5 },
        ],
      },
    },
  });

  const posts = [
    {
      title: "Shipping a headless CMS with tRPC",
      excerpt: "How end-to-end types changed the way we build content tools.",
      body: "<h2>Why headless?</h2><p>Decoupling content from presentation lets every surface — web, mobile, kiosk — pull from one typed API.</p>",
      category: "Engineering",
      featured: true,
      status: "PUBLISHED" as const,
    },
    {
      title: "Designing for editors, not databases",
      excerpt: "A good editing experience is a product feature.",
      body: "<p>Editors shouldn't think in tables. They think in <strong>stories</strong>.</p>",
      category: "Design",
      featured: false,
      status: "PUBLISHED" as const,
    },
    {
      title: "Draft: roadmap notes",
      excerpt: "",
      body: "<p>Scheduling, localization, webhooks…</p>",
      category: "Product",
      featured: false,
      status: "DRAFT" as const,
    },
  ];

  for (const p of posts) {
    const { status, ...data } = p;
    await db.entry.create({
      data: {
        contentTypeId: blogPost.id,
        spaceId: space.id,
        authorId: demo.id,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        data,
      },
    });
  }

  console.log("✅ Seeded space 'demo-blog' with a Blog Post type and 3 entries.");
  console.log("→ Sign in with demo@forge.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
