
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Users, 
  LogOut,
  ShieldAlert,
  Package,
  LayoutDashboard,
  Settings,
  MessageSquare,
  Building2,
  X,
  Pencil,
  ShieldCheck
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useUser, useDoc, useMemoFirebase, useFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { signOut } from "firebase/auth"

export function AppSidebar() {
  const { toggleSidebar } = useSidebar()
  const { user } = useUser()
  const { firestore, auth } = useFirebase()

  const userRef = useMemoFirebase(() => (!firestore || !user?.uid) ? null : doc(firestore, "users", user.uid), [user?.uid, firestore])
  const { data: userData } = useDoc(userRef)
  
  const isAdmin = userData?.role === 'Admin'

  return (
    <Sidebar className="border-none bg-slate-100/90 backdrop-blur-xl">
      <SidebarHeader className="p-8 pb-4">
        <div className="flex justify-end -mt-4 -mr-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="rounded-full hover:bg-white/50 h-10 w-10"><X className="h-5 w-5 text-slate-400" /></Button>
        </div>

        <div className="flex items-center gap-4 mt-2 mb-8 text-left">
          <Avatar className="h-16 w-16 border-4 border-white shadow-xl">
            <AvatarFallback className={cn("text-2xl font-black", isAdmin ? "bg-slate-900 text-white" : "bg-white text-slate-900")}>
              {isAdmin ? "E" : "R"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900 truncate max-w-[120px]">{userData?.firstName || "Usuario"}</span>
              <Pencil className="h-3 w-3 text-slate-300" />
            </div>
            <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest mt-1">
              {isAdmin ? "CENTRO CONTROL" : "REPARTIDOR"}
            </Badge>
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-[1.5rem] flex items-center gap-3 mb-6 shadow-xl">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-white" /></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Protocolo Activo</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-8 space-y-2">
        <SidebarMenu className="gap-4">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/dashboard" className="flex items-center gap-4 group">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm group-hover:bg-blue-600 transition-all">
                  <LayoutDashboard className="h-6 h-6 text-blue-500 group-hover:text-white" />
                </div>
                <span className="text-md font-black text-slate-700 uppercase tracking-tight">Inicio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/dashboard" className="flex items-center gap-4 group">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm group-hover:bg-emerald-600 transition-all">
                  <Package className="h-6 h-6 text-emerald-500 group-hover:text-white" />
                </div>
                <span className="text-md font-black text-slate-700 uppercase tracking-tight">Paradero</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/dashboard" className="flex items-center gap-4 group">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shadow-sm group-hover:bg-amber-600 transition-all">
                  <Users className="h-6 h-6 text-amber-500 group-hover:text-white" />
                </div>
                <span className="text-md font-black text-slate-700 uppercase tracking-tight">Mi Flota</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
              <Link href="/dashboard" className="flex items-center gap-4 group">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-all">
                  <MessageSquare className="h-6 h-6 text-white" />
                </div>
                <span className="text-md font-black text-slate-700 uppercase tracking-tight">Central</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-8 mt-auto">
        <Button onClick={() => signOut(auth!)} className="w-full h-16 rounded-[2rem] bg-red-50 text-red-500 font-black border-none hover:bg-red-100 shadow-sm transition-all">
          <LogOut className="h-5 w-5 mr-3" /> Salir Sistema
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
