import { json, redirect } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { getSessionStorage } from "../sessions.server";

export const loader = async ({ request, context }: any) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const { getSession } = getSessionStorage(env);
  const session = await getSession(request.headers.get("Cookie"));
  
  if (session.get("adminAuthenticated")) {
    throw redirect("/admin");
  }
  return json({});
};

export const action = async ({ request, context }: any) => {
  const env = context?.cloudflare?.env || context?.env || (typeof process !== 'undefined' ? process.env : {});
  const { getSession, commitSession } = getSessionStorage(env);
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const remember = formData.get("remember") === "on";
  
  const expectedUsername = env.ADMIN_USERNAME || "samastha_admin";
  const expectedPassword = env.ADMIN_PASSWORD || "admin123";

  if (username === expectedUsername && password === expectedPassword) {
    session.set("adminAuthenticated", true);
    const cookieOptions = remember ? { maxAge: 60 * 60 * 24 * 30 } : { maxAge: 60 * 60 * 2 };
    return redirect("/admin", {
      headers: { "Set-Cookie": await commitSession(session, cookieOptions) },
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
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="remember" className="w-4 h-4 text-[#15664a] focus:ring-[#15664a] border-gray-300 rounded-sm" />
              <span className="text-sm font-medium text-gray-700">Remember this device</span>
            </label>
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
