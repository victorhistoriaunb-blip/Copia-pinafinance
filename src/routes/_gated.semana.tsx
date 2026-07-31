import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Receipt } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { brl, categoriesOf, inRange, totals, weekRange } from "@/lib/analytics";
import { Page } from "@/components/dashboard/page";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CategoryBars, DailyBars, Panel } from "@/components/dashboard/charts";
import { TransactionsTable } from "@/components/dashboard/transactions-table";

export const Route = createFileRoute("/_gated/semana")({
  head: () => ({
    meta: [
      { title: "Visão por Semana · PINA Finanças" },
      { name: "description", content: "Compare receitas e despesas dia a dia dentro da semana escolhida." },
      { property: "og:title", content: "Visão por Semana · PINA Finanças" },
      { property: "og:description", content: "Receitas, despesas e categorias da semana selecionada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WeekPage,
});

function WeekPage() {
  const { transactions } = useFinance();
  const latest = transactions[0]?.date ?? new Date().toISOString().slice(0, 10);
  const [ref, setRef] = useState<string>("");
  const { start, end } = weekRange(ref || latest);
  const rows = useMemo(() => inRange(transactions, start, end), [transactions, start, end]);
  const t = totals(rows);
  const categories = useMemo(() => categoriesOf(rows), [rows]);

  const daily = useMemo(() => {
    const out: { day: string; despesas: number; receitas: number }[] = [];
    const d = new Date(`${start}T00:00:00Z`);
    for (let i = 0; i < 7; i++) {
      const key = d.toISOString().slice(0, 10);
      const day = rows.filter((r) => r.date === key);
      out.push({
        day: new Date(`${key}T00:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }),
        despesas: Math.round(day.filter((r) => r.type === "despesa").reduce((s, r) => s + r.amount, 0)),
        receitas: Math.round(day.filter((r) => r.type === "receita").reduce((s, r) => s + r.amount, 0)),
      });
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  }, [rows, start]);

  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });

  return (
    <Page
      title="Visão por Semana"
      subtitle={`${fmt(start)} — ${fmt(end)}`}
      actions={
        <input
          type="date"
          value={ref || latest}
          onChange={(e) => setRef(e.target.value)}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard index={0} icon={ArrowUpRight} title="Receitas da semana" value={brl(t.receitas)} tone="success" />
          <KpiCard index={1} icon={ArrowDownRight} title="Despesas da semana" value={brl(t.despesas)} tone="danger" />
          <KpiCard index={2} icon={PiggyBank} title="Economia da semana" value={brl(t.economia)} tone="primary" />
          <KpiCard index={3} icon={Receipt} title="Lançamentos" value={String(t.count)} tone="warning" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Gastos por dia da semana" delay={0.1} className="xl:col-span-2">
            <DailyBars data={daily} />
          </Panel>
          <Panel title="Categorias da semana" delay={0.15}>
            <CategoryBars data={categories} />
          </Panel>
        </div>

        <Panel title="Lançamentos da semana" description={`${rows.length} registro(s)`} delay={0.2}>
          <TransactionsTable rows={rows} />
        </Panel>
      </div>
    </Page>
  );
}
