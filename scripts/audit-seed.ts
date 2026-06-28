import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { dedupKeyString, documentFingerprint, ingredientDedupKey } from "./seed/normalize";

function loadEnv() {
  const env = readFileSync(".env", "utf-8");
  for (const line of env.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnv();
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const rows = parse(readFileSync("data/seeds/proyecto_listados_normalizado.csv", "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  const ingredients: Array<{
    id: string;
    inci_name: string | null;
    chemical_name: string | null;
    cas_number: string | null;
    color_index: string | null;
  }> = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await sb
      .from("ingredients")
      .select("id, inci_name, chemical_name, cas_number, color_index")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    ingredients.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const dbKeys = new Set<string>();
  for (const ing of ingredients ?? []) {
    if (ing.inci_name) dbKeys.add(`inci:${ing.inci_name.toLowerCase()}`);
    if (ing.color_index) dbKeys.add(`ci:${ing.color_index.toLowerCase()}`);
    if (ing.cas_number) dbKeys.add(`cas:${ing.cas_number.toLowerCase()}`);
    if (ing.chemical_name) dbKeys.add(`es:${ing.chemical_name.toLowerCase()}`);
  }

  const csvKeys = new Map<string, string>();
  for (const row of rows) {
    const key = ingredientDedupKey(row);
    if (!key) continue;
    const ks = dedupKeyString(key);
    if (!csvKeys.has(ks)) csvKeys.set(ks, row.record_id);
  }

  const missing = [...csvKeys.keys()].filter((k) => !dbKeys.has(k));
  console.log("=== INGREDIENTES ===");
  console.log(`CSV únicos: ${csvKeys.size}, DB: ${ingredients?.length}, faltantes: ${missing.length}`);

  for (const k of missing) {
    const rid = csvKeys.get(k)!;
    const row = rows.find((r) => r.record_id === rid)!;
    console.log(`- ${k} | ${rid} | inci=${row.inci_name} | es=${row.ingredient_name_es?.slice(0, 50)}`);
  }

  const { data: docs } = await sb
    .from("regulatory_documents")
    .select("document_number, mercosur_reference, source_label, source_url, title");

  const csvDocFps = new Map<string, { count: number; label: string }>();
  for (const row of rows) {
    const fp = documentFingerprint(row);
    const cur = csvDocFps.get(fp) ?? { count: 0, label: row.source_label };
    cur.count += 1;
    csvDocFps.set(fp, cur);
  }

  console.log("\n=== DOCUMENTOS ===");
  console.log(`CSV únicos: ${csvDocFps.size}, DB: ${docs?.length}`);

  for (const [fp, meta] of csvDocFps) {
    const [local, mercosur, label, url] = fp.split("||");
    const found = (docs ?? []).find(
      (d) =>
        (d.document_number ?? "") === local &&
        (d.mercosur_reference ?? "") === mercosur &&
        (d.source_url ?? "") === url
    );
    if (!found) {
      console.log(`- FALTA: ${label} | ${local} | rows=${meta.count}`);
    } else if ((found.source_label ?? "") !== label) {
      console.log(`- COLAPSADO (source_label distinto): CSV="${label}" DB="${found.source_label}" | ${local} | rows=${meta.count}`);
    }
  }
}

main().catch(console.error);
