"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ContextualKnowledgeLinkProps = {
  href: string;
  label?: string;
  description?: string;
};

export function ContextualKnowledgeLink({
  href,
  label = "Centro de Conocimiento",
  description = "Ver guía relacionada",
}: ContextualKnowledgeLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            aria-label={description}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <CircleHelp className="size-4" />
          </Link>
        }
      />
      <TooltipContent side="bottom">
        <p className="font-medium">{label}</p>
        <p className="text-xs opacity-90">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
