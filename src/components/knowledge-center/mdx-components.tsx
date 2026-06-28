import Link from "next/link";
import type { MDXComponents } from "mdx/types";

export const knowledgeMdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-semibold tracking-tight text-primary">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 scroll-mt-24 text-xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 text-base font-semibold tracking-tight">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href ?? "#"}
        className="text-primary underline-offset-4 hover:underline"
      >
        {children}
      </Link>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/30 pl-4 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-[var(--bica-border)]" />,
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[480px] text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border/60 bg-muted/40">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border/40 last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 font-medium text-foreground">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-muted-foreground">{children}</td>
  ),
};
