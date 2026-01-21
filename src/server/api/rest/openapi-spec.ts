/**
 * OpenAPI 3.0 Specification for GrantSignal Public API
 */
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'GrantSignal Public API',
    version: '1.0.0',
    description: 'Public REST API for GrantSignal grant management platform',
    contact: {
      name: 'GrantSignal Support',
      email: 'support@grantsignal.com',
    },
  },
  servers: [
    {
      url: 'https://app.grantsignal.com/api/v1',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'API key with format: gs_live_* or gs_test_*',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
            required: ['code', 'message'],
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Grant: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          organizationId: { type: 'string' },
          funderId: { type: 'string', nullable: true },
          opportunityId: { type: 'string', nullable: true },
          programId: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['DRAFT', 'SUBMITTED', 'AWARDED', 'REJECTED', 'ACTIVE', 'COMPLETED'],
          },
          amountRequested: { type: 'number', nullable: true },
          amountAwarded: { type: 'number', nullable: true },
          deadline: { type: 'string', format: 'date-time', nullable: true },
          submittedAt: { type: 'string', format: 'date-time', nullable: true },
          awardedAt: { type: 'string', format: 'date-time', nullable: true },
          startDate: { type: 'string', format: 'date-time', nullable: true },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          title: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          assignedToId: { type: 'string', nullable: true },
          draftContent: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          organizationId: { type: 'string' },
          grantId: { type: 'string', nullable: true },
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['GRANT_APPLICATION', 'AWARD_LETTER', 'REPORT', 'AGREEMENT', 'BUDGET', 'OTHER'],
          },
          mimeType: { type: 'string' },
          size: { type: 'integer' },
          s3Key: { type: 'string' },
          status: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
          },
          confidenceScore: { type: 'number', nullable: true },
          extractedText: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ExecutiveSummary: {
        type: 'object',
        properties: {
          keyMetrics: {
            type: 'object',
            properties: {
              totalGrants: { type: 'integer' },
              totalAwarded: { type: 'number' },
              winRate: { type: 'number' },
              activePipeline: { type: 'number' },
            },
          },
          pipelineOverview: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
          recentWins: {
            type: 'array',
            items: { $ref: '#/components/schemas/Grant' },
          },
          upcomingDeadlines: {
            type: 'array',
            items: { $ref: '#/components/schemas/Grant' },
          },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/grants': {
      get: {
        summary: 'List grants',
        description: 'Retrieve a paginated list of grants for your organization',
        tags: ['Grants'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['DRAFT', 'SUBMITTED', 'AWARDED', 'REJECTED', 'ACTIVE', 'COMPLETED'],
            },
          },
          {
            name: 'programId',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'assignedToId',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search in title and description',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Grant' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a grant',
        description: 'Create a new grant for your organization',
        tags: ['Grants'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  funderId: { type: 'string' },
                  opportunityId: { type: 'string' },
                  programId: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['DRAFT', 'SUBMITTED', 'AWARDED', 'REJECTED', 'ACTIVE', 'COMPLETED'],
                  },
                  amountRequested: { type: 'number' },
                  deadline: { type: 'string', format: 'date-time' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Grant created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Grant' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/grants/{id}': {
      get: {
        summary: 'Get a grant',
        description: 'Retrieve a specific grant by ID',
        tags: ['Grants'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Grant' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Grant not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update a grant',
        description: 'Update an existing grant',
        tags: ['Grants'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['DRAFT', 'SUBMITTED', 'AWARDED', 'REJECTED', 'ACTIVE', 'COMPLETED'],
                  },
                  amountRequested: { type: 'number' },
                  amountAwarded: { type: 'number' },
                  deadline: { type: 'string', format: 'date-time' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  assignedToId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Grant updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Grant' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Grant not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete a grant',
        description: 'Delete a grant by ID',
        tags: ['Grants'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Grant deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Grant not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/documents': {
      get: {
        summary: 'List documents',
        description: 'Retrieve a paginated list of documents',
        tags: ['Documents'],
        parameters: [
          {
            name: 'grantId',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['GRANT_APPLICATION', 'AWARD_LETTER', 'REPORT', 'AGREEMENT', 'BUDGET', 'OTHER'],
            },
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Document' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create upload URL',
        description: 'Generate a presigned URL for uploading a document',
        tags: ['Documents'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fileName', 'fileSize', 'mimeType'],
                properties: {
                  fileName: { type: 'string' },
                  fileSize: { type: 'integer' },
                  mimeType: { type: 'string' },
                  grantId: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['GRANT_APPLICATION', 'AWARD_LETTER', 'REPORT', 'AGREEMENT', 'BUDGET', 'OTHER'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Upload URL created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        uploadUrl: { type: 'string' },
                        documentId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/documents/search': {
      get: {
        summary: 'Search documents',
        description: 'Search documents using vector similarity',
        tags: ['Documents'],
        parameters: [
          {
            name: 'query',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        query: { type: 'string' },
                        results: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              document: { $ref: '#/components/schemas/Document' },
                              score: { type: 'number' },
                              excerpt: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/reports/executive-summary': {
      get: {
        summary: 'Get executive summary',
        description: 'Retrieve executive summary report with key metrics',
        tags: ['Reports'],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          '200': {
            description: 'Executive summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/ExecutiveSummary' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/reports/pipeline': {
      get: {
        summary: 'Get pipeline report',
        description: 'Retrieve pipeline report with grants grouped by status',
        tags: ['Reports'],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          '200': {
            description: 'Pipeline report',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      additionalProperties: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Grant' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/reports/win-loss': {
      get: {
        summary: 'Get win-loss analysis',
        description: 'Retrieve win-loss analysis with success metrics',
        tags: ['Reports'],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'programId',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Win-loss analysis',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        totalSubmitted: { type: 'integer' },
                        totalAwarded: { type: 'integer' },
                        totalRejected: { type: 'integer' },
                        winRate: { type: 'number' },
                        totalAmountRequested: { type: 'number' },
                        totalAmountAwarded: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
