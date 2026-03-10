"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  BookmarkCheck,
  Settings,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { LogoutButton } from "@/components/logout-button"

const navItems = [
  { href: "/dashboard/candidate", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/candidate/cv", label: "Mi CV", icon: FileText },
  { href: "/dashboard/candidate/jobs", label: "Empleos", icon: Briefcase },
  { href: "/dashboard/candidate/saved", label: "Guardados", icon: BookmarkCheck },
  { href: "/dashboard/candidate/messages", label: "Mensajes", icon: MessageCircle },
]

const bottomItems = [
  { href: "/dashboard/candidate/settings", label: "Configuración", icon: Settings },
]

type SidebarProps = {
  fullName: string
  title: string
  className?: string
}

export function CandidateSidebar({ fullName, title, className }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <aside className={cn("flex flex-col w-64 min-h-screen border-r bg-card px-3 py-5 shrink-0", className)}>
      {/* Brand */}
      <div className="px-3 mb-6">
        <Link href="/" className="text-lg font-bold tracking-tight">aijobs</Link>
        <span className="text-muted-foreground text-sm block">Candidato</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-3 mb-6">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{title}</p>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Main nav */}
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

      {/* Bottom nav */}
      <div className="space-y-1 mt-4">
        <Separator className="mb-4" />
        {bottomItems.map(({ href, label, icon: Icon }) => (
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
        ))}
        <LogoutButton />
      </div>
    </aside>
  )
}
