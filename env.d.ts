/// <reference types="@remix-run/cloudflare" />
/// <reference types="vite/client" />

declare module "*.css?url" {
  const value: string;
  export default value;
}

interface Env {
  DB: D1Database;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}
