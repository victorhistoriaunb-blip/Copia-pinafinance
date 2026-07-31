import { useRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { logout } from "@/lib/gate.functions";
import { useFinance } from "@/lib/finance-store";
import { AppShell } from "./app-shell";

export function Page({
  title,
  subtitle,
  actions,
  requireData = true,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  requireData?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const doLogout = useServerFn(logout);
  const { ready, transactions } = useFinance();

  async function handleLogout() {
    await doLogout();
    await router.navigate({ to: "/login" });
  }

  return (
    <AppShell title={title} subtitle={subtitle} actions={actions} onLogout={handleLogout}>
      {!ready ? (
        <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Carregando seus dados…
          </span>
        </div>
      ) : requireData && transactions.length === 0 ? (
        <EmptyState />
      ) : (
        children
      )}
    </AppShell>
  );
}

export function EmptyState() {
  return (
    <div className="panel grid min-h-[50vh] place-items-center p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary">
          <FileSpreadsheet className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">Nenhuma planilha importada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Importe seus arquivos Excel (.xlsx ou .xls) para alimentar automaticamente todos os
          indicadores, gráficos e relatórios.
        </p>
        <Link
          to="/importar"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110"
        >
          Importar planilhas
        </Link>
      </div>
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
