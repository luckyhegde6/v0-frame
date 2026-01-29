-- Phase 1 Ingestion Database Schema
-- Creates tables for Image, Collection, and Job models

-- Create enum type for ImageStatus
CREATE TYPE "ImageStatus" AS ENUM ('UPLOADED', 'INGESTED', 'FAILED');

-- Create Image table
CREATE TABLE "Image" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "status" "ImageStatus" NOT NULL,
  "title" TEXT,
  "tempPath" TEXT NOT NULL,
  "checksum" TEXT NOT NULL UNIQUE,
  "mimeType" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for Image table
CREATE INDEX "Image_status_idx" ON "Image"("status");
CREATE INDEX "Image_checksum_idx" ON "Image"("checksum");
CREATE INDEX "Image_createdAt_idx" ON "Image"("createdAt");

-- Create Collection table
CREATE TABLE "Collection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create _CollectionToImage join table for many-to-many relationship
-- Prisma generates join table names alphabetically: Collection before Image
CREATE TABLE "_CollectionToImage" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_CollectionToImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_CollectionToImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index for the join table
CREATE UNIQUE INDEX "_CollectionToImage_AB_unique" ON "_CollectionToImage"("A", "B");
CREATE INDEX "_CollectionToImage_B_index" ON "_CollectionToImage"("B");

-- Create Job table
CREATE TABLE "Job" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
