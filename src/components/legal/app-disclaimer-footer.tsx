import { FOOTER_DISCLAIMER_SHORT } from "@/lib/legal/microcopy";
import { DisclaimerLink } from "./disclaimer-link";

export function AppDisclaimerFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--bica-border)] bg-[var(--bica-muted)]/30 px-6 py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{FOOTER_DISCLAIMER_SHORT}</p>
        <DisclaimerLink className="text-xs text-muted-foreground hover:text-primary" />
      </div>
    </footer>
  );
}
