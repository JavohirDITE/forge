import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { AVATAR_COLORS } from "@/lib/constants";

const credentials = {
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session) return null;
    return ctx.db.user.findUnique({
      where: { id: ctx.session.userId },
      select: { id: true, email: true, name: true, avatarColor: true },
    });
  }),

  register: publicProcedure
    .input(z.object({ ...credentials, name: z.string().min(2).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }
      const user = await ctx.db.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          passwordHash: await hashPassword(input.password),
          avatarColor:
            AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        },
      });
      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
      return { id: user.id, name: user.name };
    }),

  login: publicProcedure
    .input(z.object(credentials))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      const ok =
        user && (await verifyPassword(input.password, user.passwordHash));
      if (!user || !ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }
      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
      return { id: user.id, name: user.name };
    }),

  logout: protectedProcedure.mutation(async () => {
    await destroySession();
    return { ok: true };
  }),
});
