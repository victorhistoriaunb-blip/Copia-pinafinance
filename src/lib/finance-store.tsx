import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { idbGet, idbSet } from "./idb";
import { parseFile } from "./xlsx-parse";
import type { Goal, ImportedWorkbook, Transaction } from "./finance.types";

const FILES_KEY = "workbooks";
const GOAL_KEY = "goal";

const DEFAULT_GOAL: Goal = { name: "Reserva de emergência", target: 30000 };

type Ctx = {
  ready: boolean;
  files: ImportedWorkbook[];
  transactions: Transaction[];
  goal: Goal;
  importFiles: (files: File[]) => Promise<{ name: string; error?: string }[]>;
  removeFile: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  saveGoal: (goal: Goal) => Promise<void>;
};

const FinanceContext = createContext<Ctx | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [files, setFiles] = useState<ImportedWorkbook[]>([]);
  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [stored, storedGoal] = await Promise.all([
          idbGet<ImportedWorkbook[]>(FILES_KEY),
          idbGet<Goal>(GOAL_KEY),
        ]);
        if (!alive) return;
        if (stored) setFiles(stored);
        if (storedGoal) setGoal(storedGoal);
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

  const persist = useCallback(async (next: ImportedWorkbook[]) => {
    setFiles(next);
    await idbSet(FILES_KEY, next);
  }, []);

  const importFiles = useCallback<Ctx["importFiles"]>(
    async (incoming) => {
      const results: { name: string; error?: string }[] = [];
      let next = [...files];
      for (const file of incoming) {
        if (!/\.(xlsx|xls|xlsm|csv)$/i.test(file.name)) {
          results.push({ name: file.name, error: "Formato não suportado. Use .xlsx ou .xls." });
          continue;
        }
        try {
          const workbook = await parseFile(file);
          next = [workbook, ...next.filter((f) => f.id !== workbook.id)];
          results.push({ name: file.name });
        } catch {
          results.push({ name: file.name, error: "Não foi possível ler o arquivo. Ele pode estar corrompido ou protegido." });
        }
      }
      await persist(next);
      return results;
    },
    [files, persist],
  );

  const removeFile = useCallback(
    async (id: string) => {
      await persist(files.filter((f) => f.id !== id));
    },
    [files, persist],
  );

  const clearAll = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const saveGoal = useCallback(async (next: Goal) => {
    setGoal(next);
    await idbSet(GOAL_KEY, next);
  }, []);

  const transactions = useMemo(
    () => files.flatMap((f) => f.transactions).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [files],
  );

  const value = useMemo(
    () => ({ ready, files, transactions, goal, importFiles, removeFile, clearAll, saveGoal }),
    [ready, files, transactions, goal, importFiles, removeFile, clearAll, saveGoal],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance precisa estar dentro de FinanceProvider");
  return ctx;
}
