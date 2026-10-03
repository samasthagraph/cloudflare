import { createCookieSessionStorage } from "@remix-run/cloudflare";

export function getSessionStorage(env: any) {
  return createCookieSessionStorage({
    cookie: {
      name: "__samastha_admin_session",
      httpOnly: true,
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
      sameSite: "lax",
      secrets: [env?.SESSION_SECRET || "samastha_graph_admin_secret_key_default"],
      secure: process.env.NODE_ENV === "production",
    },
  });
}

