import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { assertSpaceAccess } from "@/server/access";

export const assetRouter = router({
  list: protectedProcedure
    .input(z.object({ spaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertSpaceAccess(ctx.db, input.spaceId, ctx.session.userId);
      return ctx.db.asset.findMany({
        where: { spaceId: input.spaceId },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Register an asset by URL (e.g. from an external bucket/CDN).
  create: protectedProcedure
    .input(
      z.object({
        spaceId: z.string(),
        url: z.string().url(),
        filename: z.string().min(1).max(200),
        alt: z.string().max(200).optional(),
        mimeType: z.string().default("image/*"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertSpaceAccess(
        ctx.db,
        input.spaceId,
        ctx.session.userId,
        "EDITOR",
      );
      return ctx.db.asset.create({
        data: {
          spaceId: input.spaceId,
          url: input.url,
          filename: input.filename,
          alt: input.alt,
          mimeType: input.mimeType,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.asset.findUnique({
        where: { id: input.id },
        select: { spaceId: true },
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(
        ctx.db,
        asset.spaceId,
        ctx.session.userId,
        "EDITOR",
      );
      await ctx.db.asset.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
