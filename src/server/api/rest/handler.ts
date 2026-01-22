import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { authenticateApiKey, type ApiKeyAuthContext } from '@/server/api/middleware/api-key-auth';
import { enforceRateLimit, RateLimitError } from '@/server/api/middleware/rate-limit';
import { requireScope, requireAllScopes, ScopeError } from '@/server/api/middleware/scope-check';
import { z } from 'zod';

/**
 * Standard REST API error response format
 */
export interface RestApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Standard REST API success response format
 */
export interface RestApiResponse<T = unknown> {
  data: T;
}

/**
 * REST API handler context including auth and organization
 */
export interface RestApiContext {
  auth: ApiKeyAuthContext;
  organizationId: string;
  request: NextRequest;
}

/**
 * Handler function type for REST API endpoints
 */
export type RestApiHandler<T = unknown> = (
  ctx: RestApiContext,
  params?: Record<string, string>
) => Promise<T>;

/**
 * Options for REST API handlers
 */
export interface RestApiHandlerOptions {
  /** Required scopes (any match - OR logic) */
  requiredScopes?: string[];
  /** Required scopes (all must match - AND logic) */
  requiredAllScopes?: string[];
  /** Skip rate limiting (use sparingly) */
  skipRateLimit?: boolean;
}

/**
 * Creates an error response with proper formatting
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse<RestApiError> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Creates a success response with proper formatting
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<RestApiResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Wraps a REST API handler with authentication, rate limiting, and error handling
 */
export function createRestHandler<T = unknown>(
  handler: RestApiHandler<T>,
  options: RestApiHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // 1. Authenticate API key
      const authContext = await authenticateApiKey(request, db);
      if (!authContext) {
        return errorResponse('unauthorized', 'Invalid or missing API key', 401);
      }

      // 2. Check rate limits
      if (!options.skipRateLimit) {
        try {
          await enforceRateLimit(authContext.apiKey, db);
        } catch (error) {
          if (error instanceof RateLimitError) {
            return NextResponse.json(
              {
                error: {
                  code: 'rate_limit_exceeded',
                  message: error.message,
                  details: {
                    retryAfter: error.retryAfter,
                  },
                },
              },
              {
                status: 429,
                headers: {
                  'Retry-After': error.retryAfter.toString(),
                },
              }
            );
          }
          throw error;
        }
      }

      // 3. Check required scopes
      if (options.requiredScopes && options.requiredScopes.length > 0) {
        try {
          requireScope(authContext.apiKey, options.requiredScopes);
        } catch (error) {
          if (error instanceof ScopeError) {
            return errorResponse(
              'insufficient_scope',
              error.message,
              403,
              {
                requiredScopes: error.requiredScopes,
                actualScopes: error.actualScopes,
              }
            );
          }
          throw error;
        }
      }

      if (options.requiredAllScopes && options.requiredAllScopes.length > 0) {
        try {
          requireAllScopes(authContext.apiKey, options.requiredAllScopes);
        } catch (error) {
          if (error instanceof ScopeError) {
            return errorResponse(
              'insufficient_scope',
              error.message,
              403,
              {
                requiredScopes: error.requiredScopes,
                actualScopes: error.actualScopes,
              }
            );
          }
          throw error;
        }
      }

      // 4. Execute handler
      const params = context?.params ? await context.params : undefined;
      const result = await handler(
        {
          auth: authContext,
          organizationId: authContext.organizationId,
          request,
        },
        params
      );

      // 5. Return success response
      return successResponse(result);
    } catch (error) {
      console.error('REST API Error:', error);

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return errorResponse(
          'validation_error',
          'Request validation failed',
          400,
          error.flatten()
        );
      }

      // Handle known error types
      if (error instanceof Error) {
        // Check for specific error patterns
        if (error.message.includes('not found')) {
          return errorResponse('not_found', error.message, 404);
        }
        if (error.message.includes('already exists')) {
          return errorResponse('conflict', error.message, 409);
        }
        if (error.message.includes('permission')) {
          return errorResponse('forbidden', error.message, 403);
        }

        return errorResponse('internal_error', error.message, 500);
      }

      // Generic error
      return errorResponse('internal_error', 'An unexpected error occurred', 500);
    }
  };
}

/**
 * Helper to parse and validate JSON body
 */
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new Error('Invalid JSON body');
  }
}

/**
 * Helper to parse query parameters
 */
export function parseQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  return schema.parse(params);
}

/**
 * Helper to create paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return {
    items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
