
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, MapPin, Clock, MoreVertical, CheckCircle2, ChevronRight, Truck, Home, RefreshCcw, X } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, where, orderBy, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

const splitAddress = (address: string) => {
  if (!address) return { street: "Calle", number: "S/N" };
  if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(address)) return { street: "Punto en Mapa", number: "" };
  
  const main = address.split(',')[0].trim();
  const match = main.match(/^(.*?)\s(\d+[a-zA-Z]?)$/);
  
  if (match) return { street: match[1], number: `Nº ${match[2]}` };
  return { street: main, number: "" };
}

export default function OrdersPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("Assigned")

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user?.uid])
  const { data: userData } = useDoc(userDocRef)
  const isAdmin = userData?.role === 'Admin'

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null
    if (isAdmin) {
      return query(collection(firestore, "orders"), where("companyId", "==", user.uid), orderBy("updatedAt", "desc"))
    } else {
      return query(collection(firestore, "orders"), where("driverId", "==", user.uid), orderBy("updatedAt", "desc"))
    }
  }, [firestore, user?.uid, isAdmin])

  const { data: orders, isLoading } = useCollection(ordersQuery)

  const filteredOrders = orders?.filter(order => {
    if (activeTab === "Pending") return order.status === "Pending"
    if (activeTab === "Assigned") return ["Assigned", "Picked Up", "In Transit"].includes(order.status)
    if (activeTab === "Completed") return order.status === "Delivered"
    return false
  }) || []

  const handleStatusUpdate = (orderId: string, nextStatus: string) => {
    if (!firestore || !user?.uid) return
    const updates: any = {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    }
    if (nextStatus === 'Assigned') updates.driverId = user.uid
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), updates)
    toast({ title: "Actualizado", description: `Pedido marcado como ${nextStatus}` })
  }

  const handleUndo = (orderId: string) => {
    if (!firestore) return
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), { 
      status: "Pending", 
      driverId: null, 
      updatedAt: new Date().toISOString() 
    })
    toast({ title: "Pedido Liberado" })
  }

  return (
    <div className="p-6 space-y-6 pb-24 bg-slate-50 min-h-screen overflow-y-auto scrollbar-hide">
      <header className="flex items-center gap-4 text-left pt-6">
        <Link href="/">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-[22px] bg-white border-none shadow-sm active:scale-95 shrink-0">
            <Home className="w-6 h-6 text-slate-600" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black font-headline tracking-tight text-slate-900 leading-tight">
            {isAdmin ? "Logística Biz" : "Mi Historial"}
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
            Gestión en Tiempo Real
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
          <Truck className="w-6 h-6 text-primary" />
        </div>
      </header>

      <Tabs defaultValue="Assigned" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-200/50 p-1.5 rounded-[28px] h-14">
          <TabsTrigger value="Pending" className="rounded-[22px] font-black text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm">Esperando</TabsTrigger>
          <TabsTrigger value="Assigned" className="rounded-[22px] font-black text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm">En Curso</TabsTrigger>
          <TabsTrigger value="Completed" className="rounded-[22px] font-black text-[10px] tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm">Listas</TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-20 opacity-30 animate-pulse">
              <RefreshCcw className="w-12 h-12 mx-auto animate-spin mb-4" />
              <p className="font-black text-[10px] uppercase tracking-widest">Sincronizando...</p>
            </div>
          ) : filteredOrders.map(order => {
            const pickup = splitAddress(order.pickupAddress);
            const delivery = splitAddress(order.deliveryAddress);
            return (
              <Card key={order.id} className="rounded-[40px] border-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 bg-white">
                <CardContent className="p-6 text-left">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[20px] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                        <Package className="w-7 h-7 text-slate-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-black font-headline text-slate-800 text-sm">#{order.id.substring(0, 5)}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.deliveryContactName}</p>
                      </div>
                    </div>
                    <Badge className={cn("border-none px-3 font-black text-[9px] tracking-widest uppercase", 
                      order.status === 'Pending' ? "bg-amber-100 text-amber-600" :
                      order.status === 'Delivered' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recojo</p>
                        <p className="text-sm font-bold text-slate-800 uppercase leading-tight line-clamp-2">{pickup.street}</p>
                        {pickup.number && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">{pickup.number}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Entrega</p>
                        <p className="text-sm font-bold text-slate-800 uppercase leading-tight line-clamp-2">{delivery.street}</p>
                        {delivery.number && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">{delivery.number}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isAdmin && order.status === 'Assigned' && (
                      <Button className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase shadow-lg shadow-blue-100" onClick={() => handleStatusUpdate(order.id, 'Picked Up')}>RECOGER</Button>
                    )}
                    {!isAdmin && order.status === 'Picked Up' && (
                      <Button className="flex-1 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase shadow-lg shadow-emerald-100" onClick={() => handleStatusUpdate(order.id, 'Delivered')}>ENTREGAR</Button>
                    )}
                    <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500" onClick={() => handleUndo(order.id)}><X className="w-5 h-5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Tabs>
    </div>
  )
}
