import { writeFileSync } from "node:fs";
import { join } from "node:path";

export type SeedReport = {
  mode: "dry-run" | "live";
  seed_origin: "etapa_1a_controlled_csv_seed";
  file: string;
  started_at: string;
  finished_at: string;
  rows_processed: number;
  rows_inserted: number;
  rows_skipped: number;
  rows_skipped_existing: number;
  rows_skipped_no_identity: number;
  authorities_created: number;
  documents_created: number;
  lists_created: number;
  ingredients_created: number;
  synonyms_created: number;
  rules_created: number;
  restrictions_created: number;
  rule_versions_created: number;
  needs_review_count: number;
  errors: string[];
  warnings: string[];
};

export function createEmptyReport(file: string, dryRun: boolean): SeedReport {
  return {
    mode: dryRun ? "dry-run" : "live",
    seed_origin: "etapa_1a_controlled_csv_seed",
    file,
    started_at: new Date().toISOString(),
    finished_at: "",
    rows_processed: 0,
    rows_inserted: 0,
    rows_skipped: 0,
    rows_skipped_existing: 0,
    rows_skipped_no_identity: 0,
    authorities_created: 0,
    documents_created: 0,
    lists_created: 0,
    ingredients_created: 0,
    synonyms_created: 0,
    rules_created: 0,
    restrictions_created: 0,
    rule_versions_created: 0,
    needs_review_count: 0,
    errors: [],
    warnings: [],
  };
}

export function printReport(report: SeedReport): void {
  console.log("\n=== Cosing AR — Seed Etapa 1A ===");
  console.log(`Modo:              ${report.mode}`);
  console.log(`Origen:            ${report.seed_origin}`);
  console.log(`Archivo:           ${report.file}`);
  console.log(`Filas procesadas:  ${report.rows_processed}`);
  console.log(`Filas insertadas:  ${report.rows_inserted}`);
  console.log(`Filas omitidas:    ${report.rows_skipped}`);
  console.log(`  - ya existían:   ${report.rows_skipped_existing}`);
  console.log(`  - sin identidad: ${report.rows_skipped_no_identity}`);
  console.log(`Autoridades:       ${report.authorities_created}`);
  console.log(`Documentos:        ${report.documents_created}`);
  console.log(`Listas:            ${report.lists_created}`);
  console.log(`Ingredientes:      ${report.ingredients_created}`);
  console.log(`Sinónimos:         ${report.synonyms_created}`);
  console.log(`Reglas:            ${report.rules_created}`);
  console.log(`Restricciones:     ${report.restrictions_created}`);
  console.log(`Rule versions:     ${report.rule_versions_created}`);
  console.log(`needs_review:      ${report.needs_review_count}`);

  if (report.warnings.length) {
    console.log("\nWarnings:");
    report.warnings.forEach((w) => console.log(`  - ${w}`));
  }

  if (report.errors.length) {
    console.log("\nErrores:");
    report.errors.forEach((e) => console.log(`  - ${e}`));
  }
}

export function writeReportFile(report: SeedReport): string {
  const outPath = join(
    process.cwd(),
    "data",
    "seeds",
    `seed-report-${report.mode}-${Date.now()}.json`
  );
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");
  return outPath;
}
