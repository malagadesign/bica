import { MDXRemote } from "next-mdx-remote/rsc";
import { knowledgeMdxComponents } from "./mdx-components";

type KnowledgeArticleBodyProps = {
  content: string;
};

export function KnowledgeArticleBody({ content }: KnowledgeArticleBodyProps) {
  return (
    <article className="space-y-4">
      <MDXRemote source={content} components={knowledgeMdxComponents} />
    </article>
  );
}
