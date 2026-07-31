/**
 * Camada de dados. Hoje gera uma base determinística com o mesmo formato
 * que as linhas virão do Google Sheets (data, tipo, categoria, descrição,
 * conta, forma de pagamento, valor). Ao plugar o conector do Google Sheets,
 * basta substituir `loadTransactions()` pela leitura da planilha.
 */

import type { DashboardData, Transaction } from "./finance.types";

export type { Transaction };

export const EXPENSE_CATEGORIES = [
  "Supermercado",
  "Ração",
  "Farmácia",
  "Combustível",
  "Streaming",
  "Internet",
  "Aluguel",
  "Energia",
  "Água",
  "Lazer",
  "Saúde",
  "Pets",
  "Educação",
  "Outros",
] as const;

const CATEGORY_WEIGHT: Record<string, number> = {
  Aluguel: 1800,
  Supermercado: 1200,
  Combustível: 480,
  Energia: 260,
  Internet: 130,
  Água: 90,
  Streaming: 75,
  Ração: 210,
  Farmácia: 160,
  Lazer: 420,
  Saúde: 280,
  Pets: 150,
  Educação: 340,
  Outros: 220,
};

const ACCOUNTS = ["Conta Corrente", "Carteira Digital", "Poupança"];
const METHODS = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Dinheiro"];

