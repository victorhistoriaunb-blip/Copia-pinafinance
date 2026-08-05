import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { useAuth } from "@/lib/auth-context";
import { Page } from "@/components/dashboard/page";
import { Panel } from "@/components/dashboard/charts";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/finance.types";

export const Route = createFileRoute("/_gated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações · PINA Finanças" },
      {
        name: "description",
        content:
          "Personalize nome do app, saudação, cor de destaque, densidade e rótulos do menu da sua conta.",
      },
      { property: "og:title", content: "Configurações · PINA Finanças" },
      { property: "og:description", content: "Preferências e identidade da sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const ACCENTS: { id: AppSettings["accent"]; label: string; color: string }[] = [
  { id: "azul", label: "Azul", color: "oklch(0.623 0.188 259.8)" },
  { id: "violeta", label: "Violeta", color: "oklch(0.62 0.21 295)" },
  { id: "esmeralda", label: "Esmeralda", color: "oklch(0.65 0.15 162)" },
  { id: "ambar", label: "Âmbar", color: "oklch(0.72 0.16 70)" },
  { id: "rosa", label: "Rosa", color: "oklch(0.65 0.2 350)" },
];

const inputClass =
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/35";

function Field({
  label,
  value,
  onChange,
  maxLength = 60,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function SettingsPage() {
  const { settings, saveSettings, syncing } = useFinance();
  const { user, name } = useAuth();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraft(settings), [settings]);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft.appName.trim()) {
      setError("Informe o nome do aplicativo.");
      return;
    }
    const clean: AppSettings = {
      ...draft,
      appName: draft.appName.trim(),
      tagline: draft.tagline.trim(),
      greeting: draft.greeting.trim() || "Olá",
      labels: {
        dashboard: draft.labels.dashboard.trim() || DEFAULT_SETTINGS.labels.dashboard,
        contas: draft.labels.contas.trim() || DEFAULT_SETTINGS.labels.contas,
        relatorios: draft.labels.relatorios.trim() || DEFAULT_SETTINGS.labels.relatorios,
        metas: draft.labels.metas.trim() || DEFAULT_SETTINGS.labels.metas,
      },
    };
    await saveSettings(clean);
    setSaved(true);
  }

  return (
    <Page title="Configurações" subtitle="Preferências da sua conta" requireData={false}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Identidade" description="Como o app se apresenta para você">
            <div className="flex flex-col gap-4">
              <Field label="Nome do aplicativo" value={draft.appName} onChange={(v) => set("appName", v)} />
              <Field label="Frase de apoio" value={draft.tagline} onChange={(v) => set("tagline", v)} />
              <Field label="Saudação" value={draft.greeting} onChange={(v) => set("greeting", v)} maxLength={30} />
              <p className="text-xs text-muted-foreground">
                Prévia: <span className="text-foreground">{draft.greeting || "Olá"}{name ? `, ${name}` : ""}</span>
                {user?.email ? ` · ${user.email}` : ""}
              </p>
            </div>
          </Panel>

          <Panel title="Aparência" description="Cor de destaque e densidade" delay={0.05}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Cor de destaque
                </span>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => set("accent", a.id)}
                      aria-label={a.label}
                      aria-pressed={draft.accent === a.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                        draft.accent === a.id
                          ? "border-primary text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="size-3.5 rounded-full" style={{ background: a.color }} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Densidade
                </span>
                <div className="flex flex-wrap gap-2">
                  {(["confortavel", "compacta"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set("density", d)}
                      aria-pressed={draft.density === d}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                        draft.density === d
                          ? "border-primary text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {d === "confortavel" ? "Confortável" : "Compacta"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {(
                  [
                    ["showInsights", "Mostrar insights no dashboard"],
                    ["showGoal", "Mostrar meta no dashboard"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={draft[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="size-4 rounded border-input accent-[var(--color-primary)]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Rótulos do menu" description="Renomeie as seções como preferir" delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["dashboard", "Dashboard"],
                  ["contas", "Contas"],
                  ["relatorios", "Relatórios"],
                  ["metas", "Metas"],
                ] as const
              ).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={draft.labels[key]}
                  maxLength={24}
                  onChange={(v) => setDraft((d) => ({ ...d, labels: { ...d.labels, [key]: v } }))}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Dados de contato" description="Aparecem nas informações copiadas" delay={0.15}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome / empresa" value={draft.companyName} onChange={(v) => set("companyName", v)} />
              <Field label="E-mail" value={draft.companyEmail} onChange={(v) => set("companyEmail", v)} />
              <Field label="Telefone" value={draft.companyPhone} onChange={(v) => set("companyPhone", v)} maxLength={30} />
              <Field label="Observação" value={draft.companyNote} onChange={(v) => set("companyNote", v)} maxLength={120} />
            </div>
          </Panel>
        </div>

        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={syncing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
          >
            {syncing && <Loader2 className="size-4 animate-spin" />} Salvar configurações
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_SETTINGS);
              setSaved(false);
            }}
            className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/60"
          >
            Restaurar padrão
          </button>
          {saved && !syncing && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <Check className="size-4" /> Configurações salvas
            </span>
          )}
        </div>
      </form>
    </Page>
  );
}
