import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { router, protectedProcedure } from "@/server/trpc";
import { assertSpaceAccess } from "@/server/access";
import { slugify } from "@/lib/utils";

export const spaceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.space.findMany({
      where: { members: { some: { userId: ctx.session.userId } } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { contentTypes: true, entries: true } },
      },
    });
  }),

  bySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const space = await ctx.db.space.findUnique({
        where: { slug: input.slug },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarColor: true },
              },
            },
          },
          _count: { select: { entries: true, assets: true } },
        },
      });
      if (!space) throw new TRPCError({ code: "NOT_FOUND" });
      const role = await assertSpaceAccess(ctx.db, space.id, ctx.session.userId);
      return { ...space, viewerRole: role };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(60),
        description: z.string().max(300).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let slug = slugify(input.name);
      const clash = await ctx.db.space.findUnique({ where: { slug } });
      if (clash) slug = `${slug}-${randomBytes(2).toString("hex")}`;

      return ctx.db.space.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          ownerId: ctx.session.userId,
          members: { create: { userId: ctx.session.userId, role: "OWNER" } },
          apiKeys: {
            create: {
              name: "Default key",
              key: `forge_${randomBytes(24).toString("hex")}`,
            },
          },
        },
      });
    }),

  apiKeys: protectedProcedure
    .input(z.object({ spaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertSpaceAccess(ctx.db, input.spaceId, ctx.session.userId);
      return ctx.db.apiKey.findMany({
        where: { spaceId: input.spaceId },
        orderBy: { createdAt: "asc" },
      });
    }),

  createApiKey: protectedProcedure
    .input(z.object({ spaceId: z.string(), name: z.string().min(1).max(40) }))
    .mutation(async ({ ctx, input }) => {
      await assertSpaceAccess(
        ctx.db,
        input.spaceId,
        ctx.session.userId,
        "OWNER",
      );
      return ctx.db.apiKey.create({
        data: {
          spaceId: input.spaceId,
          name: input.name,
          key: `forge_${randomBytes(24).toString("hex")}`,
        },
      });
    }),
});
