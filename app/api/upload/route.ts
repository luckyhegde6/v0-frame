import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import prisma from '@/lib/prisma';
import { streamToTempStorage, cleanupTempFile } from '@/lib/storage/temp';
import { extractBasicMetadata } from '@/lib/image/metadata';
import { enqueueOffloadJob } from '@/lib/jobs/queue';

// Phase 1 Ingestion Contract Implementation
// See: .ai/contracts/phase-1-ingestion.md §2

export async function POST(request: NextRequest) {
  let tempPath: string | null = null;
  const imageId = crypto.randomUUID();

  try {
    // 1. Accept streamed file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const collectionName = formData.get('collection') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided', code: 'INVALID_REQUEST' }, { status: 400 });
    }

    // 2. Persist file to temporary storage
    const extension = path.extname(file.name) || '.bin';
    // stream() returns a Web ReadableStream
    tempPath = await streamToTempStorage(imageId, extension, file.stream());

    // 3. Compute checksum & 4. Extract basic metadata (only Allowed Fields)
    // Contract §4: fileSize, mimeType, width, height, checksum, uploadedAt
    const metadata = await extractBasicMetadata(tempPath);

    // 5. Create DB record
    // Contract §5: status must be INGESTED
    const image = await prisma.image.create({
      data: {
        id: imageId,
        status: 'INGESTED',
        title: title || file.name.split('.')[0],
        tempPath: tempPath,
        checksum: metadata.checksum,
        mimeType: metadata.mimeType,
        width: metadata.width,
        height: metadata.height,
        sizeBytes: metadata.sizeBytes,
        collections: collectionName ? {
          connectOrCreate: {
            where: { name: collectionName },
            create: { name: collectionName }
          }
        } : undefined,
        // createdAt handled by default(now())
      },
      include: {
        collections: true
      }
    });

    // 6. Enqueue an offload job
    // Contract §6: Fire-and-forget, failure = upload failure
    await enqueueOffloadJob({
      type: 'OFFLOAD_ORIGINAL',
      imageId: image.id,
      tempPath: image.tempPath,
      checksum: image.checksum,
    });

    // 7. Return an immutable response
    // Contract §2 Response Format
    return NextResponse.json(
      {
        imageId: image.id,
        status: image.status,
        checksum: image.checksum,
        sizeBytes: image.sizeBytes,
        uploadedAt: image.createdAt.toISOString(),
      },
      { status: 201 }
    );

  } catch (error) {
    // Contract §7 Error Handling
    console.error('[Upload Error]', error);

    // Cleanup temp file on failure
    if (tempPath) {
      await cleanupTempFile(tempPath);
    }

    // If we managed to create a DB record but failed later (e.g. job enqueue),
    // we should ideally clean up the DB record too, or mark it as FAILED.
    // Contract: "Job enqueue failure = Cleanup temp".
    // Implicitly we should probably fail the DB record to avoid orphans if possible,
    // or just rely on the cleanup logic.
    // However, since we are returning an error to the client, the transaction is effectively failed.
    // Ideally we'd wrap DB+Job in a transaction or delete the record.
    // For Phase 1 simple contract compliance, we abort.
    // We try to delete the image record if it exists to keep state clean (Optional but good practice)
    try {
      await prisma.image.delete({ where: { id: imageId } }).catch(() => { });
    } catch { }

    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json(
      { error: errorMessage, code: 'UPLOAD_FAILED' },
      { status: 500 }
    );
  }
}
