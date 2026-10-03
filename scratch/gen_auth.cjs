const fs = require('fs');

const sessionsCode = `import { createCookieSessionStorage } from "@remix-run/cloudflare";

export function getSessionStorage(env: any) {
  return createCookieSessionStorage({
    cookie: {
      name: "__admin_session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
      secrets: [env.SESSION_SECRET || "samastha_graph_fallback_secret"],
      secure: true,
    },
  });
}
`;

fs.writeFileSync('C:/Users/MYCARE/.gemini/antigravity/brain/4b950d4a-dd71-44e4-b04a-dcad12975326/sessions_code.md', '\`\`\`ts\n' + sessionsCode + '\n\`\`\`');

let adminCode = fs.readFileSync('app/routes/admin.tsx', 'utf-8');

// 1. Imports
adminCode = adminCode.replace(
  `import { json } from "@remix-run/cloudflare";`,
  `import { json, redirect } from "@remix-run/cloudflare";\nimport { getSessionStorage } from "../sessions.server";`
);

adminCode = adminCode.replace(
  `import { Menu, X, Edit, Trash2, Eye, Plus, Send, Bold, Italic, List, ListOrdered, Link as LinkIcon, RefreshCw, Calendar as CalendarIcon, Search, LayoutDashboard, FileText, Video, Mic, BarChart2, ChevronDown } from 'lucide-react';`,
  `import { Menu, X, Edit, Trash2, Eye, Plus, Send, Bold, Italic, List, ListOrdered, Link as LinkIcon, RefreshCw, Calendar as CalendarIcon, Search, LayoutDashboard, FileText, Video, Mic, BarChart2, ChevronDown, LogOut } from 'lucide-react';`
);

// 2. Loader
adminCode = adminCode.replace(
  `export const loader = async ({ context }: any) => {`,
  `export const loader = async ({ request, context }: any) => {`
);

adminCode = adminCode.replace(
  `const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});`,
  `const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});\n  const { getSession } = getSessionStorage(env);\n  const session = await getSession(request.headers.get("Cookie"));\n  const isLoggedIn = session.has("adminUser");\n`
);

adminCode = adminCode.replace(
  `return json({ articles, videos, podcasts, platformSettings });`,
  `return json({ isLoggedIn, articles, videos, podcasts, platformSettings });`
);

// 3. Action
adminCode = adminCode.replace(
  `export const action = async ({ request, context }: any) => {\n  const formData = await request.formData();\n  const intent = formData.get("intent") as string;\n  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});`,
  `export const action = async ({ request, context }: any) => {\n  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});\n  const { getSession, commitSession, destroySession } = getSessionStorage(env);\n  const session = await getSession(request.headers.get("Cookie"));\n  const formData = await request.formData();\n  const intent = formData.get("intent") as string;\n\n  if (intent === "login") {\n    const username = formData.get("username") as string;\n    const password = formData.get("password") as string;\n    if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {\n      session.set("adminUser", username);\n      return redirect("/admin", {\n        headers: { "Set-Cookie": await commitSession(session) },\n      });\n    } else {\n      return json({ error: "Invalid Credentials" }, { status: 401 });\n    }\n  }\n\n  if (intent === "logout") {\n    return redirect("/admin", {\n      headers: { "Set-Cookie": await destroySession(session) },\n    });\n  }\n\n  // Require authentication for all other actions\n  if (!session.has("adminUser")) {\n    return json({ error: "Unauthorized" }, { status: 401 });\n  }`
);

// 4. Component
adminCode = adminCode.replace(
  `const { platformSettings } = useLoaderData<typeof loader>();`,
  `const { platformSettings, isLoggedIn } = useLoaderData<typeof loader>();`
);

const loginScreenCode = `
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-inter p-4">
        <div className="bg-white p-8 rounded-sm shadow-lg border border-gray-200 w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src="/Logo.png" alt="Logo" className="h-16 w-auto" />
          </div>
          <h2 className="text-2xl font-bold text-center text-[#15664a] mb-6">CMS Authentication</h2>
          {actionData?.error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium rounded-sm">
              {actionData.error}
            </div>
          )}
          <Form method="post" className="space-y-6">
            <input type="hidden" name="intent" value="login" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input type="text" name="username" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" name="password" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#15664a] outline-none transition-shadow" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#15664a] text-white py-3 rounded-sm font-bold text-lg hover:bg-[#0f4d38] transition-colors mt-4 shadow-sm disabled:opacity-50">
              {isSubmitting ? "Authenticating..." : "Login to CMS"}
            </button>
          </Form>
        </div>
        <div className="mt-8 text-center text-sm text-gray-500">
          Secure Access • Cloudflare Serverless
        </div>
      </div>
    );
  }
`;

adminCode = adminCode.replace(
  `return (\n    <div className="min-h-screen bg-gray-50 font-inter flex flex-col">`,
  loginScreenCode + `\n  return (\n    <div className="min-h-screen bg-gray-50 font-inter flex flex-col">`
);

// 5. Header Logout Button
adminCode = adminCode.replace(
  `<button \n              onClick={handleDeploy}`,
  `<Form method="post">\n              <input type="hidden" name="intent" value="logout" />\n              <button type="submit" className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-sm transition-colors">\n                <LogOut size={16} /> Logout\n              </button>\n            </Form>\n            <button \n              onClick={handleDeploy}`
);

fs.writeFileSync('C:/Users/MYCARE/.gemini/antigravity/brain/4b950d4a-dd71-44e4-b04a-dcad12975326/admin_auth_v5.md', '\`\`\`tsx\n' + adminCode + '\n\`\`\`');
console.log('Done!');
