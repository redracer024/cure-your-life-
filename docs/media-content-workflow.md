# Media Content Workflow

## R2 Bucket Purpose

BodySignal stores all externally hosted media (audio, video, slides, PDFs) in a Cloudflare R2 bucket. Media is delivered directly from R2 to the client and is never bundled into the Render deployment.

## Recommended Folder Structure

```
audio/
video/
slides/
pdf/
```

### Example Paths

```
video/invisible-one/pain-reflects-emotions.mp4
audio/grounding-exercises/body-scan-intro.mp3
slides/pattern-overview/freeze-response/slide-01.webp
pdf/pattern-overview/freeze-response/original.pdf
```

## Naming Conventions

- Use lowercase
- Use hyphen-separated words
- Avoid spaces (use hyphens instead)
- Use descriptive, stable names

## Current Development Origin

```
https://pub-61a6f2a3fc254836a9d34227d4473a6c.r2.dev
```

The `r2.dev` domain is the current public development origin. A custom media domain can replace it later without changing app code, because the app stores only metadata and URLs.

## App Architecture

- The app stores **only** media metadata and URLs in code/data files
- Videos, audio files, and PDFs remain **outside** the Render bundle
- The app does **not** proxy media through the Express server
- The app does **not** store binary media in localStorage

## Slide Deck Workflow

1. Convert slide decks to individual image files (WebP/JPEG recommended)
2. Preserve the original PDF for reference
3. Reference images via the `slides` resource type
4. Provide an "Open original PDF" link for users who need the full document

## Git Policy

- Do **not** commit source media files into Git
- Large local PDFs, MP4s, MP3s, and other binaries should be excluded via `.gitignore`
- Only add metadata/catalog entries to the repository

## Adding New Media

1. Upload the media file to the appropriate R2 folder
2. Add a new entry to `src/data/mediaCatalog.ts`
3. Use the appropriate viewer component (`VideoPlayer`, `AudioPlayer`, `SlideViewer`, or `MediaResourceCard`)
4. Ensure the media entry is linked to the correct screen or entity
