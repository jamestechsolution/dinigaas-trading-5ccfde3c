import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, LogOut, Package, Newspaper, Briefcase, Mail, Inbox, Plus, Trash2, Pencil, X, FileText,
  ImageIcon, Navigation, Upload, MailCheck, AlertCircle, CheckCircle2, Send, MapPin,
  GraduationCap, Download, Search, ChevronLeft, ChevronRight, Users2, GripVertical,
} from "lucide-react";
import logo from "@/assets/dinigaas-logo.jpg";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { useI18n } from "@/i18n/I18nProvider";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Dinigaas" }] }),
  component: AdminPage,
});

type Tab = "content" | "images" | "nav" | "products" | "news" | "careers" | "messages" | "subscribers" | "registrations" | "shareholders";

function AdminPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("content");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setUserId(null); setIsAdmin(false); navigate({ to: "/auth" });
      }
    });
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setUserId(data.session.user.id);
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", data.session.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function makeMeAdmin() {
    if (!userId) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) return toast.error(t("admin.notAdmin.toast.fail") + error.message);
    toast.success(t("admin.notAdmin.toast.success"));
    setIsAdmin(true);
  }

  async function logout() { await supabase.auth.signOut(); navigate({ to: "/" }); }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-cotton">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cotton">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          <Link to="/" className="font-serif text-xl text-primary">{t("admin.brand")}</Link>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent">
            <LogOut className="size-4" /> {t("admin.signout")}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        {!isAdmin ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-background p-8 text-center shadow-card">
            <h2 className="font-serif text-2xl text-primary">{t("admin.notAdmin.title")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("admin.notAdmin.body")}</p>
            <button onClick={makeMeAdmin} className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-light">
              {t("admin.notAdmin.grant")}
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-3xl text-primary md:text-4xl">{t("admin.title")}</h1>
            <EmailForwardingStatus />
            <nav className="mt-6 flex flex-wrap gap-2">
              {([
                ["content", FileText, t("admin.tab.content")],
                ["images", ImageIcon, t("admin.tab.images")],
                ["nav", Navigation, t("admin.tab.nav")],
                ["products", Package, t("admin.tab.products")],
                ["news", Newspaper, t("admin.tab.news")],
                ["careers", Briefcase, t("admin.tab.careers")],
                ["registrations", GraduationCap, t("admin.tab.registrations")],
                ["shareholders", Users2, "Shareholders"],
                ["messages", Inbox, t("admin.tab.messages")],
                ["subscribers", Mail, t("admin.tab.subscribers")],
              ] as const).map(([key, Icon, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key as Tab)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    tab === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </nav>
            <div className="mt-8">
              {tab === "content" && <SiteContentAdmin />}
              {tab === "images" && <SiteImagesAdmin />}
              {tab === "nav" && <NavItemsAdmin />}
              {tab === "products" && <ProductsAdmin />}
              {tab === "news" && <NewsAdmin />}
              {tab === "careers" && <CareersAdmin />}
              {tab === "registrations" && <RegistrationsAdmin />}
              {tab === "messages" && <MessagesAdmin />}
              {tab === "subscribers" && <SubscribersAdmin />}
              {tab === "shareholders" && <ShareholdersAdmin />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------ Reusable bits ------------ */
function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`rounded-2xl border border-border bg-background p-5 shadow-card ${className}`}>{children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />;
}
function Btn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={"inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60 " + (p.className ?? "")}>{children}</button>;
}

/* ------------ Email forwarding status ------------ */
const FORWARD_EMAIL = "dinigaastrading@gmail.com";
type ForwardTest = { at: string; ok: boolean; detail: string };

function EmailForwardingStatus() {
  const { t } = useI18n();
  const configured = false;
  const [lastTest, setLastTest] = useState<ForwardTest | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dinigaas:lastForwardTest");
      if (raw) setLastTest(JSON.parse(raw) as ForwardTest);
    } catch { /* ignore */ }
  }, []);

  async function runTest() {
    setTesting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: "Forwarding Test",
      email: "test@dinigaas.local",
      subject: "[Test] Forwarding probe",
      message: `Probe sent at ${new Date().toISOString()}. If forwarding is configured, this should arrive at ${FORWARD_EMAIL}.`,
    });
    const result: ForwardTest = error
      ? { at: new Date().toISOString(), ok: false, detail: error.message }
      : { at: new Date().toISOString(), ok: true, detail: configured
          ? `Test message queued for ${FORWARD_EMAIL}.`
          : `Saved to dashboard inbox. Forwarding to ${FORWARD_EMAIL} is not configured yet.` };
    try { localStorage.setItem("dinigaas:lastForwardTest", JSON.stringify(result)); } catch { /* ignore */ }
    setLastTest(result);
    setTesting(false);
    if (error) toast.error(t("admin.email.toast.fail")); else toast.success(t("admin.email.toast.sent"));
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            <MailCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("admin.email.title")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("admin.email.forwardTo")} <span className="font-medium text-foreground">{FORWARD_EMAIL}</span>
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide"
              style={{ borderColor: configured ? "rgb(187 247 208)" : "rgb(253 230 138)", color: configured ? "rgb(21 128 61)" : "rgb(146 64 14)", background: configured ? "rgb(240 253 244)" : "rgb(255 251 235)" }}>
              {configured ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
              {configured ? t("admin.email.configured") : t("admin.email.notConfigured")}
            </div>
            {!configured && (
              <p className="mt-2 max-w-lg text-xs text-muted-foreground">
                {t("admin.email.note")}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={runTest}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
        >
          {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t("admin.email.test")}
        </button>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("admin.email.lastTest")}</p>
        {lastTest ? (
          <div className="mt-2 flex items-start gap-2 text-sm">
            {lastTest.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            )}
            <div>
              <p className={lastTest.ok ? "text-foreground" : "text-destructive"}>
                {lastTest.ok ? t("admin.email.success") : t("admin.email.failed")} · {new Date(lastTest.at).toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{lastTest.detail}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.email.noTest")}</p>
        )}
      </div>
    </div>
  );
}

