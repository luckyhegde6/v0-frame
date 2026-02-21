import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FRAME API Documentation',
      version: '1.0.0',
      description: `
## FRAME - Professional Image Management System

### Authentication Guide

This API supports two authentication methods:

#### Method 1: Bearer Token (Recommended for API clients)
1. **Get Token**: Click "Get Bearer Token" button in Admin Dashboard, or call \`GET /api/admin/token\`
2. **Use Token**: Include the token in the Authorization header:
   \`\`\`
   Authorization: Bearer <your-token>
   \`\`\`

#### Method 2: Cookie Auth (Browser sessions)
The NextAuth session cookie is automatically used when making requests from a browser.
Cookie name: \`next-auth.session-token\`

### Getting Started
1. **Sign in** at \`/auth/signin\` to get a session cookie, OR
2. **Get Bearer Token** from Admin Dashboard or \`/api/admin/token\` endpoint
3. **Make API calls** with the authentication header or cookie

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
            status: { type: 'string', enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'] },
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
  '/api/token': {
    get: {
      tags: ['Auth'],
      summary: 'Get API Token',
      description: 'Generate a bearer token for API access. Requires an active session (cookie or existing token). Valid for 24 hours.',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      responses: {
        '200': {
          description: 'Token generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', example: 'abc123...' },
                  expiresAt: { type: 'string', format: 'date-time' },
                  expiresIn: { type: 'string', example: '24h' },
                  user: { 
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      name: { type: 'string', nullable: true },
                      role: { type: 'string' }
                    }
                  },
                  usage: {
                    type: 'object',
                    properties: {
                      header: { type: 'string', example: 'Authorization' },
                      format: { type: 'string', example: 'Bearer <token>' },
                      cookie: { type: 'string', example: 'next-auth.session-token' }
                    }
                  },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized - No active session' }
      }
    }
  },
  '/api/admin/token': {
    get: {
      tags: ['Auth'],
      summary: 'Get Bearer Token',
      description: 'Generate a bearer token for API access. Valid for 24 hours.',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      responses: {
        '200': {
          description: 'Token generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', example: 'abc123...' },
                  expiresAt: { type: 'string', format: 'date-time' },
                  expiresIn: { type: 'string', example: '24h' },
                  user: { 
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' }
                    }
                  },
                  usage: {
                    type: 'object',
                    properties: {
                      header: { type: 'string', example: 'Authorization' },
                      format: { type: 'string', example: 'Bearer <token>' }
                    }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'Get user notifications',
      description: 'Get all notifications for the authenticated user',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'unread', in: 'query', schema: { type: 'boolean' }, description: 'Filter only unread notifications' }
      ],
      responses: {
        '200': {
          description: 'List of notifications',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                  unreadCount: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    patch: {
      tags: ['Notifications'],
      summary: 'Update notification status',
      description: 'Mark notifications as read, snooze them, or mark all as read',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                notificationId: { type: 'string' },
                markAllRead: { type: 'boolean' },
                status: { type: 'string', enum: ['READ', 'SNOOZED'] },
                snoozeUntil: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Notification updated' },
        '401': { description: 'Unauthorized' }
      }
    },
    delete: {
      tags: ['Notifications'],
      summary: 'Delete notification',
      description: 'Delete a notification by ID',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'query', required: true, schema: { type: 'string' }, description: 'Notification ID' }
      ],
      responses: {
        '200': { description: 'Notification deleted' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/admin/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'Get all notifications (Admin)',
      description: 'Get all notifications in the system (Admin/Superadmin only)',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'unread', in: 'query', schema: { type: 'boolean' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['UNREAD', 'READ', 'SNOOZED'] } }
      ],
      responses: {
        '200': {
          description: 'List of all notifications',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                  unreadCount: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' }
      }
    },
    post: {
      tags: ['Notifications'],
      summary: 'Create notification (Admin)',
      description: 'Create a new notification (Admin/Superadmin only)',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'title', 'message'],
              properties: {
                type: { type: 'string', enum: ['JOB_ERROR', 'JOB_COMPLETE', 'SHARE_REQUEST', 'USER_REGISTERED', 'QUOTA_EXCEEDED', 'SYSTEM_ERROR', 'ACCESS_REQUEST'] },
                title: { type: 'string' },
                message: { type: 'string' },
                requestor: { type: 'string' },
                userId: { type: 'string' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Notification created' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' }
      }
    }
  },
  '/api/upload': {
    post: {
      tags: ['Upload'],
      summary: 'Upload image',
      description: 'Upload a new image to the gallery',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Image uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  image: { $ref: '#/components/schemas/Image' },
                  uploadUrl: { type: 'string' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid file type or size' },
        '401': { description: 'Unauthorized' },
        '413': { description: 'File too large' }
      }
    }
  },
  '/api/upload/url': {
    post: {
      tags: ['Upload'],
      summary: 'Get upload URL',
      description: 'Get a pre-signed URL for uploading large files directly to storage',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['filename', 'contentType'],
              properties: {
                filename: { type: 'string' },
                contentType: { type: 'string' },
                size: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Upload URL generated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  uploadUrl: { type: 'string' },
                  imageId: { type: 'string' },
                  expiresAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/share': {
    get: {
      tags: ['Share'],
      summary: 'Get share tokens',
      description: 'Get all share tokens for the authenticated user',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      responses: {
        '200': {
          description: 'List of share tokens',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tokens: { type: 'array', items: { $ref: '#/components/schemas/ShareToken' } }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      tags: ['Share'],
      summary: 'Create share token',
      description: 'Create a new share token for a project or album',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectId'],
              properties: {
                projectId: { type: 'string' },
                albumId: { type: 'string' },
                expiresAt: { type: 'string', format: 'date-time' },
                maxAccesses: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Share token created' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/share/{token}': {
    get: {
      tags: ['Share'],
      summary: 'Access shared content',
      description: 'Access content using a share token',
      parameters: [
        { name: 'token', in: 'path', required: true, schema: { type: 'string' }, description: 'Share token' }
      ],
      responses: {
        '200': {
          description: 'Shared content access',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  project: { $ref: '#/components/schemas/Project' },
                  albums: { type: 'array', items: { $ref: '#/components/schemas/Album' } }
                }
              }
            }
          }
        },
        '404': { description: 'Invalid or expired token' }
      }
    }
  },
  '/api/share/{id}': {
    delete: {
      tags: ['Share'],
      summary: 'Revoke share token',
      description: 'Revoke a share token',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Share token ID' }
      ],
      responses: {
        '200': { description: 'Share token revoked' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Token not found' }
      }
    }
  },
  '/api/admin/requests': {
    get: {
      tags: ['PRO Requests'],
      summary: 'Get all PRO requests (Admin)',
      description: 'Get all PRO requests across all users (Admin/Superadmin only)',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] } },
        { name: 'type', in: 'query', schema: { type: 'string' } },
        { name: 'userId', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'List of all PRO requests',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  requests: { 
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string' },
                        status: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        user: { type: 'object' },
                        project: { type: 'object', nullable: true },
                        album: { type: 'object', nullable: true }
                      }
                    }
                  },
                  stats: {
                    type: 'object',
                    properties: {
                      pending: { type: 'integer' },
                      inProgress: { type: 'integer' },
                      completed: { type: 'integer' },
                      failed: { type: 'integer' },
                      total: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' }
      }
    },
    patch: {
      tags: ['PRO Requests'],
      summary: 'Update PRO request (Admin)',
      description: 'Update request status, add notes, or perform actions (Admin/Superadmin only)',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['requestId', 'action'],
              properties: {
                requestId: { type: 'string' },
                action: { type: 'string', enum: ['START', 'COMPLETE', 'REJECT', 'UPDATE_NOTES', 'RETRY'] },
                adminNotes: { type: 'string' },
                status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Request updated' },
        '400': { description: 'Invalid action or status' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' },
        '404': { description: 'Request not found' }
      }
    }
  },
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
  '/api/albums/{id}/images': {
    get: {
      tags: ['Albums'],
      summary: 'Get album images',
      description: 'Get all images in a specific album',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'List of album images',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  images: { 
                    type: 'array', 
                    items: { 
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        thumbnailPath: { type: 'string' },
                        previewPath: { type: 'string' },
                        width: { type: 'integer' },
                        height: { type: 'integer' },
                        mimeType: { type: 'string' },
                        sizeBytes: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        addedAt: { type: 'string', format: 'date-time' }
                      }
                    } 
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Album not found' }
      }
    },
    delete: {
      tags: ['Albums'],
      summary: 'Remove images from album',
      description: 'Remove images from an album (does not delete the images)',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['imageIds'],
              properties: {
                imageIds: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      responses: {
        '200': { 
          description: 'Images removed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  removedCount: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Album not found' }
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
  },
  '/api/admin/jobs/{id}/retry': {
    post: {
      tags: ['Admin'],
      summary: 'Retry a failed job',
      description: 'Retry a job that has failed. Only ADMIN or SUPERADMIN can perform this action.',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Job ID' }
      ],
      responses: {
        '200': {
          description: 'Job retry initiated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  job: { $ref: '#/components/schemas/Job' }
                }
              }
            }
          }
        },
        '400': { description: 'Job cannot be retried (not failed or max attempts reached)' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' },
        '404': { description: 'Job not found' }
      }
    }
  },
  '/api/admin/jobs/{id}/cancel': {
    post: {
      tags: ['Admin'],
      summary: 'Cancel a pending or running job',
      description: 'Cancel a job that is pending or running. Only ADMIN or SUPERADMIN can perform this action.',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Job ID' }
      ],
      responses: {
        '200': {
          description: 'Job cancelled',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  job: { $ref: '#/components/schemas/Job' }
                }
              }
            }
          }
        },
        '400': { description: 'Job cannot be cancelled (not pending or running)' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' },
        '404': { description: 'Job not found' }
      }
    }
  },
  '/api/admin/jobs/{id}/run': {
    post: {
      tags: ['Admin'],
      summary: 'Force run a pending job',
      description: 'Force start a pending job immediately. Only ADMIN or SUPERADMIN can perform this action.',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Job ID' }
      ],
      responses: {
        '200': {
          description: 'Job marked as running',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  job: { $ref: '#/components/schemas/Job' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        '400': { description: 'Job cannot be force run (not pending or locked)' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' },
        '404': { description: 'Job not found' }
      }
    }
  },
  '/api/requests': {
    get: {
      tags: ['PRO Requests'],
      summary: 'Get PRO user requests',
      description: 'Get all requests submitted by the authenticated PRO user',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      responses: {
        '200': {
          description: 'List of PRO requests',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  requests: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string', enum: ['PROJECT_EXPORT_REQUEST', 'THUMBNAIL_REGENERATION', 'FACE_RECOGNITION', 'WATERMARK_ENABLE', 'SHARE_REQUEST'] },
                        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
                        title: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        project: { type: 'object', nullable: true },
                        album: { type: 'object', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      tags: ['PRO Requests'],
      summary: 'Submit a PRO request',
      description: 'Submit a new PRO request (exports, face recognition, watermarks, etc.). Requires PRO or ADMIN role.',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'title'],
              properties: {
                type: { type: 'string', enum: ['PROJECT_EXPORT_REQUEST', 'THUMBNAIL_REGENERATION', 'FACE_RECOGNITION', 'WATERMARK_ENABLE', 'SHARE_REQUEST'] },
                title: { type: 'string' },
                description: { type: 'string' },
                payload: {
                  type: 'object',
                  properties: {
                    projectId: { type: 'string' },
                    albumId: { type: 'string' },
                    exportAll: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Request created' },
        '400': { description: 'Invalid request type or missing required fields' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - PRO subscription required' },
        '404': { description: 'Project or album not found' }
      }
    }
  },
  '/api/images/{id}/download': {
    get: {
      tags: ['Images'],
      summary: 'Download an image',
      description: 'Download the original image file',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Image ID' }
      ],
      responses: {
        '200': {
          description: 'Image file',
          content: {
            'image/jpeg': { schema: { type: 'string', format: 'binary' } },
            'image/png': { schema: { type: 'string', format: 'binary' } },
            'image/webp': { schema: { type: 'string', format: 'binary' } }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Image not found' }
      }
    }
  },
  '/api/albums/{id}/download': {
    post: {
      tags: ['Albums'],
      summary: 'Download album as ZIP',
      description: 'Download selected images or all images from an album as a ZIP file',
      security: [{ BearerAuth: [] }, { CookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Album ID' }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                imageIds: { type: 'array', items: { type: 'string' } },
                downloadAll: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'ZIP file',
          content: {
            'application/zip': { schema: { type: 'string', format: 'binary' } }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Album not found' }
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
