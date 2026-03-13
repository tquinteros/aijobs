"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  Settings,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { LogoutButton } from "@/components/logout-button"
import Image from "next/image"

const navItems = [
  { href: "/dashboard/company", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/company/jobs", label: "Job Postings", icon: Briefcase },
  { href: "/dashboard/company/candidates", label: "Candidates", icon: Users },
  { href: "/dashboard/company/messages", label: "Messages", icon: MessageCircle },
]

const bottomItems = [
  { href: "/dashboard/company/settings", label: "Settings", icon: Settings },
]

type SidebarProps = {
  companyName: string
  logoUrl: string
  className?: string
}

export function CompanySidebar({ companyName, logoUrl, className }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  // const initials = companyName
  //   .split(" ")
  //   .slice(0, 2)
  //   .map((n) => n[0])
  //   .join("")
  //   .toUpperCase()

  return (
    <aside className={cn("flex flex-col w-64 min-h-screen border-r bg-card px-3 py-5 shrink-0", className)}>
      <div className="px-3 mb-6">
        <Link href="/" className="text-lg font-bold tracking-tight">aijobs</Link>
        <span className="text-muted-foreground text-sm block">Empresa</span>
      </div>

      <div className="flex items-center gap-3 px-3 mb-6">
        <Image className="rounded-full" src={logoUrl} alt={companyName} width={36} height={36} />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{companyName}</p>
          {/* <p className="text-xs text-muted-foreground truncate">{industry ?? "Sin industria"}</p> */}
        </div>
      </div>

      <Separator className="mb-4" />

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Tooltip key={href} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href, exact)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <div className="space-y-2 mt-4">
        <Separator className="mb-4" />
        {/* {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))} */}
        <LogoutButton />
      </div>
    </aside>
  )
}
