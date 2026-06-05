import clsx from 'clsx';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx('animate-pulse rounded-lg bg-white/[0.06] border border-[#1A1410]/5', className)}
      aria-hidden
      {...props}
    />
  );
}

export function SkeletonCard({ className }) {
  return <Skeleton className={clsx('h-64 w-full', className)} />;
}
