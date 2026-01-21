import { TRPCError } from "@trpc/server";
import { UserRole } from "@prisma/client";
import type { Context } from "~/server/context";

/**
 * Permission middleware to require specific roles for tRPC procedures
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (ctx: Context) => {
    if (!ctx.auth.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    if (!ctx.organizationId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You must be part of an organization",
      });
    }

    // Get the user's role in the organization
    const user = await ctx.db.organizationUser.findFirst({
      where: {
        clerkUserId: ctx.auth.userId,
        organizationId: ctx.organizationId,
      },
      select: { role: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User not found in organization",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
      });
    }

    return { role: user.role };
  };
}

/**
 * Check if a user has permission to perform an action
 */
export function hasPermission(
  userRole: UserRole,
  requiredRoles: UserRole[]
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Role hierarchy for comparison
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

/**
 * Check if user role is at least the minimum required role
 */
export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Get user's current role in organization
 */
export async function getUserRole(
  ctx: Context
): Promise<UserRole | null> {
  if (!ctx.auth.userId || !ctx.organizationId) {
    return null;
  }

  const user = await ctx.db.organizationUser.findFirst({
    where: {
      clerkUserId: ctx.auth.userId,
      organizationId: ctx.organizationId,
    },
    select: { role: true },
  });

  return user?.role || null;
}
