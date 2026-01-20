import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();

  return NextResponse.json({
    userId,
    isAuthenticated: !!userId,
    timestamp: new Date().toISOString(),
  });
}
