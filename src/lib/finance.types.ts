export type Transaction = {
  id: string;
  date: string;
  type: "receita" | "despesa";
  category: string;
  description: string;
  account: string;
  method: string;
  amount: number;
};

export type MonthlyPoint = {
  key: string;
  label: string;
  receitas: number;
  despesas: number;
  economia: number;
};

export type CategoryTotal = { name: string; total: number; share: number };

export type DailyPoint = { day: string; despesas: number; receitas: number };

export type DashboardData = {
  period: { current: string; previous: string };
  kpis: {
    balance: number;
    income: number;
    expense: number;
    savings: number;
    spentPct: number;
    savedPct: number;
    incomeChange: number;
    expenseChange: number;
    savingsChange: number;
    balanceChange: number;
  };
  goal: { name: string; target: number; saved: number; progress: number };
  monthly: MonthlyPoint[];
  categories: CategoryTotal[];
  daily: DailyPoint[];
  insights: string[];
  recent: Transaction[];
  source: string;
};
