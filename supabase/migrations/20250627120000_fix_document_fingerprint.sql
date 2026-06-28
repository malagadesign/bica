-- Fix: incluir source_label en fingerprint de documentos
-- Disposición 7885/2022 tiene 2 contextos: Prohibidos (adenda) y Restrictiva (adenda)

DROP INDEX IF EXISTS public.idx_regulatory_documents_fingerprint;

CREATE UNIQUE INDEX idx_regulatory_documents_fingerprint
  ON public.regulatory_documents (
    authority_id,
    COALESCE(document_number, ''),
    COALESCE(source_url, ''),
    COALESCE(mercosur_reference, ''),
    COALESCE(source_label, '')
  );
