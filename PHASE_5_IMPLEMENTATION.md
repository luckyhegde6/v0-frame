# Phase 5 — Admin Control Plane Implementation

**Status**: IN PROGRESS  
**Version**: 1.0.0  
**Started**: 2026-02-21  

---

## Overview

Phase 5 focuses on building a comprehensive Admin Control Plane that provides:
- Centralized dashboard for system observability
- Interactive API documentation (Swagger - admin-only)
- Server health monitoring and analytics
- Manual job control (retry, cancel, monitor)

---

## Current State Analysis

### Already Implemented
| Component | Status | Notes |
|-----------|--------|-------|
| Admin Dashboard (`/admin`) | ✅ Basic | Shows static stats |
| Jobs Monitor (`/admin/jobs`) | ✅ Read-only | Displays job list, no actions |
| System Health (`/admin/system`) | ✅ Basic | Database and job stats |
| Storage Monitor (`/admin/storage`) | ✅ Complete | Detailed analytics |
| Swagger API Docs (`/api/docs/swagger`) | ✅ Protected | Admin-only access |
| Jobs API (GET) | ✅ Complete | Read-only job listing |
| Job Details API (GET) | ✅ Complete | Single job details |

### Missing for Phase 5 Completion
| Component | Priority | Effort |
|-----------|----------|--------|
| Job Control API (Retry/Cancel) | High | Medium |
| Job Control UI | High | Medium |
| Enhanced Dashboard with real-time stats | Medium | Medium |
| Server health detailed metrics | Medium | Low |
| Admin action audit logging | High | Low |
| Processing queue management | Medium | High |

---

## Implementation Tasks

### Task 1: Job Control API
**Priority**: High  
**Effort**: Medium  

#### 1.1 Job Retry API
- [ ] Create `POST /api/admin/jobs/[id]/retry` endpoint
- [ ] Validate job is in FAILED status
- [ ] Reset attempts and clear error
- [ ] Set status to PENDING
- [ ] Log action to AuditLog

#### 1.2 Job Cancel API
- [ ] Create `POST /api/admin/jobs/[id]/cancel` endpoint
- [ ] Validate job is PENDING or RUNNING
- [ ] Release lock if held
- [ ] Set status to CANCELLED
- [ ] Log action to AuditLog

#### 1.3 Job Force Run API
- [ ] Create `POST /api/admin/jobs/[id]/run` endpoint
- [ ] For manually triggering PENDING jobs
- [ ] Log action to AuditLog

### Task 2: Job Control UI
**Priority**: High  
**Effort**: Medium  

#### 2.1 Update Jobs Page
- [ ] Add action buttons per job row
- [ ] Add retry button for FAILED jobs
- [ ] Add cancel button for PENDING jobs
- [ ] Add job detail modal/drawer
- [ ] Show job payload and error details
- [ ] Add confirmation dialogs

#### 2.2 Job Detail View
- [ ] Create expandable job detail panel
- [ ] Show full job history
- [ ] Show related image info
- [ ] Show retry history
- [ ] Add bulk actions for multiple jobs

### Task 3: Enhanced Dashboard
**Priority**: Medium  
**Effort**: Medium  

#### 3.1 Real-time Stats
- [ ] Add auto-refresh for stats
- [ ] Show processing queue depth
- [ ] Show recent activity feed
- [ ] Show system alerts

#### 3.2 Quick Actions Panel
- [ ] Add common admin actions
- [ ] Add navigation to key pages
- [ ] Add system status indicators

### Task 4: Server Health Metrics
**Priority**: Medium  
**Effort**: Low  

#### 4.1 Enhanced System Page
- [ ] Add memory usage stats
- [ ] Add processing throughput
- [ ] Add error rate tracking
- [ ] Add database connection pool stats

#### 4.2 Health Check Enhancements
- [ ] Add detailed health check endpoint
- [ ] Add database health check
- [ ] Add storage health check
- [ ] Add job queue health check

### Task 5: Admin Audit Logging
**Priority**: High  
**Effort**: Low  

#### 5.1 Audit Log Integration
- [ ] Log all job control actions
- [ ] Log admin configuration changes
- [ ] Log user management actions
- [ ] Create audit log viewer in admin

### Task 6: API Documentation
**Priority**: Medium  
**Effort**: Low  

#### 6.1 Swagger Enhancement
- [ ] Add job control endpoints
- [ ] Add admin endpoints documentation
- [ ] Add request/response examples
- [ ] Add authentication examples

---

## Database Changes

### New Enum Values (if needed)
```prisma
enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED  // Add this for manual cancellation
}
```

### Audit Actions to Track
```prisma
// Already in AuditAction enum:
JOB_CREATED
JOB_STARTED
JOB_COMPLETED
JOB_FAILED

// Add these:
JOB_RETRY       // Job manually retried
JOB_CANCELLED   // Job manually cancelled
JOB_FORCE_RUN   // Job force-started
```

---

## API Endpoints Summary

### New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/jobs/[id]/retry` | POST | Retry a failed job |
| `/api/admin/jobs/[id]/cancel` | POST | Cancel a pending job |
| `/api/admin/jobs/[id]/run` | POST | Force run a pending job |
| `/api/admin/jobs/bulk` | POST | Bulk job operations |
| `/api/admin/health/detailed` | GET | Detailed system health |

### Updated Endpoints

| Endpoint | Changes |
|----------|---------|
| `/api/admin/jobs/[id]` | Add DELETE for cancellation |
| `/api/admin/stats` | Add more metrics |

---

## Testing Strategy

### Unit Tests
- [ ] Job retry logic
- [ ] Job cancel logic
- [ ] Audit log creation
- [ ] Authorization checks

### E2E Tests (Playwright)
- [ ] Admin login flow
- [ ] Jobs page display
- [ ] Job retry action
- [ ] Job cancel action
- [ ] Swagger access (admin-only)

---

## Security Considerations

1. **Authorization**: All admin endpoints require ADMIN or SUPERADMIN role
2. **Audit Trail**: All admin actions are logged to AuditLog
3. **Rate Limiting**: Consider rate limits on job control actions
4. **Input Validation**: Validate all inputs before processing

---

## Implementation Order

1. **Phase 5.1**: Job Control API (retry, cancel)
2. **Phase 5.2**: Job Control UI updates
3. **Phase 5.3**: Audit logging integration
4. **Phase 5.4**: Enhanced dashboard
5. **Phase 5.5**: Health metrics
6. **Phase 5.6**: Swagger documentation updates

---

## Success Criteria

- [ ] Admins can retry failed jobs
- [ ] Admins can cancel pending jobs
- [ ] All admin actions are logged
- [ ] Dashboard shows real-time stats
- [ ] Swagger is complete and admin-only
- [ ] E2E tests pass for all features
