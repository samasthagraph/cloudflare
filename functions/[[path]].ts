import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

export const onRequest = async (context: any) => {
  // @ts-ignore
  const build = await import("../build/server");
  const handler = createPagesFunctionHandler({ 
    build: build as any,
    getLoadContext: (ctx) => ({ env: ctx.env })
  });
  
  return handler(context);
};