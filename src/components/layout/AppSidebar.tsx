
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Wallet, 
  Package, 
  MessageSquare, 
  LogOut,
  Truck,
  Building2,
  X,
  Pencil
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

const navItems = [
  { 
    name: "Mi billetera", 
    href: "/wallet", 
    icon: Wallet, 
    color: "text-emerald-500", 
    bg: "bg-emerald-50" 
  },
  { 
    name: "Mis pedidos", 
    href: "/orders", 
    icon: Package, 
    color: "text-blue-500", 
    bg: "bg-blue-50" 
  },
  { 
    name: "Central de mensajes", 
    href: "/messages", 
    icon: MessageSquare, 
    color: "text-purple-500", 
    bg: "bg-purple-50" 
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const [mode, setMode] = React.useState<"driver" | "biz">("driver")

  return (
    <Sidebar className="border-none bg-[#e2e8f0]/80 backdrop-blur-xl">
      <SidebarHeader className="p-8 pb-0">
        {/* Close Button */}
        <div className="flex justify-end -mt-4 -mr-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="rounded-full hover:bg-slate-200/50"
          >
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-6 mt-4 mb-10">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
              <AvatarFallback className="bg-white text-slate-900 text-3xl font-black">c</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-slate-900">C</span>
              <Pencil className="h-4 w-4 text-slate-300" />
            </div>
            <span className="text-slate-400 font-bold text-sm">ID: RleWLJDS</span>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="bg-slate-200/50 p-1.5 rounded-[2rem] flex items-center mb-12">
          <button
            onClick={() => setMode("driver")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.8rem] transition-all font-black text-[10px] tracking-widest uppercase",
              mode === "driver" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            <Truck className="h-4 w-4" />
            DRIVER
          </button>
          <button
            onClick={() => setMode("biz")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.8rem] transition-all font-black text-[10px] tracking-widest uppercase",
              mode === "biz" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            <Building2 className="h-4 w-4" />
            BIZ
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-8 space-y-2">
        <SidebarMenu className="gap-6">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                className="h-auto p-0 hover:bg-transparent"
              >
                <Link href={item.href} className="flex items-center gap-6 group">
                  <div className={cn(
                    "h-16 w-16 rounded-[1.2rem] flex items-center justify-center transition-transform group-active:scale-95 shadow-sm",
                    item.bg
                  )}>
                    <item.icon className={cn("h-7 w-7", item.color)} />
                  </div>
                  <span className="text-xl font-bold text-slate-700">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-8 pt-0 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="flex items-center gap-4 text-red-500 hover:text-red-600 hover:bg-red-50/50 rounded-2xl h-14 p-4 font-black transition-colors"
            >
              <LogOut className="h-6 w-6" />
              <span className="text-lg">Salir del sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
