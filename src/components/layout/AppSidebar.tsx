
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
    icon: CreditCard, 
    color: "text-emerald-500", 
    bg: "bg-emerald-50" 
  },
  { 
    name: "Mis pedidos", 
    href: "/orders", 
    icon: ShoppingBag, 
    color: "text-blue-500", 
    bg: "bg-blue-50" 
  },
  { 
    name: "Mensajes comunidad", 
    href: "/messages", 
    icon: Users, 
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
      <SidebarHeader className="p-6 pb-2">
        {/* Close Button */}
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

        {/* Profile Section */}
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

        {/* Mode Selector Toggle */}
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
          {navItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                className="h-auto p-0 hover:bg-transparent"
              >
                <Link href={item.href} className="flex items-center gap-4 group">
                  <div className={cn(
                    "h-11 w-11 rounded-[0.8rem] flex items-center justify-center transition-transform group-active:scale-95 shadow-sm",
                    item.bg
                  )}>
                    <item.icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <span className="text-md font-bold text-slate-700">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
