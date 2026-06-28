import { PageHeaderSkeleton, StatCardsSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b px-6 py-14 md:py-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8">
          <PageHeaderSkeleton className="text-center" />
          <Skeleton className="h-12 w-full max-w-2xl rounded-xl" />
        </div>
      </section>
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <StatCardsSkeleton />
        </div>
      </section>
    </main>
  );
}
