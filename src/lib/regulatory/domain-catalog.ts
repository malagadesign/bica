import sources from "../../../data/regulatory-sources.json";
import documentTypes from "../../../data/regulatory-document-types.json";
import type { RegulatoryDomainContext } from "@/modules/regulatory-updates/types";

export type RegulatorySourceCatalogEntry = {
  id: string;
  label: string;
  description: string;
};

export type RegulatoryDocumentTypeEntry = {
  id: string;
  label: string;
};

export function getRegulatorySources(): RegulatorySourceCatalogEntry[] {
  return sources as RegulatorySourceCatalogEntry[];
}

export function getRegulatoryDocumentTypes(): RegulatoryDocumentTypeEntry[] {
  return documentTypes as RegulatoryDocumentTypeEntry[];
}

export function getRegulatorySourceLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return getRegulatorySources().find((s) => s.id === id)?.label ?? id;
}

export function getDocumentTypeLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return getRegulatoryDocumentTypes().find((t) => t.id === id)?.label ?? id;
}

export function buildNormativeTitle(input: {
  title?: string;
  document_type_id?: string;
  document_number?: string;
}): string {
  const custom = input.title?.trim();
  if (custom) return custom;

  const typeLabel = getDocumentTypeLabel(input.document_type_id);
  const number = input.document_number?.trim();
  if (typeLabel !== "—" && number) return `${typeLabel} ${number}`;
  if (number) return number;
  if (typeLabel !== "—") return typeLabel;
  return "";
}

export function parseDomainContext(raw: unknown): RegulatoryDomainContext {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as RegulatoryDomainContext;
  return {
    regulatory_source_id: r.regulatory_source_id ?? null,
    document_type_id: r.document_type_id ?? null,
    document_number: r.document_number ?? null,
    official_url: r.official_url ?? null,
    normative_published_date: r.normative_published_date ?? null,
    review_confirmed_at: r.review_confirmed_at ?? null,
  };
}

export function formatSourceDocumentType(
  sourceType: "csv" | "xlsx" | "pdf"
): string {
  switch (sourceType) {
    case "pdf":
      return "PDF";
    case "xlsx":
      return "Excel";
    case "csv":
      return "Documento recibido";
    default:
      return "Documento";
  }
}
