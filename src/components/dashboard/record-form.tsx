import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { paymentStatusOf, type Transaction } from "@/lib/finance.types";

const field =
  "w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-ring/30";
const labelCls = "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase";

type FormState = {
  description: string;
  amount: string;
  date: string;
  type: "receita" | "despesa";
  category: string;
  account: string;
  method: string;
  paidAmount: string;
  paymentDate: string;
  notes: string;
};

function toForm(record?: Transaction | null): FormState {
  return {
    description: record?.description ?? "",
    amount: record?.amount ? String(record.amount) : "",
    date: record?.date ?? "",
    type: record?.type ?? "despesa",
    category: record?.category ?? "",
    account: record?.account ?? "",
    method: record?.method ?? "",
    paidAmount: record?.paidAmount ? String(record.paidAmount) : "",
    paymentDate: record?.paymentDate ?? "",
    notes: record?.notes ?? "",
  };
}

const num = (v: string) => {
  const n = Number(String(v).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.abs(n) : 0;
};

/**
 * Formulário de criação/edição de registros. Nenhum campo é obrigatório além
 * de um nome — o app funciona mesmo com informações parciais.
 */
export function RecordDialog({
  record,
  onClose,
}: {
  record?: Transaction | null;
  onClose: () => void;
}) {
  const { addRecord, updateRecord } = useFinance();
  const [form, setForm] = useState<FormState>(() => toForm(record));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const amount = num(form.amount);
  const paid = Math.min(num(form.paidAmount), amount || num(form.paidAmount));
  const remaining = Math.max(0, amount - paid);
  const status = paymentStatusOf(amount, paid);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("Informe pelo menos um nome/descrição para o registro.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      description: form.description.trim(),
      amount,
      date: form.date,
      type: form.type,
      category: form.category.trim(),
      account: form.account.trim(),
      method: form.method.trim(),
      paidAmount: paid,
      paymentDate: form.paymentDate,
      notes: form.notes.trim(),
    };
    try {
      if (record) await updateRecord(record.id, payload);
      else await addRecord({ ...payload, status });
      onClose();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:items-center">
      <motion.form
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={submit}
        className="panel my-auto w-full max-w-2xl p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {record ? "Editar registro" : "Novo registro"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Preencha apenas o que fizer sentido para o seu controle.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelCls}>Nome / Descrição</span>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={160}
              placeholder="Ex.: Conta de luz, Salário, Cliente X"
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Valor</span>
            <input
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Data</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Tipo</span>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value as FormState["type"])}
              className={field}
            >
              <option value="despesa">Despesa / Saída</option>
              <option value="receita">Receita / Entrada</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Categoria</span>
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              maxLength={80}
              placeholder="Ex.: Moradia"
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Conta / Fornecedor</span>
            <input
              value={form.account}
              onChange={(e) => set("account", e.target.value)}
              maxLength={80}
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Forma de pagamento</span>
            <input
              value={form.method}
              onChange={(e) => set("method", e.target.value)}
              maxLength={80}
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Valor pago</span>
            <input
              value={form.paidAmount}
              onChange={(e) => set("paidAmount", e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Data do pagamento</span>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => set("paymentDate", e.target.value)}
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelCls}>Observações</span>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              maxLength={600}
              className={`${field} resize-y`}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3 text-xs">
          <span className="text-muted-foreground">
            Restante:{" "}
            <strong className="text-foreground">
              {remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </strong>
          </span>
          <span className="text-muted-foreground">
            Situação: <strong className="text-foreground capitalize">{status}</strong>
          </span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => set("paidAmount", String(amount))}
              className="rounded-lg border border-border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Marcar como pago
            </button>
            <button
              type="button"
              onClick={() => set("paidAmount", "")}
              className="rounded-lg border border-border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Marcar como pendente
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-70"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Salvar registro
          </button>
        </div>
      </motion.form>
    </div>
  );
}
