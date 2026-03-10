"use client"

import type { ReactNode } from "react"
import { Menu } from "lucide-react"

import { CompanySidebar } from "@/components/dashboard/company/sidebar"
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

type CompanyDashboardShellClientProps = {
  children: ReactNode
  companyName: string
}

export function CompanyDashboardShellClient({
  children,
  companyName,
}: CompanyDashboardShellClientProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      {/* Mobile header with drawer trigger */}
      <header className="flex items-center border-b bg-card px-4 py-3 md:hidden">
        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-0">
            <DrawerTitle hidden></DrawerTitle>
            <CompanySidebar
              companyName={companyName}
              className="min-h-[60vh]"
            />
          </DrawerContent>
        </Drawer>
        <div className="ml-1">
          <p className="text-sm font-semibold leading-tight">aijobs</p>
          <p className="text-xs text-muted-foreground leading-tight">Empresa</p>
        </div>
      </header>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <CompanySidebar companyName={companyName} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}

