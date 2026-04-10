export function HeaderSkeleton() {
  return (
    <nav className="flex w-full items-center justify-between gap-6">
      <div className="flex items-center gap-8">
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        <div className="hidden items-center gap-6 sm:flex">
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          <div className="h-4 w-10 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-9 w-20 animate-pulse rounded-md bg-muted sm:block" />
        <div className="hidden h-9 w-20 animate-pulse rounded-md bg-muted sm:block" />
        <div className="h-9 w-9 animate-pulse rounded-md bg-muted sm:hidden" />
      </div>
    </nav>
  )
}
