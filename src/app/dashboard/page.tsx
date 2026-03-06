
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
  ArrowLeft,
  LayoutDashboard,
  RefreshCcw,
  Building2,
  ShieldCheck,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { collection, doc, query, where, orderBy, serverTimestamp } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { CapoAssistant } from "@/components/dashboard/CapoAssistant"
import { driverRouteOptimization, type DriverRouteOptimizationOutput } from "@/ai/flows/driver-route-optimization"

// Dynamic import for the map to avoid SSR issues
const InteractiveMap = dynamic(() => import('@/components/dashboard/InteractiveMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
});

// --- SUB-COMPONENTS ---

function ChatListItem({ order, isAdmin, onClick, isSelected }: { order: any, isAdmin: boolean, onClick: () => void, isSelected: boolean }) {
  const { firestore } = useFirebase()
  
  const companyRef = useMemoFirebase(() => {
    if (!firestore || !order.companyId) return null
    return doc(firestore, "companyProfiles", order.companyId)
  }, [firestore, order.companyId])
  const { data: companyData } = useDoc(companyRef)

  const driverRef = useMemoFirebase(() => {
    if (!firestore || !order.driverId) return null
    return doc(firestore, "users", order.driverId)
  }, [firestore, order.driverId])
  const { data: driverData } = useDoc(driverRef)

  const title = isAdmin 
    ? (driverData ? `${driverData.firstName}` : "Buscando repartidor...")
    : (companyData?.name || "Empresa Logística")

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:bg-white active:scale-[0.98] transition-all border-none shadow-sm rounded-[32px] group mb-3 overflow-hidden w-full",
        isSelected ? "bg-white ring-2 ring-primary/10 shadow-md" : "bg-white/60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-[22px] bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-primary/5 transition-colors">
          {isAdmin ? <User className="w-6 h-6 text-slate-400 group-hover:text-primary" /> : <Building2 className="w-6 h-6 text-slate-400 group-hover:text-primary" />}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex justify-between items-center mb-0.5">
            <h3 className="font-black text-sm text-slate-800 truncate uppercase tracking-tight">
              {title}
            </h3>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
              {order.updatedAt ? format(new Date(order.updatedAt), 'HH:mm') : '...'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-tight">
              #{order.id.substring(0, 5)} • {order.status}
            </p>
            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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

// --- MAIN PAGE ---

export default function DashboardPage() {
  // --- 1. HOOKS AT THE TOP (STRICT ORDER) ---
  const router = useRouter()
  const searchParams = useSearchParams()
  const { firestore, auth } = useFirebase()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  // State
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
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedRouteData, setOptimizedRouteData] = useState<DriverRouteOptimizationOutput | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Memoized Queries
  const userRef = useMemoFirebase(() => (!firestore || !user?.uid) ? null : doc(firestore, "users", user.uid), [user?.uid, firestore])
  const alertsQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, "alerts"), orderBy("createdAt", "desc")), [firestore])
  const pendingOrdersQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, "orders"), where("status", "==", "Pending")), [firestore])
  const driverActiveOrdersQuery = useMemoFirebase(() => (!firestore || !user?.uid) ? null : query(collection(firestore, "orders"), where("driverId", "==", user.uid), where("status", "in", ["Assigned", "Picked Up", "In Transit"])), [user?.uid, firestore])
  const orderHistoryQuery = useMemoFirebase(() => (!firestore || !user?.uid) ? null : query(collection(firestore, "orders"), where("driverId", "==", user.uid)), [user?.uid, firestore])
  const orderChatMessagesQuery = useMemoFirebase(() => (!firestore || !selectedChatOrderId) ? null : query(collection(firestore, `orders/${selectedChatOrderId}/messages`), orderBy("timestamp", "asc")), [selectedChatOrderId, firestore])
  const alertChatMessagesQuery = useMemoFirebase(() => (!firestore || !selectedChatAlertId) ? null : query(collection(firestore, `alerts/${selectedChatAlertId}/messages`), orderBy("timestamp", "asc")), [selectedChatAlertId, firestore])

  // Data
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef)
  const { data: alerts } = useCollection(alertsQuery)
  const { data: pendingOrders } = useCollection(pendingOrdersQuery)
  const { data: driverActiveOrders } = useCollection(driverActiveOrdersQuery)
  const { data: orderHistory } = useCollection(orderHistoryQuery)
  const { data: orderChatMessages } = useCollection(orderChatMessagesQuery)
  const { data: alertChatMessages } = useCollection(alertChatMessagesQuery)

  const isAdmin = userData?.role === 'Admin'
  const activeOrder = useMemo(() => driverActiveOrders?.[0], [driverActiveOrders])
  const isCentralLayout = useMemo(() => activeTab === 'central', [activeTab])
  const hasActiveSOS = useMemo(() => alerts?.some(a => a.type === 'sos') || false, [alerts])
  const filteredAlerts = useMemo(() => {
    if (!alerts) return []
    if (alertFilter === 'mine' && user?.uid) return alerts.filter(a => a.authorId === user.uid)
    return alerts
  }, [alerts, alertFilter, user?.uid])

  // --- 2. EFFECTS ---
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
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [selectedChatOrderId, selectedChatAlertId, orderChatMessages?.length, alertChatMessages?.length])

  // --- 3. CALLBACKS ---
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
      addDocumentNonBlocking(collection(firestore, `orders/${activeId}/messages`), {
        authorId: user.uid,
        authorName: userData?.firstName || "Repartidor",
        content: chatMessageText,
        timestamp: serverTimestamp(),
        isReadByDriver: !isAdmin,
        isReadByCompany: isAdmin
      })
    } else if (selectedChatAlertId) {
      addDocumentNonBlocking(collection(firestore, `alerts/${selectedChatAlertId}/messages`), {
        authorId: user.uid,
        authorName: userData?.firstName || "Repartidor",
        content: chatMessageText,
        timestamp: serverTimestamp()
      })
    }
    setChatMessageText("")
  }, [chatMessageText, user?.uid, firestore, selectedChatOrderId, selectedChatAlertId, activeTab, activeOrder?.id, userData?.firstName, isAdmin])

  const handleAcceptOrder = useCallback((orderId: string) => {
    if (!user?.uid || !firestore) return
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), { 
      driverId: user.uid, 
      status: "Assigned", 
      updatedAt: new Date().toISOString() 
    })
    toast({ title: "Pedido Asignado Correctamente" })
  }, [user?.uid, firestore, toast])

  const handleOptimizeRoute = async () => {
    if (!currentCoords) return
    setIsOptimizing(true)
    try {
      const result = await driverRouteOptimization({
        driverCurrentLocation: { latitude: currentCoords.lat, longitude: currentCoords.lng },
        stops: [
          { address: "Punto Central A", type: "pickup", orderId: "ORD-001" },
          { address: "Calle Principal 450", type: "delivery", orderId: "ORD-001" },
          { address: "Bodega Logística Sur", type: "pickup", orderId: "ORD-002" },
          { address: "Avenida Industrial 2200", type: "delivery", orderId: "ORD-002" }
        ],
        currentTrafficConditions: "Tráfico moderado en el centro."
      })
      setOptimizedRouteData(result)
      setIsExpanded(true)
      toast({ title: "Ruta optimizada con IA", description: "Copo ha encontrado el camino más rápido." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo optimizar la ruta." })
    } finally {
      setIsOptimizing(false)
    }
  }

  // --- 4. CONDITIONAL RENDERS ---
  if (!mounted) return null
  if (isUserLoading || (user && isUserDataLoading)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Iniciando Sistemas Copo...</p>
      </div>
    )
  }
  if (!user) return <LoginScreen />

  // --- 5. CENTRAL FULLSCREEN LAYOUT ---
  if (isCentralLayout) {
    return (
      <div className="h-screen w-full bg-[#f2f1f4] flex flex-col animate-in fade-in duration-500 z-[100]">
        <header className="p-8 flex items-center gap-6 border-b border-slate-100 bg-white sticky top-0 z-50 rounded-b-[40px] shadow-sm">
          <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-slate-50" onClick={() => setActiveTab('ruta')}>
            <ArrowLeft className="h-7 w-7 text-slate-900" />
          </Button>
          <div className="flex-1">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight uppercase">Central</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Historial de Mensajes Privados</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {(selectedChatOrderId) ? (
            <div className="h-full flex flex-col bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
               <header className="flex items-center gap-4 p-8 border-b border-slate-50 bg-white">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedChatOrderId(null); }} className="rounded-full h-12 w-12 bg-slate-50"><ChevronLeft className="w-6 h-6" /></Button>
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase">
                      Orden #{selectedChatOrderId.substring(0, 5)}
                    </h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Archivo de Coordinación</p>
                  </div>
                </header>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 p-8 scrollbar-hide bg-slate-50/50">
                   <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 mb-6 text-center space-y-2 border border-white/50">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal Directo Seguro</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Mensajes privados para coordinar la entrega.
                    </p>
                  </div>
                  {orderChatMessages?.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.authorId === user.uid ? 'justify-end' : 'justify-start')}>
                      <div className={cn("max-w-[75%] p-6 rounded-[2rem] text-sm shadow-sm", msg.authorId === user.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100')}>
                        <p className="font-medium leading-relaxed">{msg.content}</p>
                        <div className="flex justify-end items-center gap-1 mt-2">
                          <p className="text-[7px] font-black opacity-40 uppercase tracking-tighter">
                            {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                          </p>
                          {msg.authorId === user.uid && <Check className="w-2.5 h-2.5 text-blue-300" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-white border-t flex items-center gap-4">
                  <Input placeholder="Escribe un mensaje..." className="h-16 bg-slate-50 border-none rounded-full px-8 font-medium shadow-inner flex-1" value={chatMessageText} onChange={(e) => setChatMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} />
                  <Button onClick={handleSendChatMessage} size="icon" className="h-16 w-16 rounded-full bg-[#79d3b4] text-white shadow-xl shrink-0"><Send className="w-6 h-6" /></Button>
                </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
               <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Archivo de Chats</h3>
               </div>
               {orderHistory && orderHistory.length > 0 ? (
                 orderHistory.map(order => (
                    <ChatListItem 
                      key={order.id} 
                      order={order} 
                      isAdmin={isAdmin} 
                      onClick={() => setSelectedChatOrderId(order.id)} 
                      isSelected={selectedChatOrderId === order.id} 
                    />
                  ))
               ) : (
                 <div className="text-center py-20 opacity-30 space-y-4 bg-white rounded-[3rem] border border-slate-100">
                    <MessageSquare className="w-12 h-12 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">No hay chats históricos.</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- 6. MAIN DASHBOARD UI ---
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
            <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-2xl bg-white/95 backdrop-blur-md border-none hover:bg-white text-slate-700 pointer-events-auto">
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
                  <span className="text-md font-bold text-slate-700">Mis Alertas</span>
                </button>
                <button onClick={() => { setActiveTab('central'); }} className="flex items-center gap-4 group w-full text-left">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-slate-100 flex items-center justify-center shadow-sm">
                    <LayoutDashboard className="h-5 w-5 text-slate-900" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Central: Historial</span>
                </button>
              </div>
              <Button variant="ghost" onClick={() => signOut(auth!)} className="w-full justify-start gap-4 h-16 rounded-3xl text-red-500 font-black px-5 hover:bg-red-50 text-sm"><LogOut className="w-5 h-5" /> Salir del sistema</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ACTION STACK (FLOATING CONTROLS) */}
      <div className="absolute top-1/2 -translate-y-1/2 right-8 z-10 flex flex-col gap-4 pointer-events-auto">
        <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-xl bg-white border-none text-slate-700 hover:text-slate-900 transition-all">
          <Compass className="h-6 w-6" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setMapCenterTrigger(t => t + 1)}
          className="h-16 w-16 rounded-full shadow-xl bg-white border-none text-slate-700"
        >
          <Target className="h-6 w-6" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setIsMapFullscreen(!isMapFullscreen)}
          className="h-16 w-16 rounded-full shadow-xl bg-white border-none text-slate-700"
        >
          <Maximize className="h-6 w-6" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setIsAiAssistantOpen(true)}
          className="h-20 w-20 rounded-full shadow-2xl bg-[#2563eb] border-none text-white hover:bg-blue-700 mt-4"
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
      <div className={cn("absolute inset-x-0 bottom-0 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.1)] rounded-t-[4rem] transition-all duration-500 ease-in-out z-20 overflow-hidden flex flex-col", isExpanded ? "top-20" : "top-1/2")}>
        
        {/* BARRA DE HERRAMIENTAS INTEGRADA EN LA CABECERA DEL PANEL */}
        <div className="h-28 w-full flex flex-col items-center justify-center shrink-0 bg-white border-b border-slate-50">
          <div className="h-8 w-full flex items-center justify-center cursor-pointer active:bg-slate-50" onClick={() => setIsExpanded(!isExpanded)}>
            <div className={cn("w-20 h-2 rounded-full", hasActiveSOS ? "bg-red-600 animate-pulse" : "bg-slate-200")}></div>
          </div>
          
          <div className="bg-slate-900 p-2 rounded-[2.5rem] flex items-center gap-1 shadow-2xl pointer-events-auto scale-90 mb-2">
            <Button 
              variant="ghost" 
              onClick={() => { setActiveTab("ruta"); setIsExpanded(false); }} 
              className={cn(
                "h-12 flex items-center gap-3 px-8 transition-all duration-300", 
                activeTab === "ruta" ? "bg-white text-slate-900 rounded-[1.8rem]" : "text-slate-400"
              )}
            >
              <Truck className="h-5 w-5" />
              {activeTab === "ruta" && <span className="font-black text-[10px] uppercase tracking-widest">RUTA</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => { setActiveTab("pedidos"); setIsExpanded(false); }} 
              className={cn(
                "h-12 w-12 rounded-full p-0 flex items-center justify-center transition-all duration-300", 
                activeTab === "pedidos" ? "bg-white text-slate-900" : "text-slate-400"
              )}
            >
              <Layers className="h-5 w-5" />
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => { setActiveTab("central"); setIsExpanded(false); }} 
              className={cn(
                "h-12 w-12 rounded-full p-0 flex items-center justify-center transition-all duration-300", 
                activeTab === "central" ? "bg-white text-slate-900" : "text-slate-400"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
            </Button>

            {/* CHAT SOLO PARA PEDIDOS ACTIVOS EN TIEMPO REAL */}
            {activeOrder && (
              <Button 
                variant="ghost" 
                onClick={() => { setActiveTab("chat"); setIsExpanded(false); }} 
                className={cn(
                  "h-12 w-12 rounded-full p-0 flex items-center justify-center transition-all duration-300", 
                  activeTab === "chat" ? "bg-white text-slate-900" : "text-slate-400"
                )}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            )}

            <Button 
              variant="ghost" 
              onClick={() => { setActiveTab("alerta"); setIsExpanded(false); }} 
              className={cn(
                "h-12 w-12 rounded-full p-0 flex items-center justify-center transition-all duration-300", 
                activeTab === "alerta" ? "bg-white text-slate-900" : "text-slate-400"
              )}
            >
              <ShieldAlert className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-8 pb-20 scrollbar-hide">
          {activeTab === 'ruta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pt-6">
               <header className="flex justify-between items-start mb-10">
                 <div>
                   <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-tight">
                     {optimizedRouteData ? "Tu Ruta IA" : "Plan de Carga"}
                   </h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                     {optimizedRouteData ? `${optimizedRouteData.totalEstimatedDuration} min • ${optimizedRouteData.totalEstimatedDistance} km` : "Optimización Logística Neuronal"}
                   </p>
                 </div>
                 {!optimizedRouteData ? (
                    <Button 
                      onClick={handleOptimizeRoute} 
                      disabled={isOptimizing}
                      className="h-16 px-8 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl"
                    >
                      {isOptimizing ? <RefreshCcw className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                      {isOptimizing ? "CALCULANDO..." : "OPTIMIZAR"}
                    </Button>
                 ) : (
                    <Button variant="ghost" size="icon" onClick={() => setOptimizedRouteData(null)} className="h-14 w-14 rounded-full bg-slate-50">
                      <X className="w-6 h-6" />
                    </Button>
                 )}
               </header>

               {!optimizedRouteData ? (
                 <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl flex items-center justify-between overflow-hidden relative">
                       <div className="relative z-10">
                         <h3 className="text-2xl font-black uppercase mb-2">Estado de Flota</h3>
                         <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">IA Conectada • CDMX</p>
                       </div>
                       <Zap className="w-20 h-20 text-blue-500/20 absolute -right-4 -bottom-4 rotate-12" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
                          <Clock className="w-8 h-8 text-blue-600 mb-4" />
                          <p className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-1">TRÁFICO</p>
                          <p className="text-xl font-black text-slate-900">MODERADO</p>
                       </div>
                       <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
                          <Package className="w-8 h-8 text-emerald-600 mb-4" />
                          <p className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-1">PARADAS</p>
                          <p className="text-xl font-black text-slate-900">4 PENDIENTES</p>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 pb-20">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-[3rem] p-8 flex items-start gap-6">
                       <div className="w-16 h-16 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shrink-0">
                         <Navigation className="w-8 h-8" />
                       </div>
                       <div className="flex-1">
                         <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">PRÓXIMO DESTINO</p>
                         <h4 className="text-2xl font-black text-slate-900 leading-tight uppercase">{optimizedRouteData.optimizedRoute[0].address}</h4>
                       </div>
                    </div>

                    <div className="relative pl-12 space-y-12">
                       <div className="absolute left-[23px] top-6 bottom-6 w-[2px] border-l-2 border-dashed border-slate-200" />
                       {optimizedRouteData.optimizedRoute.map((stop, i) => (
                         <div key={i} className="relative">
                            <div className={cn(
                              "absolute -left-[38px] top-0 w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-100 z-10 font-black text-xs",
                              i === 0 ? "bg-blue-600 text-white border-blue-600" : "text-slate-400"
                            )}>
                              {i + 1}
                            </div>
                            <div className="flex justify-between items-start">
                               <div>
                                 <h5 className="font-black text-lg text-slate-900 uppercase leading-none mb-1">{stop.address}</h5>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                   {stop.type} • {new Date(stop.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                               </div>
                               <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] px-3">ORD-{stop.orderId}</Badge>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pt-6">
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

          {activeTab === 'chat' && activeOrder && (
             <div className="h-[550px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pt-6 pb-4">
                <header className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Chat Empresa</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Orden #{activeOrder.id.substring(0, 5)} • TIEMPO REAL</p>
                  </div>
                </header>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 p-6 scrollbar-hide bg-slate-50/50 rounded-[3rem] border border-slate-100 mb-6">
                  {orderChatMessages?.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.authorId === user.uid ? 'justify-end' : 'justify-start')}>
                      <div className={cn("max-w-[85%] p-5 rounded-[2rem] text-sm shadow-sm", msg.authorId === user.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100')}>
                        <p className="font-medium leading-relaxed">{msg.content}</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <p className="text-[7px] font-black opacity-40 uppercase">
                            {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <Input placeholder="Mensaje para la empresa..." className="h-16 bg-white border-none rounded-full px-8 font-medium shadow-inner flex-1" value={chatMessageText} onChange={(e) => setChatMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} />
                  <Button onClick={handleSendChatMessage} size="icon" className="h-16 w-16 rounded-full bg-blue-600 text-white shadow-xl shrink-0"><Send className="w-6 h-6" /></Button>
                </div>
             </div>
          )}

          {activeTab === 'alerta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pt-6">
              <header className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Coro Driver</h2>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setAlertFilter('all')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", alertFilter === 'all' ? "bg-white shadow-sm" : "text-slate-400")}>TODAS</button>
                  <button onClick={() => setAlertFilter('mine')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", alertFilter === 'mine' ? "bg-white shadow-sm" : "text-slate-400")}>MIS REPORTES</button>
                </div>
              </header>
              <div className="space-y-4">
                {filteredAlerts?.map((alert) => (
                  <CoroItem key={alert.id} alert={alert} userId={user.uid} onOpenChat={(id) => { setSelectedChatAlertId(id); setSelectedChatOrderId(null); setActiveTab('central'); }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
