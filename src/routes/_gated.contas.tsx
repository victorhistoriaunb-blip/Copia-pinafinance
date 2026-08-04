import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronDown, Copy, CopyCheck, Pencil, Trash2, X } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import {
  EXPENSE_KINDS,
  EXPENSE_KIND_LABEL,
  STATUS_LABEL,
  remainingOf,
  type ExpenseKind,
  type PaymentStatus,
  type Transaction,
} from "@/lib/finance.types";
import { availableMonths, brl2, fullMonthLabel, monthKey, shiftMonth } from "@/lib/analytics";
import { Page, Select, NewRecordButton } from "@/components/dashboard/page";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RecordDialog } from "@/components/dashboard/record-form";
import { paidFromStatus } from "@/components/dashboard/transactions-table";
import {
  InlineDate,
  InlineMoney,
  InlineSelect,
  InlineText,
} from "@/components/dashboard/inline-fields";

export const Route = createFileRoute("/_gated/contas")({
  head: () => ({
    meta: [
      { title: "Contas · PINA Finanças" },
      {
        name: "description",
        content:
          "Acompanhe suas contas em cards com edição rápida, situação de pagamento, vencimento e replicação entre meses.",
      },
      { property: "og:title", content: "Contas · PINA Finanças" },
      {
        property: "og:description",
        content: "Cards de contas com edição rápida e replicação entre meses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContasPage,
});

const KIND_OPTIONS = EXPENSE_KINDS.map((k) => ({ value: k, label: EXPENSE_KIND_LABEL[k] }));
const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as PaymentStatus[]).map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
}));

