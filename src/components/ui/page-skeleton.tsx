import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bica-card p-5">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="mt-4 h-8 w-16" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between bica-card p-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function KnowledgePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 px-6 py-8">
      <PageHeaderSkeleton />
      <div className="bica-snapshot p-8">
        <Skeleton className="h-4 w-40" />
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
      <ListSkeleton rows={3} />
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="overflow-hidden bica-card">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2 border-b border-[var(--bica-border)] px-4 py-4 last:border-b-0">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
