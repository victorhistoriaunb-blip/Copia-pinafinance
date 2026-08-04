import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { idbGet, idbSet } from "./idb";
import { parseFile } from "./xlsx-parse";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  DEFAULT_SETTINGS,
  paymentStatusOf,
  type AppSettings,
  type DashboardCardPref,
  type Goal,
  type ImportedWorkbook,
  type NewTransaction,
  type Transaction,
} from "./finance.types";

const FILES_KEY = "workbooks";
const RECORDS_KEY = "records";
const GOAL_KEY = "goal";
const SETTINGS_KEY = "settings";
const LAYOUT_KEY = "dashboard-layout";

const DEFAULT_GOAL: Goal = { name: "Reserva de emergência", target: 30000 };

type Ctx = {
  ready: boolean;
  files: ImportedWorkbook[];
  transactions: Transaction[];
  goal: Goal;
  settings: AppSettings;
  layout: DashboardCardPref[];
  importFiles: (files: File[]) => Promise<{ name: string; error?: string }[]>;
  removeFile: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  saveGoal: (goal: Goal) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  saveLayout: (layout: DashboardCardPref[]) => Promise<void>;
  addRecord: (data: NewTransaction) => Promise<Transaction>;
  addRecords: (list: NewTransaction[]) => Promise<void>;
  updateRecord: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
};


const FinanceContext = createContext<Ctx | null>(null);

/** Garante que registros antigos (versões anteriores) ganhem os novos campos. */
function normalizeRecord(t: Partial<Transaction> & { id: string }): Transaction {
  const amount = Number(t.amount ?? 0);
  const paidAmount = Number(t.paidAmount ?? 0);
  const kind = t.expenseKind;
  return {
    id: t.id,
    date: t.date ?? "",
    type: t.type === "receita" ? "receita" : "despesa",
    category: t.category ?? "",
    expenseKind: kind === "fixa" || kind === "variavel" ? kind : "nenhuma",
    
    description: t.description ?? "",
    account: t.account ?? "",
    method: t.method ?? "",
    dueDate: t.dueDate ?? "",
    amount,
    notes: t.notes ?? "",
    details: t.details ?? "",
    history: t.history ?? "",
    links: t.links ?? "",
    comments: t.comments ?? "",
    paidAmount,
    paymentDate: t.paymentDate ?? "",
    status: t.status ?? paymentStatusOf(amount, paidAmount),
    source: t.source ?? (t.fileId ? "planilha" : "manual"),
    fileId: t.fileId ?? "",
    fileName: t.fileName ?? "",
    sheet: t.sheet ?? "",
    ...(t.extra ? { extra: t.extra } : {}),
  };
}