/* ------------ Logo preview ------------ */
type MaskMode = "contain" | "cover";

function LogoPreview() {
  const { t } = useI18n();
  const [mode, setMode] = useState<MaskMode>("contain");
  const fit = mode === "contain" ? "object-contain" : "object-cover";

  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-card animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl text-primary">{t("admin.logo.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.logo.intro")}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-muted-foreground sm:inline-block">
            {t("admin.logo.maskMode")}
          </span>
          <div
            role="tablist"
            aria-label={t("admin.logo.maskMode")}
            className="relative inline-flex items-center rounded-full border border-border bg-cotton p-1 shadow-inner"
          >
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-soft transition-transform duration-300 ease-out"
              style={{ transform: mode === "cover" ? "translateX(100%)" : "translateX(0%)" }}
            />
            {(["contain", "cover"] as MaskMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`relative z-10 min-w-[5rem] rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors duration-200 ${
                  mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`admin.logo.${m}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div key={mode} className="mt-5 grid gap-4 animate-fade-in lg:grid-cols-3">
        <div className="group rounded-2xl border border-border bg-cotton p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.logo.headerLabel")}</p>
          <div className="mt-3 rounded-xl bg-background p-3 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-full ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
                <img src={logo} alt="Logo header preview" width={48} height={48} className={`size-full ${fit} transition-all duration-300`} />
              </div>
              <span className="flex flex-col leading-tight">
                <span className="font-serif text-2xl font-semibold text-primary">Dinigaas</span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-clay">Trading S.C.</span>
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {mode === "contain" ? t("admin.logo.containNoteH") : t("admin.logo.coverNoteH")}
          </p>
        </div>

        <div className="group rounded-2xl border border-border bg-cotton p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.logo.footerLabel")}</p>
          <div className="mt-3 rounded-xl bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-full bg-primary-foreground/95 p-1 transition-transform duration-300 group-hover:scale-105">
                <img src={logo} alt="Logo footer preview" width={64} height={64} className={`size-full rounded-full ${fit} transition-all duration-300`} />
              </div>
              <div className="leading-tight">
                <p className="font-serif text-lg font-semibold">Dinigaas Trading S.C.</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-primary-foreground/70">Education • Healthcare</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {mode === "contain" ? t("admin.logo.containNoteF") : t("admin.logo.coverNoteF")}
          </p>
        </div>

        <div className="group rounded-2xl border border-border bg-cotton p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.logo.faviconLabel")}</p>
          <div className="mt-3 overflow-hidden rounded-t-xl border border-b-0 border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2">
              <div className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-destructive/70" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="ml-2 flex max-w-[180px] items-center gap-2 truncate rounded-t-md bg-background px-2.5 py-1.5 text-[11px] text-foreground">
                <span className="size-3.5 shrink-0 overflow-hidden rounded-sm">
                  <img src={logo} alt="Favicon preview" width={14} height={14} className={`size-full ${fit} transition-all duration-300`} />
                </span>
                <span className="truncate">Dinigaas Trading S.C.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground">
              <MapPin className="size-3" /> dinigaas-trading.lovable.app
            </div>
          </div>
          <div className="rounded-b-xl border border-t-0 border-border bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="size-4 overflow-hidden rounded-sm">
                <img src={logo} alt="Favicon at 16px" width={16} height={16} className={`size-full ${fit} transition-all duration-300`} />
              </span>
              <span className="size-8 overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-110">
                <img src={logo} alt="Favicon at 32px" width={32} height={32} className={`size-full ${fit} transition-all duration-300`} />
              </span>
              <span className="size-16 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105">
                <img src={logo} alt="Favicon at 64px" width={64} height={64} className={`size-full ${fit} transition-all duration-300`} />
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">16 · 32 · 64 px</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {mode === "contain" ? t("admin.logo.containNoteI") : t("admin.logo.coverNoteI")}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-border bg-cotton/60 p-4">
        <p className="text-sm font-semibold text-foreground">{t("admin.logo.crop.title")}</p>
        <ul className="mt-2 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
          <li>• Upload a <span className="font-medium text-foreground">square</span> image (1:1). Recommended <span className="font-medium text-foreground">512 × 512 px</span> or larger.</li>
          <li>• Keep the mark centered with ~<span className="font-medium text-foreground">10% padding</span>.</li>
          <li>• File format: <span className="font-medium text-foreground">PNG</span> or JPG. Max <span className="font-medium text-foreground">5 MB</span>.</li>
          <li>• Avoid fine text in the logo — unreadable at favicon size (16 px).</li>
          <li>• Use high contrast so the mark stays visible on the dark green footer.</li>
          <li>• To replace the favicon globally, upload to the <span className="font-medium text-foreground">brand_logo</span> slot below.</li>
        </ul>
      </div>
    </div>
  );
}

