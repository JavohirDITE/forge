import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Field } from "@prisma/client";
import { router, protectedProcedure } from "@/server/trpc";
import { assertSpaceAccess } from "@/server/access";

/** Validates entry data against the content type's field schema. */
function validateAgainstSchema(
  fields: Field[],
  data: Record<string, unknown>,
): void {
  for (const field of fields) {
    const value = data[field.apiId];
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");

    if (field.required && empty) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Field "${field.name}" is required.`,
      });
    }
    if (empty) continue;

    const typeOk =
      (field.type === "TEXT" && typeof value === "string") ||
      (field.type === "RICHTEXT" && typeof value === "string") ||
      (field.type === "NUMBER" && typeof value === "number") ||
      (field.type === "BOOLEAN" && typeof value === "boolean") ||
      (field.type === "DATE" && typeof value === "string") ||
      (field.type === "SELECT" && typeof value === "string") ||
      (field.type === "MEDIA" && typeof value === "string");

    if (!typeOk) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Field "${field.name}" has the wrong type.`,
      });
    }
  }
}

export const entryRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        contentTypeId: z.string(),
        status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ct = await ctx.db.contentType.findUnique({
        where: { id: input.contentTypeId },
        select: { spaceId: true },
      });
      if (!ct) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(ctx.db, ct.spaceId, ctx.session.userId);
      return ctx.db.entry.findMany({
        where: { contentTypeId: input.contentTypeId, status: input.status },
        orderBy: { updatedAt: "desc" },
        include: {
          author: { select: { id: true, name: true, avatarColor: true } },
        },
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.entry.findUnique({
        where: { id: input.id },
        include: {
          contentType: { include: { fields: { orderBy: { order: "asc" } } } },
          author: { select: { id: true, name: true, avatarColor: true } },
        },
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(ctx.db, entry.spaceId, ctx.session.userId);
      return entry;
    }),

  create: protectedProcedure
    .input(
      z.object({
        contentTypeId: z.string(),
        data: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ct = await ctx.db.contentType.findUnique({
        where: { id: input.contentTypeId },
        include: { fields: true },
      });
      if (!ct) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(ctx.db, ct.spaceId, ctx.session.userId, "EDITOR");

      return ctx.db.entry.create({
        data: {
          contentTypeId: ct.id,
          spaceId: ct.spaceId,
          authorId: ctx.session.userId,
          status: "DRAFT",
          data: input.data as object,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.entry.findUnique({
        where: { id: input.id },
        include: { contentType: { include: { fields: true } } },
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(
        ctx.db,
        entry.spaceId,
        ctx.session.userId,
        "EDITOR",
      );
      // Published entries must stay valid; drafts can be incomplete.
      if (entry.status === "PUBLISHED") {
        validateAgainstSchema(entry.contentType.fields, input.data);
      }
      return ctx.db.entry.update({
        where: { id: input.id },
        data: { data: input.data as object },
      });
    }),

  setStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.enum(["DRAFT", "PUBLISHED"]) }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.entry.findUnique({
        where: { id: input.id },
        include: { contentType: { include: { fields: true } } },
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(
        ctx.db,
        entry.spaceId,
        ctx.session.userId,
        "EDITOR",
      );
      if (input.status === "PUBLISHED") {
        validateAgainstSchema(
          entry.contentType.fields,
          entry.data as Record<string, unknown>,
        );
      }
      return ctx.db.entry.update({
        where: { id: input.id },
        data: {
          status: input.status,
          publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.entry.findUnique({
        where: { id: input.id },
        select: { spaceId: true },
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      await assertSpaceAccess(
        ctx.db,
        entry.spaceId,
        ctx.session.userId,
        "EDITOR",
      );
      await ctx.db.entry.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
