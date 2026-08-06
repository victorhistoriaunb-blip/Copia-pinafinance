import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, LayoutGrid, List, Search } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { availableMonths, brl, fullMonthLabel, monthKey, totals } from "@/lib/analytics";
import { Page, Select } from "@/components/dashboard/page";
import { Panel } from "@/components/dashboard/charts";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { RecordCard } from "@/components/dashboard/record-card";

export const Route = createFileRoute("/_gated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios · PINA Finanças" },
      { name: "description", content: "Filtre lançamentos por período, tipo e categoria e exporte em CSV." },
      { property: "og:title", content: "Relatórios · PINA Finanças" },
      { property: "og:description", content: "Filtros avançados e exportação dos lançamentos importados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { transactions } = useFinance();
  const months = useMemo(() => availableMonths(transactions), [transactions]);
  const categories = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort(),
    [transactions],
  );

  const [period, setPeriod] = useState("all");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [term, setTerm] = useState("");
  const [view, setView] = useState<"cards" | "tabela">("cards");

  const rows = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (period === "all" || monthKey(t.date) === period) &&
          (type === "all" || t.type === type) &&
          (category === "all" || t.category === category) &&
          (term.trim() === "" || t.description.toLowerCase().includes(term.trim().toLowerCase())),
      ),
    [transactions, period, type, category, term],
  );
  const t = totals(rows);

  function exportCsv() {
    const header = ["Data", "Tipo", "Categoria", "Descrição", "Conta", "Forma", "Valor", "Planilha"];
    const body = rows.map((r) =>
      [r.date, r.type, r.category, r.description, r.account, r.method, String(r.amount).replace(".", ","), r.fileName]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob(["\uFEFF" + [header.join(";"), ...body].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-pina-financas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page
      title="Relatórios"
      subtitle={`${rows.length} lançamento(s) · saldo ${brl(t.economia)}`}
      actions={
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-primary)] px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          <Download className="size-3.5" /> Exportar CSV
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <Panel title="Filtros" description="Combine período, tipo, categoria e busca" delay={0.05}>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={period}
              onChange={setPeriod}
              label="Período"
              options={[{ value: "all", label: "Todos" }, ...months.map((m) => ({ value: m, label: fullMonthLabel(m) }))]}
            />
            <Select
              value={type}
              onChange={setType}
              label="Tipo"
              options={[
                { value: "all", label: "Todos" },
                { value: "receita", label: "Receitas" },
                { value: "despesa", label: "Despesas" },
              ]}
            />
            <Select
              value={category}
              onChange={setCategory}
              label="Categoria"
              options={[{ value: "all", label: "Todas" }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
            <span className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar descrição"
                className="rounded-lg border border-input bg-card py-2 pr-3 pl-8 text-sm outline-none focus:border-primary"
              />
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface/50 p-3 text-xs">
              <p className="text-muted-foreground">Receitas</p>
              <p className="mt-1 text-lg font-semibold text-success">{brl(t.receitas)}</p>
            </div>
            <div className="rounded-xl bg-surface/50 p-3 text-xs">
              <p className="text-muted-foreground">Despesas</p>
              <p className="mt-1 text-lg font-semibold text-destructive">{brl(t.despesas)}</p>
            </div>
            <div className="rounded-xl bg-surface/50 p-3 text-xs">
              <p className="text-muted-foreground">Saldo</p>
              <p className="mt-1 text-lg font-semibold">{brl(t.economia)}</p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Lançamentos"
          description={`Resultado dos filtros · ${rows.length} registro(s)`}
          delay={0.1}
        >
          <div className="mb-4 inline-flex rounded-xl border border-border p-1">
            {([
              ["cards", "Cards", LayoutGrid],
              ["tabela", "Tabela", List],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === value
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum lançamento com esses filtros.
            </p>
          ) : view === "tabela" ? (
            <TransactionsTable rows={rows} limit={500} />
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {rows.slice(0, 200).map((t) => (
                <RecordCard key={t.id} t={t} />
              ))}
            </div>
          )}
          {view === "cards" && rows.length > 200 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Mostrando os 200 primeiros — refine os filtros ou use a visão em tabela.
            </p>
          )}
        </Panel>
      </div>
    </Page>
  );
}
