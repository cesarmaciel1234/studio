
"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { 
  Navigation, 
  Maximize, 
  Minimize,
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
  Target,
  Sparkles,
  Building2,
  Pencil,
  BarChart3,
  LogOut,
  TrendingUp,
  DollarSign,
  Map,
  RefreshCcw,
  Store,
  CheckCircle2,
  Check,
  ShieldCheck,
  Trash2,
  Loader2,
  Send,
  Mic,
  X,
  LayoutDashboard,
  PlusCircle,
  Leaf,
  Users,
  Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import Link from "next/link"

import { 
  useFirebase, 
  useUser, 
  useCollection, 
  useDoc, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
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
               alert.type === 'obras' ? Navigation : AlertTriangle;
  
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
          <div className="flex flex-wrap items-center gap-2 mb-1">
             <h4 className={cn("font-black text-xs uppercase tracking-tight", colorClass)}>{alert.label}</h4>
             <span className="text-slate-200">•</span>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
               {alert.createdAt ? format(new Date(alert.createdAt), 'dd/MM/yy HH:mm') : 'AHORA'}
             </p>
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
              <span className="text-[10px] font-black">CHAT</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

const DriverOrderCard = ({ order, index, onOpenChat }: any) => {
  return (
    <Card className="rounded-[32px] border-none shadow-lg bg-white overflow-hidden mb-4">
      <div className="p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
          <span className="font-black text-lg">{index + 1}</span>
        </div>
        <div className="flex-1 text-left">
          <h4 className="font-black text-slate-900 text-sm uppercase truncate">{order.deliveryAddress}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.clientName}</p>
        </div>
        <Button size="icon" variant="ghost" className="rounded-full" onClick={() => onOpenChat(order.id)}>
          <MessageSquare className="w-5 h-5 text-slate-400" />
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
  // --- CRÍTICO: HOOKS SIEMPRE AL PRINCIPIO ---
  const router = useRouter()
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
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Consultas a Firebase (Memoizadas para evitar bucles de renderizado)
  const userRef = useMemoFirebase(() => (!firestore || !user?.uid) ? null : doc(firestore, "users", user.uid), [user?.uid, firestore])
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef)
  
  const alertsQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, "alerts"), orderBy("createdAt", "desc")), [firestore])
  const { data: alerts } = useCollection(alertsQuery)

  const pendingOrdersQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, "orders"), where("status", "==", "Pending"), orderBy("createdAt", "desc")), [firestore])
  const { data: pendingOrders } = useCollection(pendingOrdersQuery)

  const driverActiveOrdersQuery = useMemoFirebase(() => (!firestore || !user?.uid) ? null : query(collection(firestore, "orders"), where("driverId", "==", user.uid), where("status", "in", ["Assigned", "Picked Up", "In Transit"])), [user?.uid, firestore])
  const { data: driverActiveOrders } = useCollection(driverActiveOrdersQuery)

  const orderChatMessagesQuery = useMemoFirebase(() => (!firestore || !selectedChatOrderId) ? null : query(collection(firestore, `orders/${selectedChatOrderId}/chatMessages`), orderBy("timestamp", "asc")), [selectedChatOrderId, firestore])
  const { data: orderChatMessages } = useCollection(orderChatMessagesQuery)

  const alertChatMessagesQuery = useMemoFirebase(() => (!firestore || !selectedChatAlertId) ? null : query(collection(firestore, `alerts/${selectedChatAlertId}/messages`), orderBy("timestamp", "asc")), [selectedChatAlertId, firestore])
  const { data: alertChatMessages } = useCollection(alertChatMessagesQuery)

  const hasActiveSOS = useMemo(() => alerts?.some(a => a.type === 'sos') || false, [alerts])
  const activeOrder = useMemo(() => driverActiveOrders?.[0], [driverActiveOrders])
  const sheetY = isMapFullscreen ? 'calc(100% - 40px)' : (isExpanded ? '0' : 'calc(100% - 160px)')

  useEffect(() => {
    setMounted(true)
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
  }, [])

  useEffect(() => {
    if (activeOrder && isNavigating) {
      setDestinationCoords([activeOrder.deliveryLatitude, activeOrder.deliveryLongitude])
    } else {
      setDestinationCoords(null)
    }
  }, [activeOrder, isNavigating])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo(0, chatScrollRef.current.scrollHeight)
    }
  }, [selectedChatOrderId, selectedChatAlertId, chatMessageText])

  /**
   * FLUJO DE CORO DRIVER (ALERTA COMUNITARIA):
   * 1. Activación: En el panel inferior (ícono ShieldAlert).
   * 2. Selección: Se elige un tipo (Control, Tráfico, Peligro, Obras).
   * 3. Diálogo: Abre DialogTrigger y guarda el estado en selectedAlertType.
   * 4. Publicación: handlePublishAlert recopila descripción + GPS + ID y crea el doc en alerts.
   */
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
      participantIds: [user.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active"
    })
    setAlertDescription("")
    setSelectedAlertType(null)
    toast({ title: "Reporte Vial Publicado" })
  }, [selectedAlertType, user?.uid, firestore, currentCoords, alertDescription, toast])

  const handleSendChatMessage = useCallback(() => {
    if (!chatMessageText.trim() || !user?.uid || !firestore) return
    
    if (selectedChatOrderId) {
      addDocumentNonBlocking(collection(firestore, `orders/${selectedChatOrderId}/chatMessages`), {
        orderId: selectedChatOrderId,
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
  }, [chatMessageText, user?.uid, firestore, selectedChatOrderId, selectedChatAlertId, userData?.firstName])

  const handleAcceptOrder = useCallback((orderId: string) => {
    if (!user?.uid || !firestore) return
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), { 
      driverId: user.uid, 
      status: "Assigned", 
      updatedAt: new Date().toISOString() 
    })
    toast({ title: "Pedido Asignado" })
  }, [user?.uid, firestore, toast])

  // --- RENDERS CONDICIONALES DESPUÉS DE LOS HOOKS ---
  if (!mounted) return null
  if (isUserLoading || (user && isUserDataLoading)) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>
  if (!user) return <LoginScreen />

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      {/* MAPA INTERACTIVO (Z-0) */}
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

      {/* BOTÓN MENÚ LATERAL (TOP LEFT) */}
      <div className="absolute top-8 left-8 z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" className="h-16 w-16 rounded-[1.5rem] shadow-2xl bg-white/95 backdrop-blur-md border-none hover:bg-white text-slate-700">
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
                <Link href="/orders" className="flex items-center gap-4 group">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-blue-50 flex items-center justify-center shadow-sm">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Historial Pedidos</span>
                </Link>
                <Link href="/messages" className="flex items-center gap-4 group">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-purple-50 flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Mensajes comunidad</span>
                </Link>
              </div>
              <Button variant="ghost" onClick={() => signOut(auth!)} className="w-full justify-start gap-4 h-16 rounded-3xl text-red-500 font-black px-5 hover:bg-red-50 text-sm"><LogOut className="w-5 h-5" /> Salir del sistema</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* BOTÓN ASISTENTE CAPO (TOP RIGHT) */}
      <div className="absolute right-8 top-8 z-10">
        <Button size="icon" onClick={() => setIsAiAssistantOpen(true)} className="h-16 w-16 rounded-[1.5rem] shadow-2xl bg-blue-600 text-white border-none hover:bg-blue-700">
          <Sparkles className="h-8 w-8" />
        </Button>
      </div>

      {/* BOTONES DE CONTROL DE MAPA */}
      <div className="absolute right-8 bottom-32 flex flex-col gap-3 z-10">
        <Button size="icon" variant="secondary" onClick={() => setIsNavigating(!isNavigating)} className={cn("h-12 w-12 rounded-full shadow-xl transition-all", isNavigating ? "bg-blue-600 text-white" : "bg-white text-slate-600")}>
          <Navigation className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="secondary" onClick={() => setMapCenterTrigger(p => p+1)} className="h-12 w-12 rounded-full shadow-xl bg-white text-slate-600">
          <Target className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="secondary" onClick={() => setIsMapFullscreen(!isMapFullscreen)} className={cn("h-12 w-12 rounded-full shadow-xl transition-all", isMapFullscreen ? "bg-slate-900 text-white" : "bg-white text-slate-600")}>
          {isMapFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
      </div>

      {/* PANEL DESLIZABLE INFERIOR */}
      <div className={cn("absolute inset-x-0 bottom-0 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.1)] rounded-t-[3.5rem] transition-all duration-500 ease-in-out z-20 overflow-hidden flex flex-col", sheetY === '0' ? "top-20" : sheetY === 'calc(100% - 40px)' ? "top-[calc(100%-40px)]" : "top-1/2")}>
        <div className="h-12 w-full flex items-center justify-center cursor-pointer active:bg-slate-50" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={cn("w-16 h-1.5 rounded-full mb-8", hasActiveSOS ? "bg-red-600 animate-pulse" : "bg-slate-200")}></div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-hide">
          {/* NAVEGACIÓN DEL PANEL */}
          <div className="flex justify-center mb-10 sticky top-0 bg-white pt-2 pb-4 z-30">
            <div className="bg-slate-50 p-2 rounded-[2.5rem] flex items-center gap-2 shadow-inner border border-slate-100">
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("ruta")} className={cn("h-16 w-20 rounded-[1.8rem]", activeTab === "ruta" ? "bg-slate-900 text-white" : "text-slate-400")}><Truck className="h-7 w-7" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("pedidos")} className={cn("h-16 w-20 rounded-[1.8rem]", activeTab === "pedidos" ? "bg-slate-900 text-white" : "text-slate-400")}><Layers className="h-7 w-7" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("central")} className={cn("h-16 w-20 rounded-[1.8rem]", activeTab === "central" ? "bg-slate-900 text-white" : "text-slate-400")}><MessageSquare className="h-7 w-7" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("alerta")} className={cn("h-16 w-20 rounded-[1.8rem]", activeTab === "alerta" ? "bg-slate-900 text-white" : "text-slate-400")}><ShieldAlert className="h-7 w-7" /></Button>
            </div>
          </div>

          {/* CONTENIDO DE PESTAÑAS */}
          {activeTab === 'ruta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl mb-8">
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-8">Mi Ruta Pro</h1>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-800 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">PEDIDOS</span>
                    <span className="text-4xl font-black text-white">{driverActiveOrders?.length || 0}</span>
                  </div>
                  <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-800 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">ALERTA SOS</span>
                    <span className={cn("text-4xl font-black", hasActiveSOS ? "text-red-500" : "text-emerald-500")}>{hasActiveSOS ? "SI" : "NO"}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {driverActiveOrders?.map((order, i) => (
                  <DriverOrderCard key={order.id} order={order} index={i} onOpenChat={() => { setSelectedChatOrderId(order.id); setSelectedChatAlertId(null); setActiveTab('central'); }} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">Pedidos Disponibles</h2>
              <div className="space-y-4">
                {pendingOrders?.map(order => (
                  <div key={order.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between hover:bg-slate-100 transition-all">
                    <div className="text-left">
                      <h4 className="font-black text-lg truncate">{order.deliveryAddress.split(',')[0]}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{order.clientName}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-emerald-600">${order.offeredPrice}</p>
                       <Button size="sm" variant="outline" onClick={() => handleAcceptOrder(order.id)} className="h-10 rounded-xl mt-2">ACEPTAR</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alerta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <header className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Coro Driver</h2>
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
                      <DialogHeader><DialogTitle className="font-black uppercase text-xl text-center">Reportar {a.label}</DialogTitle></DialogHeader>
                      <div className="py-6">
                        <Textarea placeholder="Describe la situación..." className="min-h-[120px] bg-slate-50 rounded-[28px] p-6 text-lg" value={alertDescription} onChange={(e) => setAlertDescription(e.target.value)} />
                      </div>
                      <DialogFooter><Button onClick={handlePublishAlert} className="w-full h-20 rounded-[32px] bg-slate-900 text-white font-black uppercase">PUBLICAR</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>

              <div className="space-y-4">
                {alerts?.map((alert) => (
                  <CoroItem key={alert.id} alert={alert} userId={user.uid} onOpenChat={(id) => { setSelectedChatAlertId(id); setSelectedChatOrderId(null); setActiveTab('central'); }} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'central' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left h-full flex flex-col min-h-[500px]">
                {(selectedChatOrderId || selectedChatAlertId) ? (
                  <div className="flex flex-col h-full bg-slate-100 rounded-[40px] p-4">
                    <header className="flex items-center gap-4 mb-6 sticky top-0 bg-white p-4 rounded-2xl shadow-sm z-10">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedChatOrderId(null); setSelectedChatAlertId(null); }} className="rounded-full h-10 w-10"><ChevronLeft className="w-6 h-6" /></Button>
                      <h2 className="text-[14px] font-black tracking-tight uppercase truncate">
                        {selectedChatOrderId ? `Chat Orden #${selectedChatOrderId.substring(0, 5)}` : `Chat Alerta Comunidad`}
                      </h2>
                    </header>
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 px-2 scrollbar-hide mb-4 min-h-[300px]">
                      {(selectedChatOrderId ? orderChatMessages : alertChatMessages)?.map((msg) => (
                        <div key={msg.id} className={cn("flex", msg.authorId === user.uid ? 'justify-end' : 'justify-start')}>
                          <div className={cn("max-w-[85%] p-4 rounded-[22px] text-[13px] shadow-sm", msg.authorId === user.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none')}>
                            {msg.authorName && msg.authorId !== user.uid && <p className="text-[10px] font-black mb-1 opacity-50">{msg.authorName}</p>}
                            <p className="font-medium leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-4 items-center">
                      <Input placeholder="Escribe un mensaje..." className="h-14 bg-white border-none rounded-full px-6 font-medium shadow-lg flex-1 text-sm" value={chatMessageText} onChange={(e) => setChatMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} />
                      <Button onClick={handleSendChatMessage} size="icon" className="h-14 w-14 rounded-full bg-emerald-500 text-white shadow-xl shrink-0"><Send className="w-5 h-5" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black tracking-tighter uppercase mb-6 px-2">Canal de Chat</h2>
                    <p className="text-xs text-slate-400 px-2 mb-4 font-bold uppercase tracking-widest">Chats de Pedidos</p>
                    {driverActiveOrders?.map(order => (
                      <Card key={order.id} className="rounded-[40px] border-none shadow-sm bg-slate-50/50 hover:bg-white transition-all cursor-pointer" onClick={() => { setSelectedChatOrderId(order.id); setSelectedChatAlertId(null); }}>
                        <CardContent className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[20px] bg-white flex items-center justify-center border border-slate-100"><MessageSquare className="w-5 h-5 text-primary" /></div>
                            <div className="text-left">
                              <h4 className="font-black text-slate-900 text-[13px] uppercase truncate">Orden #{order.id.substring(0, 5)}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.deliveryAddress.split(',')[0]}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
