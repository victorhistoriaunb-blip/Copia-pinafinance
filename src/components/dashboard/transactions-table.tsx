import type { Transaction } from "@/lib/finance.types";
import { brl2 } from "@/lib/analytics";

export function TransactionsTable({ rows, limit }: { rows: Transaction[]; limit?: number }) {
  const list = limit ? rows.slice(0, limit) : rows;
  if (list.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum lançamento neste período.</p>;
  }
  return (
    <div className="-mx-2 max-h-[520px] overflow-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-2 py-2 font-medium">Data</th>
            <th className="px-2 py-2 font-medium">Descrição</th>
            <th className="px-2 py-2 font-medium">Categoria</th>
            <th className="px-2 py-2 font-medium">Conta</th>
            <th className="px-2 py-2 text-right font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {list.map((t) => (
            <tr key={t.id} className="border-t border-border/60 transition-colors duration-200 hover:bg-surface/40">
              <td className="px-2 py-2.5 whitespace-nowrap text-muted-foreground">
                {new Date(`${t.date}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
              </td>
              <td className="max-w-[240px] truncate px-2 py-2.5">{t.description}</td>
              <td className="px-2 py-2.5 text-muted-foreground">{t.category}</td>
              <td className="px-2 py-2.5 text-muted-foreground">{t.account}</td>
              <td className={`px-2 py-2.5 text-right font-medium ${t.type === "receita" ? "text-success" : "text-destructive"}`}>
                {t.type === "receita" ? "+" : "−"}
                {brl2(t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
