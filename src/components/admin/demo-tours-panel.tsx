import { MapPin, Route } from "lucide-react";

const TOURS = [
  {
    id: "consulta-rapida",
    title: "Recorrido 1 — Consulta rápida",
    steps: [
      { label: "Inicio", href: "/app/dashboard" },
      { label: "Buscar ingrediente", href: "/app/search" },
      { label: "Ficha regulatoria", href: null },
      { label: "Documento normativo", href: "/app/documents" },
    ],
    description:
      "Ideal para mostrar valor inmediato: búsqueda, estado regulatorio y norma de respaldo.",
  },
  {
    id: "exploracion",
    title: "Recorrido 2 — Exploración regulatoria",
    steps: [
      { label: "Inicio", href: "/app/dashboard" },
      { label: "Listados", href: "/app/lists" },
      { label: "Conservantes", href: "/app/lists/conservantes" },
      { label: "Ingrediente", href: null },
      { label: "Línea de tiempo", href: null },
    ],
    description:
      "Navegación por categoría normativa hasta la evolución histórica del ingrediente.",
  },
  {
    id: "backoffice",
    title: "Recorrido 3 — Backoffice editorial",
    steps: [
      { label: "Usuarios", href: "/app/admin/users" },
      { label: "Workspace editorial", href: "/app/admin/workspace" },
      { label: "Ficha regulatoria", href: "/app/admin/ingredients" },
      { label: "Flujo editorial", href: null },
      { label: "Publicar normativa", href: null },
    ],
    description:
      "Demostración del panel de administración y publicación de contenido normativo.",
  },
];

export function DemoToursPanel() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Route className="size-4 text-primary/60" />
        <h2 className="bica-section-title">Recorridos sugeridos para demostración</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {TOURS.map((tour) => (
          <div key={tour.id} className="bica-card p-5">
            <h3 className="font-medium text-primary">{tour.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{tour.description}</p>
            <ol className="mt-4 space-y-2">
              {tour.steps.map((step, index) => (
                <li key={step.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums"
                    style={{
                      background: "var(--badge-muted-bg)",
                      color: "var(--badge-muted-text)",
                    }}
                  >
                    {index + 1}
                  </span>
                  {step.href ? (
                    <a
                      href={step.href}
                      className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {step.label}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{step.label}</span>
                  )}
                  {index < tour.steps.length - 1 && (
                    <span className="ml-auto text-muted-foreground/40">↓</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" />
        Documentación completa en docs/DEMO_TOURS.md
      </p>
    </section>
  );
}
