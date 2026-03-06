"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, ShieldCheck, LogOut, Home, Wallet, MessageCircle, ChevronRight, Loader2, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { safeFormat } from "@/lib/date-utils"

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false)
  const { user, isUserLoading: isAuthLoading } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  
  useEffect(() => { setMounted(true) }, [])

  // CORRECCIÓN: Primero leemos el rol del usuario en la colección maestros 'users'
  const userMasterRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user?.uid])
  const { data: userMasterData, isLoading: isMasterLoading } = useDoc(userMasterRef)

  const isAdmin = userMasterData?.role === 'Admin'

  // Leemos el perfil específico según el rol
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isMasterLoading) return null
    const collectionName = isAdmin ? "companyProfiles" : "driverProfiles"
    return doc(firestore, collectionName, user.uid)
  }, [firestore, user?.uid, isAdmin, isMasterLoading])
  const { data: userData, isLoading: isUserDataLoading } = useDoc(profileRef)

  const driverOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null
    return query(collection(firestore, "orders"), where(isAdmin ? "companyId" : "driverId", "==", user.uid))
  }, [firestore, user?.uid, isAdmin])
  const { data: orders } = useCollection(driverOrdersQuery)

  const activeAlertsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "alerts"), orderBy("updatedAt", "desc"), limit(10))
  }, [firestore, user])
  const { data: activeAlerts } = useCollection(activeAlertsQuery)

  const stats = useMemo(() => {
    if (!orders) return { balance: 0, count: 0 }
    const delivered = orders.filter(o => o.status === 'Delivered')
    const balance = delivered.reduce((acc, o) => acc + (Number(o.offeredPrice) || 0), 0)
    return { balance, count: delivered.length }
  }, [orders])

  if (!mounted || isAuthLoading || isMasterLoading || (user && isUserDataLoading)) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" /></div>

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-slate-50">
      <div className="p-6 space-y-8 pb-32">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="outline" size="icon" className="h-14 w-14 rounded-[22px] bg-white border-none shadow-sm shrink-0"><Home className="w-6 h-6 text-slate-600" /></Button></Link>
          <div className="flex-1 bg-slate-200/50 p-1.5 rounded-[24px] flex items-center shadow-inner relative h-14">
            <div className="absolute inset-y-1.5 w-[calc(100%-12px)] rounded-[20px] shadow-sm bg-white"></div>
            <button className="flex-1 z-10 text-[10px] font-black uppercase text-center text-slate-900 tracking-widest">
              {isAdmin ? "PANEL CONTROL" : "REPARTIDOR PRO"}
            </button>
          </div>
        </div>

        <header className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-white shadow-2xl">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="text-2xl font-black bg-slate-100">{userMasterData?.firstName?.substring(0,2) || "UR"}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-1 right-1 bg-emerald-500 p-2 rounded-full border-4 border-white shadow-lg"><ShieldCheck className="w-4 h-4 text-white" /></div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900">{userMasterData?.firstName || "Usuario"}</h1>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-500 fill-current" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría Gold • {stats.count} Entregas</p>
            </div>
          </div>
        </header>

        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
           <div className="space-y-4 text-left">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Billetera Pro</h2>
             <Card className="rounded-[40px] p-8 shadow-sm border border-slate-100 bg-white space-y-6">
               <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Disponible para Retiro</p>
                   <h3 className="text-4xl font-black text-slate-900 tracking-tighter">${stats.balance.toLocaleString()}</h3>
                 </div>
                 <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center">
                   <Wallet className="w-8 h-8 text-emerald-600" />
                 </div>
               </div>
               <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase shadow-lg tracking-widest">RETIRAR FONDOS</Button>
             </Card>
           </div>

           <div className="space-y-4 text-left">
             <header className="flex justify-between items-center px-2">
               <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Comunidad Live</h2>
               <Badge className="bg-blue-100 text-blue-600 border-none text-[8px] font-black tracking-widest uppercase px-2">ACTIVA</Badge>
             </header>
             <div className="space-y-3">
               {activeAlerts?.map(alert => (
                 <Card key={alert.id} className="rounded-[32px] border-none shadow-sm bg-white p-5 flex items-center gap-4 active:scale-95 transition-all">
                   <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", alert.type === 'sos' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400')}>
                     <MessageCircle className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 flex-1">
                     <h4 className="font-black text-slate-900 text-[12px] uppercase truncate tracking-tight">{alert.label}</h4>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Bumping: {safeFormat(alert.updatedAt || alert.createdAt, 'HH:mm')}</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-300" />
                 </Card>
               ))}
             </div>
           </div>
        </section>

        <Button variant="ghost" onClick={() => signOut(auth!)} className="w-full justify-start gap-4 h-16 rounded-[28px] font-black px-6 text-red-500 hover:bg-red-50 transition-colors tracking-widest text-xs"><LogOut className="w-6 h-6" /> CERRAR SESIÓN</Button>
      </div>
    </div>
  )
}