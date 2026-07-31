import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useFinance } from "@/lib/finance-store";
import { availableMonths, brl, categoriesOf, fullMonthLabel, monthKey } from "@/lib/analytics";
import { Page, Select } from "@/components/dashboard/page";
import { CategoryBars, CategoryDonut, Panel } from "@/components/dashboard/charts";

export const Route = createFileRoute("/_gated/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias · PINA Finanças" },
      { name: "description", content: "Ranking de categorias de gastos e receitas com participação percentual." },
      { property: "og:title", content: "Categorias · PINA Finanças" },
      { property: "og:description", content: "Ranking de categorias com participação no total." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { transactions } = useFinance();
  const months = useMemo(() => availableMonths(transactions), [transactions]);
  const [period, setPeriod] = useState("all");
  const [type, setType] = useState<"despesa" | "receita">("despesa");

  const rows = useMemo(
    () => (period === "all" ? transactions : transactions.filter((t) => monthKey(t.date) === period)),
    [transactions, period],
  );
  const categories = useMemo(() => categoriesOf(rows, type), [rows, type]);
  const total = categories.reduce((s, c) => s + c.total, 0);

  return (
    <Page
      title="Categorias"
      subtitle={period === "all" ? "Todos os períodos" : fullMonthLabel(period)}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={type}
            onChange={(v) => setType(v as "despesa" | "receita")}
            options={[
              { value: "despesa", label: "Despesas" },
              { value: "receita", label: "Receitas" },
            ]}
          />
          <Select
            value={period}
            onChange={setPeriod}
            options={[{ value: "all", label: "Todo o período" }, ...months.map((m) => ({ value: m, label: fullMonthLabel(m) }))]}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Participação" description={`${categories.length} categorias`} delay={0.05}>
            <CategoryDonut data={categories} />
          </Panel>
          <Panel title="Ranking" description={`Total ${brl(total)}`} delay={0.1} className="xl:col-span-2">
            <CategoryBars data={categories} />
          </Panel>
        </div>

        <Panel title="Detalhamento" description="Valor e participação por categoria" delay={0.15}>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-2 py-2 font-medium">Categoria</th>
                  <th className="px-2 py-2 text-right font-medium">Total</th>
                  <th className="px-2 py-2 text-right font-medium">Participação</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.name} className="border-t border-border/60 hover:bg-surface/40">
                    <td className="px-2 py-2.5">{c.name}</td>
                    <td className="px-2 py-2.5 text-right font-medium">{brl(c.total)}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-surface sm:block">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${c.share}%` }} />
                        </span>
                        {c.share.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
