// Phase 3: EXIF Enrichment Handler
// Extracts detailed metadata from images using sharp and exif-reader

import fs from 'fs/promises';
import sharp from 'sharp';
import exifReader from 'exif-reader';
import prisma from '@/lib/prisma';

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

    try {
        // 1. Read image metadata using sharp
        const imageBuffer = await fs.readFile(originalPath);
        const metadata = await sharp(imageBuffer).metadata();

        if (!metadata.exif) {
            console.log(`[EXIF Handler] No EXIF data found for image: ${imageId}`);
            return;
        }

        // 2. Parse EXIF data
        const exif = exifReader(metadata.exif) as ExifData;

        // GPS Conversion (DMS to Decimal)
        const getDecimal = (dms: any) => {
            if (!dms || !Array.isArray(dms) || dms.length !== 3) return null;
            return dms[0] + dms[1] / 60 + dms[2] / 3600;
        };

        const lat = exif.gps?.GPSLatitude ? getDecimal(exif.gps.GPSLatitude) * (exif.gps.GPSLatitudeRef === 'S' ? -1 : 1) : null;
        const lng = exif.gps?.GPSLongitude ? getDecimal(exif.gps.GPSLongitude) * (exif.gps.GPSLongitudeRef === 'W' ? -1 : 1) : null;

        // 3. Update database with enriched metadata
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
    }
}
