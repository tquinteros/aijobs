import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/get-current-user"

export async function HeaderNav() {
  const user = await getCurrentUser()

  const navLink =
    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"

  return (
    <nav className="flex w-full items-center justify-between gap-6">
      <div className="flex items-center gap-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground hover:opacity-90"
        >
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
        {!user && (
          <>
            <Link
              href="/auth/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Sign in
            </Link>

            <Link
              href="/auth/sign-up"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Sign up
            </Link>
          </>
        )}

        {user?.role === "candidate" && (
          <Link href="/dashboard/candidate" className={navLink}>
            Dashboard
          </Link>
        )}

        {user?.role === "company" && (
          <Link href="/dashboard/company" className={navLink}>
            Dashboard
          </Link>
        )}

        {user && !user.role && (
          <span className="text-sm text-muted-foreground">Account</span>
        )}
      </div>
    </nav>
  )
}