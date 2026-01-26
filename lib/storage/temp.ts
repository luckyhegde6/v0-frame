import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// Phase 1 Contract: Deterministic temp path
// See: .ai/contracts/phase-1-ingestion.md §3

const TEMP_DIR_NAME = 'ingest';

// Cross-platform temp directory resolution
function getTempDir(): string {
    // On Vercel, /tmp is the only writable directory
    if (process.env.VERCEL) {
        return path.join('/tmp', TEMP_DIR_NAME);
    }
    // Local development fallback
    return path.join(os.tmpdir(), 'v0-frame', TEMP_DIR_NAME);
}

/**
 * Ensures the temp directory exists
 */
export async function ensureTempDir(): Promise<void> {
    const dir = getTempDir();
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

/**
 * Generates specific deterministic path for an image
 * Contract §3: /tmp/ingest/{imageId}.{ext}
 */
export function getTempPath(imageId: string, extension: string): string {
    // Normalize extension
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return path.join(getTempDir(), `${imageId}${ext}`);
}

/**
 * Streams a file to temporary storage atomically
 * Contract §3: File write must be atomic (using rename pattern if strictly required, 
 * but for Phase 1 temp files, direct write is often sufficient if we don't commit ingestion until success)
 * However, to be purely atomic, we should write to a randomized temp file first then rename.
 * 
 * Contract §2: "Persist file to temporary storage"
 */
export async function streamToTempStorage(
    imageId: string,
    extension: string,
    stream: Readable | ReadableStream
): Promise<string> {
    await ensureTempDir();

    const finalPath = getTempPath(imageId, extension);
    // Using a partial path for atomicity
    const partialPath = `${finalPath}.part`;

    // Handle both Node streams and Web streams
    let nodeStream: Readable;
    if (stream instanceof Readable) {
        nodeStream = stream;
    } else {
        // Convert Web Stream to Node Stream if necessary (Next.js Request body)
        // @ts-ignore - Readable.fromWeb is available in newer Node versions
        nodeStream = Readable.fromWeb(stream as any);
    }

    const writeStream = createWriteStream(partialPath);

    try {
        await pipeline(nodeStream, writeStream);
        // Rename to final deterministic path
        await fs.rename(partialPath, finalPath);
        return finalPath;
    } catch (error) {
        // Cleanup on failure
        try {
            await fs.unlink(partialPath).catch(() => { });
        } catch { }
        throw new Error(`Temp storage failure: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Cleans up a temp file
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        // Ignore if already gone
        if ((error as any).code !== 'ENOENT') {
            console.error(`Failed to cleanup temp file ${filePath}:`, error);
        }
    }
}
