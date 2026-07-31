import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Receipt } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { availableYears, brl, categoriesOf, monthlySeries, totals } from "@/lib/analytics";
import { Page, Select } from "@/components/dashboard/page";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CategoryBars, FlowChart, Panel } from "@/components/dashboard/charts";

export const Route = createFileRoute("/_gated/ano")({
  head: () => ({
    meta: [
      { title: "Visão por Ano · PINA Finanças" },
      { name: "description", content: "Evolução anual das receitas, despesas e economia mês a mês." },
      { property: "og:title", content: "Visão por Ano · PINA Finanças" },
      { property: "og:description", content: "Comparativo anual de receitas, despesas e economia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: YearPage,
});

function YearPage() {
  const { transactions } = useFinance();
  const years = useMemo(() => availableYears(transactions), [transactions]);
  const [sel, setSel] = useState("");
  const year = sel && years.includes(sel) ? sel : years[0] ?? String(new Date().getFullYear());
  const rows = useMemo(() => transactions.filter((t) => t.date.startsWith(year)), [transactions, year]);
  const t = totals(rows);
  const months = useMemo(
    () => monthlySeries(rows, Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`)),
    [rows, year],
  );
  const categories = useMemo(() => categoriesOf(rows), [rows]);
  const best = [...months].sort((a, b) => b.economia - a.economia)[0];

  return (
    <Page
      title="Visão por Ano"
      subtitle={`Consolidado de ${year}`}
      actions={years.length > 0 ? <Select value={year} onChange={setSel} options={years.map((y) => ({ value: y, label: y }))} /> : null}
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard index={0} icon={ArrowUpRight} title="Receitas do ano" value={brl(t.receitas)} tone="success" />
          <KpiCard index={1} icon={ArrowDownRight} title="Despesas do ano" value={brl(t.despesas)} tone="danger" />
          <KpiCard index={2} icon={PiggyBank} title="Economia do ano" value={brl(t.economia)} tone="primary" />
          <KpiCard index={3} icon={Receipt} title="Média mensal de gastos" value={brl(t.despesas / 12)} tone="warning" />
        </div>

        <Panel title="Receitas x Despesas" description={`Mês a mês em ${year}`} delay={0.1}>
          <FlowChart data={months} />
        </Panel>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Categorias do ano" delay={0.15} className="xl:col-span-2">
            <CategoryBars data={categories} />
          </Panel>
          <Panel title="Resumo" description="Destaques do período" delay={0.2}>
            <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
              <li className="rounded-xl bg-surface/50 p-3">
                Melhor mês de economia: <strong className="text-foreground">{best?.label ?? "—"}</strong>{" "}
                ({brl(best?.economia ?? 0)})
              </li>
              <li className="rounded-xl bg-surface/50 p-3">
                Maior categoria: <strong className="text-foreground">{categories[0]?.name ?? "—"}</strong>{" "}
                ({brl(categories[0]?.total ?? 0)})
              </li>
              <li className="rounded-xl bg-surface/50 p-3">
                Total de lançamentos: <strong className="text-foreground">{t.count}</strong>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
