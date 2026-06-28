import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import {
  MERCOSUR_CSV_COLUMNS,
  type CsvRow,
} from "@/lib/regulatory/csv-normalize";
import type { RegulatorySourceType } from "../types";

export type ParseResult = {
  sourceType: RegulatorySourceType;
  encoding: string;
  sheetName: string | null;
  rows: CsvRow[];
  detectedColumns: string[];
  missingColumns: string[];
};

export function detectSourceType(filename: string): RegulatorySourceType | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

function normalizeHeaderKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}

function mapRow(raw: Record<string, string>): CsvRow {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    mapped[normalizeHeaderKey(key)] = String(value ?? "");
  }

  const row = {} as CsvRow;
  for (const col of MERCOSUR_CSV_COLUMNS) {
    row[col] = mapped[col] ?? "";
  }
  return row;
}

function detectColumns(rows: CsvRow[]): {
  detectedColumns: string[];
  missingColumns: string[];
} {
  const sample = rows[0];
  if (!sample) {
    return {
      detectedColumns: [],
      missingColumns: [...MERCOSUR_CSV_COLUMNS],
    };
  }

  const detected = MERCOSUR_CSV_COLUMNS.filter((col) => {
    const val = sample[col];
    return val !== undefined;
  });

  const missing = MERCOSUR_CSV_COLUMNS.filter(
    (col) => !detected.includes(col) || (col === "record_id" && !sample.record_id?.trim())
  ).filter((col) => col === "record_id" || col === "list_type" || col === "status");

  return { detectedColumns: [...detected], missingColumns: missing };
}

function parseCsvBuffer(buffer: Buffer): ParseResult {
  const text = buffer.toString("utf-8");
  const rawRows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const rows = rawRows.map(mapRow);
  const { detectedColumns, missingColumns } = detectColumns(rows);

  return {
    sourceType: "csv",
    encoding: "utf-8",
    sheetName: null,
    rows,
    detectedColumns,
    missingColumns,
  };
}

function parseXlsxBuffer(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("El archivo Excel no contiene hojas.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
    raw: false,
  });

  const rows = rawRows.map(mapRow);
  const { detectedColumns, missingColumns } = detectColumns(rows);

  return {
    sourceType: "xlsx",
    encoding: "binary",
    sheetName,
    rows,
    detectedColumns,
    missingColumns,
  };
}

export function parseRegulatoryFile(
  buffer: Buffer,
  filename: string
): ParseResult {
  const sourceType = detectSourceType(filename);
  if (!sourceType) {
    throw new Error("Formato no soportado. Use CSV o Excel.");
  }
  if (sourceType === "pdf") {
    throw new Error(
      "PDF preparado para futuras versiones. Por ahora use CSV o Excel."
    );
  }

  return sourceType === "csv"
    ? parseCsvBuffer(buffer)
    : parseXlsxBuffer(buffer);
}
