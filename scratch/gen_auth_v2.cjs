const fs = require('fs');

// 1. sessions.server.ts
const sessionsCode = `import { createCookieSessionStorage } from "@remix-run/cloudflare";

export function getSessionStorage(env: any) {
  return createCookieSessionStorage({
    cookie: {
      name: "__samastha_admin_session",
      httpOnly: true,
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
      sameSite: "lax",
      secrets: [env.SESSION_SECRET],
      secure: true,
    },
  });
}
`;
fs.writeFileSync('C:/Users/MYCARE/.gemini/antigravity/brain/4b950d4a-dd71-44e4-b04a-dcad12975326/sessions_code_v2.md', '\`\`\`ts\n' + sessionsCode + '\n\`\`\`');


// 2. admin.login.tsx
const loginCode = `import { json, redirect } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { getSessionStorage } from "../sessions.server";

export const loader = async ({ request, context }: any) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const { getSession } = getSessionStorage(env);
  const session = await getSession(request.headers.get("Cookie"));
  
  if (session.has("adminAuthenticated")) {
    return redirect("/admin");
  }
  return null;
};

export const action = async ({ request, context }: any) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const { getSession, commitSession } = getSessionStorage(env);
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  
  if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
    session.set("adminAuthenticated", true);
    return redirect("/admin", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
  
  return json({ error: "Invalid Credentials" }, { status: 401 });
};

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-inter p-4">
      <div className="bg-white p-8 rounded-sm shadow-lg border border-gray-200 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/Logo.png" alt="Samastha Graph Logo" className="h-16 w-auto" />
        </div>
        <h2 className="text-2xl font-bold text-center text-[#15664a] mb-6">CMS Login</h2>
        {actionData?.error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium rounded-sm">
            {actionData.error}
          </div>
        )}
        <Form method="post" className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <input type="text" name="username" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c8a136] outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input type="password" name="password" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c8a136] outline-none transition-shadow" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-[#15664a] text-white py-3 rounded-sm font-bold text-lg hover:bg-[#0f4d38] transition-colors mt-4 shadow-sm disabled:opacity-50 flex justify-center items-center">
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Authenticate"}
          </button>
        </Form>
      </div>
      <div className="mt-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
        <div className="flex gap-2">
           <span className="w-3 h-3 rounded-full bg-[#15664a]"></span>
           <span className="w-3 h-3 rounded-full bg-[#c8a136]"></span>
        </div>
        <span>Secure Access • Cloudflare Serverless</span>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('C:/Users/MYCARE/.gemini/antigravity/brain/4b950d4a-dd71-44e4-b04a-dcad12975326/admin_login_code.md', '\`\`\`tsx\n' + loginCode + '\n\`\`\`');


// 3. admin.tsx updates
let adminCode = fs.readFileSync('app/routes/admin.tsx', 'utf-8');

// Imports
adminCode = adminCode.replace(
  `import { json } from "@remix-run/cloudflare";`,
  `import { json, redirect } from "@remix-run/cloudflare";\nimport { getSessionStorage } from "../sessions.server";`
);

adminCode = adminCode.replace(
  `import { Menu, X, Edit, Trash2, Eye, Plus, Send, Bold, Italic, List, ListOrdered, Link as LinkIcon, RefreshCw, Calendar as CalendarIcon, Search, LayoutDashboard, FileText, Video, Mic, BarChart2, ChevronDown } from 'lucide-react';`,
  `import { Menu, X, Edit, Trash2, Eye, Plus, Send, Bold, Italic, List, ListOrdered, Link as LinkIcon, RefreshCw, Calendar as CalendarIcon, Search, LayoutDashboard, FileText, Video, Mic, BarChart2, ChevronDown, LogOut } from 'lucide-react';`
);

// Loader
adminCode = adminCode.replace(
  `export const loader = async ({ context }: any) => {`,
  `export const loader = async ({ request, context }: any) => {`
);

adminCode = adminCode.replace(
  `const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});`,
  `const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});\n  const { getSession } = getSessionStorage(env);\n  const session = await getSession(request.headers.get("Cookie"));\n  if (!session.has("adminAuthenticated")) {\n    throw redirect("/admin/login");\n  }\n`
);

// Action
adminCode = adminCode.replace(
  `export const action = async ({ request, context }: any) => {\n  const formData = await request.formData();\n  const intent = formData.get("intent") as string;\n  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});`,
  `export const action = async ({ request, context }: any) => {\n  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});\n  const { getSession, destroySession } = getSessionStorage(env);\n  const session = await getSession(request.headers.get("Cookie"));\n  if (!session.has("adminAuthenticated")) {\n    throw redirect("/admin/login");\n  }\n\n  const formData = await request.formData();\n  const intent = formData.get("intent") as string;\n\n  if (intent === "logout") {\n    return redirect("/admin/login", {\n      headers: { "Set-Cookie": await destroySession(session) },\n    });\n  }`
);

// Header Add Logout Button
adminCode = adminCode.replace(
  `<button \n              onClick={handleDeploy}`,
  `<Form method="post">\n              <input type="hidden" name="intent" value="logout" />\n              <button type="submit" className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-sm transition-colors">\n                <LogOut size={16} /> Logout\n              </button>\n            </Form>\n            <button \n              onClick={handleDeploy}`
);

fs.writeFileSync('C:/Users/MYCARE/.gemini/antigravity/brain/4b950d4a-dd71-44e4-b04a-dcad12975326/admin_code_v6.md', '\`\`\`tsx\n' + adminCode + '\n\`\`\`');
