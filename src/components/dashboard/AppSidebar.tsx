
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Truck, User, Wallet, Package, MessageSquare, LogOut, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { useAuth } from "@/firebase"

interface AppSidebarProps {
  user: any;
  userData: any;
  isAdmin: boolean;
  onToggleRole: (role: "Driver" | "Admin") => void;
}

export function AppSidebar({ user, userData, isAdmin, onToggleRole }: AppSidebarProps) {
  const auth = useAuth()

  return (
    <div className="p-8 h-full flex flex-col space-y-8 bg-white">
      <SheetHeader className="text-left">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 shadow-xl border-4 border-slate-50">
            <AvatarFallback className="bg-slate-900 text-white font-black text-xl uppercase italic">
              {userData?.firstName?.substring(0,2) || "UR"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-2xl font-black tracking-tighter uppercase italic truncate">
              {userData?.firstName}
            </SheetTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isAdmin ? 'Enterprise Pro' : 'Elite Driver'}
            </p>
          </div>
        </div>
      </SheetHeader>
      
      <div className="bg-slate-100 p-1.5 rounded-full flex relative h-16 shadow-inner">
        <div className={cn(
          "absolute inset-y-1.5 w-[calc(50%-6px)] rounded-full shadow-md transition-all duration-300", 
          isAdmin ? "translate-x-full bg-slate-900" : "translate-x-0 bg-white"
        )}></div>
        <button 
          onClick={() => onToggleRole('Driver')} 
          className={cn("flex-1 z-10 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors", !isAdmin ? "text-slate-900" : "text-slate-500")}
        >
          <Truck className="w-4 h-4" /> Driver
        </button>
        <button 
          onClick={() => onToggleRole('Admin')} 
          className={cn("flex-1 z-10 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors", isAdmin ? "text-white" : "text-slate-500")}
        >
          <Building2 className="w-4 h-4" /> Empresa
        </button>
      </div>

      <nav className="flex-1 space-y-2">
         {[
           { href: "/profile", icon: Wallet, label: "Billetera", color: "text-teal-500", bg: "bg-teal-50" },
           { href: "/orders", icon: Package, label: "Pedidos", color: "text-blue-500", bg: "bg-blue-50" },
           { href: "/chat", icon: MessageSquare, label: "Mensajería", color: "text-violet-500", bg: "bg-violet-50" }
         ].map((item) => (
           <Link key={item.label} href={item.href} className="flex items-center gap-4 p-4 rounded-[24px] hover:bg-slate-50 transition-all group active:scale-95">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.bg)}>
               <item.icon className={cn("w-6 h-6", item.color)} />
             </div>
             <span className="font-black text-slate-800 text-xs uppercase tracking-widest">{item.label}</span>
           </Link>
         ))}
      </nav>

      <div className="pt-4 border-t border-slate-100">
        <Button 
          variant="ghost" 
          onClick={() => signOut(auth!)} 
          className="w-full justify-start gap-4 h-16 rounded-[24px] text-red-500 font-black px-6 hover:bg-red-50 transition-colors text-xs uppercase tracking-widest active:scale-95"
        >
          <LogOut className="w-5 h-5" /> Salir del Sistema
        </Button>
        <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em] mt-6">
          RutaRápida Pro v2.5
        </p>
      </div>
    </div>
  )
}
