import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import prisma from '@/lib/prisma';
import { streamToTempStorage, cleanupTempFile } from '@/lib/storage/temp';
import { extractBasicMetadata } from '@/lib/image/metadata';
import { enqueueOffloadJob } from '@/lib/jobs/queue';
import { auth } from "@/lib/auth/auth";

// Phase 1 Ingestion Contract Implementation
// See: .ai/contracts/phase-1-ingestion.md §2

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = session.user.id;
  let tempPath: string | null = null;
  const imageId = crypto.randomUUID();

  console.log('[Upload API] Request received', { imageId });

  try {
    // 1. Accept streamed file upload
    const formData = await request.formData();
    console.log('[Upload API] FormData parsed');

    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const collectionName = formData.get('collection') as string;
    const collectionIdsRaw = formData.get('collectionIds') as string;

    console.log('[Upload API] Payload:', {
      fileName: file?.name,
      title,
      collectionName,
      hasCollectionIds: !!collectionIdsRaw
    });

    let collectionIds: string[] = [];

    if (collectionIdsRaw) {
      try {
        collectionIds = JSON.parse(collectionIdsRaw);
      } catch (e) {
        console.error('Failed to parse collectionIds:', e);
      }
    }

    if (!file) {
      console.error('[Upload API] Missing file');
      return NextResponse.json({ error: 'No file provided', code: 'INVALID_REQUEST' }, { status: 400 });
    }

    // 2. Persist file to temporary storage
    const extension = path.extname(file.name) || '.bin';
    console.log('[Upload API] Streaming to temp storage...', { imageId, extension });
    // stream() returns a Web ReadableStream
    tempPath = await streamToTempStorage(imageId, extension, file.stream());
    console.log('[Upload API] Temp file created:', tempPath);

    // 3. Compute checksum & 4. Extract basic metadata (only Allowed Fields)
    // Contract §4: fileSize, mimeType, width, height, checksum, uploadedAt
    console.log('[Upload API] Extracting metadata...');
    const metadata = await extractBasicMetadata(tempPath);
    console.log('[Upload API] Metadata extracted:', metadata);

    // 5. Create DB record
    // Contract §5: status must be INGESTED
    console.log('[Upload API] Creating DB record...');
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
        userId: userId,
        collections: collectionIds.length > 0
          ? {
            connect: collectionIds.map(id => ({ id }))
          }
          : collectionName
            ? {
              connectOrCreate: {
                where: {
                  name_userId: {
                    name: collectionName,
                    userId: userId
                  }
                },
                create: {
                  name: collectionName,
                  userId: userId
                }
              }
            }
            : undefined,
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
    console.log('[Upload success]', { imageId: image.id });
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
    console.error('[Upload API Critical Failure]', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      imageId
    });

    // Cleanup temp file on failure
    if (tempPath) {
      console.log('[Cleanup] Removing temp file:', tempPath);
      await cleanupTempFile(tempPath).catch(err => console.error('[Cleanup Error]', err));
    }

    // Attempt to delete DB record if it was half-created
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
