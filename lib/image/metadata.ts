import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs/promises';
import { createReadStream } from 'fs';

// Phase 1 Contract: Metadata Contract
// See: .ai/contracts/phase-1-ingestion.md §4

export interface BasicMetadata {
    mimeType: string;
    width: number;
    height: number;
    sizeBytes: number;
    checksum: string;
}

/**
 * Computes SHA-256 checksum of a file
 * Contract §4: checksum = computed
 */
export async function computeChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = createReadStream(filePath);

        stream.on('error', (err) => reject(err));
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

/**
 * Extracts only allowed metadata for Phase 1
 * Contract §4: Only specific fields allowed. No EXIF deep parsing.
 */
export async function extractBasicMetadata(filePath: string): Promise<BasicMetadata> {
    // 1. Get file stats for size
    const stats = await fs.stat(filePath);

    // 2. Compute checksum (can be parallelized with stat but separate for clarity)
    const checksum = await computeChecksum(filePath);

    // 3. Extract image header info using sharp
    // metadata() reads the header, which is safe and fast
    try {
        const metadata = await sharp(filePath).metadata();

        if (!metadata.width || !metadata.height || !metadata.format) {
            throw new Error('Failed to extract image dimensions or format');
        }

        // Map sharp format to mime type (basic mapping)
        const mimeType = `image/${metadata.format}`;

        return {
            sizeBytes: stats.size,
            checksum,
            width: metadata.width,
            height: metadata.height,
            mimeType,
        };
    } catch (error) {
        throw new Error(`Metadata extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
