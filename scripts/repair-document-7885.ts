/**
 * Reparación: documento Restrictiva (adenda) de Disposición 7885/2022.
 *
 * 1. Intenta aplicar migración de índice (requiere SUPABASE_DB_URL en .env)
 * 2. Crea documento Restrictiva y reasigna R01894/R01895
 *
 *   npx tsx scripts/repair-document-7885.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const RESTRICTIVA_LABEL = "Restrictiva (adenda)";
const PROHIBIDOS_LABEL = "Prohibidos (adenda)";
const LOCAL_NORM = "Disposición Nº 7885/2022";
const MERCOSUR = "MERCOSUR/GMC/RES. N° 37/20";
const SOURCE_URL =
  "https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-7885-2022-372594/texto";

function loadEnv(): void {
  const envPath = join(process.cwd(), ".env");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function applyMigrationViaPg(): Promise<boolean> {
  const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) return false;

  try {
    const pg = await import("pg");
    const client = new pg.default.Client({ connectionString: dbUrl });
    await client.connect();
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20250627120000_fix_document_fingerprint.sql"
      ),
      "utf-8"
    );
    await client.query(sql);
    await client.end();
    console.log("Migración de índice aplicada vía SUPABASE_DB_URL");
    return true;
  } catch (err) {
    console.warn(
      "No se pudo aplicar migración vía DB:",
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

async function main(): Promise<void> {
  loadEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  await applyMigrationViaPg();

  const { data: authority } = await supabase
    .from("regulatory_authorities")
    .select("id")
    .eq("code", "AR_MERCOSUR")
    .single();

  if (!authority) throw new Error("No se encontró authority AR_MERCOSUR");

  const { data: prohibidosDoc } = await supabase
    .from("regulatory_documents")
    .select("id, source_label")
    .eq("authority_id", authority.id)
    .eq("document_number", LOCAL_NORM)
    .eq("mercosur_reference", MERCOSUR)
    .maybeSingle();

  if (prohibidosDoc && prohibidosDoc.source_label !== PROHIBIDOS_LABEL) {
    await supabase
      .from("regulatory_documents")
      .update({ source_label: PROHIBIDOS_LABEL })
      .eq("id", prohibidosDoc.id);
    console.log("source_label actualizado en documento Prohibidos (adenda)");
  }

  let { data: restrictivaDoc } = await supabase
    .from("regulatory_documents")
    .select("id, document_number, source_label")
    .eq("authority_id", authority.id)
    .eq("source_label", RESTRICTIVA_LABEL)
    .eq("document_number", LOCAL_NORM)
    .maybeSingle();

  if (!restrictivaDoc) {
    const { data: created, error } = await supabase
      .from("regulatory_documents")
      .insert({
        authority_id: authority.id,
        title: `${RESTRICTIVA_LABEL} — ${LOCAL_NORM}`,
        document_type: "resolution",
        document_number: LOCAL_NORM,
        source_url: SOURCE_URL,
        mercosur_reference: MERCOSUR,
        source_label: RESTRICTIVA_LABEL,
        summary: `MERCOSUR: ${MERCOSUR}`,
        status: "active",
      })
      .select("id, document_number, source_label")
      .single();

    if (error?.code === "23505") {
      console.log("Índice antiguo activo — insertando con document_number disambiguated...");
      const { data: fallback, error: fallbackError } = await supabase
        .from("regulatory_documents")
        .insert({
          authority_id: authority.id,
          title: `${RESTRICTIVA_LABEL} — ${LOCAL_NORM}`,
          document_type: "resolution",
          document_number: `${LOCAL_NORM} (${RESTRICTIVA_LABEL})`,
          source_url: SOURCE_URL,
          mercosur_reference: MERCOSUR,
          source_label: RESTRICTIVA_LABEL,
          summary: `MERCOSUR: ${MERCOSUR}. Mismo texto normativo; contexto Restrictiva adenda.`,
          status: "active",
        })
        .select("id, document_number, source_label")
        .single();

      if (fallbackError) throw fallbackError;
      restrictivaDoc = fallback;
    } else if (error) {
      throw error;
    } else {
      restrictivaDoc = created;
    }

    console.log("Documento Restrictiva creado:", restrictivaDoc!.id);
  } else {
    console.log("Documento Restrictiva ya existía:", restrictivaDoc.id);
  }

  const { data: rules, error: rulesError } = await supabase
    .from("ingredient_rules")
    .update({ document_id: restrictivaDoc!.id })
    .in("source_record_id", ["R01894", "R01895"])
    .select("source_record_id, document_id");

  if (rulesError) throw rulesError;
  console.log(
    "Reglas reasignadas:",
    rules?.map((r) => r.source_record_id).join(", ")
  );

  const { count } = await supabase
    .from("regulatory_documents")
    .select("*", { count: "exact", head: true });

  console.log("\nTotal documentos:", count, "(esperado: 17)");
  console.log(
    "Recomendado: aplicar supabase/migrations/20250627120000_fix_document_fingerprint.sql en SQL Editor"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
