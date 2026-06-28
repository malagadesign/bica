/** Textos oficiales de disclaimer — Sprint 8 */

export const BICA_GOVERNING_AI_PRINCIPLE =
  "En BICA, la inteligencia artificial nunca reemplaza el criterio regulatorio. Su función es asistir al especialista, reducir tareas repetitivas y detectar posibles inconsistencias. La decisión final de revisar, corregir y publicar siempre pertenece a un responsable humano.";

export const DISCLAIMER_GENERAL =
  "BICA es una plataforma informativa de consulta y organización de información regulatoria vinculada a ingredientes y sustancias utilizadas en productos de higiene personal, cosméticos y perfumes. La información contenida en la plataforma no reemplaza la normativa oficial vigente ni constituye asesoramiento legal o regulatorio vinculante. Las fuentes oficiales continúan siendo ANMAT, MERCOSUR, el Boletín Oficial de la República Argentina y demás autoridades regulatorias competentes. Antes de tomar decisiones regulatorias, comerciales o de formulación, la información debe ser verificada contra la normativa oficial vigente. BICA es gestionada por Eternia Regulatory & Compliance Consultants.";

export const DISCLAIMER_OFFICIAL_SOURCES_NOTE =
  "Para información oficial, consulte los sitios y publicaciones oficiales de ANMAT y demás autoridades regulatorias competentes.";

/** Reservado para integración futura — no expuesto en UI pública en Sprint 8 */
export const DISCLAIMER_AI_INTERNAL =
  "Las funciones asistidas por inteligencia artificial de BICA, cuando estén disponibles, tendrán carácter auxiliar. Las sugerencias generadas por IA deberán ser revisadas y validadas por un responsable humano antes de ser publicadas o utilizadas como criterio regulatorio. BICA no publicará automáticamente información generada por IA.";

export const DISCLAIMER_HUMAN_REVIEW =
  "Toda actualización normativa incorporada a BICA requiere revisión y confirmación manual por un administrador autorizado antes de publicarse en la base informativa.";

export const OFFICIAL_SOURCES = [
  { name: "ANMAT", url: "https://www.argentina.gob.ar/anmat" },
  {
    name: "Boletín Oficial",
    url: "https://www.boletinoficial.gob.ar/",
  },
  {
    name: "Argentina.gob.ar — Normativa",
    url: "https://www.argentina.gob.ar/normativa",
  },
] as const;

export const ETERNIA_CONTACT = {
  name: "Eternia Regulatory & Compliance Consultants",
  description:
    "Gestión y desarrollo de la plataforma BICA. Consultas sobre acceso, uso y gobernanza de la información.",
} as const;
