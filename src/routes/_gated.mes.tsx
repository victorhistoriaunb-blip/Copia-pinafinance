import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Receipt } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import {
  availableMonths,
  brl,
  categoriesOf,
  dailySeries,
  fullMonthLabel,
  monthKey,
  totals,
} from "@/lib/analytics";
import { Page, Select } from "@/components/dashboard/page";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CategoryBars, CategoryDonut, DailyBars, Panel } from "@/components/dashboard/charts";
import { TransactionsTable } from "@/components/dashboard/transactions-table";

export const Route = createFileRoute("/_gated/mes")({
  head: () => ({
    meta: [
      { title: "Visão por Mês · PINA Finanças" },
      { name: "description", content: "Analise o mês completo: receitas, despesas, categorias e evolução diária." },
      { property: "og:title", content: "Visão por Mês · PINA Finanças" },
      { property: "og:description", content: "Receitas, despesas e categorias do mês selecionado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MonthPage,
});

function MonthPage() {
  const { transactions } = useFinance();
  const months = useMemo(() => availableMonths(transactions), [transactions]);
  const [sel, setSel] = useState("");
  const month = sel && months.includes(sel) ? sel : months[0] ?? new Date().toISOString().slice(0, 7);
  const rows = useMemo(() => transactions.filter((t) => monthKey(t.date) === month), [transactions, month]);
  const t = totals(rows);
  const categories = useMemo(() => categoriesOf(rows), [rows]);
  const daily = useMemo(() => dailySeries(rows, month), [rows, month]);

  return (
    <Page
      title="Visão por Mês"
      subtitle={fullMonthLabel(month)}
      actions={
        months.length > 0 ? (
          <Select value={month} onChange={setSel} options={months.map((m) => ({ value: m, label: fullMonthLabel(m) }))} />
        ) : null
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard index={0} icon={ArrowUpRight} title="Receitas" value={brl(t.receitas)} tone="success" />
          <KpiCard index={1} icon={ArrowDownRight} title="Despesas" value={brl(t.despesas)} tone="danger" />
          <KpiCard index={2} icon={PiggyBank} title="Economia" value={brl(t.economia)} tone="primary" />
          <KpiCard index={3} icon={Receipt} title="Lançamentos" value={String(t.count)} tone="warning" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Gastos diários" description={fullMonthLabel(month)} delay={0.1} className="xl:col-span-2">
            <DailyBars data={daily} />
          </Panel>
          <Panel title="Distribuição por categoria" delay={0.15}>
            <CategoryDonut data={categories} />
          </Panel>
        </div>

        <Panel title="Maiores categorias do mês" delay={0.2}>
          <CategoryBars data={categories} />
        </Panel>

        <Panel title="Lançamentos do mês" description={`${rows.length} registro(s)`} delay={0.25}>
          <TransactionsTable rows={rows} />
        </Panel>
      </div>
    </Page>
  );
}
