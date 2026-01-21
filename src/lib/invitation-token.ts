import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);

export interface InvitationTokenPayload {
  organizationId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  exp: number;
}

/**
 * Generate a JWT token for team invitation
 * Token expires in 7 days
 */
export async function generateInvitationToken(
  organizationId: string,
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<string> {
  const token = await new SignJWT({
    organizationId,
    email,
    role,
    invitedBy,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode an invitation token
 * Returns null if token is invalid or expired
 */
export async function verifyInvitationToken(
  token: string
): Promise<InvitationTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as InvitationTokenPayload;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}
