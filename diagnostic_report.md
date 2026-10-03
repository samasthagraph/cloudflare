# 🚨 Deep Diagnostic Report: Samastha Graph CMS Crash

## 1. Schema vs. Data Cross-Check Results
I have meticulously scanned every JSON file across `app/content/articles`, `app/content/videos`, and `app/content/podcasts` and cross-referenced them with `keystatic.config.tsx`.

✅ **Podcasts (`app/content/podcasts/*.json`)**: Perfectly matches the schema (title, episodeNumber, audioUrl, duration, description).
✅ **Articles (`app/content/articles/*.json`)**: Perfectly matches the schema (title, publishedAt, coverImage, excerpt, content). The previous PowerShell migration correctly renamed `thumbnail` to `coverImage` and applied the absolute paths.
❌ **Settings (`app/content/settings/homepage.json`)**: **FATAL ORPHANED RELATIONSHIP FOUND.**
- The `homepage.json` file contains: `"heroVideo": "kerala-muslim-jamaath-state-conference"`
- However, there is **no video with this slug** in the `app/content/videos/` directory.
- **Why this crashes Keystatic:** In `keystatic.config.tsx`, `heroVideo` is defined as a `fields.relationship({ collection: 'videos' })`. Keystatic uses Zod for strict schema validation. When it loads the homepage singleton and attempts to resolve `"kerala-muslim-jamaath-state-conference"` against the `videos` collection, it throws a validation error because the reference is completely orphaned, crashing the Keystatic Admin UI lifecycle.

## 2. Codebase Review: Frontend Routes
A deep scan of the frontend routes revealed a fatal path resolution error directly responsible for the frontend "crashing" (throwing 500/404s) on the live deployment.

❌ **File**: `app/routes/articles.$slug.tsx`
- **Line Number**: `8`
- **The Error Code**: `const files = import.meta.glob('../../content/articles/*.json', { eager: true });`
- **Why this crashes the frontend**: Remix's flat routing places `articles.$slug.tsx` directly inside `app/routes/`. The path `../../content/articles/*.json` traverses up two levels, pointing to `<workspace-root>/content/articles/*.json`, which **does not exist**. 
- Because `import.meta.glob` silently returns an empty object `{}` when it finds no files, the loader immediately hits the `if (!articleFileKey) throw new Response("Not Found", { status: 404 });` block. This forces every single article link to crash into a 404 ErrorBoundary on the live site.

## 3. Local Build / Typecheck (tsc & vite)
- **`npx tsc --noEmit`**: Detected a minor `TS2339` error in `admin.deploy.tsx` (which I fixed in the previous commit) and standard TS warnings about `import.meta.glob` type declarations (which Vite resolves automatically).
- **`npm run build`**: Executed and compiled the Remix/Vite production build flawlessly in ~31 seconds. The crashes are strictly runtime (Keystatic Zod validation and Remix Loader 404s).

---

## 🎯 Conclusion & Proposed Fixes

There are two separate runtime crashes occurring simultaneously:

### 1. Keystatic CMS Crash (Zod Relationship Error)
**File**: `app/content/settings/homepage.json`
**Proposed Fix**: Delete the orphaned relationship in the JSON file.
```json
{
  "heroVideo": null
}
```
*(Or upload the missing video `kerala-muslim-jamaath-state-conference.json` to the videos collection).*

### 2. Frontend Article Route Crash (404 Loader Error)
**File**: `app/routes/articles.$slug.tsx`
**Line**: `8`
**Proposed Fix**: Correct the relative path in `import.meta.glob` to properly point into the `app/` directory.
```tsx
// Change this:
const files = import.meta.glob('../../content/articles/*.json', { eager: true });

// To this:
const files = import.meta.glob('../../app/content/articles/*.json', { eager: true });
// OR
const files = import.meta.glob('../content/articles/*.json', { eager: true });
```
