import * as XLSX from "xlsx";
import type { ImportIssue, ImportedWorkbook, SheetSummary, Transaction } from "./finance.types";

/** Normaliza cabeçalho: minúsculo, sem acento, sem pontuação. */
function norm(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const FIELD_SYNONYMS: Record<string, string[]> = {
  date: ["data", "dia", "date", "competencia", "vencimento", "data pagamento", "data lancamento"],
  description: ["descricao", "historico", "item", "lancamento", "nome", "detalhe", "titulo", "produto"],
  category: ["categoria", "classificacao", "grupo", "tipo de gasto", "segmento"],
  type: ["tipo", "natureza", "entrada saida", "movimento", "operacao", "receita despesa"],
  amount: ["valor", "montante", "total", "preco", "quantia", "valor r", "valor total", "vlr"],
  account: ["conta", "banco", "carteira", "instituicao"],
  method: ["forma de pagamento", "pagamento", "metodo", "forma", "meio de pagamento"],
};

function matchField(header: string): string | null {
  const h = norm(header);
  if (!h) return null;
  for (const [field, options] of Object.entries(FIELD_SYNONYMS)) {
    if (options.some((o) => h === o)) return field;
  }
  for (const [field, options] of Object.entries(FIELD_SYNONYMS)) {
    if (options.some((o) => h.includes(o) || o.includes(h))) return field;
  }
  return null;
}

const RECEITA_WORDS = ["receita", "entrada", "credito", "ganho", "salario", "provento", "deposito"];
const DESPESA_WORDS = ["despesa", "saida", "debito", "gasto", "pagamento", "custo"];

function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  const negative = /^\(.*\)$/.test(s) || s.includes("-");
  s = s.replace(/[()]/g, "").replace(/[^\d,.-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s.replace(/-/g, ""));
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseDate(raw: unknown): string | null {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}`;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return `${d.y}-${pad(d.m)}-${pad(d.d)}`;
    return null;
  }
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const br = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (br) {
    const year = br[3].length === 2 ? 2000 + Number(br[3]) : Number(br[3]);
    return `${year}-${pad(Number(br[2]))}-${pad(Number(br[1]))}`;
  }
  const isoLike = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (isoLike) return `${isoLike[1]}-${pad(Number(isoLike[2]))}-${pad(Number(isoLike[3]))}`;
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }
  return null;
}

/** Encontra a linha de cabeçalho: a que reconhece mais colunas conhecidas. */
function findHeaderRow(rows: unknown[][]): { index: number; map: Record<string, number>; columns: string[] } | null {
  let best: { index: number; map: Record<string, number>; columns: string[]; score: number } | null = null;
  const limit = Math.min(rows.length, 25);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] ?? [];
    const map: Record<string, number> = {};
    const columns: string[] = [];
    row.forEach((cell, col) => {
      const label = String(cell ?? "").trim();
      if (!label) return;
      columns.push(label);
      const field = matchField(label);
      if (field && map[field] === undefined) map[field] = col;
    });
    const score = Object.keys(map).length + (map.amount !== undefined ? 2 : 0) + (map.date !== undefined ? 2 : 0);
    if (map.amount !== undefined && (!best || score > best.score)) {
      best = { index: i, map, columns, score };
    }
  }
  return best ? { index: best.index, map: best.map, columns: best.columns } : null;
}

export function parseWorkbook(fileId: string, fileName: string, buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { cellDates: true });
  const sheets: SheetSummary[] = [];
  const issues: ImportIssue[] = [];
  const transactions: Transaction[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null, blankrows: false });
    if (rows.length === 0) {
      sheets.push({ name: sheetName, rows: 0, imported: 0, skipped: 0, columns: [] });
      issues.push({ level: "aviso", sheet: sheetName, message: "Aba vazia — nenhum dado encontrado." });
      continue;
    }

    const header = findHeaderRow(rows);
    if (!header) {
      sheets.push({ name: sheetName, rows: rows.length, imported: 0, skipped: rows.length, columns: [] });
      issues.push({
        level: "erro",
        sheet: sheetName,
        message: "Não foi possível identificar as colunas. É necessário ao menos uma coluna de Valor (e de preferência Data, Descrição, Categoria e Tipo).",
      });
      continue;
    }

    const { map } = header;
    const body = rows.slice(header.index + 1);
    let imported = 0;
    let noDate = 0;
    let noAmount = 0;

    body.forEach((row, i) => {
      const cell = (field: string) => (map[field] === undefined ? null : row[map[field]]);
      const amountRaw = parseAmount(cell("amount"));
      if (amountRaw === null || amountRaw === 0) {
        if (row.some((c) => c !== null && String(c).trim() !== "")) noAmount++;
        return;
      }
      const date = parseDate(cell("date"));
      if (!date) {
        noDate++;
        return;
      }

      const typeText = norm(cell("type"));
      const categoryText = String(cell("category") ?? "").trim();
      let type: Transaction["type"];
      if (typeText && RECEITA_WORDS.some((w) => typeText.includes(w))) type = "receita";
      else if (typeText && DESPESA_WORDS.some((w) => typeText.includes(w))) type = "despesa";
      else type = amountRaw < 0 ? "despesa" : typeText ? "despesa" : "receita";
      if (!typeText && amountRaw > 0 && map.type === undefined) {
        // sem coluna de tipo: positivo é receita apenas se a categoria sugerir
        const c = norm(categoryText);
        type = RECEITA_WORDS.some((w) => c.includes(w)) || c.includes("salario") ? "receita" : "despesa";
      }

      transactions.push({
        id: `${fileId}:${sheetName}:${i}`,
        date,
        type,
        category: categoryText || "Sem categoria",
        description: String(cell("description") ?? "").trim() || categoryText || "Lançamento",
        account: String(cell("account") ?? "").trim() || "—",
        method: String(cell("method") ?? "").trim() || "—",
        amount: Math.abs(amountRaw),
        fileId,
        fileName,
        sheet: sheetName,
      });
      imported++;
    });

    sheets.push({
      name: sheetName,
      rows: body.length,
      imported,
      skipped: body.length - imported,
      columns: header.columns,
    });

    if (noDate > 0)
      issues.push({ level: "aviso", sheet: sheetName, message: "Linhas ignoradas por data inválida ou ausente.", count: noDate });
    if (noAmount > 0)
      issues.push({ level: "aviso", sheet: sheetName, message: "Linhas ignoradas por valor inválido ou vazio.", count: noAmount });
    if (map.category === undefined)
      issues.push({ level: "aviso", sheet: sheetName, message: "Coluna de Categoria não encontrada — lançamentos ficam em “Sem categoria”." });
    if (map.type === undefined)
      issues.push({ level: "aviso", sheet: sheetName, message: "Coluna de Tipo não encontrada — o tipo foi deduzido pelo sinal do valor." });
    if (imported === 0 && body.length > 0)
      issues.push({ level: "erro", sheet: sheetName, message: "Nenhuma linha válida foi importada nesta aba." });
  }

  const workbook: ImportedWorkbook = {
    id: fileId,
    name: fileName,
    size: buffer.byteLength,
    importedAt: new Date().toISOString(),
    sheets,
    issues,
    transactions,
  };
  return workbook;
}

export async function parseFile(file: File): Promise<ImportedWorkbook> {
  const buffer = await file.arrayBuffer();
  const id = `${file.name}`;
  return parseWorkbook(id, file.name, buffer);
}
