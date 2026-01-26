# Global Principles

These are the non-negotiable principles that all AI agents must follow when contributing to the FRAME photo management system.

**Violation of these rules invalidates the output.**

## Core Principles

1. **Correctness > Performance > Features**
   - Get it right first
   - Make it fast second
   - Add features last

2. **Explicit State Transitions Are Mandatory**
   - All state changes must be tracked
   - No implicit state modifications
   - Audit trail for all transitions

3. **All Heavy Work Must Be Asynchronous**
   - API routes enqueue jobs, don't execute them
   - Background workers handle heavy processing
   - No blocking operations in request handlers

4. **Originals Are Immutable and Lossless**
   - Never modify original images
   - Preserve byte-for-byte accuracy
   - All optimizations on derived copies

5. **Cloud Storage Is Ephemeral and Disposable**
   - Temporary storage only
   - Can be deleted at any time
   - No durable data in cloud

6. **Home Server Is the Canonical Source of Truth**
   - Original images stored on home server
   - Home server is authoritative
   - Cloud is just a frontend

7. **Failures Are Expected and Must Be Handled Explicitly**
   - Network failures
   - Disk pressure
   - Partial writes
   - Duplicate job execution
   - Home server unavailability

8. **Streaming Is Preferred Over Buffering**
   - No large files in memory
   - Use Node.js streams
   - Handle backpressure
   - Pipeline operations

9. **Boring, Readable Code Beats Clever Abstractions**
   - Explicit over implicit
   - Clear over concise
   - Maintainable over clever

## Application to All Agents

No agent is allowed to violate these principles, regardless of the task or context.

### Create Agent
- Must follow lifecycle model
- Must use async patterns
- Must preserve originals
- Must handle failures

### Optimize Agent
- Must not sacrifice correctness
- Must preserve safety checks
- Must maintain async boundaries
- Must keep streaming

### Debug Agent
- Must assume failures are normal
- Must preserve data integrity
- Must trace async boundaries
- Must identify root cause

### Refactor Agent
- Must preserve all behavior
- Must maintain async patterns
- Must keep code readable
- Must not change contracts

### Maintain Agent
- Must document principles
- Must ensure clarity
- Must verify correctness
- Must update docs when principles change

### Architect Agent
- Must design for failures
- Must enforce async boundaries
- Must protect originals
- Must choose boring solutions

### Security Reviewer Agent
- Must verify data protection
- Must check failure handling
- Must ensure safe file operations
- Must validate all inputs

### Test Engineer Agent
- Must test failure scenarios
- Must verify state transitions
- Must test async operations
- Must ensure correctness

## Enforcement

These principles are enforced through:

1. **Code Review**: All changes reviewed against principles
2. **Testing**: Tests verify principles are followed
3. **Documentation**: Principles documented in code
4. **Automation**: Linting and validation scripts

## Consequences of Violation

If an agent violates these principles:

1. **Output is rejected**: The work is not accepted
2. **Explanation required**: Why the violation occurred
3. **Correction needed**: Fix to align with principles
4. **Documentation updated**: If principle needs clarification

## Examples

### ✅ Correct: Async Upload

```typescript
// API route enqueues job
export async function POST(req: Request) {
  const file = await saveToTemp(req);
  const image = await createImageRecord(file);
  await enqueueOffloadJob(image.id);
  return Response.json({ imageId: image.id });
}

// Worker processes asynchronously
async function offloadWorker(imageId: string) {
  const image = await getImage(imageId);
  await streamToHomeServer(image);
  await verifyChecksum(image);
  await updateStatus(imageId, 'STORED');
  await cleanupTemp(image);
}
```

### ❌ Incorrect: Synchronous Processing

```typescript
// API route does heavy work
export async function POST(req: Request) {
  const file = await saveToTemp(req);
  await streamToHomeServer(file); // ❌ Blocking!
  await verifyChecksum(file);
  await cleanupTemp(file);
  return Response.json({ success: true });
}
```

### ✅ Correct: Streaming

```typescript
// Stream file without buffering
export async function GET(req: Request) {
  const stream = createReadStream(filePath);
  return new Response(stream as any);
}
```

### ❌ Incorrect: Buffering

```typescript
// Buffer entire file in memory
export async function GET(req: Request) {
  const buffer = await readFile(filePath); // ❌ Memory issue!
  return new Response(buffer);
}
```

### ✅ Correct: Explicit State Transitions

```typescript
// Track all state changes
await prisma.image.update({
  where: { id: imageId },
  data: {
    status: 'STORED',
    storedAt: new Date(),
    updatedAt: new Date()
  }
});
```

### ❌ Incorrect: Implicit State

```typescript
// State change not tracked
image.status = 'STORED'; // ❌ No audit trail!
```

## Philosophy

These principles exist because:

1. **Scale**: System must handle millions of images
2. **Reliability**: Failures will happen, must be handled
3. **Maintainability**: Code must be understandable
4. **Data Safety**: Originals are irreplaceable
5. **User Experience**: System must be responsive

## Updates

These principles may be updated as the system evolves, but changes must be:

1. **Justified**: Clear reason for change
2. **Documented**: Updated in this file
3. **Communicated**: All agents notified
4. **Backward compatible**: Or migration plan provided

---

**Last Updated**: 2026-01-25  
**Version**: 1.0.0  
**Status**: Active
