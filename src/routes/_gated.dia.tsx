import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Receipt } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { brl, categoriesOf, totals } from "@/lib/analytics";
import { Page } from "@/components/dashboard/page";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CategoryDonut, Panel } from "@/components/dashboard/charts";
import { TransactionsTable } from "@/components/dashboard/transactions-table";

export const Route = createFileRoute("/_gated/dia")({
  head: () => ({
    meta: [
      { title: "Visão por Dia · PINA Finanças" },
      { name: "description", content: "Acompanhe receitas, despesas e lançamentos de um dia específico." },
      { property: "og:title", content: "Visão por Dia · PINA Finanças" },
      { property: "og:description", content: "Receitas, despesas e lançamentos do dia selecionado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DayPage,
});

function DayPage() {
  const { transactions } = useFinance();
  const latest = transactions[0]?.date ?? new Date().toISOString().slice(0, 10);
  const [day, setDay] = useState<string>("");
  const date = day || latest;
  const rows = useMemo(() => transactions.filter((t) => t.date === date), [transactions, date]);
  const t = totals(rows);
  const categories = useMemo(() => categoriesOf(rows), [rows]);

  return (
    <Page
      title="Visão por Dia"
      subtitle={new Date(`${date}T00:00:00Z`).toLocaleDateString("pt-BR", {
        dateStyle: "full",
        timeZone: "UTC",
      })}
      actions={
        <input
          type="date"
          value={date}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard index={0} icon={ArrowUpRight} title="Receitas do dia" value={brl(t.receitas)} tone="success" />
          <KpiCard index={1} icon={ArrowDownRight} title="Despesas do dia" value={brl(t.despesas)} tone="danger" />
          <KpiCard index={2} icon={PiggyBank} title="Saldo do dia" value={brl(t.economia)} tone="primary" />
          <KpiCard index={3} icon={Receipt} title="Lançamentos" value={String(t.count)} tone="warning" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Lançamentos do dia" description={`${rows.length} registro(s)`} delay={0.1} className="xl:col-span-2">
            <TransactionsTable rows={rows} />
          </Panel>
          <Panel title="Despesas por categoria" description="Dia selecionado" delay={0.15}>
            <CategoryDonut data={categories} />
          </Panel>
        </div>
      </div>
    </Page>
  );
}
