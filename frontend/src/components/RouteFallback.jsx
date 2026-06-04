import { Skeleton, SkeletonCard } from './ui';

export default function RouteFallback() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
