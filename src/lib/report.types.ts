/** Estrutura neutra que representa o estado atual de uma tela para exportação. */
export type ReportKpi = { label: string; value: string; hint?: string };

export type ReportChart = {
  title: string;
  type: "bar" | "line" | "pie";
  labels: string[];
  series: { name: string; values: number[] }[];
};

export type ReportTable = {
  title: string;
  columns: string[];
  rows: (string | number)[][];
};

export type ReportSnapshot = {
  /** Título do documento (normalmente o nome da tela). */
  title: string;
  subtitle?: string;
  /** Filtros aplicados no momento da exportação. */
  filters: { label: string; value: string }[];
  kpis: ReportKpi[];
  charts: ReportChart[];
  tables: ReportTable[];
  notes?: string[];
  /** Identidade visual usada no cabeçalho/rodapé. */
  brand: {
    appName: string;
    tagline?: string;
    company?: string;
    email?: string;
    phone?: string;
    logoUrl?: string;
  };
};

export const AUTHOR_CREDIT = "Criado por Victor Souza de Aguiar.";
