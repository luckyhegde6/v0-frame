// Phase 3: EXIF Enrichment Handler
// Extracts detailed metadata from images using sharp and exif-reader

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import exifReader from 'exif-reader';
import prisma from '@/lib/prisma';
import { retrieveFile, USE_SUPABASE_STORAGE } from '@/lib/storage';

interface ExifData {
    gps?: {
        GPSLatitude?: number[];
        GPSLatitudeRef?: string;
        GPSLongitude?: number[];
        GPSLongitudeRef?: string;
        GPSAltitude?: number;
    };
    image?: {
        Make?: string;
        Model?: string;
        Software?: string;
    };
    exif?: {
        ExposureTime?: number;
        FNumber?: number;
        ISO?: number;
        FocalLength?: number;
        LensModel?: string;
        DateTimeOriginal?: Date;
    };
}

/**
 * Extract EXIF metadata and update image record
 */
export async function handleExifEnrichment(payload: any, jobId: string): Promise<void> {
    const { imageId, originalPath } = payload;

    console.log(`[EXIF Handler] Processing image: ${imageId}`);
    console.log(`[EXIF Handler] Using Supabase Storage: ${USE_SUPABASE_STORAGE}`);

    let localPath = originalPath;

    try {
        // 1. Get the file - download from Supabase if needed
        if (USE_SUPABASE_STORAGE) {
            // Handle both formats: full URL, bucket/path, or just path
            let bucket: string
            let storagePath: string
            
            if (originalPath.startsWith('http')) {
              // Full URL - extract bucket and path
              const urlMatch = originalPath.match(/object\/(?:public\/)?([^/]+)\/(.+)$/)
              if (urlMatch) {
                bucket = urlMatch[1]
                storagePath = urlMatch[2]
              } else {
                throw new Error(`Failed to parse URL: ${originalPath}`)
              }
            } else if (originalPath.includes('/')) {
              // bucket/path format
              const [b, ...pathParts] = originalPath.split('/')
              bucket = b
              storagePath = pathParts.join('/')
            } else {
              // Just path - assume project-albums bucket (common case)
              bucket = 'project-albums'
              storagePath = originalPath
            }

            console.log(`[EXIF Handler] Downloading from Supabase: ${bucket}/${storagePath}`);

            try {
                localPath = await retrieveFile({
                    bucket: bucket as any,
                    path: storagePath,
                });
                console.log(`[EXIF Handler] Downloaded to: ${localPath}`);
            } catch (error) {
                console.error(`[EXIF Handler] Failed to download:`, error);
                throw error;
            }
        }

        // 2. Read image metadata using sharp
        const imageBuffer = await fs.readFile(localPath);
        const metadata = await sharp(imageBuffer).metadata();

        if (!metadata.exif) {
            console.log(`[EXIF Handler] No EXIF data found for image: ${imageId}`);
            // Clean up temp file if downloaded from Supabase
            if (USE_SUPABASE_STORAGE && originalPath.includes('/')) {
                await fs.unlink(localPath).catch(() => {});
            }
            return;
        }

        // 3. Parse EXIF data
        const exif = exifReader(metadata.exif) as ExifData;

        // GPS Conversion (DMS to Decimal)
        const getDecimal = (dms: any) => {
            if (!dms || !Array.isArray(dms) || dms.length !== 3) return null;
            return dms[0] + dms[1] / 60 + dms[2] / 3600;
        };

        const lat = exif.gps?.GPSLatitude ? getDecimal(exif.gps.GPSLatitude) * (exif.gps.GPSLatitudeRef === 'S' ? -1 : 1) : null;
        const lng = exif.gps?.GPSLongitude ? getDecimal(exif.gps.GPSLongitude) * (exif.gps.GPSLongitudeRef === 'W' ? -1 : 1) : null;

        // 4. Update database with enriched metadata
        await prisma.image.update({
            where: { id: imageId },
            data: {
                make: exif.image?.Make || null,
                model: exif.image?.Model || null,
                exposureTime: exif.exif?.ExposureTime ? `1/${Math.round(1 / exif.exif.ExposureTime)}` : null,
                fNumber: exif.exif?.FNumber || null,
                iso: exif.exif?.ISO || null,
                focalLength: exif.exif?.FocalLength || null,
                lensModel: exif.exif?.LensModel || null,
                software: exif.image?.Software || null,
                dateTaken: exif.exif?.DateTimeOriginal || null,
                lat,
                lng,
                alt: exif.gps?.GPSAltitude || null,
            }
        });

        console.log(`[EXIF Handler] Successfully enriched metadata for image: ${imageId}`);

    } catch (error: any) {
        console.error(`[EXIF Handler] Error processing image ${imageId}:`, error.message);
        throw error; // Rethrow for job runner to handle retries
    } finally {
        // Clean up temp file if downloaded from Supabase
        if (USE_SUPABASE_STORAGE && originalPath.includes('/') && localPath) {
            try {
                await fs.unlink(localPath).catch(() => {});
            } catch {}
        }
    }
}
