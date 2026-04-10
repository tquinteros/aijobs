import type { CurrentUser } from "@/lib/auth/get-current-user"
import { HeaderNav } from "./header-nav"

type HeaderProps = {
  user: CurrentUser
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center px-4 lg:px-0">
        <HeaderNav user={user} />
      </div>
    </header>
  )
}
