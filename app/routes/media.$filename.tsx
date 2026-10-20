import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getDbMedia } from "~/utils/db.server";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const { filename } = params;
  if (!filename) {
    return new Response("Not found", { status: 404 });
  }

  const ctx = context as any;
  const env = ctx?.cloudflare?.env || ctx?.env || (typeof process !== "undefined" ? process.env : {});

  if (env?.DB) {
    try {
      const media = await getDbMedia(env.DB, filename);
      if (media && media.data) {
        // Decode base64 to binary
        const binaryString = atob(media.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": media.mimeType || "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch (e) {
      console.warn("Error serving media:", e);
    }
  }

  return new Response("Media not found", { status: 404 });
};
