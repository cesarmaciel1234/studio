
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
  Package,
  LayoutDashboard,
  Settings
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
import { useUser, useDoc, useMemoFirebase, useFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { signOut } from "firebase/auth"

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const { user } = useUser()
  const { firestore, auth } = useFirebase()

  const userRef = useMemoFirebase(() => (!firestore || !user?.uid) ? null : doc(firestore, "users", user.uid), [user?.uid, firestore])
  const { data: userData } = useDoc(userRef)
  
  const isAdmin = userData?.role === 'Admin'

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
              <AvatarFallback className={cn("text-xl font-black", isAdmin ? "bg-slate-900 text-white" : "bg-white text-slate-900")}>
                {isAdmin ? "E" : "R"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900 truncate max-w-[120px]">
                {userData?.firstName || "Usuario"}
              </span>
              <Pencil className="h-3 w-3 text-slate-300" />
            </div>
            <span className="text-slate-400 font-bold text-[10px] tracking-widest">
              {isAdmin ? "CENTRO DE CONTROL" : "REPARTIDOR"}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 p-2 rounded-[1.5rem] flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Sistema En Línea</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-6 space-y-2">
        <SidebarMenu className="gap-3">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/dashboard?tab=gestion" className="flex items-center gap-4 group">
                <div className="h-11 w-11 rounded-[0.8rem] bg-blue-50 flex items-center justify-center shadow-sm">
                  <LayoutDashboard className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-md font-bold text-slate-700">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {isAdmin ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
                  <Link href="/dashboard?tab=flota" className="flex items-center gap-4 group">
                    <div className="h-11 w-11 rounded-[0.8rem] bg-emerald-50 flex items-center justify-center shadow-sm">
                      <Users className="h-5 w-5 text-emerald-500" />
                    </div>
                    <span className="text-md font-bold text-slate-700">Mi Flota</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
                  <Link href="/dashboard?tab=central" className="flex items-center gap-4 group">
                    <div className="h-11 w-11 rounded-[0.8rem] bg-slate-900 flex items-center justify-center shadow-sm">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-md font-bold text-slate-700">Mensajería Directa</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
                  <Link href="/dashboard?tab=pedidos" className="flex items-center gap-4 group">
                    <div className="h-11 w-11 rounded-[0.8rem] bg-orange-50 flex items-center justify-center shadow-sm">
                      <Package className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="text-md font-bold text-slate-700">Mis Entregas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/settings" className="flex items-center gap-4 group">
                <div className="h-11 w-11 rounded-[0.8rem] bg-slate-100 flex items-center justify-center shadow-sm">
                  <Settings className="h-5 w-5 text-slate-500" />
                </div>
                <span className="text-md font-bold text-slate-700">Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 pt-0 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => signOut(auth!)}
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
