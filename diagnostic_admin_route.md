# Diagnostic: Keystatic `/admin` Route Failure

## 1. Remix Route vs. Config Mismatch
The Keystatic frontend application uses an internal React Router to handle its navigation. 
When the Remix file is renamed to `app/routes/admin.$.tsx`, the application mounts at `samasthagraph.pages.dev/admin`.
However, if `ui: { basePath: '/admin' }` is omitted from `keystatic.config.tsx`, the internal React Router defaults to expecting the root to be `/keystatic`. Because the current browser URL (`/admin`) does not match the expected Keystatic internal routes, the `<Keystatic />` component renders a **"Not found"** error screen.

**Conclusion**: `ui: { basePath: '/admin' }` is strictly required in `keystatic.config.tsx`.

## 2. API Route Disconnect
Upon inspecting the compiled source code of `@keystatic/core/api/generic` (specifically `keystatic-core-api-generic.node.js` at line 303), I discovered the following request parsing logic:

```javascript
const getParams = req => {
  // ...
  return url.pathname.replace(/^\/api\/keystatic\/?/, '') // HARDCODED REGEX
    .split('/')
    .map(x => decodeURIComponent(x))
    .filter(Boolean);
};
```

This reveals a critical limitation in Keystatic's architecture: **The API endpoint is hardcoded to `/api/keystatic`.**
If the API file is renamed to `app/routes/api.admin.$.tsx`, the request URL becomes `/api/admin/...`. The hardcoded regex `^\/api\/keystatic` fails to strip the prefix, resulting in a misparsed parameter array (e.g., `['api', 'admin', 'tree']` instead of `['tree']`). The API router falls through its switch cases and returns a generic `404 Not Found`.

Furthermore, the Keystatic frontend is also hardcoded to fetch from `/api/keystatic`. By renaming the Remix API file, we effectively deleted the endpoint the UI was trying to reach.

## 3. The Exact Culprit
The recent attempt to synchronize the API route name with the UI route name (`api.admin.$.tsx`) broke the integration. 

As you originally suspected in your very first prompt: *"The Keystatic API route `app/routes/api.keystatic.$.tsx` should remain exactly as it is, as Keystatic handles that communication automatically."* You were 100% correct, and standard Keystatic Remix documentation on GitHub is misleading regarding this behavior.

## Proposed Fix
If you approve, I will execute the following to permanently resolve the issue:
1. **Retain** `app/routes/admin.$.tsx` (UI stays at `/admin`).
2. **Retain** `ui: { basePath: '/admin' }` in `keystatic.config.tsx` (Keystatic UI router syncs with Remix).
3. **Rename** `app/routes/api.admin.$.tsx` **BACK TO** `app/routes/api.keystatic.$.tsx` (Restores the strictly required API endpoint).
