import { Suspense } from "react"
import { HeaderNav } from "./header-nav"
import { HeaderSkeleton } from "./header-skeleton"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center">
        <Suspense fallback={<HeaderSkeleton />}>
          <HeaderNav />
        </Suspense>
      </div>
    </header>
  )
}