'use client';

import React from 'react';
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Package, MessageCircle, LogOut, AlertTriangle, Pencil } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { safeFormat } from "@/lib/date-utils";
import { signOut } from "firebase/auth";
import { Auth } from "firebase/auth";

interface AppSidebarProps {
  user: any;
  userData: any;
  isAdmin: boolean;
  alerts: any[] | null;
  auth: Auth | null;
}

export function AppSidebar({ user, userData, isAdmin, alerts, auth }: AppSidebarProps) {
  return (
    <div className="p-8 space-y-8 h-full flex flex-col bg-white">
      <SheetHeader className="text-left">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20 shadow-xl border-4 border-slate-50">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="bg-slate-100 font-black">
                {userData?.firstName?.substring(0, 2) || "UR"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg border border-slate-100">
              <Pencil className="h-3 w-3 text-slate-300" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-2xl font-black tracking-tighter">
              {userData?.firstName || "Usuario"}
            </SheetTitle>
            <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest mt-1">
              {isAdmin ? "CENTRO CONTROL" : "REPARTIDOR"}
            </Badge>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-2 pt-4">
        <Link href="/profile" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-teal-500" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Mi Perfil</span>
        </Link>
        <Link href="/orders" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Historial</span>
        </Link>

        <div className="pt-6 px-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comunidad Live</h3>
            <Badge className="bg-emerald-100 text-emerald-600 text-[8px] font-black border-none animate-pulse">ACTIVA</Badge>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide">
            {alerts?.map(alert => (
              <div key={alert.id} className="p-3 bg-white/50 rounded-2xl border border-white/50 flex items-center gap-3 active:scale-95 transition-all">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", alert.type === 'sos' ? 'bg-red-50' : 'bg-blue-50')}>
                  {alert.type === 'sos' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <MessageCircle className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-slate-800 truncate uppercase">{alert.label}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Bumping: {safeFormat(alert.updatedAt || alert.createdAt, 'HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button 
        variant="ghost" 
        onClick={() => auth && signOut(auth)} 
        className="w-full justify-start gap-4 h-16 rounded-3xl text-red-500 font-black px-5 hover:bg-red-50 transition-colors text-sm"
      >
        <LogOut className="w-5 h-5" /> Salir
      </Button>
    </div>
  );
}