const fmtDate = (v: string) =>
  v ? new Date(`${v}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";

function textOf(t: Transaction) {
  return [
    `Conta: ${t.description}`,
    `Data: ${fmtDate(t.date)}`,
    `Despesa: ${EXPENSE_KIND_LABEL[t.expenseKind]}`,
    `Vencimento: ${fmtDate(t.dueDate)}`,
    `Situação: ${STATUS_LABEL[t.status]}`,
    `Valor: ${brl2(t.amount)}`,
    `Pago: ${brl2(t.paidAmount)} · Restante: ${brl2(remainingOf(t))}`,
    t.notes ? `Observações: ${t.notes}` : "",
    t.details ? `Detalhamento: ${t.details}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const labelCls = "text-[10px] font-semibold tracking-wide text-muted-foreground uppercase";

function AccountCard({
  t,
  selected,
  onSelect,
  onEdit,
}: {
  t: Transaction;
  selected: boolean;
  onSelect: (v: boolean) => void;
  onEdit: () => void;
}) {
  const { updateRecord, deleteRecord } = useFinance();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const up = (data: Partial<Transaction>) => void updateRecord(t.id, data);

  async function copy() {
    try {
      await navigator.clipboard.writeText(textOf(t));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`panel panel-hover flex flex-col gap-3 p-4 ${selected ? "ring-2 ring-primary/50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          aria-label={`Selecionar ${t.description}`}
          className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
        />
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <div className="min-w-0">
            <p className={labelCls}>Data</p>
            <div className="text-sm text-foreground">
              <InlineDate label="data" value={t.date} onSave={(v) => up({ date: v })} />
            </div>
          </div>
          <div className="min-w-0">
            <p className={labelCls}>Conta</p>
            <div className="truncate text-sm font-semibold text-foreground">
              <InlineText
                label="conta"
                value={t.description}
                onSave={(v) => up({ description: v })}
                placeholder="Nome da conta"
              />
            </div>
          </div>
          <div className="min-w-0">
            <p className={labelCls}>Despesa</p>
            <div className="text-sm text-foreground">
              <InlineSelect
                label="despesa"
                value={t.expenseKind}
                options={KIND_OPTIONS}
                onSave={(v) => up({ expenseKind: v as ExpenseKind })}
              />
            </div>
          </div>
          <div className="min-w-0">
            <p className={labelCls}>Vencimento</p>
            <div className="text-sm text-foreground">
              <InlineDate label="vencimento" value={t.dueDate} onSave={(v) => up({ dueDate: v })} />
            </div>
          </div>
          <div className="min-w-0">
            <p className={labelCls}>Situação</p>
            <div className="text-sm">
              <InlineSelect
                label="situação"
                value={t.status}
                options={STATUS_OPTIONS}
                onSave={(v) => up(paidFromStatus(v as PaymentStatus, t))}
              >
                <StatusBadge status={t.status} />
              </InlineSelect>
            </div>
          </div>
          <div className="min-w-0">
            <p className={labelCls}>Valor</p>
            <div
              className={`text-sm font-semibold ${t.type === "receita" ? "text-success" : "text-foreground"}`}
            >
              <InlineMoney label="valor" value={t.amount} onSave={(v) => up({ amount: v })} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onEdit}
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
      </div>

      <div className="flex items-center gap-2 border-t border-border/60 pt-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          Detalhamento
        </button>
        <button
          type="button"
          onClick={() => void copy()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          {copied ? <CopyCheck className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          {copied ? "Copiado" : "Copiar informações"}
        </button>
      </div>

      {open && (
        <div className="grid gap-2 rounded-xl bg-surface/50 p-3 text-[11px] text-muted-foreground">
          <p>
            Pago: <strong className="text-foreground">{brl2(t.paidAmount)}</strong> · Restante:{" "}
            <strong className="text-foreground">{brl2(remainingOf(t))}</strong> · Pagamento em{" "}
            {fmtDate(t.paymentDate)}
          </p>
          {t.notes && <p>Observações: {t.notes}</p>}
          {t.details && <p>Informações adicionais: {t.details}</p>}
          {t.history && <p>Histórico: {t.history}</p>}
          {t.comments && <p>Comentários: {t.comments}</p>}
          {t.links && <p className="truncate">Links: {t.links}</p>}
          {(t.account || t.method) && (
            <p>
              {t.account && `Conta bancária: ${t.account}`} {t.method && `· Forma: ${t.method}`}
            </p>
          )}
          {t.source === "planilha" && <p>Origem: {t.fileName} · aba {t.sheet}</p>}
          {!t.notes && !t.details && !t.history && !t.comments && !t.links && (
            <p>Sem informações complementares — use a caneta para preencher a aba Detalhamento.</p>
          )}
        </div>
      )}
    </motion.article>
  );
}

type Draft = {
  sourceId: string;
  description: string;
  amount: number;
  expenseKind: ExpenseKind;
  dueDate: string;
  date: string;
};

function ReplicateDialog({
  rows,
  months,
  onClose,
}: {
  rows: Transaction[];
  months: string[];
  onClose: (done: boolean) => void;
}) {
  const { addRecords } = useFinance();
  const base = rows[0]?.date?.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const options = useMemo(() => {
    const set = new Set<string>(months);
    for (let i = -2; i <= 12; i++) set.add(shiftMonth(base, i));
    return [...set].sort();
  }, [months, base]);

  const [target, setTarget] = useState(shiftMonth(base, 1));
  const [step, setStep] = useState<"mes" | "revisao">("mes");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);

  function toReview() {
    const moved = (iso: string) => {
      if (!iso) return "";
      const day = iso.slice(8, 10);
      const last = new Date(Date.UTC(Number(target.slice(0, 4)), Number(target.slice(5, 7)), 0)).getUTCDate();
      return `${target}-${String(Math.min(Number(day), last)).padStart(2, "0")}`;
    };
    setDrafts(
      rows.map((t) => ({
        sourceId: t.id,
        description: t.description,
        amount: t.amount,
        expenseKind: t.expenseKind,
        dueDate: moved(t.dueDate),
        date: moved(t.date) || `${target}-01`,
      })),
    );
    setStep("revisao");
  }

  async function confirm() {
    setSaving(true);
    const byId = new Map(rows.map((r) => [r.id, r]));
    await addRecords(
      drafts.map((d) => {
        const src = byId.get(d.sourceId)!;
        return {
          date: d.date,
          dueDate: d.dueDate,
          type: src.type,
          category: src.category,
          expenseKind: d.expenseKind,
          description: d.description,
          account: src.account,
          method: src.method,
          amount: d.amount,
          notes: src.notes,
          details: src.details,
          history: src.history,
          links: src.links,
          comments: src.comments,
          paidAmount: 0,
          paymentDate: "",
        };
      }),
    );
    setSaving(false);
    onClose(true);
  }

  const set = (i: number, data: Partial<Draft>) =>
    setDrafts((list) => list.map((d, idx) => (idx === i ? { ...d, ...data } : d)));

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="panel my-auto w-full max-w-3xl p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Replicar contas</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {step === "mes"
                ? `Deseja copiar ${rows.length} conta(s) para qual mês?`
                : "Revise e ajuste antes de confirmar. Status e data de pagamento não são copiados."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {step === "mes" ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Select
              label="Mês de destino"
              value={target}
              onChange={setTarget}
              options={options.map((m) => ({ value: m, label: fullMonthLabel(m) }))}
            />
            <button
              type="button"
              onClick={toReview}
              className="ml-auto inline-flex h-10 items-center rounded-xl bg-[image:var(--gradient-primary)] px-5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              Revisar
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 max-h-[45vh] overflow-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    <th className="px-2 py-2">Data</th>
                    <th className="px-2 py-2">Conta</th>
                    <th className="px-2 py-2">Despesa</th>
                    <th className="px-2 py-2">Vencimento</th>
                    <th className="px-2 py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((d, i) => (
                    <tr key={d.sourceId} className="border-t border-border/60">
                      <td className="px-2 py-1.5">
                        <InlineDate label="data" value={d.date} onSave={(v) => set(i, { date: v })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <InlineText
                          label="conta"
                          value={d.description}
                          onSave={(v) => set(i, { description: v })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <InlineSelect
                          label="despesa"
                          value={d.expenseKind}
                          options={KIND_OPTIONS}
                          onSave={(v) => set(i, { expenseKind: v as ExpenseKind })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <InlineDate
                          label="vencimento"
                          value={d.dueDate}
                          onSave={(v) => set(i, { dueDate: v })}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <InlineMoney
                          label="valor"
                          value={d.amount}
                          className="text-right"
                          onSave={(v) => set(i, { amount: v })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep("mes")}
                className="h-10 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void confirm()}
                className="h-10 rounded-xl bg-[image:var(--gradient-primary)] px-5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-70"
              >
                Confirmar replicação
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ContasPage() {
  const { transactions, settings } = useFinance();
  const months = useMemo(() => availableMonths(transactions), [transactions]);
  const [month, setMonth] = useState<string>("");
  const current = month && months.includes(month) ? month : (months[0] ?? "");
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [selected, setSelected] = useState<string[]>([]);
  const [replicating, setReplicating] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const rows = useMemo(
    () =>
      transactions
        .filter((t) => (current ? monthKey(t.date) === current : true))
        .filter((t) => (statusFilter === "todas" ? true : t.status === statusFilter)),
    [transactions, current, statusFilter],
  );

  const chosen = rows.filter((r) => selected.includes(r.id));

  return (
    <Page
      title={settings.labels.contas}
      subtitle={current ? `Cards do mês · ${fullMonthLabel(current)}` : "Cards de contas"}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {months.length > 0 && (
            <Select
              value={current}
              onChange={setMonth}
              options={months.map((m) => ({ value: m, label: fullMonthLabel(m) }))}
            />
          )}
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "todas", label: "Todas" },
              ...STATUS_OPTIONS,
            ]}
          />
          <NewRecordButton label="Nova conta" />
        </div>
      }
    >
      {editing && <RecordDialog record={editing} onClose={() => setEditing(null)} />}
      {replicating && chosen.length > 0 && (
        <ReplicateDialog
          rows={chosen}
          months={months}
          onClose={(done) => {
            setReplicating(false);
            if (done) setSelected([]);
          }}
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="panel flex flex-wrap items-center gap-3 px-4 py-3 text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={rows.length > 0 && selected.length === rows.length}
              onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
              className="size-4 accent-[var(--color-primary)]"
            />
            Selecionar todas
          </label>
          <span>{selected.length} selecionada(s) de {rows.length}</span>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => setReplicating(true)}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/60 disabled:opacity-50"
          >
            <Copy className="size-3.5" /> Replicar
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="panel py-10 text-center text-sm text-muted-foreground">
            Nenhuma conta neste período.
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {rows.map((t) => (
              <AccountCard
                key={t.id}
                t={t}
                selected={selected.includes(t.id)}
                onSelect={(v) =>
                  setSelected((list) => (v ? [...list, t.id] : list.filter((id) => id !== t.id)))
                }
                onEdit={() => setEditing(t)}
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
