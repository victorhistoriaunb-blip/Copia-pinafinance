import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Lightbulb,
  PiggyBank,
  Percent,
  Target,
  Wallet,
} from "lucide-react";
import { getDashboard } from "@/lib/finance.functions";
import type { DashboardData } from "@/lib/finance.types";
import { logout } from "@/lib/gate.functions";
import { AppShell } from "@/components/dashboard/app-shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  CategoryBars,
  CategoryDonut,
  DailyBars,
  FlowChart,
  GoalGauge,
  Panel,
} from "@/components/dashboard/charts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Financeiro Pessoal · PINA Finanças" },
      {
        name: "description",
        content:
          "Painel visual com saldo, receitas, despesas, economia, categorias, metas e insights do seu mês.",
      },
      { property: "og:title", content: "Dashboard Financeiro Pessoal · PINA Finanças" },
      {
        property: "og:description",
        content: "Saldo, receitas, despesas, categorias e metas em um painel moderno.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: () => getDashboard(),
  component: Dashboard,
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Dashboard() {
  const data = Route.useLoaderData() as DashboardData;
  const router = useRouter();
  const doLogout = useServerFn(logout);
  const { kpis, monthly, categories, daily, goal, insights, recent } = data;

  const spark = (key: "receitas" | "despesas" | "economia") =>
    monthly.slice(-8).map((m) => ({ v: m[key] }));

  const monthLabel = new Date(`${data.period.current}-01T00:00:00Z`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  async function handleLogout() {
    await doLogout();
    await router.navigate({ to: "/login" });
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Visão geral · ${monthLabel}`}
      onLogout={handleLogout}
      actions={
        <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
          {data.source}
        </span>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            icon={Wallet}
            title="Saldo atual"
            value={brl(kpis.balance)}
            change={kpis.balanceChange}
            hint="acumulado"
            tone="primary"
            spark={spark("economia")}
          />
          <KpiCard
            index={1}
            icon={ArrowUpRight}
            title="Receitas do mês"
            value={brl(kpis.income)}
            change={kpis.incomeChange}
            hint="vs mês anterior"
            tone="success"
            spark={spark("receitas")}
          />
          <KpiCard
            index={2}
            icon={ArrowDownRight}
            title="Despesas do mês"
            value={brl(kpis.expense)}
            change={kpis.expenseChange}
            hint="vs mês anterior"
            tone="danger"
            spark={spark("despesas")}
          />
          <KpiCard
            index={3}
            icon={PiggyBank}
            title="Economia do mês"
            value={brl(kpis.savings)}
            change={kpis.savingsChange}
            hint="vs mês anterior"
            tone="warning"
            spark={spark("economia")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={4}
            icon={Percent}
            title="Percentual gasto"
            value={`${kpis.spentPct.toFixed(1)}%`}
            hint="da receita do mês"
            tone="danger"
          />
          <KpiCard
            index={5}
            icon={Percent}
            title="Percentual economizado"
            value={`${kpis.savedPct.toFixed(1)}%`}
            hint="da receita do mês"
            tone="success"
          />
          <KpiCard
            index={6}
            icon={Target}
            title={goal.name}
            value={brl(goal.saved)}
            hint={`meta ${brl(goal.target)}`}
            tone="primary"
          />
          <KpiCard
            index={7}
            icon={Target}
            title="Progresso da meta"
            value={`${goal.progress.toFixed(0)}%`}
            hint="concluído"
            tone="warning"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel
            title="Receitas x Despesas"
            description="Últimos 12 meses"
            delay={0.1}
            className="xl:col-span-2"
          >
            <FlowChart data={monthly} />
          </Panel>
          <Panel title="Distribuição por categoria" description="Mês atual" delay={0.15}>
            <CategoryDonut data={categories} />
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel
            title="Maiores categorias"
            description="Gasto acumulado no mês"
            delay={0.2}
            className="xl:col-span-2"
          >
            <CategoryBars data={categories} />
          </Panel>
          <Panel title="Meta financeira" description={goal.name} delay={0.25}>
            <GoalGauge progress={goal.progress} />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{brl(goal.saved)} acumulado</span>
              <span>{brl(goal.target)} alvo</span>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel
            title="Gastos diários"
            description="Dia a dia do mês atual"
            delay={0.3}
            className="xl:col-span-2"
          >
            <DailyBars data={daily} />
          </Panel>

          <Panel title="Insights" description="Análises automáticas" delay={0.35}>
            <ul className="flex flex-col gap-2.5">
              {insights.map((text, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.35 }}
                  className="flex gap-2.5 rounded-xl bg-surface/50 p-3 text-xs leading-relaxed text-muted-foreground transition-colors duration-200 hover:bg-surface/80 hover:text-foreground"
                >
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  <span>{text}</span>
                </motion.li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Lançamentos recentes" description="Últimos registros da base" delay={0.4}>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-2 py-2 font-medium">Data</th>
                  <th className="px-2 py-2 font-medium">Descrição</th>
                  <th className="px-2 py-2 font-medium">Categoria</th>
                  <th className="px-2 py-2 font-medium">Forma</th>
                  <th className="px-2 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-border/60 transition-colors duration-200 hover:bg-surface/40"
                  >
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {new Date(`${t.date}T00:00:00Z`).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="max-w-[220px] truncate px-2 py-2.5">{t.description}</td>
                    <td className="px-2 py-2.5 text-muted-foreground">{t.category}</td>
                    <td className="px-2 py-2.5 text-muted-foreground">{t.method}</td>
                    <td
                      className={`px-2 py-2.5 text-right font-medium ${
                        t.type === "receita" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {t.type === "receita" ? "+" : "−"}
                      {brl(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
