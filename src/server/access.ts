import { TRPCError } from "@trpc/server";
import type { PrismaClient, Role } from "@prisma/client";

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

/**
 * Asserts the user belongs to the space with at least `minRole`.
 * Returns their role so callers can branch on it.
 */
export async function assertSpaceAccess(
  db: PrismaClient,
  spaceId: string,
  userId: string,
  minRole: Role = "VIEWER",
): Promise<Role> {
  const membership = await db.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
    select: { role: true },
  });
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this space.",
    });
  }
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Requires ${minRole} role or higher.`,
    });
  }
  return membership.role;
}
