"use client"

import type { ReactNode } from "react"
import { Menu } from "lucide-react"

import { CandidateSidebar } from "@/components/dashboard/candidate/sidebar"
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

type CandidateDashboardShellClientProps = {
  children: ReactNode
  fullName: string
  title: string
}

export function CandidateDashboardShellClient({
  children,
  fullName,
  title,
}: CandidateDashboardShellClientProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
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
            <CandidateSidebar
              fullName={fullName}
              title={title}
              className="min-h-[60vh]"
            />
          </DrawerContent>
        </Drawer>
        <div className="ml-1">
          <p className="text-sm font-semibold leading-tight">aijobs</p>
          <p className="text-xs text-muted-foreground leading-tight">Candidato</p>
        </div>
      </header>

      <div className="hidden md:block">
        <CandidateSidebar fullName={fullName} title={title} />
      </div>

      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}

