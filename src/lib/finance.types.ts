export type PaymentStatus = "pago" | "pendente" | "parcial";

/** Tipo de despesa (substitui a antiga "categoria" nos cards/formulários). */
export type ExpenseKind = "fixa" | "variavel" | "nenhuma";

export const EXPENSE_KIND_LABEL: Record<ExpenseKind, string> = {
  fixa: "Fixa",
  variavel: "Variável",
  nenhuma: "Nenhuma",
};

export const EXPENSE_KINDS: ExpenseKind[] = ["fixa", "variavel", "nenhuma"];

export type Transaction = {
  id: string;
  /** ISO yyyy-mm-dd — pode ficar vazio quando a planilha não tem data. */
  date: string;
  type: "receita" | "despesa";
  category: string;
  /** Tipo de despesa: fixa, variável ou nenhuma. */
  expenseKind: ExpenseKind;
  /** Nome da conta (ex.: Água, Luz, Netflix). Mantém o campo `description`. */
  description: string;
  account: string;
  method: string;
  /** Data limite de pagamento (yyyy-mm-dd). Diferente de `date` (lançamento). */
  dueDate: string;
  /** Sempre positivo. Pode ser 0 quando não informado. */
  amount: number;
  notes: string;
  /** Informações complementares (aba Detalhamento) */
  details: string;
  history: string;
  links: string;
  comments: string;
  /** Controle de pagamento */
  paidAmount: number;
  paymentDate: string;
  status: PaymentStatus;
  /** Origem */
  source: "planilha" | "manual";
  fileId: string;
  fileName: string;
  sheet: string;
  /** Colunas extras encontradas na planilha (chave = cabeçalho original) */
  extra?: Record<string, string>;
  /** Quando preenchido (ISO), o registro está na lixeira e pode ser restaurado. */
  deletedAt?: string;

};

export type NewTransaction = Omit<
  Transaction,
  "id" | "fileId" | "fileName" | "sheet" | "source" | "status"
> & { status?: PaymentStatus };

export function paymentStatusOf(amount: number, paid: number): PaymentStatus {
  if (amount <= 0) return paid > 0 ? "pago" : "pendente";
  if (paid <= 0) return "pendente";
  if (paid + 0.005 >= amount) return "pago";
  return "parcial";
}


export function remainingOf(t: Transaction) {
  return Math.max(0, Number((t.amount - t.paidAmount).toFixed(2)));
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  pago: "Pago",
  pendente: "Pendente",
  parcial: "Parcial",
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

export type AppSettings = {
  appName: string;
  tagline: string;
  greeting: string;
  currency: string;
  locale: string;
  accent: "azul" | "violeta" | "esmeralda" | "ambar" | "rosa";
  density: "confortavel" | "compacta";
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyNote: string;
  labels: {
    dashboard: string;
    contas: string;
    relatorios: string;
    metas: string;
  };
  showInsights: boolean;
  showGoal: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "PINA Finanças",
  tagline: "Controle pessoal",
  greeting: "Olá",
  currency: "BRL",
  locale: "pt-BR",
  accent: "azul",
  density: "confortavel",
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyNote: "",
  labels: {
    dashboard: "Dashboard",
    contas: "Contas",
    relatorios: "Relatórios",
    metas: "Metas",
  },
  showInsights: true,
  showGoal: true,
};

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

/** Preferência de exibição de um card do dashboard personalizável. */
export type DashboardCardPref = { id: string; visible: boolean; size: "pequeno" | "medio" | "grande" };

export const DASHBOARD_CARDS: { id: string; label: string; defaultSize: DashboardCardPref["size"] }[] = [
  { id: "kpi-saldo", label: "Saldo acumulado", defaultSize: "pequeno" },
  { id: "kpi-receitas", label: "Receitas do mês", defaultSize: "pequeno" },
  { id: "kpi-despesas", label: "Despesas do mês", defaultSize: "pequeno" },
  { id: "kpi-economia", label: "Economia do mês", defaultSize: "pequeno" },
  { id: "kpi-pendente", label: "Total pendente", defaultSize: "pequeno" },
  { id: "kpi-pago", label: "Total pago", defaultSize: "pequeno" },
  { id: "fluxo", label: "Receitas x Despesas", defaultSize: "grande" },
  { id: "despesa-tipo", label: "Despesas por tipo (fixa/variável)", defaultSize: "medio" },
  { id: "diario", label: "Gastos diários", defaultSize: "grande" },
  { id: "vencimentos", label: "Próximos vencimentos", defaultSize: "medio" },
  { id: "meta", label: "Meta financeira", defaultSize: "medio" },
  { id: "insights", label: "Insights", defaultSize: "medio" },
];

export const DEFAULT_DASHBOARD_LAYOUT: DashboardCardPref[] = DASHBOARD_CARDS.map((c) => ({
  id: c.id,
  visible: true,
  size: c.defaultSize,
}));
