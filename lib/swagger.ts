import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FRAME API Documentation',
      version: '1.0.0',
      description: `
## FRAME - Professional Image Management System

### Authentication
All protected endpoints require a valid NextAuth session token. Admin/Superadmin endpoints require the appropriate role.

### Rate Limits
- Standard: 100 requests/minute
- Upload: 10 requests/minute

### Error Responses
All endpoints return standard error responses:
- 400: Bad Request - Invalid parameters
- 401: Unauthorized - Invalid or missing authentication
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 500: Internal Server Error

### Image Statuses
- UPLOADED: Initial state when client sends bytes
- INGESTED: Temp file written, metadata stored
- PROCESSING: Asset generation in progress
- STORED: Original and derived assets ready
- FAILED: Unrecoverable ingestion error

### Notification Types
- JOB_ERROR: Background job failed
- JOB_COMPLETE: Background job succeeded
- SHARE_REQUEST: Client requested access
- USER_REGISTERED: New user signed up
- QUOTA_EXCEEDED: Storage limit reached
- SYSTEM_ERROR: Critical system error
- ACCESS_REQUEST: Access to resource requested
      `,
      contact: {
        name: 'FRAME Support',
        email: 'support@frame.app'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token'
        }
      },
      schemas: {
        Image: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            title: { type: 'string', example: 'My Image' },
            status: { type: 'string', enum: ['UPLOADED', 'INGESTED', 'PROCESSING', 'STORED', 'FAILED'] },
            width: { type: 'integer', example: 1920 },
            height: { type: 'integer', example: 1080 },
            sizeBytes: { type: 'integer', example: 2048000 },
            checksum: { type: 'string', example: 'abc123...' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            name: { type: 'string', example: 'Wedding Photos' },
            description: { type: 'string', example: 'Client wedding collection' },
            quotaBytes: { type: 'integer', example: 10737418240 },
            storageUsed: { type: 'integer', example: 5368709120 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['USER', 'PRO', 'CLIENT', 'ADMIN', 'SUPERADMIN'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            type: { type: 'string', enum: ['JOB_ERROR', 'JOB_COMPLETE', 'SHARE_REQUEST', 'USER_REGISTERED', 'QUOTA_EXCEEDED', 'SYSTEM_ERROR', 'ACCESS_REQUEST'] },
            title: { type: 'string', example: 'Job Failed' },
            message: { type: 'string', example: 'Thumbnail generation failed' },
            status: { type: 'string', enum: ['UNREAD', 'READ', 'SNOOZED'] },
            requestor: { type: 'string', example: 'user@email.com' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            type: { type: 'string', example: 'OFFLOAD_ORIGINAL' },
            status: { type: 'string', enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'] },
            attempts: { type: 'integer', example: 0 },
            maxAttempts: { type: 'integer', example: 3 },
            lastError: { type: 'string', example: 'Connection timeout' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ShareToken: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            token: { type: 'string', example: 'abc123...' },
            projectId: { type: 'string', example: 'cuid123' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            maxAccesses: { type: 'integer', nullable: true },
            accessCount: { type: 'integer', example: 0 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' }
          }
        },
        ProProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            userId: { type: 'string', example: 'cuid123' },
            businessName: { type: 'string', example: 'John Photography' },
            logo: { type: 'string', example: 'https://...' },
            location: { type: 'string', example: 'New York, NY' },
            contactEmail: { type: 'string', example: 'contact@business.com' },
            website: { type: 'string', example: 'https://business.com' },
            phone: { type: 'string', example: '+1234567890' },
            socialLinks: { type: 'object', properties: { instagram: { type: 'string' }, facebook: { type: 'string' }, twitter: { type: 'string' } } },
            portfolio: { type: 'string', example: 'https://portfolio.com' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Album: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            name: { type: 'string', example: 'Wedding Album' },
            description: { type: 'string', example: 'Client wedding photos' },
            category: { type: 'string', enum: ['PHOTO_ALBUM', 'VIDEO_ALBUM', 'SHORT_VIDEOS', 'REELS', 'SHORTS'] },
            projectId: { type: 'string', nullable: true, example: 'cuid123' },
            ownerId: { type: 'string', example: 'cuid123' },
            coverImage: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AlbumSettings: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            albumId: { type: 'string', example: 'cuid123' },
            imageQuality: { type: 'string', enum: ['ORIGINAL', 'HIGH', 'MEDIUM', 'LOW'] },
            videoQuality: { type: 'string', enum: ['ORIGINAL', 'HIGH', 'MEDIUM', 'LOW'] },
            shortQuality: { type: 'string', enum: ['ORIGINAL', 'HIGH', 'MEDIUM', 'LOW'] },
            enableDownload: { type: 'boolean', example: true },
            enablePreview: { type: 'boolean', example: true },
            watermarkEnabled: { type: 'boolean', example: false },
            watermarkPosition: { type: 'string', enum: ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER'] },
            watermarkOpacity: { type: 'number', example: 0.5 },
            faceRecognitionEnabled: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ClientProjectAccess: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            projectId: { type: 'string', example: 'cuid123' },
            userId: { type: 'string', example: 'cuid123' },
            accessLevel: { type: 'string', enum: ['READ', 'WRITE', 'FULL'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ClientAlbumAccess: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            albumId: { type: 'string', example: 'cuid123' },
            userId: { type: 'string', example: 'cuid123' },
            accessLevel: { type: 'string', enum: ['READ', 'WRITE', 'FULL'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            action: { type: 'string', enum: ['PROJECT_CREATED', 'PROJECT_DELETED', 'ALBUM_CREATED', 'ALBUM_DELETED', 'IMAGE_UPLOADED', 'IMAGE_DELETED', 'USER_LOGIN', 'USER_LOGOUT', 'SETTINGS_CHANGED', 'CLIENT_ACCESS_GRANTED', 'CLIENT_ACCESS_REVOKED'] },
            entityType: { type: 'string', example: 'Project' },
            entityId: { type: 'string', example: 'cuid123' },
            userId: { type: 'string', example: 'cuid123' },
            metadata: { type: 'object', additionalProperties: true },
            ipAddress: { type: 'string', example: '192.168.1.1' },
            userAgent: { type: 'string', example: 'Mozilla/5.0...' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      { BearerAuth: [] },
      { CookieAuth: [] }
    ],
    tags: [
      { name: 'Health', description: 'Health check and monitoring endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Images', description: 'Image management endpoints' },
      { name: 'Projects', description: 'Project management endpoints' },
      { name: 'Albums', description: 'Album management endpoints' },
      { name: 'Profile', description: 'PRO profile endpoints' },
      { name: 'Client Access', description: 'Client access management endpoints' },
      { name: 'Audit', description: 'Audit log endpoints (Admin only)' },
      { name: 'Admin', description: 'Admin-only endpoints' },
      { name: 'Notifications', description: 'Notification endpoints' },
      { name: 'Upload', description: 'File upload endpoints' },
      { name: 'Share', description: 'Project sharing endpoints' }
    ]
  },
  apis: ['./app/api/**/*.ts', './lib/**/*.ts']
}

const spec = swaggerJsdoc(options) as Record<string, unknown>

const additionalPaths: Record<string, unknown> = {
  '/api/profile': {
    get: {
      tags: ['Profile'],
      summary: 'Get PRO profile',
      description: 'Get the current user PRO profile',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      responses: {
        '200': {
          description: 'PRO profile data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProProfile' }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      tags: ['Profile'],
      summary: 'Create or update PRO profile',
      description: 'Create or update the current user PRO profile',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                businessName: { type: 'string' },
                logo: { type: 'string' },
                location: { type: 'string' },
                contactEmail: { type: 'string' },
                website: { type: 'string' },
                phone: { type: 'string' },
                instagram: { type: 'string' },
                facebook: { type: 'string' },
                twitter: { type: 'string' },
                portfolio: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Profile updated' },
        '201': { description: 'Profile created' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/albums': {
    get: {
      tags: ['Albums'],
      summary: 'Get albums',
      description: 'Get all albums accessible to the user',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'projectId', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'List of albums',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  albums: { type: 'array', items: { $ref: '#/components/schemas/Album' } }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/albums/{id}': {
    get: {
      tags: ['Albums'],
      summary: 'Get album',
      description: 'Get a specific album by ID',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Album data' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Album not found' }
      }
    },
    delete: {
      tags: ['Albums'],
      summary: 'Delete album',
      description: 'Delete an album',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Album deleted' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Album not found' }
      }
    }
  },
  '/api/albums/{id}/settings': {
    get: {
      tags: ['Albums'],
      summary: 'Get album settings',
      description: 'Get settings for a specific album',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Album settings',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AlbumSettings' }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    put: {
      tags: ['Albums'],
      summary: 'Update album settings',
      description: 'Update settings for a specific album',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                imageQuality: { type: 'string', enum: ['ORIGINAL', 'HIGH', 'MEDIUM', 'LOW'] },
                videoQuality: { type: 'string', enum: ['ORIGINAL', 'HIGH', 'MEDIUM', 'LOW'] },
                shortQuality: { type: 'string', enum: ['ORIGINAL', 'HIGH', 'MEDIUM', 'LOW'] },
                enableDownload: { type: 'boolean' },
                enablePreview: { type: 'boolean' },
                watermarkEnabled: { type: 'boolean' },
                watermarkPosition: { type: 'string', enum: ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER'] },
                watermarkOpacity: { type: 'number' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Settings updated' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/projects/{id}/clients': {
    get: {
      tags: ['Client Access'],
      summary: 'Get project clients',
      description: 'Get all clients with access to a project',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'List of client accesses',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  clients: { type: 'array', items: { $ref: '#/components/schemas/ClientProjectAccess' } }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      tags: ['Client Access'],
      summary: 'Grant client access',
      description: 'Grant a user access to a project',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'accessLevel'],
              properties: {
                userId: { type: 'string' },
                accessLevel: { type: 'string', enum: ['READ', 'WRITE', 'FULL'] }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Access granted' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/projects/{id}/clients/{userId}': {
    delete: {
      tags: ['Client Access'],
      summary: 'Revoke client access',
      description: 'Revoke a user access from a project',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Access revoked' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/audit': {
    get: {
      tags: ['Audit'],
      summary: 'Get audit logs',
      description: 'Get audit logs (Admin/Superadmin only)',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'action', in: 'query', schema: { type: 'string' } },
        { name: 'userId', in: 'query', schema: { type: 'string' } },
        { name: 'entityType', in: 'query', schema: { type: 'string' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } }
      ],
      responses: {
        '200': {
          description: 'List of audit logs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  logs: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  totalPages: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' }
      }
    }
  }
}

export const swaggerSpec = {
  ...(spec as Record<string, unknown>),
  paths: {
    ...(spec.paths as Record<string, unknown>),
    ...additionalPaths
  }
} as typeof spec
