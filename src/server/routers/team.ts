import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, orgProcedure, publicProcedure } from "../trpc";
import { UserRole } from "@prisma/client";
import { requireRole } from "~/lib/permissions";
import {
  generateInvitationToken,
  verifyInvitationToken,
} from "~/lib/invitation-token";
import { resend, FROM_EMAIL } from "~/lib/resend";
import { clerkClient } from "@clerk/nextjs/server";

export const teamRouter = router({
  /**
   * List all members in the organization
   */
  listMembers: orgProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.organizationUser.findMany({
      where: {
        organizationId: ctx.organizationId,
      },
      select: {
        id: true,
        clerkUserId: true,
        role: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Fetch Clerk user data for each member
    const membersWithClerkData = await Promise.all(
      members.map(async (member) => {
        try {
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(member.clerkUserId);

          return {
            ...member,
            email:
              clerkUser.emailAddresses.find(
                (e) => e.id === clerkUser.primaryEmailAddressId
              )?.emailAddress || "",
            firstName: clerkUser.firstName || "",
            lastName: clerkUser.lastName || "",
            imageUrl: clerkUser.imageUrl || "",
          };
        } catch (error) {
          // If Clerk user not found, return member without Clerk data
          return {
            ...member,
            email: "",
            firstName: "",
            lastName: "",
            imageUrl: "",
          };
        }
      })
    );

    return membersWithClerkData;
  }),

  /**
   * Get pending invitations for the organization
   */
  listInvitations: orgProcedure
    .use(async ({ ctx, next }) => {
      // Only OWNER and ADMIN can view invitations
      const permission = await requireRole([UserRole.OWNER, UserRole.ADMIN])(
        ctx
      );
      return next({ ctx: { ...ctx, ...permission } });
    })
    .query(async ({ ctx }) => {
      const invitations = await ctx.db.teamInvitation.findMany({
        where: {
          organizationId: ctx.organizationId,
          acceptedAt: null,
          expiresAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return invitations;
    }),

  /**
   * Invite a new member to the organization
   */
  inviteMember: orgProcedure
    .use(async ({ ctx, next }) => {
      // Only OWNER and ADMIN can invite members
      const permission = await requireRole([UserRole.OWNER, UserRole.ADMIN])(
        ctx
      );
      return next({ ctx: { ...ctx, ...permission } });
    })
    .input(
      z.object({
        email: z.string().email(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, role } = input;

      // Check if user is already a member
      const existingMember = await ctx.db.organizationUser.findFirst({
        where: {
          organizationId: ctx.organizationId,
          organization: {
            users: {
              some: {
                clerkUserId: {
                  // We can't check email directly in Prisma, will check via Clerk
                  not: undefined,
                },
              },
            },
          },
        },
      });

      // Check if there's already a pending invitation
      const existingInvite = await ctx.db.teamInvitation.findFirst({
        where: {
          organizationId: ctx.organizationId,
          email,
          acceptedAt: null,
          expiresAt: {
            gte: new Date(),
          },
        },
      });

      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An invitation has already been sent to this email",
        });
      }

      // Generate JWT token
      const token = await generateInvitationToken(
        ctx.organizationId,
        email,
        role,
        ctx.auth.userId!
      );

      // Create invitation record
      const invitation = await ctx.db.teamInvitation.create({
        data: {
          organizationId: ctx.organizationId,
          email,
          role,
          token,
          invitedBy: ctx.auth.userId!,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Get organization name
      const organization = await ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { name: true },
      });

      // Get inviter's name
      const client = await clerkClient();
      const inviter = await client.users.getUser(ctx.auth.userId!);
      const inviterName = `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim() || "A team member";

      // Send invitation email
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/accept?token=${token}`;

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `You've been invited to join ${organization?.name || "GrantSignal"}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You've been invited!</h2>
              <p>${inviterName} has invited you to join <strong>${organization?.name || "their organization"}</strong> on GrantSignal as a <strong>${role.toLowerCase()}</strong>.</p>
              <p>GrantSignal helps organizations manage grant opportunities, track applications, and collaborate on proposals.</p>
              <div style="margin: 30px 0;">
                <a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                This invitation will expire in 7 days. If you don't want to join this organization, you can ignore this email.
              </p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="${inviteUrl}">${inviteUrl}</a>
              </p>
            </div>
          `,
        });
      } catch (error) {
        // If email fails, delete the invitation
        await ctx.db.teamInvitation.delete({
          where: { id: invitation.id },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send invitation email",
        });
      }

      // Log activity
      await ctx.db.complianceAudit.create({
        data: {
          organizationId: ctx.organizationId,
          actionType: "TEAM_MEMBER_INVITED",
          description: `Invited ${email} as ${role}`,
          performedBy: ctx.auth.userId!,
          metadata: {
            email,
            role,
            invitationId: invitation.id,
          },
        },
      });

      return invitation;
    }),

  /**
   * Resend an invitation email
   */
  resendInvite: orgProcedure
    .use(async ({ ctx, next }) => {
      const permission = await requireRole([UserRole.OWNER, UserRole.ADMIN])(
        ctx
      );
      return next({ ctx: { ...ctx, ...permission } });
    })
    .input(
      z.object({
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.teamInvitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to resend this invitation",
        });
      }

      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted",
        });
      }

      // Get organization name
      const organization = await ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { name: true },
      });

      // Get inviter's name
      const client = await clerkClient();
      const inviter = await client.users.getUser(ctx.auth.userId!);
      const inviterName = `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim() || "A team member";

      // Send invitation email
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/accept?token=${invitation.token}`;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: invitation.email,
        subject: `Reminder: You've been invited to join ${organization?.name || "GrantSignal"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reminder: You've been invited!</h2>
            <p>${inviterName} has invited you to join <strong>${organization?.name || "their organization"}</strong> on GrantSignal as a <strong>${invitation.role.toLowerCase()}</strong>.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.
            </p>
          </div>
        `,
      });

      return { success: true };
    }),

  /**
   * Revoke a pending invitation
   */
  revokeInvite: orgProcedure
    .use(async ({ ctx, next }) => {
      const permission = await requireRole([UserRole.OWNER, UserRole.ADMIN])(
        ctx
      );
      return next({ ctx: { ...ctx, ...permission } });
    })
    .input(
      z.object({
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.teamInvitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to revoke this invitation",
        });
      }

      await ctx.db.teamInvitation.delete({
        where: { id: input.invitationId },
      });

      return { success: true };
    }),

  /**
   * Remove a member from the organization
   */
  removeMember: orgProcedure
    .use(async ({ ctx, next }) => {
      const permission = await requireRole([UserRole.OWNER, UserRole.ADMIN])(
        ctx
      );
      return next({ ctx: { ...ctx, ...permission } });
    })
    .input(
      z.object({
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.organizationUser.findUnique({
        where: { id: input.memberId },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (member.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove this member",
        });
      }

      // Can't remove yourself
      const currentUser = await ctx.db.organizationUser.findFirst({
        where: {
          clerkUserId: ctx.auth.userId,
          organizationId: ctx.organizationId,
        },
      });

      if (currentUser?.id === input.memberId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself from the organization",
        });
      }

      // Can't remove OWNER if you're not OWNER
      if (member.role === UserRole.OWNER && currentUser?.role !== UserRole.OWNER) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only an owner can remove another owner",
        });
      }

      await ctx.db.organizationUser.delete({
        where: { id: input.memberId },
      });

      // Log activity
      await ctx.db.complianceAudit.create({
        data: {
          organizationId: ctx.organizationId,
          actionType: "TEAM_MEMBER_INVITED",
          description: `Removed team member`,
          performedBy: ctx.auth.userId!,
          metadata: {
            removedMemberId: input.memberId,
            removedMemberRole: member.role,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Update a member's role
   */
  updateMemberRole: orgProcedure
    .use(async ({ ctx, next }) => {
      // Only OWNER can update roles
      const permission = await requireRole([UserRole.OWNER])(ctx);
      return next({ ctx: { ...ctx, ...permission } });
    })
    .input(
      z.object({
        memberId: z.string(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.organizationUser.findUnique({
        where: { id: input.memberId },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (member.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this member",
        });
      }

      // Can't change your own role
      const currentUser = await ctx.db.organizationUser.findFirst({
        where: {
          clerkUserId: ctx.auth.userId,
          organizationId: ctx.organizationId,
        },
      });

      if (currentUser?.id === input.memberId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      const updated = await ctx.db.organizationUser.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });

      return updated;
    }),

  /**
   * Get invitation details by token (public endpoint)
   */
  getInviteDetails: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify token
      const payload = await verifyInvitationToken(input.token);
      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired invitation token",
        });
      }

      // Get invitation from database
      const invitation = await ctx.db.teamInvitation.findUnique({
        where: { token: input.token },
        include: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      return {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization.name,
        expiresAt: invitation.expiresAt,
      };
    }),

  /**
   * Accept an invitation (public endpoint)
   */
  acceptInvite: publicProcedure
    .input(
      z.object({
        token: z.string(),
        clerkUserId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify token
      const payload = await verifyInvitationToken(input.token);
      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired invitation token",
        });
      }

      // Get invitation
      const invitation = await ctx.db.teamInvitation.findUnique({
        where: { token: input.token },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      // Check if user is already a member
      const existingMember = await ctx.db.organizationUser.findFirst({
        where: {
          organizationId: invitation.organizationId,
          clerkUserId: input.clerkUserId,
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this organization",
        });
      }

      // Get Clerk user data
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(input.clerkUserId);
      const displayName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

      // Create organization user
      const newMember = await ctx.db.organizationUser.create({
        data: {
          organizationId: invitation.organizationId,
          clerkUserId: input.clerkUserId,
          role: invitation.role,
          displayName: displayName || undefined,
          avatarUrl: clerkUser.imageUrl || undefined,
        },
      });

      // Mark invitation as accepted
      await ctx.db.teamInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // Log activity
      await ctx.db.complianceAudit.create({
        data: {
          organizationId: invitation.organizationId,
          actionType: "TEAM_MEMBER_JOINED",
          description: `${displayName || invitation.email} joined as ${invitation.role}`,
          performedBy: input.clerkUserId,
          metadata: {
            email: invitation.email,
            role: invitation.role,
          },
        },
      });

      return newMember;
    }),
});
