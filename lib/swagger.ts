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
      { name: 'Admin', description: 'Admin-only endpoints' },
      { name: 'Notifications', description: 'Notification endpoints' },
      { name: 'Upload', description: 'File upload endpoints' },
      { name: 'Share', description: 'Project sharing endpoints' }
    ]
  },
  apis: ['./app/api/**/*.ts', './lib/**/*.ts']
}

export const swaggerSpec = swaggerJsdoc(options)
