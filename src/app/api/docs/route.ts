import { NextResponse } from 'next/server';
import { openApiSpec } from '@/server/api/rest/openapi-spec';

/**
 * GET /api/docs
 * Returns the OpenAPI specification as JSON
 */
export async function GET() {
  return NextResponse.json(openApiSpec);
}
