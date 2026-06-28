import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/page-skeleton";

export default function AppLoading() {
  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <PageHeaderSkeleton />
        <ListSkeleton rows={4} />
      </div>
    </main>
  );
}
