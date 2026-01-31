-- Phase 2 Migration: Job Runner with Locking & Retries
-- Adds support for persistent job execution, locking, and image lifecycle extension

-- Add new image status enum value
ALTER TYPE "ImageStatus" ADD VALUE 'PROCESSING' BEFORE 'FAILED';
ALTER TYPE "ImageStatus" ADD VALUE 'STORED' BEFORE 'FAILED';

-- Add derived asset fields to Image table
ALTER TABLE "Image" ADD COLUMN "thumbnailPath" TEXT;
ALTER TABLE "Image" ADD COLUMN "previewPath" TEXT;

-- Recreate Job table with full Phase 2 contract compliance
-- Drop existing Job table to rebuild with proper schema
DROP TABLE IF EXISTS "Job" CASCADE;

-- Create JobStatus enum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- Create new Job table with Phase 2 contract fields
CREATE TABLE "Job" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "lastError" TEXT,
  "imageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Job_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE SET NULL
);

-- Create indexes for job queries
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_imageId_idx" ON "Job"("imageId");
CREATE INDEX "Job_type_idx" ON "Job"("type");
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");
