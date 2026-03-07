import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

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

async function HeaderNav() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  const isLoggedIn = !error && !!data?.claims
  let role: "candidate" | "company" | null = null

  if (isLoggedIn && data?.claims?.sub) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.claims.sub)
      .single()
    if (profile?.role === "candidate" || profile?.role === "company") {
      role = profile.role
    }
  }

  const navLink =
    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"

  return (
    <nav className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground hover:opacity-90">
          aijobs
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          <Link href="/jobs" className={navLink}>
            Jobs
          </Link>
          <Link href="/about" className={navLink}>
            About
          </Link>
          <Link href="/contact" className={navLink}>
            Contact
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isLoggedIn ? (
          <>
            <Link
              href="/auth/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            {role === "company" && (
              <Link
                href="/dashboard/company"
                className={navLink}
              >
                Dashboard
              </Link>
            )}
            {role === "candidate" && (
              <Link
                href="/dashboard/candidate"
                className={navLink}
              >
                Dashboard
              </Link>
            )}
            {!role && (
              <span className="text-sm text-muted-foreground">Account</span>
            )}
          </>
        )}
      </div>
    </nav>
  )
}

export default async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        <HeaderNav />
      </div>
    </header>
  )
}
