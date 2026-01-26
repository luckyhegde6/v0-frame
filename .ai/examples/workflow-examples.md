# Workflow Examples

This document provides concrete examples of common workflows.

## 1. Feature Implementation: Add "Like" Button

**Context**: Add a like button to image cards in the gallery.

**Steps**:
1.  **Plan**:
    -   Update `Image` schema with `likes Int @default(0)`.
    -   Create server action `toggleLike(imageId)`.
    -   Update `ImageCard` component.
2.  **DB**:
    \`\`\`bash
    npx prisma migrate dev --name add_likes
    \`\`\`
3.  **Code**:
    -   `lib/actions.ts`: Implement `toggleLike`.
    -   `components/ImageCard.tsx`: Add button, call action.
4.  **Test**: Add unit test for action.

## 2. Bug Fix: Fix Image Upload Timeout

**Context**: Large images fail to upload on slow connections.

**Steps**:
1.  **Investigate**: Check logs, see "TimeoutError".
2.  **Plan**: Increase timeout or switch to background upload.
3.  **Implement**:
    -   Switch to `uppy` or `react-dropzone` with chunked uploads? (Phase 1 restriction: No chunking yet).
    -   Simply increase Vercel function timeout config.
4.  **Verify**: Upload 20MB file on throttled network.

## 3. TDD: Create URL Slug Utility

**Context**: Need to generate safe slugs for filenames.

**Steps**:
1.  **Red**: Write test `slugify("My Image!.jpg")` -> expected `"my-image.jpg"`.
2.  **Green**: Implement basic regex replacement.
3.  **Refactor**: optimization, handle edge cases (emoji).
