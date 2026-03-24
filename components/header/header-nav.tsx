import Link from "next/link"
import { Menu } from "lucide-react"

import { getCurrentUser } from "@/lib/auth/get-current-user"
import { ThemeSwitcher } from "../theme-switcher"
import { Button } from "../ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet"
import { LogoutButton } from "../logout-button"

export async function HeaderNav() {
  const user = await getCurrentUser()

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
          <Link href="/jobs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Jobs
          </Link>
          {/* <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            About
          </Link> */}
          <Link href="/contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contact
          </Link>
          <Link href="/faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            FAQ
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-3 sm:flex">
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
          {user && (
            <>
              <Button size="sm" className="text-sm" asChild>
                <Link
                  href={
                    user?.role === "candidate"
                      ? "/dashboard/candidate"
                      : "/dashboard/company"
                  }
                >
                  Dashboard
                </Link>
              </Button>
              <LogoutButton size="sm" className="text-sm" />
            </>
          )}

          {user && !user.role && (
            <span className="text-sm text-muted-foreground">Account</span>
          )}

          <ThemeSwitcher />
        </div>

        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="text-base">Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-4 flex flex-col gap-4 px-4 pb-6">
                <nav className="flex flex-col gap-3">
                  <Link
                    href="/jobs"
                    className="text-sm font-medium text-foreground"
                  >
                    Jobs
                  </Link>
                  {/* <Link
                    href="/about"
                    className="text-sm font-medium text-foreground"
                  >
                    About
                  </Link> */}
                  <Link
                    href="/contact"
                    className="text-sm font-medium text-foreground"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/faq"
                    className="text-sm font-medium text-foreground"
                  >
                    FAQ
                  </Link>
                </nav>

                <div className="h-px bg-border" />

                <div className="flex flex-col gap-3">
                  {!user && (
                    <>
                      <Link
                        href="/auth/login"
                        className="rounded-md border px-4 py-2 text-sm font-medium text-foreground text-center"
                      >
                        Sign in
                      </Link>

                      <Link
                        href="/auth/sign-up"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground text-center"
                      >
                        Sign up
                      </Link>
                    </>
                  )}

                  {user && (
                    <>
                      <Button size="sm" className="w-full text-sm" asChild>
                        <Link
                          href={
                            user?.role === "candidate"
                              ? "/dashboard/candidate"
                              : "/dashboard/company"
                          }
                        >
                          Dashboard
                        </Link>
                      </Button>
                      <LogoutButton />
                    </>
                  )}

                  {user && !user.role && (
                    <span className="text-sm text-muted-foreground">
                      Account
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Theme
                  </span>
                  <ThemeSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}