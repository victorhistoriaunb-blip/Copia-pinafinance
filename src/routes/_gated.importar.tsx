import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { Page } from "@/components/dashboard/page";
import { Panel } from "@/components/dashboard/charts";

export const Route = createFileRoute("/_gated/importar")({
  head: () => ({
    meta: [
      { title: "Importar Planilhas · PINA Finanças" },
      {
        name: "description",
        content:
          "Envie planilhas Excel (.xlsx e .xls) por clique ou arrastar e soltar e alimente o dashboard automaticamente.",
      },
      { property: "og:title", content: "Importar Planilhas · PINA Finanças" },
      {
        property: "og:description",
        content: "Upload de planilhas Excel para alimentar seu dashboard financeiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ImportPage,
});

const fmtSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function ImportPage() {
  const { files, importFiles, removeFile, clearAll, transactions } = useFinance();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ name: string; error?: string }[]>([]);

  async function handle(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    setResults([]);
    try {
      const res = await importFiles(Array.from(list));
      setResults(res);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Page
      title="Importar Planilhas"
      subtitle="Os arquivos ficam salvos neste navegador até você removê-los"
      requireData={false}
      actions={
        files.length > 0 ? (
          <button
            type="button"
            onClick={() => clearAll()}
            className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
          >
            Remover todas
          </button>
        ) : null
      }
    >
      <div className="flex flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handle(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`panel grid cursor-pointer place-items-center border-dashed p-10 text-center transition-colors duration-200 ${
            dragging ? "border-primary bg-primary/8" : "hover:border-primary/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.xlsm,.csv"
            multiple
            className="hidden"
            onChange={(e) => void handle(e.target.files)}
          />
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary">
            {busy ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-6" />}
          </span>
          <p className="mt-4 text-sm font-semibold">
            {busy ? "Processando planilhas…" : "Arraste suas planilhas aqui ou clique para selecionar"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Formatos aceitos: .xlsx e .xls · múltiplos arquivos · todas as abas são lidas automaticamente
          </p>
        </motion.div>

        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <p
                key={r.name}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                  r.error ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success"
                }`}
              >
                {r.error ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">{r.error ?? "importada com sucesso"}</span>
              </p>
            ))}
          </div>
        )}

        <Panel
          title="Planilhas importadas"
          description={`${files.length} arquivo(s) · ${transactions.length} lançamentos válidos`}
          delay={0.1}
        >
          {files.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma planilha importada ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {files.map((f) => (
                <li key={f.id} className="rounded-xl border border-border/70 bg-surface/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                        <FileSpreadsheet className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtSize(f.size)} · {f.sheets.length} aba(s) ·{" "}
                          {f.transactions.length} lançamentos · importada em{" "}
                          {new Date(f.importedAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Atualizar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        aria-label={`Excluir ${f.name}`}
                        className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {f.sheets.map((s) => (
                      <span
                        key={s.name}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground"
                      >
                        {s.name} · {s.imported} ok
                        {s.skipped > 0 && ` · ${s.skipped} ignorada(s)`}
                      </span>
                    ))}
                  </div>

                  {f.issues.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {f.issues.map((issue, i) => (
                        <li
                          key={i}
                          className={`flex gap-2 rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${
                            issue.level === "erro"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {issue.level === "erro" ? (
                            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                          ) : (
                            <Info className="mt-0.5 size-3 shrink-0" />
                          )}
                          <span>
                            <strong>{issue.sheet}:</strong> {issue.message}
                            {issue.count ? ` (${issue.count})` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Como montar sua planilha" description="Colunas reconhecidas automaticamente" delay={0.15}>
          <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <li>• <strong className="text-foreground">Data</strong> — data, dia, competência, vencimento</li>
            <li>• <strong className="text-foreground">Valor</strong> — valor, total, montante (obrigatória)</li>
            <li>• <strong className="text-foreground">Tipo</strong> — receita/despesa, entrada/saída, crédito/débito</li>
            <li>• <strong className="text-foreground">Categoria</strong> — categoria, classificação, grupo</li>
            <li>• <strong className="text-foreground">Descrição</strong> — descrição, histórico, lançamento</li>
            <li>• <strong className="text-foreground">Conta / Forma</strong> — conta, banco, forma de pagamento</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Sem coluna de tipo, valores negativos são tratados como despesa. Importar um arquivo com o
            mesmo nome substitui a versão anterior.
          </p>
        </Panel>
      </div>
    </Page>
  );
}