export function FinanceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [files, setFiles] = useState<ImportedWorkbook[]>([]);
  const [records, setRecords] = useState<Transaction[]>([]);
  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [layout, setLayout] = useState<DashboardCardPref[]>(DEFAULT_DASHBOARD_LAYOUT);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [storedFiles, storedRecords, storedGoal, storedSettings, storedLayout] =
          await Promise.all([
            idbGet<ImportedWorkbook[]>(FILES_KEY),
            idbGet<Transaction[]>(RECORDS_KEY),
            idbGet<Goal>(GOAL_KEY),
            idbGet<Partial<AppSettings>>(SETTINGS_KEY),
            idbGet<DashboardCardPref[]>(LAYOUT_KEY),
          ]);
        if (!alive) return;
        if (storedFiles) setFiles(storedFiles);
        if (storedRecords) {
          setRecords(storedRecords.map(normalizeRecord));
        } else if (storedFiles) {
          // Migração das versões anteriores: registros vinham dentro dos arquivos.
          const migrated = storedFiles.flatMap((f) => f.transactions.map(normalizeRecord));
          setRecords(migrated);
          if (migrated.length > 0) await idbSet(RECORDS_KEY, migrated);
        }
        if (storedGoal) setGoal(storedGoal);
        if (storedLayout && storedLayout.length > 0) {
          const known = new Map(storedLayout.map((c) => [c.id, c]));
          setLayout([
            ...storedLayout.filter((c) => DEFAULT_DASHBOARD_LAYOUT.some((d) => d.id === c.id)),
            ...DEFAULT_DASHBOARD_LAYOUT.filter((d) => !known.has(d.id)),
          ]);
        }
        if (storedSettings)
          setSettings({
            ...DEFAULT_SETTINGS,
            ...storedSettings,
            labels: { ...DEFAULT_SETTINGS.labels, ...(storedSettings.labels ?? {}) },
          });

      } catch {
        /* armazenamento indisponível */
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persistRecords = useCallback(async (next: Transaction[]) => {
    setRecords(next);
    await idbSet(RECORDS_KEY, next);
  }, []);

  const persistFiles = useCallback(async (next: ImportedWorkbook[]) => {
    setFiles(next);
    await idbSet(FILES_KEY, next);
  }, []);

  const importFiles = useCallback<Ctx["importFiles"]>(
    async (incoming) => {
      const results: { name: string; error?: string }[] = [];
      let nextFiles = [...files];
      let nextRecords = [...records];
      for (const file of incoming) {
        if (!/\.(xlsx|xls|xlsm|csv)$/i.test(file.name)) {
          results.push({ name: file.name, error: "Formato não suportado. Use .xlsx ou .xls." });
          continue;
        }
        try {
          const workbook = await parseFile(file);
          nextFiles = [workbook, ...nextFiles.filter((f) => f.id !== workbook.id)];
          nextRecords = [
            ...workbook.transactions,
            ...nextRecords.filter((r) => r.fileId !== workbook.id),
          ];
          results.push({ name: file.name });
        } catch {
          results.push({
            name: file.name,
            error: "Não foi possível ler o arquivo. Ele pode estar corrompido ou protegido.",
          });
        }
      }
      await persistFiles(nextFiles);
      await persistRecords(nextRecords);
      return results;
    },
    [files, records, persistFiles, persistRecords],
  );

  const removeFile = useCallback(
    async (id: string) => {
      await persistFiles(files.filter((f) => f.id !== id));
      await persistRecords(records.filter((r) => r.fileId !== id));
    },
    [files, records, persistFiles, persistRecords],
  );

  const clearAll = useCallback(async () => {
    await persistFiles([]);
    await persistRecords(records.filter((r) => r.source === "manual"));
  }, [records, persistFiles, persistRecords]);

  const saveGoal = useCallback(async (next: Goal) => {
    setGoal(next);
    await idbSet(GOAL_KEY, next);
  }, []);

  const saveSettings = useCallback(async (next: AppSettings) => {
    setSettings(next);
    await idbSet(SETTINGS_KEY, next);
  }, []);

  const saveLayout = useCallback<Ctx["saveLayout"]>(async (next) => {
    setLayout(next);
    await idbSet(LAYOUT_KEY, next);
  }, []);

  const addRecord = useCallback<Ctx["addRecord"]>(
    async (data) => {
      const record = normalizeRecord({
        ...data,
        id: `manual:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        source: "manual",
        status: paymentStatusOf(data.amount, data.paidAmount),
      });
      await persistRecords([record, ...records]);
      return record;
    },
    [records, persistRecords],
  );

  const addRecords = useCallback<Ctx["addRecords"]>(
    async (list) => {
      const created = list.map((data, i) =>
        normalizeRecord({
          ...data,
          id: `manual:${Date.now()}:${i}:${Math.random().toString(36).slice(2, 8)}`,
          source: "manual",
          status: paymentStatusOf(data.amount, data.paidAmount),
        }),
      );
      await persistRecords([...created, ...records]);
    },
    [records, persistRecords],
  );

  const updateRecord = useCallback<Ctx["updateRecord"]>(
    async (id, data) => {
      const next = records.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...data };
        return normalizeRecord({
          ...merged,
          status: paymentStatusOf(merged.amount, merged.paidAmount),
        });
      });
      await persistRecords(next);
    },
    [records, persistRecords],
  );

  const deleteRecord = useCallback<Ctx["deleteRecord"]>(
    async (id) => {
      await persistRecords(records.filter((r) => r.id !== id));
    },
    [records, persistRecords],
  );

  const transactions = useMemo(
    () => [...records].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [records],
  );

  const value = useMemo(
    () => ({
      ready,
      files,
      transactions,
      goal,
      settings,
      layout,
      importFiles,
      removeFile,
      clearAll,
      saveGoal,
      saveSettings,
      saveLayout,
      addRecord,
      addRecords,
      updateRecord,
      deleteRecord,
    }),
    [
      ready,
      files,
      transactions,
      goal,
      settings,
      layout,
      importFiles,
      removeFile,
      clearAll,
      saveGoal,
      saveSettings,
      saveLayout,
      addRecord,
      addRecords,
      updateRecord,
      deleteRecord,
    ],
  );


  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance precisa estar dentro de FinanceProvider");
  return ctx;
}
