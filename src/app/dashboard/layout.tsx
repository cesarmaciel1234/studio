
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="bg-transparent overflow-hidden">
        {/* Removed header to allow full-screen map experience */}
        <div className="relative flex flex-1 flex-col h-full w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
