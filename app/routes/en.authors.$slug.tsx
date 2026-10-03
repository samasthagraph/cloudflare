import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import AuthorProfilePage, { loader as baseLoader, meta as baseMeta } from "./authors.$slug";

export const loader = async (args: LoaderFunctionArgs) => {
  return baseLoader(args);
};

export const meta: MetaFunction<typeof loader> = baseMeta as any;

export default AuthorProfilePage;
