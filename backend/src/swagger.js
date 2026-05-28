/**
 * Swagger/OpenAPI 3.0 specification for Beatzy API.
 * Mounted at /api/docs via swagger-ui-express.
 */

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Beatzy API',
    version: '1.0.0',
    description:
      'Music Intelligence Engine — Song identification, deep audio analysis, mood classification, and SaaS API access.',
    contact: { name: 'Beatzy Team', url: 'https://beatzy.app' },
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
    { url: 'https://api.beatzy.app', description: 'Production' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & authorization' },
    { name: 'Audio', description: 'Audio upload & job management' },
    { name: 'Results', description: 'Analysis results retrieval' },
    { name: 'API Keys', description: 'SaaS API key management' },
    { name: 'Billing', description: 'Stripe subscription billing' },
    { name: 'Users', description: 'User profile & usage' },
    { name: 'Admin', description: 'Admin-only operations' },
  ],

  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token obtained from /api/auth/login or /api/auth/register',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'SaaS API key (Pro/Enterprise plans)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              status: { type: 'integer' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
          is_admin: { type: 'boolean' },
        },
      },
      AudioJob: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['queued', 'processing', 'completed', 'failed'] },
          original_filename: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      AnalysisResult: {
        type: 'object',
        properties: {
          job_id: { type: 'string', format: 'uuid' },
          song_title: { type: 'string', nullable: true },
          song_artist: { type: 'string', nullable: true },
          song_album: { type: 'string', nullable: true },
          bpm: { type: 'number', nullable: true },
          energy_level: { type: 'number', nullable: true },
          mood: { type: 'string', nullable: true },
          key_signature: { type: 'string', nullable: true },
          time_signature: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
    },
  },

  paths: {
    // ── Auth ─────────────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 2 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email & password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh JWT tokens (rotation)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'New token pair issued' },
          401: { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/api/auth/google': {
      get: {
        tags: ['Auth'],
        summary: 'Initiate Google OAuth flow',
        responses: { 302: { description: 'Redirect to Google consent screen' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: { user: { $ref: '#/components/schemas/User' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (invalidate refresh token)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Logged out' } },
      },
    },

    // ── Audio ────────────────────────────────────────────────────
    '/api/audio/upload': {
      post: {
        tags: ['Audio'],
        summary: 'Upload audio file for analysis',
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  audio: { type: 'string', format: 'binary', description: 'Audio file (MP3/WAV/FLAC/OGG/M4A, max 200MB)' },
                },
              },
            },
          },
        },
        responses: {
          202: {
            description: 'Upload accepted — job queued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        jobId: { type: 'string', format: 'uuid' },
                        status: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          413: { description: 'File exceeds plan limit' },
          415: { description: 'Unsupported file type' },
        },
      },
    },
    '/api/audio/jobs/{jobId}': {
      get: {
        tags: ['Audio'],
        summary: 'Get job status',
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Job details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/AudioJob' },
                  },
                },
              },
            },
          },
          404: { description: 'Job not found' },
        },
      },
      delete: {
        tags: ['Audio'],
        summary: 'Delete a job',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job deleted' },
          404: { description: 'Job not found' },
        },
      },
    },
    '/api/audio/history': {
      get: {
        tags: ['Audio'],
        summary: 'Get user analysis history',
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
        ],
        responses: {
          200: {
            description: 'Paginated job history with results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        jobs: { type: 'array', items: { $ref: '#/components/schemas/AudioJob' } },
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
    },

    // ── Results ──────────────────────────────────────────────────
    '/api/results/{jobId}': {
      get: {
        tags: ['Results'],
        summary: 'Get analysis results for a job',
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Analysis results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/AnalysisResult' },
                  },
                },
              },
            },
          },
          202: { description: 'Analysis still in progress' },
          404: { description: 'Job / results not found' },
        },
      },
    },
    '/api/results': {
      get: {
        tags: ['Results'],
        summary: 'List all user results',
        security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'Array of analysis results (max 100)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/AnalysisResult' } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── API Keys ─────────────────────────────────────────────────
    '/api/keys': {
      get: {
        tags: ['API Keys'],
        summary: 'List all API keys',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Array of API key metadata' } },
      },
      post: {
        tags: ['API Keys'],
        summary: 'Generate a new API key (Pro/Enterprise)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string', minLength: 1, maxLength: 100 } },
              },
            },
          },
        },
        responses: {
          201: { description: 'API key created — raw key returned once' },
          429: { description: 'Maximum API keys reached for plan' },
        },
      },
    },
    '/api/keys/{id}': {
      delete: {
        tags: ['API Keys'],
        summary: 'Revoke an API key',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'API key revoked' },
          404: { description: 'Key not found' },
        },
      },
    },

    // ── Billing ──────────────────────────────────────────────────
    '/api/billing/plans': {
      get: {
        tags: ['Billing'],
        summary: 'List subscription plans',
        responses: { 200: { description: 'Array of available plans' } },
      },
    },
    '/api/billing/subscribe': {
      post: {
        tags: ['Billing'],
        summary: 'Create Stripe checkout session',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId'],
                properties: { planId: { type: 'string', enum: ['pro', 'enterprise'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Checkout URL returned' },
          400: { description: 'Invalid plan' },
        },
      },
    },
    '/api/billing/subscription': {
      get: {
        tags: ['Billing'],
        summary: 'Get current subscription status',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Subscription info' } },
      },
    },
    '/api/billing/portal': {
      post: {
        tags: ['Billing'],
        summary: 'Open Stripe billing portal',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Portal URL returned' } },
      },
    },
    '/api/billing/webhook': {
      post: {
        tags: ['Billing'],
        summary: 'Stripe webhook endpoint',
        description: 'Receives Stripe events (checkout.session.completed, subscription.deleted, invoice.payment_failed)',
        responses: { 200: { description: 'Event processed' } },
      },
    },

    // ── Users ────────────────────────────────────────────────────
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get detailed user profile',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'User profile with usage stats' } },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user name',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string', minLength: 2 } },
              },
            },
          },
        },
        responses: { 200: { description: 'Name updated' } },
      },
    },
    '/api/users/me/password': {
      patch: {
        tags: ['Users'],
        summary: 'Change password',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
          401: { description: 'Current password incorrect' },
        },
      },
    },
    '/api/users/usage': {
      get: {
        tags: ['Users'],
        summary: 'Get 30-day usage breakdown',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Daily usage counts' } },
      },
    },

    // ── Admin ────────────────────────────────────────────────────
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users (admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25, maximum: 100 } },
        ],
        responses: { 200: { description: 'Paginated user list' } },
      },
    },
    '/api/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get single user detail (admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'User detail' },
          404: { description: 'User not found' },
        },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Update user flags (admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  is_active: { type: 'boolean' },
                  plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
                  is_admin: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User updated' },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Platform-wide KPIs (admin only)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Total users, jobs by status, users by plan' } },
      },
    },
    '/api/admin/audit-log': {
      get: {
        tags: ['Admin'],
        summary: 'Paginated audit log (admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
        ],
        responses: { 200: { description: 'Paginated audit entries' } },
      },
    },
  },
};

module.exports = spec;
