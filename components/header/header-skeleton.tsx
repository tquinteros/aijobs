export function HeaderSkeleton() {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center">
          <nav className="flex w-full items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
              <div className="hidden items-center gap-6 sm:flex">
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                <div className="h-4 w-10 animate-pulse rounded bg-muted" />
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
              <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
            </div>
          </nav>
        </div>
      </header>
    )
  }