// PRNG determinístico (mulberry32) — mesma base em toda renderização.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function loadTransactions(monthsBack = 18): Transaction[] {
  const random = rng(20260731);
  const out: Transaction[] = [];
  const now = new Date();
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  for (let m = monthsBack - 1; m >= 0; m--) {
    const base = new Date(cursor);
    base.setUTCMonth(base.getUTCMonth() - m);
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const isCurrent = m === 0;
    const lastDay = isCurrent ? Math.min(now.getUTCDate(), daysInMonth) : daysInMonth;

    // Receitas
    out.push({
      id: `${year}-${month}-salario`,
      date: iso(new Date(Date.UTC(year, month, Math.min(5, lastDay)))),
      type: "receita",
      category: "Salário",
      description: "Salário mensal",
      account: "Conta Corrente",
      method: "Pix",
      amount: 9800 + Math.round(random() * 400),
    });
    if (random() > 0.45) {
      out.push({
        id: `${year}-${month}-extra`,
        date: iso(new Date(Date.UTC(year, month, Math.min(18, lastDay)))),
        type: "receita",
        category: "Freelance",
        description: "Projeto extra",
        account: "Carteira Digital",
        method: "Pix",
        amount: 700 + Math.round(random() * 2200),
      });
    }

    // Despesas
    for (const category of EXPENSE_CATEGORIES) {
      const weight = CATEGORY_WEIGHT[category] ?? 200;
      const drift = 1 + (monthsBack - m) * 0.006 * (category === "Combustível" ? 3 : 1);
      const count = category === "Aluguel" ? 1 : 2 + Math.floor(random() * 4);
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(random() * lastDay);
        const value = ((weight / count) * (0.7 + random() * 0.6) * drift) as number;
        out.push({
          id: `${year}-${month}-${category}-${i}`,
          date: iso(new Date(Date.UTC(year, month, Math.min(day, lastDay)))),
          type: "despesa",
          category,
          description: `${category} · ${["compra", "assinatura", "pagamento", "recarga"][Math.floor(random() * 4)]}`,
          account: ACCOUNTS[Math.floor(random() * ACCOUNTS.length)],
          method: METHODS[Math.floor(random() * METHODS.length)],
          amount: Math.round(value * 100) / 100,
        });
      }
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const monthKey = (d: string) => d.slice(0, 7);
const sum = (rows: Transaction[]) => rows.reduce((t, r) => t + r.amount, 0);
const pct = (curr: number, prev: number) => (prev === 0 ? 0 : ((curr - prev) / prev) * 100);

const MONTH_LABELS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function buildDashboard(): DashboardData {
  const tx = loadTransactions();
  const now = new Date();
  const current = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const previous = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const inMonth = (key: string, type: Transaction["type"]) =>
    tx.filter((t) => monthKey(t.date) === key && t.type === type);

  const income = sum(inMonth(current, "receita"));
  const expense = sum(inMonth(current, "despesa"));
  const prevIncome = sum(inMonth(previous, "receita"));
  const prevExpense = sum(inMonth(previous, "despesa"));
  const savings = income - expense;
  const prevSavings = prevIncome - prevExpense;
  const balance = sum(tx.filter((t) => t.type === "receita")) - sum(tx.filter((t) => t.type === "despesa"));

  // Série mensal (12 meses)
  const keys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const monthly = keys.map((k) => {
    const rec = sum(inMonth(k, "receita"));
    const desp = sum(inMonth(k, "despesa"));
    return {
      key: k,
      label: MONTH_LABELS[Number(k.slice(5, 7)) - 1],
      receitas: Math.round(rec),
      despesas: Math.round(desp),
      economia: Math.round(rec - desp),
    };
  });

  // Categorias do mês atual
  const byCategory = new Map<string, number>();
  for (const t of inMonth(current, "despesa")) {
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
  }
  const categories = [...byCategory.entries()]
    .map(([name, total]) => ({
      name,
      total: Math.round(total),
      share: expense === 0 ? 0 : (total / expense) * 100,
    }))
    .sort((a, b) => b.total - a.total);

  // Fluxo diário do mês atual (acumulado) para sparklines / área
  const daily: { day: string; despesas: number; receitas: number }[] = [];
  const lastDay = now.getUTCDate();
  for (let d = 1; d <= lastDay; d++) {
    const key = `${current}-${String(d).padStart(2, "0")}`;
    const rows = tx.filter((t) => t.date === key);
    daily.push({
      day: String(d).padStart(2, "0"),
      despesas: Math.round(sum(rows.filter((r) => r.type === "despesa"))),
      receitas: Math.round(sum(rows.filter((r) => r.type === "receita"))),
    });
  }

  const goal = { name: "Reserva de emergência", target: 30000, saved: Math.round(Math.min(Math.max(balance * 0.62, 0), 30000 * 0.78)) };

  const biggest = inMonth(current, "despesa").sort((a, b) => b.amount - a.amount)[0];
  const topCategory = categories[0];
  const growth = categories
    .map((c) => {
      const prevTotal = sum(inMonth(previous, "despesa").filter((t) => t.category === c.name));
      return { name: c.name, change: pct(c.total, prevTotal) };
    })
    .sort((a, b) => b.change - a.change);

  const insights = [
    expense < prevExpense
      ? `Você gastou ${Math.abs(pct(expense, prevExpense)).toFixed(0)}% menos que no mês passado.`
      : `Seus gastos subiram ${pct(expense, prevExpense).toFixed(0)}% em relação ao mês passado.`,
    topCategory ? `${topCategory.name} representa ${topCategory.share.toFixed(0)}% dos gastos do mês.` : "",
    growth[0] ? `${growth[0].name} foi a categoria que mais cresceu (${growth[0].change.toFixed(0)}%).` : "",
    growth[growth.length - 1]
      ? `${growth[growth.length - 1].name} teve redução de ${Math.abs(growth[growth.length - 1].change).toFixed(0)}%.`
      : "",
    biggest ? `Seu maior gasto do mês foi ${biggest.description} (R$ ${biggest.amount.toFixed(2)}).` : "",
    `Economia acumulada de R$ ${Math.round(monthly.reduce((t, m) => t + m.economia, 0)).toLocaleString("pt-BR")} nos últimos 12 meses.`,
  ].filter(Boolean);

  return {
    period: { current, previous },
    kpis: {
      balance: Math.round(balance),
      income: Math.round(income),
      expense: Math.round(expense),
      savings: Math.round(savings),
      spentPct: income === 0 ? 0 : (expense / income) * 100,
      savedPct: income === 0 ? 0 : (savings / income) * 100,
      incomeChange: pct(income, prevIncome),
      expenseChange: pct(expense, prevExpense),
      savingsChange: pct(savings, prevSavings),
      balanceChange: pct(balance, balance - savings),
    },
    goal: { ...goal, progress: Math.min((goal.saved / goal.target) * 100, 100) },
    monthly,
    categories,
    daily,
    insights,
    recent: tx.slice(0, 8),
    source: "Base de exemplo (Google Sheets conecta na próxima etapa)",
  };
}
