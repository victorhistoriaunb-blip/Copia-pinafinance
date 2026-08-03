import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "@/lib/finance.types";
import { remainingOf } from "@/lib/finance.types";
import { brl2 } from "@/lib/analytics";
import { useFinance } from "@/lib/finance-store";
import { RecordDialog } from "./record-form";
import { StatusBadge } from "./status-badge";

export function TransactionsTable({
  rows,
  limit,
  editable = true,
}: {
  rows: Transaction[];
  limit?: number;
  editable?: boolean;
}) {
  const { deleteRecord } = useFinance();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const list = limit ? rows.slice(0, limit) : rows;

  if (list.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro neste período.</p>;
  }

  return (
    <div className="-mx-2 max-h-[520px] overflow-auto">
      {editing && <RecordDialog record={editing} onClose={() => setEditing(null)} />}
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-2 py-2 font-semibold">Data</th>
            <th className="px-2 py-2 font-semibold">Descrição</th>
            <th className="px-2 py-2 font-semibold">Categoria</th>
            <th className="px-2 py-2 font-semibold">Situação</th>
            <th className="px-2 py-2 text-right font-semibold">Restante</th>
            <th className="px-2 py-2 text-right font-semibold">Valor</th>
            {editable && <th className="px-2 py-2 text-right font-semibold">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {list.map((t) => (
            <tr key={t.id} className="border-t border-border/60 transition-colors duration-200 hover:bg-surface/60">
              <td className="px-2 py-2.5 whitespace-nowrap text-muted-foreground">
                {t.date
                  ? new Date(`${t.date}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                  : "—"}
              </td>
              <td className="max-w-[240px] truncate px-2 py-2.5 text-foreground">{t.description}</td>
              <td className="px-2 py-2.5 text-muted-foreground">{t.category || "—"}</td>
              <td className="px-2 py-2.5">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-2 py-2.5 text-right text-muted-foreground">{brl2(remainingOf(t))}</td>
              <td
                className={`px-2 py-2.5 text-right font-semibold ${
                  t.type === "receita" ? "text-success" : "text-destructive"
                }`}
              >
                {t.type === "receita" ? "+" : "−"}
                {brl2(t.amount)}
              </td>
              {editable && (
                <td className="px-2 py-2.5">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      aria-label={`Editar ${t.description}`}
                      className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteRecord(t.id)}
                      aria-label={`Excluir ${t.description}`}
                      className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
