import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import listNews from "./tools/list-news";
import listCareers from "./tools/list-careers";
import listShareholders from "./tools/list-shareholders";
import listStudentRegistrations from "./tools/list-student-registrations";

// OAuth issuer must be the direct Supabase host, not the .lovable.cloud proxy.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "dinigaas-trading-mcp",
  title: "Dinigaas Trading MCP",
  version: "0.1.0",
  instructions:
    "Tools for Dinigaas Trading S.C. Callers sign in as a user of the app; RLS applies. Use list_products, list_news, list_careers, and list_shareholders for public catalog data. list_student_registrations is admin-only.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, listNews, listCareers, listShareholders, listStudentRegistrations],
});