/* ------------ Products ------------ */
type Product = { id: string; name: string; category: string; description: string; image_url: string | null; featured: boolean };
function ProductsAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const load = () => supabase.from("products").select("*").order("created_at",{ascending:false}).then(({data}) => setItems((data ?? []) as Product[]));
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.name || !editing?.category || !editing?.description) return toast.error(t("admin.common.allRequired"));
    const payload = { name: editing.name, category: editing.category, description: editing.description, image_url: editing.image_url || null, featured: !!editing.featured };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.savedToast")); setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm(t("admin.products.confirmDelete"))) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.deleted")); load();
  }
  return (
    <div className="space-y-4">
      <Btn onClick={() => setEditing({ name:"", category:"Education", description:"", featured:false })}><Plus className="size-4"/>{t("admin.products.add")}</Btn>
      <div className="grid gap-3">
        {items.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-clay">{p.category}{p.featured ? t("admin.products.featuredSuffix") : ""}</p>
                <h3 className="mt-1 font-serif text-lg text-primary">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(p)} className="rounded-full p-2 hover:bg-accent"><Pencil className="size-4"/></button>
                <button onClick={() => remove(p.id)} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4"/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? t("admin.products.edit") : t("admin.products.new")}>
          <div className="space-y-3">
            <Input placeholder={t("admin.products.f.name")} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}/>
            <Input placeholder={t("admin.products.f.category")} value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })}/>
            <Textarea placeholder={t("admin.products.f.description")} rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}/>
            <Input placeholder={t("admin.products.f.image")} value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}/>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}/> {t("admin.products.featured")}</label>
            <Btn onClick={save}>{t("admin.common.save")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------ News ------------ */
type News = { id: string; title: string; slug: string; excerpt: string; content: string; image_url: string | null; published: boolean };
function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80); }
function NewsAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<News[]>([]);
  const [editing, setEditing] = useState<Partial<News> | null>(null);
  const load = () => supabase.from("news").select("*").order("published_at",{ascending:false}).then(({data}) => setItems((data ?? []) as News[]));
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.title || !editing?.excerpt || !editing?.content) return toast.error(t("admin.common.allRequired"));
    const slug = editing.slug || slugify(editing.title);
    const payload = { title: editing.title, slug, excerpt: editing.excerpt, content: editing.content, image_url: editing.image_url || null, published: editing.published ?? true };
    const { error } = editing.id
      ? await supabase.from("news").update(payload).eq("id", editing.id)
      : await supabase.from("news").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.savedToast")); setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm(t("admin.news.confirmDelete"))) return;
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.deleted")); load();
  }
  return (
    <div className="space-y-4">
      <Btn onClick={() => setEditing({ title:"", excerpt:"", content:"", published:true })}><Plus className="size-4"/>{t("admin.news.add")}</Btn>
      <div className="grid gap-3">
        {items.map((n) => (
          <Card key={n.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg text-primary">{n.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{n.excerpt}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.published ? t("admin.news.published") : t("admin.news.draft")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(n)} className="rounded-full p-2 hover:bg-accent"><Pencil className="size-4"/></button>
                <button onClick={() => remove(n.id)} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4"/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? t("admin.news.edit") : t("admin.news.new")}>
          <div className="space-y-3">
            <Input placeholder={t("admin.news.f.title")} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/>
            <Input placeholder={t("admin.news.f.excerpt")} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}/>
            <Textarea placeholder={t("admin.news.f.content")} rows={6} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })}/>
            <Input placeholder={t("admin.news.f.image")} value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}/>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published ?? true} onChange={(e) => setEditing({ ...editing, published: e.target.checked })}/> {t("admin.news.published")}</label>
            <Btn onClick={save}>{t("admin.common.save")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------ Careers ------------ */
type Job = { id: string; title: string; department: string; location: string; type: string; description: string; requirements: string; active: boolean };
function CareersAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<Job[]>([]);
  const [editing, setEditing] = useState<Partial<Job> | null>(null);
  const load = () => supabase.from("careers").select("*").order("created_at",{ascending:false}).then(({data}) => setItems((data ?? []) as Job[]));
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.title || !editing?.department || !editing?.description || !editing?.requirements) return toast.error(t("admin.common.allRequired"));
    const payload = {
      title: editing.title, department: editing.department,
      location: editing.location || "Sheger City, Gefarsa Gujje Kella",
      type: editing.type || "Full-time",
      description: editing.description, requirements: editing.requirements,
      active: editing.active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("careers").update(payload).eq("id", editing.id)
      : await supabase.from("careers").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.savedToast")); setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm(t("admin.careers.confirmDelete"))) return;
    const { error } = await supabase.from("careers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.deleted")); load();
  }
  return (
    <div className="space-y-4">
      <Btn onClick={() => setEditing({ title:"", department:"", description:"", requirements:"", active:true })}><Plus className="size-4"/>{t("admin.careers.add")}</Btn>
      <div className="grid gap-3">
        {items.map((j) => (
          <Card key={j.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg text-primary">{j.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{j.department} · {j.location} · {j.type} · {j.active ? t("admin.careers.active") : t("admin.careers.inactive")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(j)} className="rounded-full p-2 hover:bg-accent"><Pencil className="size-4"/></button>
                <button onClick={() => remove(j.id)} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4"/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? t("admin.careers.edit") : t("admin.careers.new")}>
          <div className="space-y-3">
            <Input placeholder={t("admin.careers.f.title")} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/>
            <Input placeholder={t("admin.careers.f.department")} value={editing.department ?? ""} onChange={(e) => setEditing({ ...editing, department: e.target.value })}/>
            <Input placeholder={t("admin.careers.f.location")} value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })}/>
            <Input placeholder={t("admin.careers.f.type")} value={editing.type ?? ""} onChange={(e) => setEditing({ ...editing, type: e.target.value })}/>
            <Textarea placeholder={t("admin.careers.f.description")} rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}/>
            <Textarea placeholder={t("admin.careers.f.requirements")} rows={4} value={editing.requirements ?? ""} onChange={(e) => setEditing({ ...editing, requirements: e.target.value })}/>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })}/> {t("admin.careers.active")}</label>
            <Btn onClick={save}>{t("admin.common.save")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------ Messages ------------ */
type Msg = { id: string; name: string; email: string; phone: string | null; subject: string; message: string; read: boolean; created_at: string };
function MessagesAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<Msg[]>([]);
  const load = () => supabase.from("contact_messages").select("*").order("created_at",{ascending:false}).then(({data}) => setItems((data ?? []) as Msg[]));
  useEffect(() => { load(); }, []);
  async function toggleRead(m: Msg) {
    await supabase.from("contact_messages").update({ read: !m.read }).eq("id", m.id);
    load();
  }
  async function remove(id: string) {
    if (!confirm(t("admin.messages.confirmDelete"))) return;
    await supabase.from("contact_messages").delete().eq("id", id); load();
  }
  return (
    <div className="grid gap-3">
      {items.length === 0 && <p className="text-sm text-muted-foreground">{t("admin.messages.empty")}</p>}
      {items.map((m) => (
        <Card key={m.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-lg text-primary">{m.subject}</h3>
                {!m.read && <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-bold uppercase text-clay">{t("admin.messages.new")}</span>}
              </div>
              <p className="text-xs text-muted-foreground">{t("admin.messages.from")} {m.name} · {m.email}{m.phone ? " · " + m.phone : ""} · {new Date(m.created_at).toLocaleString()}</p>
              <p className="mt-3 whitespace-pre-line text-sm text-foreground">{m.message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => toggleRead(m)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-accent">{m.read ? t("admin.messages.markUnread") : t("admin.messages.markRead")}</button>
              <button onClick={() => remove(m.id)} className="rounded-full p-2 text-destructive hover:bg-destructive/10 self-end"><Trash2 className="size-4"/></button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------ Subscribers ------------ */
type Sub = { id: string; email: string; created_at: string };
function SubscribersAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<Sub[]>([]);
  const load = () => supabase.from("newsletter_subscribers").select("*").order("created_at",{ascending:false}).then(({data}) => setItems((data ?? []) as Sub[]));
  useEffect(() => { load(); }, []);
  async function remove(id: string) {
    if (!confirm(t("admin.subs.confirmRemove"))) return;
    await supabase.from("newsletter_subscribers").delete().eq("id", id); load();
  }
  return (
    <div className="grid gap-2">
      {items.length === 0 && <p className="text-sm text-muted-foreground">{t("admin.subs.empty")}</p>}
      {items.map((s) => (
        <Card key={s.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{s.email}</p>
              <p className="text-xs text-muted-foreground">{t("admin.subs.subscribed")} {new Date(s.created_at).toLocaleString()}</p>
            </div>
            <button onClick={() => remove(s.id)} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4"/></button>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------ Site Content ------------ */
type ContentRow = { id: string; key: string; value: string; label: string; section: string; multiline: boolean; sort_order: number };
function SiteContentAdmin() {
  const { t } = useI18n();
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("site_content").select("*").order("section").order("sort_order");
    const list = (data ?? []) as ContentRow[];
    setRows(list);
    setDrafts(Object.fromEntries(list.map((r) => [r.key, r.value])));
  };
  useEffect(() => { load(); }, []);

  async function save(row: ContentRow) {
    setSavingKey(row.key);
    const { error } = await supabase.from("site_content").update({ value: drafts[row.key] ?? "" }).eq("id", row.id);
    setSavingKey(null);
    if (error) return toast.error(error.message);
    toast.success(t("admin.content.savedToast", { label: row.label }));
    load();
  }

  const grouped = rows.reduce<Record<string, ContentRow[]>>((acc, r) => {
    (acc[r.section] ??= []).push(r); return acc;
  }, {});
  const sectionTitle: Record<string, string> = {
    home: t("admin.content.section.home"),
    about: t("admin.content.section.about"),
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{t("admin.content.intro")}</p>
      {Object.entries(grouped).map(([section, items]) => (
        <div key={section} className="space-y-3">
          <h2 className="font-serif text-xl text-primary">{sectionTitle[section] ?? section}</h2>
          {items.map((r) => {
            const dirty = (drafts[r.key] ?? "") !== r.value;
            return (
              <Card key={r.id}>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">{r.label}</label>
                {r.multiline ? (
                  <Textarea rows={4} value={drafts[r.key] ?? ""} onChange={(e) => setDrafts({ ...drafts, [r.key]: e.target.value })} />
                ) : (
                  <Input value={drafts[r.key] ?? ""} onChange={(e) => setDrafts({ ...drafts, [r.key]: e.target.value })} />
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{dirty ? t("admin.common.unsaved") : t("admin.common.saved")}</span>
                  <Btn disabled={!dirty || savingKey === r.key} onClick={() => save(r)}>
                    {savingKey === r.key ? <Loader2 className="size-4 animate-spin"/> : t("admin.common.save")}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ------------ Site Images ------------ */
type ImageRow = { id: string; slot: string; label: string; image_url: string | null };
type MediaFile = { name: string; url: string };

function SiteImagesAdmin() {
  const { t } = useI18n();
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [picker, setPicker] = useState<ImageRow | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const loadRows = async () => {
    const { data } = await supabase.from("site_images").select("*").order("label");
    setRows((data ?? []) as ImageRow[]);
  };
  const loadFiles = async () => {
    const { data } = await supabase.storage.from("site_media").list("", { sortBy: { column: "created_at", order: "desc" } });
    const list = (data ?? []).filter((f) => f.name && !f.name.startsWith("."));
    const enriched = list.map((f) => ({
      name: f.name,
      url: supabase.storage.from("site_media").getPublicUrl(f.name).data.publicUrl,
    }));
    setFiles(enriched);
  };
  useEffect(() => { loadRows(); loadFiles(); }, []);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error(t("admin.images.maxSize")); return; }
    setCropFile(file);
  }

  async function uploadCropped(blob: Blob) {
    setUploading(true);
    const isPng = blob.type === "image/png";
    const ext = isPng ? "png" : "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("site_media").upload(path, blob, {
      contentType: blob.type || "image/jpeg", upsert: false,
    });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    setCropFile(null);
    toast.success(t("admin.images.uploaded"));
    loadFiles();
  }

  async function assign(row: ImageRow, url: string | null) {
    const { error } = await supabase.from("site_images").update({ image_url: url }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(t("admin.images.slotUpdated", { label: row.label }));
    setPicker(null);
    loadRows();
  }

  async function deleteFile(name: string) {
    if (!confirm(t("admin.images.confirmDelete"))) return;
    const { error } = await supabase.storage.from("site_media").remove([name]);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.deleted"));
    loadFiles();
  }

  return (
    <div className="space-y-8">
      <LogoPreview />
      <div>
        <h2 className="font-serif text-xl text-primary">{t("admin.images.slots.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.images.slots.intro")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{r.label}</p>
              <div className="mt-2 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.label} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">{t("admin.images.usingDefault")}</div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Btn onClick={() => setPicker(r)}><ImageIcon className="size-4"/>{t("admin.images.change")}</Btn>
                {r.image_url && (
                  <button onClick={() => assign(r, null)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent">
                    {t("admin.images.reset")}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl text-primary">{t("admin.images.library")}</h2>
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-light ${uploading ? "opacity-60" : ""}`}>
            {uploading ? <Loader2 className="size-4 animate-spin"/> : <Upload className="size-4"/>}
            {uploading ? t("admin.images.uploading") : t("admin.images.upload")}
            <input type="file" accept="image/*" className="hidden" onChange={handleFilePick} disabled={uploading}/>
          </label>
        </div>
        {files.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("admin.images.empty")}</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {files.map((f) => (
              <div key={f.name} className="group relative overflow-hidden rounded-xl border border-border bg-background">
                <img src={f.url} alt={f.name} className="aspect-square w-full object-cover"/>
                <button onClick={() => deleteFile(f.name)} className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-destructive opacity-0 shadow transition-opacity group-hover:opacity-100">
                  <Trash2 className="size-3.5"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {picker && (
        <Modal onClose={() => setPicker(null)} title={t("admin.images.choose", { label: picker.label })}>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.images.uploadFirst")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((f) => (
                <button key={f.name} onClick={() => assign(picker, f.url)} className="group overflow-hidden rounded-xl border border-border ring-primary transition-all hover:ring-2">
                  <img src={f.url} alt={f.name} className="aspect-square w-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {cropFile && (
        <ImageCropDialog
          file={cropFile}
          busy={uploading}
          onCancel={() => setCropFile(null)}
          onConfirm={uploadCropped}
        />
      )}
    </div>
  );
}

/* ------------ Navigation ------------ */
type NavRow = { id: string; label: string; path: string; sort_order: number; active: boolean };
function NavItemsAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<NavRow[]>([]);
  const [editing, setEditing] = useState<Partial<NavRow> | null>(null);

  const load = () => supabase.from("nav_items").select("*").order("sort_order").then(({ data }) => setItems((data ?? []) as NavRow[]));
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.label || !editing?.path) return toast.error(t("admin.nav.toast.labelPath"));
    if (!editing.path.startsWith("/")) return toast.error(t("admin.nav.toast.pathSlash"));
    const payload = {
      label: editing.label.trim(),
      path: editing.path.trim(),
      sort_order: Number(editing.sort_order ?? 0),
      active: editing.active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("nav_items").update(payload).eq("id", editing.id)
      : await supabase.from("nav_items").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.savedToast")); setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm(t("admin.nav.confirmRemove"))) return;
    const { error } = await supabase.from("nav_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("admin.common.removed")); load();
  }
  async function toggleActive(item: NavRow) {
    await supabase.from("nav_items").update({ active: !item.active }).eq("id", item.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("admin.nav.intro")}</p>
        <Btn onClick={() => setEditing({ label: "", path: "/", sort_order: items.length + 1, active: true })}>
          <Plus className="size-4"/>{t("admin.nav.add")}
        </Btn>
      </div>
      <div className="grid gap-2">
        {items.map((it) => (
          <Card key={it.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-serif text-lg text-primary">{it.label}</p>
                <p className="text-xs text-muted-foreground">{it.path} · {t("admin.nav.order")} {it.sort_order} · {it.active ? t("admin.nav.visible") : t("admin.nav.hidden")}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(it)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-accent">
                  {it.active ? t("admin.nav.hide") : t("admin.nav.show")}
                </button>
                <button onClick={() => setEditing(it)} className="rounded-full p-2 hover:bg-accent"><Pencil className="size-4"/></button>
                <button onClick={() => remove(it.id)} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="size-4"/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? t("admin.nav.edit") : t("admin.nav.new")}>
          <div className="space-y-3">
            <Input placeholder={t("admin.nav.f.label")} value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })}/>
            <Input placeholder={t("admin.nav.f.path")} value={editing.path ?? ""} onChange={(e) => setEditing({ ...editing, path: e.target.value })}/>
            <Input type="number" placeholder={t("admin.nav.f.sort")} value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}/>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })}/>
              {t("admin.nav.f.visibleHeader")}
            </label>
            <Btn onClick={save}>{t("admin.common.save")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-3xl bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-primary">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-accent"><X className="size-4"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------ Student Registrations ------------ */
type Reg = {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  relationship: string;
  student_first_name: string;
  student_last_name: string;
  student_date_of_birth: string;
  student_gender: string;
  grade_applying_for: string;
  previous_school: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  read: boolean;
  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = ["pending", "contacted", "accepted", "rejected"] as const;
const PAGE_SIZE = 10;

function RegistrationsAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState<Reg[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read" | (typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("student_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Reg[]);
  };
  useEffect(() => { load(); }, []);

  const selected = items.find((r) => r.id === selectedId) ?? null;

  const filtered = items.filter((r) => {
    if (statusFilter === "unread" && r.read) return false;
    if (statusFilter === "read" && !r.read) return false;
    if (
      statusFilter !== "all" &&
      statusFilter !== "unread" &&
      statusFilter !== "read" &&
      r.status !== statusFilter
    )
      return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.parent_name.toLowerCase().includes(q) ||
      r.parent_email.toLowerCase().includes(q) ||
      r.parent_phone.toLowerCase().includes(q) ||
      `${r.student_first_name} ${r.student_last_name}`.toLowerCase().includes(q) ||
      r.grade_applying_for.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const unreadCount = items.filter((r) => !r.read).length;

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function setRead(r: Reg, value: boolean) {
    setBusy(true);
    const { error } = await supabase.from("student_registrations").update({ read: value }).eq("id", r.id);
    setBusy(false);
    if (error) return toast.error(t("admin.regs.couldNotUpdate"));
    toast.success(value ? t("admin.regs.markedRead") : t("admin.regs.markedUnread"));
    load();
  }

  async function setStatus(r: Reg, status: string) {
    setBusy(true);
    const { error } = await supabase.from("student_registrations").update({ status, read: true }).eq("id", r.id);
    setBusy(false);
    if (error) return toast.error(t("admin.regs.couldNotUpdateStatus"));
    toast.success(t("admin.regs.statusUpdated"));
    load();
  }

  async function remove(id: string) {
    if (!confirm(t("admin.regs.confirmDelete"))) return;
    const { error } = await supabase.from("student_registrations").delete().eq("id", id);
    if (error) return toast.error(t("admin.regs.couldNotDelete"));
    toast.success(t("admin.common.deleted"));
    load();
  }

  function exportCSV() {
    if (items.length === 0) return toast.error(t("admin.regs.exportEmpty"));
    const headers = ["Submitted","Status","Read","Parent","Email","Phone","Relationship","Student","Date of Birth","Gender","Grade","Previous School","Address","Notes"];
    const rows = items.map((r) => [
      new Date(r.created_at).toISOString(),
      r.status, r.read ? "Yes" : "No",
      r.parent_name, r.parent_email, r.parent_phone, r.relationship,
      `${r.student_first_name} ${r.student_last_name}`,
      r.student_date_of_birth, r.student_gender, r.grade_applying_for,
      r.previous_school ?? "", r.address ?? "", (r.notes ?? "").replace(/\s+/g, " "),
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dinigaas-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("admin.regs.exportedCsv", { n: items.length }));
  }

  async function exportPDF() {
    if (items.length === 0) return toast.error(t("admin.regs.exportEmpty"));
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("Dinigaas Trading S.C. — Student Registrations", 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()} · ${items.length} record(s)`, 40, 58);
    autoTable(doc, {
      startY: 75,
      head: [["Submitted","Parent","Contact","Student","DOB","Grade","Status"]],
      body: items.map((r) => [
        new Date(r.created_at).toLocaleDateString(),
        r.parent_name,
        `${r.parent_email}\n${r.parent_phone}`,
        `${r.student_first_name} ${r.student_last_name}`,
        r.student_date_of_birth,
        r.grade_applying_for,
        `${r.status}${r.read ? "" : " (new)"}`,
      ]),
      styles: { fontSize: 9, cellPadding: 4, valign: "top" },
      headStyles: { fillColor: [30, 64, 47], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 243, 238] },
      margin: { left: 40, right: 40 },
    });
    doc.save(`dinigaas-registrations-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success(t("admin.regs.exportedPdf", { n: items.length }));
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.regs.searchPlaceholder")}
                className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">{t("admin.regs.all")} ({items.length})</option>
              <option value="unread">{t("admin.regs.unread")} ({unreadCount})</option>
              <option value="read">{t("admin.regs.read")}</option>
              <option value="pending">{t("admin.regs.statusPending")}</option>
              <option value="contacted">{t("admin.regs.statusContacted")}</option>
              <option value="accepted">{t("admin.regs.statusAccepted")}</option>
              <option value="rejected">{t("admin.regs.statusRejected")}</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent">
              <Download className="size-4" /> {t("admin.regs.exportCsv")}
            </button>
            <button onClick={exportPDF} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-light">
              <Download className="size-4" /> {t("admin.regs.exportPdf")}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("admin.regs.showing", { a: pageItems.length, b: filtered.length, c: items.length })}
        </p>
      </Card>

      {pageItems.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? t("admin.regs.empty") : t("admin.regs.emptyFiltered")}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pageItems.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <button onClick={() => setSelectedId(r.id)} className="flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-lg text-primary">{r.student_first_name} {r.student_last_name}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">{r.grade_applying_for}</span>
                    <StatusBadge status={r.status} />
                    {!r.read && <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-bold uppercase text-clay">{t("admin.regs.new")}</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.relationship}: {r.parent_name} · {r.parent_email} · {r.parent_phone} · {new Date(r.created_at).toLocaleString()}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-primary/70">{t("admin.regs.clickToView")}</p>
                </button>
                <div className="flex flex-col gap-2 lg:w-56">
                  <select
                    value={r.status}
                    onChange={(e) => setStatus(r, e.target.value)}
                    disabled={busy}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{t(`admin.status.${s}`)}</option>
                    ))}
                  </select>
                  <button onClick={() => setRead(r, !r.read)} disabled={busy} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent">
                    {r.read ? t("admin.regs.markUnread") : t("admin.regs.markRead")}
                  </button>
                  <button onClick={() => remove(r.id)} className="inline-flex items-center justify-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10">
                    <Trash2 className="size-3.5" /> {t("admin.regs.delete")}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{t("admin.regs.page", { a: safePage, b: totalPages })}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50">
              <ChevronLeft className="size-3.5" /> {t("admin.regs.prev")}
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50">
              {t("admin.regs.next")} <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <RegistrationDrawer
        registration={selected}
        onClose={() => setSelectedId(null)}
        onStatusChange={(value) => selected && setStatus(selected, value)}
        onToggleRead={() => selected && setRead(selected, !selected.read)}
        busy={busy}
      />
    </div>
  );
}

type StatusEvent = { id: string; from_status: string | null; to_status: string; note: string | null; created_at: string };

function RegistrationDrawer({
  registration, onClose, onStatusChange, onToggleRead, busy,
}: {
  registration: Reg | null; onClose: () => void; onStatusChange: (status: string) => void; onToggleRead: () => void; busy: boolean;
}) {
  const { t } = useI18n();
  const [history, setHistory] = useState<StatusEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const open = !!registration;

  useEffect(() => {
    if (!registration) return;
    let cancelled = false;
    setLoadingHistory(true);
    (async () => {
      const { data, error } = await (supabase as any)
        .from("student_registration_status_history")
        .select("id, from_status, to_status, note, created_at")
        .eq("registration_id", registration.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error(t("admin.regs.couldNotLoadHistory"));
        setHistory([]);
      } else {
        setHistory((data ?? []) as StatusEvent[]);
      }
      setLoadingHistory(false);
    })();
    return () => { cancelled = true; };
  }, [registration?.id, registration?.status, registration?.updated_at, t]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!registration) return null;
  const r = registration;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label={t("admin.regs.close")} onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in" />
      <aside role="dialog" aria-modal="true" aria-label={t("admin.regs.title")} className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-background shadow-2xl animate-in slide-in-from-right duration-300">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.regs.title")}</p>
            <h2 className="mt-1 font-serif text-2xl text-primary">{r.student_first_name} {r.student_last_name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">{r.grade_applying_for}</span>
              <StatusBadge status={r.status} />
              {!r.read && <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-bold uppercase text-clay">{t("admin.regs.new")}</span>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full border border-border p-2 text-muted-foreground hover:bg-accent" aria-label={t("admin.regs.close")}>
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.regs.parentSection")}</h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <Detail label={t("admin.regs.detail.name")} value={r.parent_name} />
              <Detail label={t("admin.regs.detail.relationship")} value={r.relationship} />
              <Detail label={t("admin.regs.detail.email")} value={r.parent_email} />
              <Detail label={t("admin.regs.detail.phone")} value={r.parent_phone} />
              <div className="sm:col-span-2">
                <Detail label={t("admin.regs.detail.address")} value={r.address || "—"} />
              </div>
            </dl>
          </section>

          <section className="mt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.regs.studentSection")}</h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <Detail label={t("admin.regs.detail.firstName")} value={r.student_first_name} />
              <Detail label={t("admin.regs.detail.lastName")} value={r.student_last_name} />
              <Detail label={t("admin.regs.detail.dob")} value={r.student_date_of_birth} />
              <Detail label={t("admin.regs.detail.gender")} value={r.student_gender} />
              <Detail label={t("admin.regs.detail.grade")} value={r.grade_applying_for} />
              <Detail label={t("admin.regs.detail.prevSchool")} value={r.previous_school || "—"} />
            </dl>
            {r.notes && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.regs.notes")}</p>
                <p className="mt-1 whitespace-pre-line rounded-xl border border-border bg-cotton px-3 py-2 text-sm text-foreground">{r.notes}</p>
              </div>
            )}
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.regs.submission")}</h3>
            </div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <Detail label={t("admin.regs.submitted")} value={new Date(r.created_at).toLocaleString()} />
              <Detail label={t("admin.regs.lastUpdate")} value={new Date(r.updated_at).toLocaleString()} />
            </dl>
          </section>

          <section className="mt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.regs.timeline")}</h3>
            {loadingHistory ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("admin.regs.loadingHistory")}
              </div>
            ) : history.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("admin.regs.noHistory")}</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l-2 border-border pl-5">
                {history.map((ev, i) => (
                  <li key={ev.id} className="relative">
                    <span className={`absolute -left-[27px] top-1.5 size-3 rounded-full ring-4 ring-background ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      {ev.from_status ? (
                        <>
                          <StatusBadge status={ev.from_status} />
                          <span className="text-xs text-muted-foreground">→</span>
                          <StatusBadge status={ev.to_status} />
                        </>
                      ) : (
                        <StatusBadge status={ev.to_status} />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</p>
                    {ev.note && <p className="mt-1 text-xs italic text-foreground/80">{ev.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border bg-cotton px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("admin.regs.status")}</label>
            <select
              value={r.status}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={busy}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{t(`admin.status.${s}`)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggleRead} disabled={busy} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent">
              {r.read ? t("admin.regs.markUnread") : t("admin.regs.markRead")}
            </button>
            <button onClick={onClose} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-light">
              {t("admin.regs.close")}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, string> = {
    pending: "bg-muted text-foreground/70",
    contacted: "bg-primary/10 text-primary",
    accepted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-destructive/10 text-destructive",
  };
  const label = t(`admin.status.${status}`);
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] ?? "bg-muted text-foreground/70"}`}>
      {label === `admin.status.${status}` ? status : label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-foreground">{value}</p>
    </div>
  );
}

/* ------------ Shareholders ------------ */
type Shareholder = {
  id: string;
  name: string;
  role: string;
  stake: string;
  bio: string;
  email: string;
  phone: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

function ShareholdersAdmin() {
  const [items, setItems] = useState<Shareholder[]>([]);
  const [editing, setEditing] = useState<Partial<Shareholder> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleBulkUpload(files: File[]) {
    if (!files.length) return;
    setBulkProgress({ done: 0, total: files.length });
    let created = 0;
    let failed = 0;
    let base = items.length;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `shareholders/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("site_media")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("site_media").getPublicUrl(path);
        const { error: insErr } = await supabase.from("shareholders").insert({
          name: "",
          role: "",
          stake: "",
          bio: "",
          email: "",
          phone: "",
          image_url: data.publicUrl,
          sort_order: base + i + 1,
          active: true,
        });
        if (insErr) throw insErr;
        created++;
      } catch (e) {
        failed++;
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
      setBulkProgress({ done: i + 1, total: files.length });
    }
    setBulkProgress(null);
    if (created) {
      track("admin_shareholder_bulk_upload", { created, failed });
      toast.success(`Uploaded ${created} photo${created === 1 ? "" : "s"}${failed ? ` (${failed} failed)` : ""}`);
    }
    load();
  }

  const load = () =>
    supabase
      .from("shareholders")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setItems((data ?? []) as Shareholder[]));

  useEffect(() => {
    load();
  }, []);

  async function persistOrder(next: Shareholder[]) {
    setSavingOrder(true);
    const updates = next.map((s, i) =>
      supabase.from("shareholders").update({ sort_order: i + 1 }).eq("id", s.id),
    );
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error)?.error;
    setSavingOrder(false);
    if (err) {
      toast.error(err.message);
      load();
      return;
    }
    track("admin_shareholder_reorder", { count: next.length });
    toast.success("Order saved");
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const from = items.findIndex((s) => s.id === dragId);
    const to = items.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const renumbered = next.map((s, i) => ({ ...s, sort_order: i + 1 }));
    setItems(renumbered);
    setDragId(null);
    setOverId(null);
    void persistOrder(renumbered);
  }


  async function save() {
    if (!editing?.image_url?.trim()) return toast.error("Photo is required");
    const payload = {
      name: "",
      role: "",
      stake: "",
      bio: "",
      email: "",
      phone: "",
      image_url: editing.image_url.trim(),
      sort_order: Number(editing.sort_order ?? 0) || 0,
      active: editing.active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("shareholders").update(payload).eq("id", editing.id)
      : await supabase.from("shareholders").insert(payload);
    if (error) return toast.error(error.message);
    track(editing.id ? "admin_shareholder_update" : "admin_shareholder_create", {
      shareholder_id: editing.id ?? null,
    });
    toast.success("Saved");
    setEditing(null);
    load();
  }


  async function remove(id: string) {
    if (!confirm("Delete this shareholder?")) return;
    const { error } = await supabase.from("shareholders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    track("admin_shareholder_delete", { shareholder_id: id });
    toast.success("Deleted");
    load();
  }

  async function handleUpload(file: File) {
    if (!editing) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `shareholders/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site_media")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("site_media").getPublicUrl(path);
      setEditing({ ...editing, image_url: data.publicUrl });
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Btn
        onClick={() => {
          track("admin_shareholder_add_click");
          setEditing({
            name: "",
            role: "",
            stake: "",
            bio: "",
            email: "",
            phone: "",
            image_url: null,
            sort_order: items.length + 1,
            active: true,
          });
        }}
      >
        <Plus className="size-4" /> Add shareholder
      </Btn>

      <p className="text-xs text-muted-foreground">
        Drag the <GripVertical className="inline size-3 align-text-bottom" aria-hidden /> handle to reorder.
        {savingOrder ? " Saving…" : ""}
      </p>

      <div className="grid gap-3">
        {items.map((s) => (
          <Card
            key={s.id}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              if (overId !== s.id) setOverId(s.id);
            }}
            onDragLeave={() => {
              if (overId === s.id) setOverId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(s.id);
            }}
            className={`transition-colors ${dragId === s.id ? "opacity-50" : ""} ${
              overId === s.id && dragId !== s.id ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  setDragId(s.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className="cursor-grab touch-none rounded-full p-2 text-muted-foreground hover:bg-accent active:cursor-grabbing"
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                <GripVertical className="size-4" />
              </button>
              <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                    <ImageIcon className="size-5" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-clay">
                  #{s.sort_order}
                  {!s.active ? " · hidden" : ""}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    track("admin_shareholder_edit_click", { shareholder_id: s.id });
                    setEditing(s);
                  }}
                  className="rounded-full p-2 hover:bg-accent"
                  aria-label={`Edit ${s.name}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="rounded-full p-2 text-destructive hover:bg-destructive/10"
                  aria-label={`Delete ${s.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>


      {editing && (
        <Modal
          onClose={() => setEditing(null)}
          title={editing.id ? "Edit shareholder" : "New shareholder"}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Photo / logo</label>
              <div className="mt-1 flex items-center gap-3">
                <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {editing.image_url ? (
                    <img src={editing.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
                    </div>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
                  <Upload className="size-4" />
                  {uploading ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {editing.image_url && (
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, image_url: null })}
                    className="rounded-full p-2 text-destructive hover:bg-destructive/10"
                    aria-label="Remove photo"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <Input
                className="mt-2"
                placeholder="Or paste an image URL"
                value={editing.image_url ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, image_url: e.target.value || null })
                }
              />
            </div>



            <Input
              type="number"
              placeholder="Sort order"
              value={editing.sort_order ?? 0}
              onChange={(e) =>
                setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.active ?? true}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />{" "}
              Visible on the public Shareholders page
            </label>
            <Btn onClick={save}>Save</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
