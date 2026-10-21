import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { syncLatestMedia } from "~/utils/sync.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== "undefined" ? process.env : {});
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  if (!env?.DB) {
    return json({ success: false, error: "Database not configured." }, { status: 500 });
  }

  const result = await syncLatestMedia(env.DB, { force });
  return json(result, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
};

export const action = async ({ context }: ActionFunctionArgs) => {
  const env = (context as any)?.cloudflare?.env || (context as any)?.env || (typeof process !== "undefined" ? process.env : {});

  if (!env?.DB) {
    return json({ success: false, error: "Database not configured." }, { status: 500 });
  }

  const result = await syncLatestMedia(env.DB, { force: true });
  return json(result, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
};
