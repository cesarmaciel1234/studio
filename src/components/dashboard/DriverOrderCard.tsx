
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, Phone, MessageSquare, AlertCircle, X, Truck, Shield, Loader2, Camera, PenTool, ShieldCheck } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useFirestore, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const splitAddress = (address: string) => {
  if (!address) return { street: "Calle", number: "S/N" };
  if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(address)) return { street: "Punto en Mapa", number: "" };
  
  const main = address.split(',')[0].trim();
  const match = main.match(/^(.*?)\s(\d+[a-zA-Z]?)$/);
  
  if (match) return { street: match[1], number: `Nº ${match[2]}` };
  return { street: main, number: "" };
}

export const DriverOrderCard = React.memo(function DriverOrderCard({ order, index, onOpenChat, currentCoords }: { order: any, index: number, onOpenChat: (id: string) => void, currentCoords: {lat: number, lng: number} | null }) {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isPoDOpen, setIsPoDOpen] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isPanicOpen, setIsPanicOpen] = useState(false)
  
  const handleAction = () => {
    if (!firestore) return
    if (order.status === 'Assigned') {
      updateDocumentNonBlocking(doc(firestore, "orders", order.id), { 
        status: 'Picked Up', 
        updatedAt: new Date().toISOString() 
      })
      toast({ title: "Paquete en tu Posesión" })
    } else {
      setIsPoDOpen(true)
    }
  }

  const confirmDelivery = () => {
    setIsCapturing(true)
    setTimeout(() => {
      updateDocumentNonBlocking(doc(firestore, "orders", order.id), { 
        status: 'Delivered', 
        actualDeliveryTime: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      })
      toast({ title: "Entrega Confirmada con PoD" })
      setIsCapturing(false)
      setIsPoDOpen(false)
    }, 800)
  }

  const handlePanic = () => {
    if (!firestore || !user?.uid) return
    
    if (!currentCoords) {
      toast({ title: "Sin GPS", description: "Se enviará alerta SOS sin coordenadas.", variant: "destructive" })
    }
    
    addDocumentNonBlocking(collection(firestore, "alerts"), {
      type: "sos",
      label: "SOS CRÍTICO",
      description: `¡Emergencia! Driver reporta incidencia en la Orden #${order.id.substring(0,5)}.`,
      orderId: order.id,
      authorId: user.uid,
      driverId: user.uid,
      latitude: currentCoords?.lat || 0,
      longitude: currentCoords?.lng || 0,
      createdAt: new Date().toISOString(),
      likes: []
    })

    toast({ 
      variant: "destructive", 
      title: "SOS ENVIADO A CENTRAL", 
      description: "La empresa ha recibido tu ubicación y está activando el protocolo." 
    })
    setIsPanicOpen(false)
  }

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!firestore) return
    updateDocumentNonBlocking(doc(firestore, "orders", order.id), { 
      status: "Pending", 
      driverId: null, 
      updatedAt: new Date().toISOString() 
    })
    toast({ title: "Pedido Liberado", description: "El pedido vuelve a la bandeja de entrada." })
  }

  const addressData = order.status === 'Assigned' ? splitAddress(order.pickupAddress) : splitAddress(order.deliveryAddress)
  const isPickup = order.status === 'Assigned'

  return (
    <div className="bg-white border-[3px] border-sky-100 rounded-[48px] p-6 shadow-xl mb-6 relative overflow-hidden transition-all hover:shadow-2xl text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col min-w-0 flex-1">
           <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 mb-2 w-fit">
             {isPickup ? "RECOGER EN 8 MIN" : "PUNTO DE ENTREGA"}
           </Badge>
           <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight uppercase line-clamp-2">
              {addressData.street}
            </h3>
            {addressData.number && (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{addressData.number}</p>
            )}
        </div>
        <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg shadow-sky-100 ml-4">
          {index + 1}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-emerald-600 uppercase">GANANCIA</span>
          </div>
          <span className="text-lg font-black text-emerald-600">${order.offeredPrice || '1,500'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button variant="outline" className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-[10px] uppercase gap-2">
          <Phone className="w-4 h-4 text-blue-600" /> Llamar
        </Button>
        <Button variant="outline" className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-[10px] uppercase gap-2" onClick={() => onOpenChat(order.id)}>
          <MessageSquare className="w-4 h-4 text-primary" /> Chat
        </Button>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={handleAction}
          className={cn(
            "w-full h-16 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95",
            isPickup ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
          )}
        >
          {isPickup ? "CONFIRMAR RECOJO" : "FINALIZAR ENTREGA"}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 h-12 rounded-xl text-red-500 font-black text-[10px] uppercase gap-2 bg-red-50" onClick={() => setIsPanicOpen(true)}>
            <AlertCircle className="w-4 h-4" /> SOS CENTRAL
          </Button>
          <Button variant="ghost" className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400" onClick={handleUndo}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isPanicOpen} onOpenChange={setIsPanicOpen}>
        <DialogContent className="max-w-md w-[92vw] rounded-[48px] p-8 border-none shadow-2xl">
          <DialogHeader className="text-center space-y-4">
             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
               <AlertTriangle className="w-10 h-10 text-red-600" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tight text-red-600">CENTRAL DE EMERGENCIA</DialogTitle>
             <p className="text-sm text-slate-500 font-medium leading-relaxed">¿Deseas reportar una incidencia crítica? La central recibirá tu posición exacta y se activará el protocolo de auxilio.</p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <button 
              onClick={() => toast({ title: "Asistencia Mecánica", description: "Solicitando grúa a tu ubicación actual..." })}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-2 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <Truck className="w-5 h-5 mx-auto text-blue-500" />
              <p className="text-[8px] font-black text-slate-400 uppercase">Mecánico</p>
            </button>
            <button 
              onClick={() => toast({ title: "Seguro VRT Activo", description: "Póliza #VRT-99281. Contacto: 0800-SAFE-BIZ" })}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-2 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <Shield className="w-5 h-5 mx-auto text-emerald-500" />
              <p className="text-[8px] font-black text-slate-400 uppercase">Seguro VRT</p>
            </button>
          </div>
          <DialogFooter className="flex flex-col gap-3 mt-4">
            <Button onClick={handlePanic} className="w-full h-16 rounded-2xl bg-red-600 text-white font-black uppercase shadow-xl shadow-red-100">REPORTAR AHORA</Button>
            <Button variant="ghost" onClick={() => setIsPanicOpen(false)} className="w-full h-12 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-[10px]">CANCELAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPoDOpen} onOpenChange={setIsPoDOpen}>
        <DialogContent className="max-w-md w-[92vw] rounded-[48px] p-8 border-none shadow-2xl">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <DialogTitle className="xl font-black uppercase tracking-tight">Prueba de Entrega (PoD)</DialogTitle>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Orden #{order.id.substring(0, 5)}</p>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Camera className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-widest">Subir Foto del Paquete</span>
            </div>
            <div className="h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
              <PenTool className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-widest">Firma Digital del Cliente</span>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={confirmDelivery} 
              disabled={isCapturing}
              className="w-full h-16 rounded-[24px] bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : "FINALIZAR ENTREGA PRO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})
