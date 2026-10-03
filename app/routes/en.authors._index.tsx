import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import AuthorsIndex, { loader as baseLoader, meta as baseMeta } from "./authors._index";

export const loader = async (args: LoaderFunctionArgs) => {
  return baseLoader(args);
};

export const meta: MetaFunction = baseMeta;

export default AuthorsIndex;
