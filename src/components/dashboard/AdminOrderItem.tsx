
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Truck, MapPin, MessageSquare, X, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export const AdminOrderItem = React.memo(function AdminOrderItem({ order, onCenterMap, onOpenChat }: { order: any, onCenterMap: (lat: number, lng: number) => void, onOpenChat: (orderId: string) => void }) {
  const firestore = useFirestore()
  const { toast } = useToast()
  const driverRef = useMemoFirebase(() => {
    if (!firestore || !order.driverId) return null
    return doc(firestore, "users", order.driverId, "driverProfile", order.driverId)
  }, [firestore, order.driverId])
  const { data: driverData } = useDoc(driverRef)

  const isPending = order.status === 'Pending'

  const handleUndoOrder = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!firestore) return
    updateDocumentNonBlocking(doc(firestore, "orders", order.id), {
      status: "Pending",
      driverId: null,
      updatedAt: new Date().toISOString()
    })
    toast({ title: "Pedido Liberado", description: "El pedido ha vuelto a la bandeja de entrada." })
  }

  return (
    <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden mb-4 hover:shadow-md transition-all active:scale-98">
      <CardContent className="p-6 space-y-4 text-left">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", isPending ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100")}>
              <Truck className={cn("w-6 h-6", isPending ? "text-amber-600" : "text-blue-600")} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">#{order.id.substring(0, 5)} • {order.deliveryContactName}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.status}</p>
            </div>
          </div>
          <Badge className={cn("border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest", 
            isPending ? 'bg-amber-100 text-amber-600' : 
            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
          )}>
            {order.status === 'Pending' ? 'PENDIENTE' : order.status === 'Delivered' ? 'LISTO' : 'EN RUTA'}
          </Badge>
        </div>

        {!isPending && driverData && (
          <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Avatar className="w-6 h-6 border border-slate-100">
                 <AvatarFallback className="text-[8px] font-black">{driverData.firstName?.substring(0,1)}</AvatarFallback>
               </Avatar>
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                {driverData.firstName} {driverData.lastName || ''}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-500 fill-current" />
              <p className="text-[8px] font-black text-emerald-500 uppercase">IA TRACKING</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {!isPending && driverData?.currentLatitude && (
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-slate-100 text-[10px] font-black uppercase tracking-widest gap-2 bg-slate-50 hover:bg-slate-100"
              onClick={() => onCenterMap(driverData.currentLatitude, driverData.currentLongitude)}
            >
              <MapPin className="w-4 h-4 text-blue-600" /> Rastrear
            </Button>
          )}
          {!isPending && (
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-slate-100 text-[10px] font-black uppercase tracking-widest gap-2 bg-slate-50"
              onClick={() => onOpenChat(order.id)}
            >
              <MessageSquare className="w-4 h-4 text-primary" /> Chat
            </Button>
          )}
          <Button 
            variant="outline" 
            className="flex-1 h-12 rounded-xl border-red-100 text-[10px] font-black uppercase tracking-widest gap-2 bg-red-50 text-red-500 hover:bg-red-100"
            onClick={handleUndoOrder}
          >
            <X className="w-4 h-4" /> Soltar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
