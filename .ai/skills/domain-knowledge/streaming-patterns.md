# Streaming Patterns

This document defines the patterns for streaming data in FRAME.

## Core Principle
**Never buffer large files in memory. Always stream.**

## 1. Node.js Streams
Use native Node.js streams (`Readable`, `Writable`, `Transform`) or Web Streams (`ReadableStream`) where supported.

### Reading Files
\`\`\`typescript
// ❌ Bad: fs.readFile loads entire file into RAM
const file = await fs.readFile(path);

// ✅ Good: createReadStream streams chunks
const stream = fs.createReadStream(path);
\`\`\`

### Writing Files
\`\`\`typescript
// ❌ Bad: fs.writeFile requires full buffer
await fs.writeFile(path, buffer);

// ✅ Good: write stream
const writeStream = fs.createWriteStream(path);
inputStream.pipe(writeStream);
\`\`\`

## 2. Pipelining
Use `stream.pipeline` for safer streaming with error handling and cleanup.

\`\`\`typescript
import { pipeline } from 'stream/promises';

await pipeline(
  sourceStream,
  transformStream,
  destinationStream
);
\`\`\`

## 3. Backpressure
Ensure streams handle backpressure correctly (don't read faster than you can write). Node.js `pipeline` handles this automatically.

## 4. HTTP Responses
Stream responses directly to the client.

\`\`\`typescript
export async function GET() {
  const stream = fs.createReadStream(filePath);
  // Next.js Response supports iterator/stream
  return new Response(stream as any);
}
\`\`\`

## 5. Web Streams (Fetch/Request)
Converting Web Streams to Node Streams may be necessary for some libraries.

\`\`\`typescript
import { Readable } from 'stream';
const nodeStream = Readable.fromWeb(webStream);
\`\`\`
