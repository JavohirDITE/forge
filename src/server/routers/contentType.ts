import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { assertSpaceAccess } from "@/server/access";
import { toApiId } from "@/lib/utils";

const fieldTypeEnum = z.enum([
  "TEXT",
  "RICHTEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "SELECT",
  "MEDIA",
]);

export const contentTypeRouter = router({
  list: protectedProcedure
    .input(z.object({ spaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertSpaceAccess(ctx.db, input.spaceId, ctx.session.userId);
      return ctx.db.contentType.findMany({
        where: { spaceId: input.spaceId },
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { fields: true, entries: true } },
        },
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ct = await ctx.db.contentType.findUnique({
        where: { id: input.id },
        include: { fields: { orderBy: { order: "asc" } } },
      });
      if (!ct) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(ctx.db, ct.spaceId, ctx.session.userId);
      return ct;
    }),

  create: protectedProcedure
    .input(
      z.object({
        spaceId: z.string(),
        name: z.string().min(2).max(50),
        icon: z.string().default("FileText"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertSpaceAccess(
        ctx.db,
        input.spaceId,
        ctx.session.userId,
        "EDITOR",
      );
      const apiId = toApiId(input.name);
      const exists = await ctx.db.contentType.findUnique({
        where: { spaceId_apiId: { spaceId: input.spaceId, apiId } },
      });
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A content type with API id "${apiId}" already exists.`,
        });
      }
      // Seed with a sensible default title field.
      return ctx.db.contentType.create({
        data: {
          spaceId: input.spaceId,
          name: input.name,
          apiId,
          icon: input.icon,
          fields: {
            create: {
              name: "Title",
              apiId: "title",
              type: "TEXT",
              required: true,
              order: 0,
            },
          },
        },
        include: { fields: true },
      });
    }),

  addField: protectedProcedure
    .input(
      z.object({
        contentTypeId: z.string(),
        name: z.string().min(1).max(50),
        type: fieldTypeEnum,
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ct = await ctx.db.contentType.findUnique({
        where: { id: input.contentTypeId },
        select: { spaceId: true, _count: { select: { fields: true } } },
      });
      if (!ct) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(ctx.db, ct.spaceId, ctx.session.userId, "EDITOR");

      const apiId = toApiId(input.name);
      const clash = await ctx.db.field.findUnique({
        where: {
          contentTypeId_apiId: { contentTypeId: input.contentTypeId, apiId },
        },
      });
      if (clash) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Field "${apiId}" already exists.`,
        });
      }
      return ctx.db.field.create({
        data: {
          contentTypeId: input.contentTypeId,
          name: input.name,
          apiId,
          type: input.type,
          required: input.required,
          order: ct._count.fields,
          config: input.options ? { options: input.options } : {},
        },
      });
    }),

  removeField: protectedProcedure
    .input(z.object({ fieldId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const field = await ctx.db.field.findUnique({
        where: { id: input.fieldId },
        include: { contentType: { select: { spaceId: true } } },
      });
      if (!field) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(
        ctx.db,
        field.contentType.spaceId,
        ctx.session.userId,
        "EDITOR",
      );
      await ctx.db.field.delete({ where: { id: input.fieldId } });
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ct = await ctx.db.contentType.findUnique({
        where: { id: input.id },
        select: { spaceId: true },
      });
      if (!ct) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(ctx.db, ct.spaceId, ctx.session.userId, "OWNER");
      await ctx.db.contentType.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
