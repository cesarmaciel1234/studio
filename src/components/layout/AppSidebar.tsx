
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  CreditCard, 
  ShoppingBag, 
  Users, 
  LogOut,
  Truck,
  Building2,
  X,
  Pencil,
  MessageSquare,
  ShieldAlert,
  Package
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const [mode, setMode] = React.useState<"driver" | "biz">("driver")

  return (
    <Sidebar className="border-none bg-[#e2e8f0]/80 backdrop-blur-xl">
      <SidebarHeader className="p-6 pb-2">
        <div className="flex justify-end -mt-2 -mr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="rounded-full hover:bg-slate-200/50 h-8 w-8"
          >
            <X className="h-4 w-4 text-slate-500" />
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-2 mb-6">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
              <AvatarFallback className="bg-white text-slate-900 text-xl font-black">c</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900">C</span>
              <Pencil className="h-3 w-3 text-slate-300" />
            </div>
            <span className="text-slate-400 font-bold text-[10px]">ID: RleWLJDS</span>
          </div>
        </div>

        <div className="bg-slate-200/50 p-1 rounded-[1.2rem] flex items-center mb-4">
          <button
            onClick={() => setMode("driver")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[1rem] transition-all font-black text-[8px] tracking-widest uppercase",
              mode === "driver" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            <Truck className="h-3 w-3" />
            DRIVER
          </button>
          <button
            onClick={() => setMode("biz")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[1rem] transition-all font-black text-[8px] tracking-widest uppercase",
              mode === "biz" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            <Building2 className="h-3 w-3" />
            BIZ
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-6 space-y-2">
        <SidebarMenu className="gap-3">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/wallet" className="flex items-center gap-4 group">
                <div className="h-11 w-11 rounded-[0.8rem] bg-emerald-50 flex items-center justify-center shadow-sm">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-md font-bold text-slate-700">Mi billetera</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/dashboard?tab=pedidos" className="flex items-center gap-4 group">
                <div className="h-11 w-11 rounded-[0.8rem] bg-blue-50 flex items-center justify-center shadow-sm">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-md font-bold text-slate-700">Pedidos: Propios y entregados</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/dashboard?tab=alerta&filter=mine" className="flex items-center gap-4 group">
                <div className="h-11 w-11 rounded-[0.8rem] bg-red-50 flex items-center justify-center shadow-sm">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-md font-bold text-slate-700">Mis Alertas (Historial)</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/dashboard?tab=central" className="flex items-center gap-4 group">
                <div className="h-11 w-11 rounded-[0.8rem] bg-slate-100 flex items-center justify-center shadow-sm">
                  <MessageSquare className="h-5 w-5 text-slate-900" />
                </div>
                <span className="text-md font-bold text-slate-700">Central: Historial Mensajes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 pt-0 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="flex items-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl h-11 p-3 font-black transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Salir del sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
