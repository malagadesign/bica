import { cn } from "@/lib/utils";

type OfficialSourceNoteProps = {
  text: string;
  className?: string;
};

export function OfficialSourceNote({ text, className }: OfficialSourceNoteProps) {
  return (
    <p
      className={cn(
        "rounded-lg border border-[var(--bica-border)] bg-[var(--bica-muted)]/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground",
        className
      )}
    >
      {text}
    </p>
  );
}
