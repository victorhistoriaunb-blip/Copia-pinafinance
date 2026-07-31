export type Transaction = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  type: "receita" | "despesa";
  category: string;
  description: string;
  account: string;
  method: string;
  amount: number; // sempre positivo
  fileId: string;
  fileName: string;
  sheet: string;
};

export type ImportIssue = {
  level: "erro" | "aviso";
  sheet: string;
  message: string;
  count?: number;
};

export type SheetSummary = {
  name: string;
  rows: number;
  imported: number;
  skipped: number;
  columns: string[];
};

export type ImportedWorkbook = {
  id: string;
  name: string;
  size: number;
  importedAt: string;
  sheets: SheetSummary[];
  issues: ImportIssue[];
  transactions: Transaction[];
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

export type Goal = { name: string; target: number };

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
