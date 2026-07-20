import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    return typeof s.next === "string" ? { next: s.next } : {};
  },

  head: () => ({
    meta: [
      { title: "Sign in — Dinigaas Admin" },
      { name: "description", content: "Admin sign in for Dinigaas Trading S.C." },
    ],
  }),
  component: AuthPage,
});


function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success(t("auth.signupOk"));
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/admin" });
    }
  }

  return (
    <SiteLayout>
      <section className="grid min-h-[70vh] place-items-center bg-cotton py-20">
        <div className="w-full max-w-md rounded-3xl border border-border bg-background p-8 shadow-card">
          <h1 className="font-serif text-3xl text-primary">{mode === "signin" ? t("auth.signin") : t("auth.signup")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.signin.desc") : t("auth.signup.desc")}
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("auth.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("auth.password")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60"
            >
              {loading ? t("auth.wait") : mode === "signin" ? t("auth.signinBtn") : t("auth.signupBtn")}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "signin" ? t("auth.toggleToSignup") : t("auth.toggleToSignin")}
          </button>
          <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:text-primary">
            {t("auth.back")}
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
