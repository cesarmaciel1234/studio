import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">Panel Administrativo</span>
              <span className="text-xs text-muted-foreground">Última actualización: hace 2m</span>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}