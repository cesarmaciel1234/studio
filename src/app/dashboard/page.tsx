"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Navigation, 
  Truck,
  Layers,
  MessageSquare,
  ShieldAlert,
  Menu,
  Clock,
  AlertTriangle,
  Package,
  ChevronRight,
  ChevronLeft,
  Flame,
  MapPin,
  DollarSign,
  TrendingUp,
  LogOut,
  Store,
  Loader2,
  Send,
  Phone,
  Heart,
  Boxes,
  Bot,
  Compass,
  Zap,
  MoreHorizontal,
  Target,
  Maximize,
  Sparkles,
  X,
  User,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"

import { 
  useFirebase, 
  useUser, 
  useCollection, 
  useDoc, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase"
import { collection, doc, query, where, orderBy } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { CapoAssistant } from "@/components/dashboard/CapoAssistant"

// Importación dinámica del mapa para evitar errores de SSR
const InteractiveMap = dynamic(() => import('@/components/dashboard/InteractiveMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
});

const CoroItem = ({ alert, userId, onOpenChat }: { alert: any, userId: string, onOpenChat: (id: string) => void }) => {
  const Icon = alert.type === 'policia' ? ShieldAlert : 
               alert.type === 'trafico' ? Clock : 
               alert.type === 'sos' ? Navigation : AlertTriangle;
  
  const colorClass = alert.type === 'policia' ? 'text-blue-600' : 
                     alert.type === 'trafico' ? 'text-orange-600' : 
                     alert.type === 'sos' ? 'text-red-600' : 
                     alert.type === 'obras' ? 'text-emerald-600' : 'text-slate-600';
  
  const bgColorClass = alert.type === 'policia' ? 'bg-blue-50' : 
                       alert.type === 'trafico' ? 'bg-orange-50' : 
                       alert.type === 'sos' ? 'bg-red-50' : 
                       alert.type === 'obras' ? 'bg-emerald-50' : 'bg-slate-50';

  return (
    <Card className="rounded-[32px] border-none shadow-sm bg-white p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4">
      <div className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", bgColorClass)}>
          <Icon className={cn("w-6 h-6", colorClass)} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center justify-between mb-1">
             <div className="flex items-center gap-2">
               <h4 className={cn("font-black text-xs uppercase tracking-tight", colorClass)}>{alert.label}</h4>
               <span className="text-slate-200">•</span>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                 {alert.createdAt ? format(new Date(alert.createdAt), 'HH:mm') : 'AHORA'}
               </p>
             </div>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300">
               <MoreHorizontal className="w-4 h-4" />
             </Button>
          </div>
          <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">
            {alert.description}
          </p>
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors group">
              <Heart className={cn("w-4 h-4", alert.likes?.includes(userId) && "fill-red-500 text-red-500")} />
              <span className="text-[10px] font-black">{alert.likes?.length || 0}</span>
            </button>
            <button onClick={() => onOpenChat(alert.id)} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] font-black">COMENTAR</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

const PendingOrderCard = ({ order, onAccept }: { order: any, onAccept: (id: string) => void }) => {
  return (
    <Card className="rounded-[40px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white overflow-hidden mb-6 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
             <Package className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">RECOMPENSA</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter">
              +${order.reward || "1,500"}
            </p>
          </div>
        </div>
        <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[10px] py-1 px-3 rounded-lg">
          INMEDIATO
        </Badge>
      </div>

      <div className="relative pl-12 pb-8">
        <div className="absolute left-[23px] top-6 bottom-6 w-[2px] border-l-2 border-dashed border-slate-100" />
        <div className="relative mb-10">
          <div className="absolute -left-[38px] top-0 w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-50 z-10">
            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">PUNTO DE RECOJO</p>
          <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">
            {order.originName || "Empresa Central"}
          </h4>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ORIGEN EMPRESA</p>
        </div>
        <div className="relative">
          <div className="absolute -left-[38px] top-0 w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-50 z-10">
             <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">ENTREGA FINAL</p>
          <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase max-w-[220px]">
            {order.deliveryAddress || "Dirección Nacional de Migraciones"}
          </h4>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
        <div className="flex gap-6">
          <div className="text-left">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">TIEMPO</p>
            <p className="text-xl font-black text-slate-900">{order.timeEstimate || "8m"}</p>
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">DISTANCIA</p>
            <p className="text-xl font-black text-blue-600">{order.distanceEstimate || "671m"}</p>
          </div>
        </div>
        <Button 
          onClick={() => onAccept(order.id)}
          className="h-16 px-10 rounded-[2rem] bg-slate-950 hover:bg-black text-white font-black text-sm tracking-tight shadow-2xl"
        >
          ACEPTAR CARGA
        </Button>
      </div>
    </Card>
  )
}

const LoginScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center space-y-8">
     <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-500/20">
       <Truck className="w-12 h-12 text-white" />
     </div>
     <div className="space-y-2">
       <h1 className="text-4xl font-black text-white tracking-tighter">RutaRápida Pro</h1>
       <p className="text-blue-500 font-bold text-xs uppercase tracking-[0.3em]">Logística Inteligente</p>
     </div>
     <Button className="w-full max-w-xs h-16 rounded-3xl bg-white text-slate-900 font-black text-lg" asChild>
       <Link href="/login">EMPEZAR SESIÓN</Link>
     </Button>
  </div>
)

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { firestore, auth } = useFirebase()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('ruta')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mapCenterTrigger, setMapCenterTrigger] = useState(0)
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null)
  const [heading, setHeading] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false)
  const [selectedAlertType, setSelectedAlertType] = useState<{id: string, label: string} | null>(null)
  const [alertDescription, setAlertDescription] = useState("")
  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string | null>(null)
  const [selectedChatAlertId, setSelectedChatAlertId] = useState<string | null>(null)
  const [chatMessageText, setChatMessageText] = useState("")
  const [alertFilter, setAlertFilter] = useState<'all' | 'mine'>('all')
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // HOOKS DE FIREBASE MEMOIZADOS (TODOS AL INICIO PARA CUMPLIR RULES OF HOOKS)
  const userRef = useMemoFirebase(() => (!firestore || !user?.uid) ? null : doc(firestore, "users", user.uid), [user?.uid, firestore])
  const alertsQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, "alerts"), orderBy("createdAt", "desc")), [firestore])
  const pendingOrdersQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, "orders"), where("status", "==", "Pending")), [firestore])
  const driverActiveOrdersQuery = useMemoFirebase(() => (!firestore || !user?.uid) ? null : query(collection(firestore, "orders"), where("driverId", "==", user.uid), where("status", "in", ["Assigned", "Picked Up", "In Transit"])), [user?.uid, firestore])
  const orderChatMessagesQuery = useMemoFirebase(() => (!firestore || !selectedChatOrderId) ? null : query(collection(firestore, `orders/${selectedChatOrderId}/chatMessages`), orderBy("timestamp", "asc")), [selectedChatOrderId, firestore])
  const alertChatMessagesQuery = useMemoFirebase(() => (!firestore || !selectedChatAlertId) ? null : query(collection(firestore, `alerts/${selectedChatAlertId}/messages`), orderBy("timestamp", "asc")), [selectedChatAlertId, firestore])

  // DATOS DE FIREBASE
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef)
  const { data: alerts } = useCollection(alertsQuery)
  const { data: pendingOrders } = useCollection(pendingOrdersQuery)
  const { data: driverActiveOrders } = useCollection(driverActiveOrdersQuery)
  const { data: orderChatMessages } = useCollection(orderChatMessagesQuery)
  const { data: alertChatMessages } = useCollection(alertChatMessagesQuery)

  // DERIVADOS MEMOIZADOS
  const hasActiveSOS = useMemo(() => alerts?.some(a => a.type === 'sos') || false, [alerts])
  const activeOrder = useMemo(() => driverActiveOrders?.[0], [driverActiveOrders])
  const isCentralLayout = useMemo(() => activeTab === 'central', [activeTab])
  
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'mine' && user?.uid) {
      return alerts?.filter(a => a.authorId === user.uid) || []
    }
    return alerts || []
  }, [alerts, alertFilter, user?.uid])

  useEffect(() => {
    setMounted(true)
    const tab = searchParams.get('tab')
    const filter = searchParams.get('filter')
    if (tab) setActiveTab(tab)
    if (filter === 'mine') setAlertFilter('mine')
    
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          if (pos.coords.heading !== null) setHeading(pos.coords.heading)
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [searchParams])

  useEffect(() => {
    if (activeOrder && isNavigating && activeOrder.deliveryLatitude && activeOrder.deliveryLongitude) {
      setDestinationCoords([activeOrder.deliveryLatitude, activeOrder.deliveryLongitude])
    } else {
      setDestinationCoords(null)
    }
  }, [activeOrder, isNavigating])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo(0, chatScrollRef.current.scrollHeight)
    }
  }, [selectedChatOrderId, selectedChatAlertId, orderChatMessages?.length, alertChatMessages?.length])

  const handlePublishAlert = useCallback(() => {
    if (!selectedAlertType || !user?.uid || !firestore || !currentCoords) return
    addDocumentNonBlocking(collection(firestore, "alerts"), {
      type: selectedAlertType.id,
      label: selectedAlertType.label,
      description: alertDescription,
      latitude: currentCoords.lat,
      longitude: currentCoords.lng,
      authorId: user.uid,
      likes: [],
      createdAt: new Date().toISOString(),
      status: "Active"
    })
    setAlertDescription("")
    setSelectedAlertType(null)
    toast({ title: "Reporte Vial Publicado" })
  }, [selectedAlertType, user?.uid, firestore, currentCoords, alertDescription, toast])

  const handleSendChatMessage = useCallback(() => {
    if (!chatMessageText.trim() || !user?.uid || !firestore) return
    const activeId = selectedChatOrderId || (activeTab === 'chat' && activeOrder?.id);
    
    if (activeId) {
      addDocumentNonBlocking(collection(firestore, `orders/${activeId}/chatMessages`), {
        authorId: user.uid,
        content: chatMessageText,
        timestamp: new Date().toISOString()
      })
    } else if (selectedChatAlertId) {
      addDocumentNonBlocking(collection(firestore, `alerts/${selectedChatAlertId}/messages`), {
        authorId: user.uid,
        authorName: userData?.firstName || "Repartidor",
        content: chatMessageText,
        timestamp: new Date().toISOString()
      })
    }
    setChatMessageText("")
  }, [chatMessageText, user?.uid, firestore, selectedChatOrderId, selectedChatAlertId, activeTab, activeOrder?.id, userData?.firstName])

  const handleAcceptOrder = useCallback((orderId: string) => {
    if (!user?.uid || !firestore) return
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), { 
      driverId: user.uid, 
      status: "Assigned", 
      updatedAt: new Date().toISOString() 
    })
    toast({ title: "Pedido Asignado Correctamente" })
  }, [user?.uid, firestore, toast])

  if (!mounted) return null
  if (isUserLoading || (user && isUserDataLoading)) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>
  if (!user) return <LoginScreen />

  // MODO CENTRAL: LAYOUT DE PANTALLA COMPLETA PARA HISTORIAL
  if (isCentralLayout) {
    return (
      <div className="h-screen w-full bg-white flex flex-col animate-in fade-in duration-500">
        <header className="p-8 flex items-center gap-6 border-b border-slate-100 bg-white sticky top-0 z-50">
          <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-slate-50" onClick={() => setActiveTab('ruta')}>
            <ArrowLeft className="h-7 w-7 text-slate-900" />
          </Button>
          <div className="flex-1">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">Central</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Historial Mensajes Privados</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          {(selectedChatOrderId || selectedChatAlertId) ? (
            <div className="h-full flex flex-col bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
               <header className="flex items-center gap-4 p-8 border-b border-slate-50 bg-white">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedChatOrderId(null); setSelectedChatAlertId(null); }} className="rounded-full h-12 w-12 bg-slate-50"><ChevronLeft className="w-6 h-6" /></Button>
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase">
                      {selectedChatOrderId ? `Orden #${selectedChatOrderId.substring(0, 5)}` : `Reporte Comunidad`}
                    </h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">En línea</p>
                  </div>
                </header>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 p-8 scrollbar-hide bg-slate-50/50">
                  {(selectedChatOrderId ? orderChatMessages : alertChatMessages)?.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.authorId === user.uid ? 'justify-end' : 'justify-start')}>
                      <div className={cn("max-w-[75%] p-6 rounded-[2rem] text-sm shadow-sm", msg.authorId === user.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100')}>
                        {msg.authorName && msg.authorId !== user.uid && <p className="text-[10px] font-black mb-2 opacity-50 uppercase tracking-widest">{msg.authorName}</p>}
                        <p className="font-medium leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-8 border-t border-slate-50 bg-white">
                  <div className="flex gap-4">
                    <Input placeholder="Escribe un mensaje privado..." className="h-16 bg-slate-50 border-none rounded-full px-8 font-medium shadow-inner flex-1 text-base" value={chatMessageText} onChange={(e) => setChatMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} />
                    <Button onClick={handleSendChatMessage} size="icon" className="h-16 w-16 rounded-full bg-slate-900 text-white shadow-2xl shrink-0"><Send className="w-6 h-6" /></Button>
                  </div>
                </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
               <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Historial Privado</h3>
               </div>
               {driverActiveOrders?.map(order => (
                  <div key={order.id} className="rounded-[40px] bg-white border border-slate-100 p-8 flex items-center justify-between hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group" onClick={() => { setSelectedChatOrderId(order.id); setSelectedChatAlertId(null); }}>
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 transition-colors">
                        <MessageSquare className="w-8 h-8 text-slate-900 group-hover:text-white transition-colors" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">ORDEN #{order.id.substring(0, 5)}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest px-3 py-1">PRIVADO</Badge>
                          <span className="text-slate-200">•</span>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.status}</p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-8 h-8 text-slate-200 group-hover:text-slate-900 transition-colors" />
                  </div>
                ))}
                {driverActiveOrders?.length === 0 && (
                  <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                    <MessageSquare className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                    <p className="text-slate-400 font-black uppercase text-sm tracking-[0.2em]">No hay historial de mensajes privados</p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      {/* MAP LAYER */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          center={currentCoords ? [currentCoords.lat, currentCoords.lng] : [19.4326, -99.1332]} 
          destination={destinationCoords}
          alerts={alerts}
          heading={heading}
          isNavigating={isNavigating && !!activeOrder}
          centerTrigger={mapCenterTrigger}
          currentUserId={user?.uid}
        />
      </div>

      {/* FLOATING HEADER CONTROLS */}
      <div className="absolute top-8 left-8 right-8 z-10 flex justify-between pointer-events-none">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" className="h-16 w-16 rounded-[1.5rem] shadow-2xl bg-white/95 backdrop-blur-md border-none hover:bg-white text-slate-700 pointer-events-auto">
              <div className="relative">
                <Menu className="h-7 w-7" />
                {hasActiveSOS && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-ping"></div>}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0 border-none bg-white/80 backdrop-blur-xl shadow-2xl rounded-r-[48px]">
            <div className="p-8 space-y-8 h-full flex flex-col">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 shadow-xl border-4 border-white">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="bg-slate-100 font-black">{userData?.firstName?.substring(0,2) || "UR"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-2xl font-black tracking-tighter flex items-center gap-2 uppercase">
                      {userData?.firstName || "Usuario"}
                    </SheetTitle>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 space-y-4 pt-4">
                <Link href="/wallet" className="flex items-center gap-4 group">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-emerald-50 flex items-center justify-center shadow-sm">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Mi billetera</span>
                </Link>
                <button onClick={() => { setActiveTab('pedidos'); setIsExpanded(true); }} className="flex items-center gap-4 group w-full text-left">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-blue-50 flex items-center justify-center shadow-sm">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Pedidos</span>
                </button>
                <button onClick={() => { setActiveTab('alerta'); setIsExpanded(true); setAlertFilter('mine'); }} className="flex items-center gap-4 group w-full text-left">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-red-50 flex items-center justify-center shadow-sm">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Mis Alertas (Historial)</span>
                </button>
                <button onClick={() => { setActiveTab('central'); }} className="flex items-center gap-4 group w-full text-left">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-slate-100 flex items-center justify-center shadow-sm">
                    <MessageSquare className="h-5 w-5 text-slate-900" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Central: Historial Mensajes</span>
                </button>
              </div>
              <Button variant="ghost" onClick={() => signOut(auth!)} className="w-full justify-start gap-4 h-16 rounded-3xl text-red-500 font-black px-5 hover:bg-red-50 text-sm"><LogOut className="w-5 h-5" /> Salir del sistema</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ACTION STACK (CONTROLES FLOTANTES) */}
      <div className="absolute top-8 right-8 z-10 flex flex-col gap-4 pointer-events-auto">
        <Button variant="secondary" size="icon" className="h-20 w-20 rounded-full shadow-2xl bg-[#1e293b] border-none text-slate-400 hover:text-white transition-all">
          <Compass className="h-8 w-8" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setMapCenterTrigger(t => t + 1)}
          className="h-20 w-20 rounded-full shadow-2xl bg-white border-none text-slate-900"
        >
          <Target className="h-8 w-8" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setIsMapFullscreen(!isMapFullscreen)}
          className="h-20 w-20 rounded-full shadow-2xl bg-white border-none text-slate-900"
        >
          <Maximize className="h-8 w-8" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setIsAiAssistantOpen(true)}
          className="h-20 w-20 rounded-full shadow-2xl bg-[#2563eb] border-none text-white hover:bg-blue-700"
        >
          <Sparkles className="h-8 w-8" />
        </Button>
      </div>

      {/* AI ASSISTANT OVERLAY */}
      {isAiAssistantOpen && (
        <div className="absolute inset-0 z-[60] p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="h-full max-w-lg mx-auto">
            <CapoAssistant onClose={() => setIsAiAssistantOpen(false)} />
          </div>
        </div>
      )}

      {/* SLIDING BOTTOM PANEL */}
      <div className={cn("absolute inset-x-0 bottom-0 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.1)] rounded-t-[3.5rem] transition-all duration-500 ease-in-out z-20 overflow-hidden flex flex-col", isExpanded ? "top-20" : "top-1/2")}>
        <div className="h-12 w-full flex items-center justify-center cursor-pointer active:bg-slate-50" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={cn("w-16 h-1.5 rounded-full mb-8", hasActiveSOS ? "bg-red-600 animate-pulse" : "bg-slate-200")}></div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-hide">
          {/* TAB NAVIGATION: RESTORED PRIVATE MESSAGING TAB FOR ACTIVE ORDERS */}
          <div className="flex justify-center mb-10 sticky top-0 bg-white pt-2 pb-4 z-30">
            <div className="bg-slate-50 p-2 rounded-[2.5rem] flex items-center gap-2 shadow-inner border border-slate-100">
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("ruta")} className={cn("h-16 w-16 rounded-[1.8rem]", activeTab === "ruta" ? "bg-slate-900 text-white" : "text-slate-400")}><Truck className="h-7 w-7" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("pedidos")} className={cn("h-16 w-16 rounded-[1.8rem]", activeTab === "pedidos" ? "bg-slate-900 text-white" : "text-slate-400")}><Layers className="h-7 w-7" /></Button>
              {activeOrder && (
                <Button variant="ghost" size="icon" onClick={() => setActiveTab("chat")} className={cn("h-16 w-16 rounded-[1.8rem]", activeTab === "chat" ? "bg-slate-900 text-white" : "text-slate-400")}><MessageSquare className="h-7 w-7" /></Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("alerta")} className={cn("h-16 w-16 rounded-[1.8rem]", activeTab === "alerta" ? "bg-slate-900 text-white" : "text-slate-400")}><ShieldAlert className="h-7 w-7" /></Button>
            </div>
          </div>

          {/* TAB CONTENT: RUTA */}
          {activeTab === 'ruta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl mb-12 relative overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <h1 className="text-4xl font-black tracking-tighter">Mi Ruta Pro</h1>
                  <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
                </div>
                <div className="bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-700/50 mb-10">
                   <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MISIÓN DIARIA: BONO $2,000</p>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">5/10 PEDIDOS</p>
                   </div>
                   <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full w-1/2 rounded-full" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-700/50 flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">POSICIÓN</p>
                    <div className="flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-emerald-400" />
                       <span className="text-4xl font-black">#3</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-700/50 flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">PARADAS</p>
                    <span className="text-4xl font-black">1</span>
                  </div>
                </div>
              </div>
              {activeOrder ? (
                <Card className="rounded-[3rem] border-none shadow-[0_30px_60px_rgba(0,0,0,0.08)] bg-white p-10 relative">
                  <div className="flex wrap justify-between items-start mb-8">
                    <div className="space-y-2">
                      <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[10px] py-1.5 px-4 rounded-full uppercase tracking-widest">
                        RECOGER EN 8 MIN
                      </Badge>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                        {activeOrder.originName || "ORIGEN EMPRESA"}
                      </h2>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
                      1
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-[2rem] p-6 mb-8 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                           <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-[12px] font-black text-emerald-700 uppercase tracking-widest">GANANCIA</span>
                     </div>
                     <span className="text-2xl font-black text-emerald-600">$1,500</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <Button variant="secondary" className="h-16 rounded-[2rem] bg-slate-50 border-none shadow-sm hover:bg-slate-100 flex items-center justify-center gap-3">
                       <Phone className="w-5 h-5 text-blue-500" />
                       <span className="font-black text-sm text-slate-900 uppercase tracking-widest">LLAMAR</span>
                    </Button>
                    <Button variant="secondary" className="h-16 rounded-[2rem] bg-slate-50 border-none shadow-sm hover:bg-slate-100 flex items-center justify-center gap-3" onClick={() => setActiveTab('chat')}>
                       <MessageSquare className="w-5 h-5 text-blue-500" />
                       <span className="font-black text-sm text-slate-900 uppercase tracking-widest">CHAT</span>
                    </Button>
                  </div>
                  <Button className="w-full h-20 rounded-[2.5rem] bg-orange-500 hover:bg-orange-600 text-white font-black text-lg tracking-tight shadow-2xl shadow-orange-500/30 uppercase">
                    CONFIRMAR RECOJO
                  </Button>
                </Card>
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No tienes una ruta activa</p>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="flex items-center gap-6 mb-10">
                <div className="h-16 w-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-2xl">
                  <Boxes className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Cerca Tuyo</h2>
                  <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Oportunidades Live</p>
                </div>
              </div>
              <div className="space-y-2">
                {pendingOrders?.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No hay pedidos disponibles</p>
                  </div>
                ) : (
                  pendingOrders?.map(order => (
                    <PendingOrderCard key={order.id} order={order} onAccept={handleAcceptOrder} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: CHAT (PRIVATE MESSAGING FOR ACTIVE ORDER) */}
          {activeTab === 'chat' && activeOrder && (
             <div className="h-[500px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                <header className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <MessageSquare className="h-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Chat Empresa</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Orden #{activeOrder.id.substring(0, 5)}</p>
                  </div>
                </header>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-hide bg-slate-50 rounded-[2rem] border border-slate-100 mb-6">
                  {orderChatMessages?.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.authorId === user.uid ? 'justify-end' : 'justify-start')}>
                      <div className={cn("max-w-[85%] p-4 rounded-[1.5rem] text-sm shadow-sm", msg.authorId === user.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100')}>
                        <p className="font-medium leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {orderChatMessages?.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                       <MessageSquare className="w-12 h-12 mb-2" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Sin mensajes previos</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Input placeholder="Escribe a la empresa..." className="h-14 bg-white border-none rounded-full px-6 font-medium shadow-inner flex-1" value={chatMessageText} onChange={(e) => setChatMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} />
                  <Button onClick={handleSendChatMessage} size="icon" className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-xl shrink-0"><Send className="w-5 h-5" /></Button>
                </div>
             </div>
          )}

          {/* TAB CONTENT: ALERTA (CORO DRIVER) */}
          {activeTab === 'alerta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <header className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Coro Driver</h2>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setAlertFilter('all')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", alertFilter === 'all' ? "bg-white shadow-sm" : "text-slate-400")}>TODAS</button>
                  <button onClick={() => setAlertFilter('mine')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", alertFilter === 'mine' ? "bg-white shadow-sm" : "text-slate-400")}>MIS REPORTES</button>
                </div>
              </header>
              
              <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
                {[
                  { id: "policia", label: "CONTROL", icon: ShieldAlert, bg: "bg-blue-50", color: "text-blue-600" },
                  { id: "trafico", label: "TRÁFICO", icon: Clock, bg: "bg-orange-50", color: "text-orange-600" },
                  { id: "accidente", label: "PELIGRO", icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
                  { id: "obras", label: "OBRAS", icon: Navigation, bg: "bg-emerald-50", color: "text-emerald-600" },
                ].map((a) => (
                  <Dialog key={a.id}>
                    <DialogTrigger asChild>
                      <div className="flex flex-col items-center gap-4 min-w-[100px] cursor-pointer" onClick={() => setSelectedAlertType({id: a.id, label: a.label})}>
                        <div className={cn("h-20 w-20 rounded-[28px] flex items-center justify-center shadow-sm bg-white border border-slate-100")}>
                          <div className={cn("h-12 w-12 rounded-[18px] flex items-center justify-center", a.bg)}>
                            <a.icon className={cn("h-6 w-6", a.color)} />
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider">{a.label}</span>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[92vw] rounded-[48px] p-10">
                      <DialogHeader>
                        <DialogTitle className="font-black uppercase text-xl text-center">Reportar {a.label}</DialogTitle>
                        <DialogDescription className="text-center">Avisa a la comunidad sobre esta situación en tiempo real.</DialogDescription>
                      </DialogHeader>
                      <div className="py-6">
                        <Textarea placeholder="Describe la situación..." className="min-h-[120px] bg-slate-50 rounded-[28px] p-6 text-lg border-none focus-visible:ring-blue-500" value={alertDescription} onChange={(e) => setAlertDescription(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <Button onClick={handlePublishAlert} className="w-full h-20 rounded-[32px] bg-slate-900 text-white font-black uppercase shadow-xl hover:bg-black">PUBLICAR REPORTE</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
              <div className="space-y-4">
                {filteredAlerts?.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No hay reportes que mostrar</p>
                  </div>
                ) : (
                  filteredAlerts?.map((alert) => (
                    <CoroItem key={alert.id} alert={alert} userId={user.uid} onOpenChat={(id) => { setSelectedChatAlertId(id); setSelectedChatOrderId(null); setActiveTab('central'); }} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}