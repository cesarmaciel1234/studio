
"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"
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
  HardHat,
  Package,
  ChevronRight,
  ChevronLeft,
  Flame,
  MapPin,
  List,
  Target,
  Sparkles,
  Plus,
  Minus,
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
  Leaf
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
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
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import Link from "next/link"

import { 
  useFirebase, 
  useFirestore, 
  useUser, 
  useCollection, 
  useDoc, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase"
import { collection, doc, query, where, orderBy, serverTimestamp } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

// Importación dinámica del mapa
const InteractiveMap = dynamic(() => import('@/components/dashboard/InteractiveMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
});

// Componentes auxiliares locales
const CoroItem = ({ alert, userId }: { alert: any, userId: string }) => {
  const isOwner = alert.authorId === userId;
  return (
    <div className="flex items-center gap-5 p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", 
        alert.type === 'policia' ? 'bg-blue-50 text-blue-600' : 
        alert.type === 'trafico' ? 'bg-orange-50 text-orange-600' : 
        alert.type === 'sos' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
      )}>
        {alert.type === 'policia' ? <ShieldAlert className="w-6 h-6" /> : 
         alert.type === 'trafico' ? <Clock className="w-6 h-6" /> : 
         <AlertTriangle className="w-6 h-6" />}
      </div>
      <div className="flex-1 text-left">
        <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">{alert.label}</h4>
        <p className="text-[10px] font-bold text-slate-400 mb-1">REPORTE VIAL</p>
        <p className="text-xs text-slate-600 line-clamp-1">{alert.description}</p>
      </div>
    </div>
  )
}

const DriverOrderCard = ({ order, index, currentCoords, onOpenChat }: any) => {
  return (
    <Card className="rounded-[32px] border-none shadow-lg bg-white overflow-hidden">
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

const AdminOrderItem = ({ order, onCenterMap, onOpenChat }: any) => {
  return (
    <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden mb-3">
      <div className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          <Truck className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h4 className="font-black text-slate-900 text-xs uppercase truncate">{order.clientName}</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{order.deliveryAddress}</p>
        </div>
        <div className="flex gap-2">
           <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onCenterMap(order.deliveryLatitude, order.deliveryLongitude)}><MapPin className="w-4 h-4" /></Button>
           <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onOpenChat(order.id)}><MessageSquare className="w-4 h-4" /></Button>
        </div>
      </div>
    </Card>
  )
}

const LocationPickerMap = ({ onLocationSelect }: any) => (
  <div className="h-[400px] w-full bg-slate-100 flex items-center justify-center relative">
    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Mapa de Selección de Ubicación</p>
    <Button 
      className="absolute bottom-6 h-12 rounded-full px-8 bg-slate-900 text-white font-black"
      onClick={() => onLocationSelect(19.4326, -99.1332, "Centro Histórico, CDMX")}
    >
      Confirmar Ubicación
    </Button>
  </div>
)

const LoginScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center space-y-8">
     <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-500/20">
       <Truck className="w-12 h-12 text-white" />
     </div>
     <div className="space-y-2">
       <h1 className="text-4xl font-black text-white tracking-tighter">RutaRápida Pro</h1>
       <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Logística Inteligente</p>
     </div>
     <Button className="w-full max-w-xs h-16 rounded-3xl bg-white text-slate-900 font-black text-lg" onClick={() => window.location.href = '/login'}>EMPEZAR SESIÓN</Button>
  </div>
)

export default function DashboardPage() {
  const router = useRouter()
  const { firestore, auth } = useFirebase()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  const { toggleSidebar } = useSidebar()

  // Estados de UI
  const [activeTab, setActiveTab] = useState('ruta')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [mapCenterTrigger, setMapCenterTrigger] = useState(0)
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null)
  const [heading, setHeading] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Estados de IA (Capo)
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false)
  const [capoMessage, setCapoMessage] = useState("")
  const [isCapoThinking, setIsCapoThinking] = useState(false)
  const [capoConversation, setCapoConversation] = useState<any[]>([])
  const [isCapoRecording, setIsCapoRecording] = useState(false)
  const [capoAudioUrl, setCapoAudioUrl] = useState<string | null>(null)

  // Estados de Negocio
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false)
  const [alertDescription, setAlertDescription] = useState("")
  const [selectedAlertType, setSelectedAlertType] = useState<{id: string, label: string} | null>(null)
  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string | null>(null)
  const [chatMessageText, setChatMessageText] = useState("")
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  
  // Campos de Nuevo Pedido
  const [newClientName, setNewClientName] = useState("")
  const [newDelivery, setNewDelivery] = useState("")
  const [newDeliveryCoords, setNewDeliveryCoords] = useState<{lat: number, lng: number} | null>(null)
  const [newOfferedPrice, setNewOfferedPrice] = useState("")
  const [newPickupTime, setNewPickupTime] = useState("Inmediato")
  const [newPkgDescription, setNewPkgDescription] = useState("")

  const capoScrollRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const audioPlayerRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setMounted(true)
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          if (pos.coords.heading !== null) {
            setHeading(pos.coords.heading)
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Firebase Data Queries - All wrapped with user check to avoid Permission Denied
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [user, firestore])
  
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef)
  const isAdmin = userData?.role === 'Admin'

  const companyRef = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return doc(firestore, "companyProfiles", user.uid);
  }, [isAdmin, user, firestore])
  
  const { data: companyData } = useDoc(companyRef)

  const alertsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "alerts"), orderBy("createdAt", "desc"));
  }, [firestore, user])
  
  const { data: alerts } = useCollection(alertsQuery)

  const pendingOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "orders"), where("status", "==", "Pending"), orderBy("createdAt", "desc"));
  }, [firestore, user])
  
  const { data: pendingOrders } = useCollection(pendingOrdersQuery)

  const driverActiveOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "orders"), where("driverId", "==", user.uid), where("status", "in", ["Assigned", "Picked Up", "In Transit"]));
  }, [user, firestore])
  
  const { data: driverActiveOrders } = useCollection(driverActiveOrdersQuery)

  const bizOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return query(collection(firestore, "orders"), where("companyId", "==", user.uid));
  }, [isAdmin, user, firestore])
  
  const { data: bizAllOrders, isLoading: isLoadingBizOrders } = useCollection(bizOrdersQuery)

  const fleetQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return query(collection(firestore, "users"), where("role", "==", "Driver"));
  }, [isAdmin, user, firestore])
  
  const { data: fleetData } = useCollection(fleetQuery)

  const chatMessagesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !selectedChatOrderId) return null;
    return query(collection(firestore, `orders/${selectedChatOrderId}/chatMessages`), orderBy("timestamp", "asc"));
  }, [selectedChatOrderId, user, firestore])
  
  const { data: chatMessages } = useCollection(chatMessagesQuery)

  const activeOrder = useMemo(() => driverActiveOrders?.[0], [driverActiveOrders])

  useEffect(() => {
    if (activeOrder && isNavigating) {
      setDestinationCoords([activeOrder.deliveryLatitude, activeOrder.deliveryLongitude])
    } else {
      setDestinationCoords(null)
    }
  }, [activeOrder, isNavigating])

  // Handlers de Negocio
  const handleCreateOrder = () => {
    if (!user?.uid || !firestore || !newClientName || !newDeliveryCoords) return
    setIsCreatingOrder(true)
    addDocumentNonBlocking(collection(firestore, "orders"), {
      clientName: newClientName,
      deliveryAddress: newDelivery,
      deliveryLatitude: newDeliveryCoords.lat,
      deliveryLongitude: newDeliveryCoords.lng,
      pickupAddress: "Sede Central Biz",
      pickupLatitude: currentCoords?.lat || 19.4326,
      pickupLongitude: currentCoords?.lng || -99.1332,
      offeredPrice: Number(newOfferedPrice),
      estimatedPickupWindow: newPickupTime,
      packageDescription: newPkgDescription,
      status: "Pending",
      companyId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    setNewClientName(""); setNewDelivery(""); setNewOfferedPrice(""); setNewPkgDescription("");
    setIsCreatingOrder(false); setActiveTab('ruta');
    toast({ title: "Pedido Publicado", description: "El pedido ya es visible para los conductores." })
  }

  const handlePublishAlert = () => {
    if (!selectedAlertType || !user?.uid || !firestore) return
    
    if (!currentCoords) {
      toast({ title: "Error GPS", description: "No se detectó tu ubicación para el reporte.", variant: "destructive" })
      return
    }

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

    setIsAlertMenuOpen(false); setAlertDescription(""); setSelectedAlertType(null);
    toast({ title: "Reporte Vial Publicado" })
  }

  const handleAcceptOrder = (orderId: string) => {
    if (!user?.uid || !firestore) return
    updateDocumentNonBlocking(doc(firestore, "orders", orderId), { 
      driverId: user.uid, 
      status: "Assigned", 
      updatedAt: new Date().toISOString() 
    })
    toast({ title: "Pedido Asignado", description: "Se ha añadido a tu ruta de hoy." })
  }

  const handleAcceptBatch = () => {
    if (!user?.uid || selectedOrderIds.length === 0 || !firestore) return
    selectedOrderIds.forEach(id => handleAcceptOrder(id))
    setSelectedOrderIds([])
  }

  const handleResolveSOS = (alertId: string) => {
    if (!firestore) return
    deleteDocumentNonBlocking(doc(firestore, "alerts", alertId))
    toast({ title: "Emergencia Resuelta" })
  }

  const handleClearAllAlerts = () => {
    if (!firestore || !alerts) return
    alerts.forEach(a => deleteDocumentNonBlocking(doc(firestore, "alerts", a.id)))
    toast({ title: "Historial Limpio" })
  }

  const handleToggleRole = (newRole: "Driver" | "Admin") => {
    if (!user?.uid || !firestore) return
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), { role: newRole })
    toast({ title: `Cambio a Modo ${newRole === 'Admin' ? 'Empresa' : 'Driver'}` })
  }

  const handleAdminCenterMap = (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng })
    setMapCenterTrigger(p => p + 1)
    setIsExpanded(false)
  }

  const handleAdminOpenChat = (orderId: string) => {
    setSelectedChatOrderId(orderId)
    setActiveTab('central')
    setIsExpanded(true)
  }

  const handleDriverOpenChat = (orderId: string) => {
    setSelectedChatOrderId(orderId)
    setActiveTab('central')
    setIsExpanded(true)
  }

  const handleSendChatMessage = () => {
    if (!selectedChatOrderId || !chatMessageText.trim() || !user?.uid || !firestore) return
    addDocumentNonBlocking(collection(firestore, `orders/${selectedChatOrderId}/chatMessages`), {
      orderId: selectedChatOrderId,
      authorId: user.uid,
      content: chatMessageText,
      timestamp: new Date().toISOString()
    })
    setChatMessageText("")
  }

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleDragStart = (y: number) => {
    setDragY(0)
    setIsDragging(true)
  }

  const safeFormat = (dateStr: string, pattern: string) => {
    try { return format(new Date(dateStr), pattern) } catch { return "" }
  }

  const enterpriseMetrics = useMemo(() => ({
    avgTime: 24,
    co2: (bizAllOrders?.length || 0) * 1.2
  }), [bizAllOrders])

  const activeSOSAlerts = useMemo(() => alerts?.filter(a => a.type === 'sos') || [], [alerts])
  const hasActiveSOS = activeSOSAlerts.length > 0

  if (!mounted) return null
  if (isUserLoading || (user && isUserDataLoading)) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>
  if (!user) return <LoginScreen />

  const sheetY = isMapFullscreen ? 'calc(100% - 40px)' : (isExpanded ? '0' : 'calc(100% - 160px)')

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          center={currentCoords ? [currentCoords.lat, currentCoords.lng] : [19.4326, -99.1332]} 
          destination={destinationCoords}
          alerts={alerts}
          activeOrders={isAdmin ? bizAllOrders : null}
          fleet={isAdmin ? fleetData : null}
          heading={heading}
          isNavigating={isNavigating && !!activeOrder}
          centerTrigger={mapCenterTrigger}
          currentUserId={user?.uid}
        />
      </div>

      <div className="absolute top-8 left-8 z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-16 w-16 rounded-[1.5rem] shadow-2xl bg-white/95 backdrop-blur-md border-none hover:bg-white transition-all text-slate-700"
            >
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
                    <SheetTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
                      {isAdmin ? (companyData?.name || "Biz Profile") : (userData?.firstName || "Driver")}
                      <Pencil className="w-4 h-4 text-slate-300 hover:text-primary transition-colors cursor-pointer" />
                    </SheetTitle>
                    <p className="text-xs font-bold text-slate-400 truncate">{isAdmin ? (user.email) : `ID: ${user.uid.substring(0,8)}`}</p>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="bg-slate-200/50 p-1 rounded-[1.2rem] flex items-center mb-4">
                <button
                  onClick={() => handleToggleRole('Driver')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[1rem] transition-all font-black text-[8px] tracking-widest uppercase",
                    !isAdmin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  <Truck className="h-3 w-3" />
                  DRIVER
                </button>
                <button
                  onClick={() => handleToggleRole('Admin')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[1rem] transition-all font-black text-[8px] tracking-widest uppercase",
                    isAdmin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  <Building2 className="h-3 w-3" />
                  BIZ
                </button>
              </div>

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
                  <span className="text-md font-bold text-slate-700">Pedidos: Pendientes y entregados</span>
                </Link>
                <Link href="/messages" className="flex items-center gap-4 group">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-purple-50 flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Mensajes comunidad</span>
                </Link>
                <Link href="/messages/history" className="flex items-center gap-4 group">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-orange-50 flex items-center justify-center shadow-sm">
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Mensajes con la comunidad</span>
                </Link>
              </div>

              <Button variant="ghost" onClick={() => signOut(auth!)} className="w-full justify-start gap-4 h-16 rounded-3xl text-red-500 font-black px-5 hover:bg-red-50 transition-colors text-sm"><LogOut className="w-5 h-5" /> Salir del sistema</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="absolute right-8 top-8 z-10 flex flex-col gap-4">
        <Button 
          size="icon" 
          onClick={() => setIsAiAssistantOpen(true)}
          className="h-16 w-16 rounded-[1.5rem] shadow-2xl bg-[#2563eb] text-white border-none hover:bg-[#1d4ed8]"
        >
          <Sparkles className="h-8 w-8" />
        </Button>
      </div>

      <div className="absolute right-8 bottom-32 flex flex-col gap-3 z-10">
        <Button size="icon" variant="secondary" onClick={() => setIsNavigating(!isNavigating)} className={cn("h-12 w-12 rounded-full shadow-xl backdrop-blur-md border-none transition-all", isNavigating ? "bg-blue-600 text-white" : "bg-white/95 text-slate-600")}>
          <Navigation className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="secondary" onClick={() => setMapCenterTrigger(p => p+1)} className="h-12 w-12 rounded-full shadow-xl bg-white/95 backdrop-blur-md border-none">
          <Target className="h-5 w-5 text-slate-600" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={() => setIsMapFullscreen(!isMapFullscreen)}
          className={cn(
            "h-12 w-12 rounded-full shadow-xl backdrop-blur-md border-none transition-all",
            isMapFullscreen ? "bg-slate-900 text-white" : "bg-white/95 text-slate-600"
          )}
        >
          {isMapFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
      </div>

      {isAiAssistantOpen && (
        <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-[80vh]">
            <Card className="h-full rounded-[3.5rem] border-none shadow-2xl overflow-hidden flex flex-col bg-slate-900 text-white">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center"><Sparkles className="w-7 h-7" /></div>
                  <div>
                    <h2 className="text-2xl font-black">{isAdmin ? "Analista Orion" : "Capo Asistente"}</h2>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">En Línea</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsAiAssistantOpen(false)}><X className="w-6 h-6" /></Button>
              </div>
              <div className="flex-1 p-8 overflow-y-auto space-y-4 scrollbar-hide">
                 <div className="flex justify-start">
                   <div className="bg-slate-800 p-6 rounded-[2rem] rounded-tl-none max-w-[85%] text-sm font-medium leading-relaxed">
                     ¡Hola {userData?.firstName}! Soy Capo. He analizado tu ruta y el tráfico en tiempo real. ¿Cómo puedo apoyarte?
                   </div>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-800 bg-slate-950/50">
                <div className="flex gap-4">
                  <Input placeholder="Escribe a Capo..." className="h-16 bg-slate-800 border-none rounded-[2rem] px-8 text-lg font-bold" />
                  <Button size="icon" className="h-16 w-16 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl"><Send className="w-6 h-6" /></Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      <div 
        className={cn(
          "absolute inset-x-0 bottom-0 bg-white shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] rounded-t-[3.5rem] transition-all duration-500 ease-in-out z-20 overflow-hidden flex flex-col",
          sheetY === '0' ? "top-20" : sheetY === 'calc(100% - 40px)' ? "top-[calc(100%-40px)]" : "top-1/2"
        )}
      >
        <div 
          className="h-12 w-full flex items-center justify-center cursor-pointer active:bg-slate-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cn("w-16 h-1.5 rounded-full mb-8", hasActiveSOS ? "bg-red-600 animate-pulse" : "bg-slate-200")}></div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-hide">
          <div className="flex justify-center mb-10 sticky top-0 bg-white pt-2 pb-4 z-30">
            <div className="bg-slate-50 p-2 rounded-[2.5rem] flex items-center gap-2 shadow-inner border border-slate-100">
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("ruta")} className={cn("h-16 w-20 rounded-[1.8rem]", activeTab === "ruta" ? "bg-slate-900 text-white" : "text-slate-400")}><Truck className="h-7 w-7" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("pedidos")} className={cn("h-16 w-20 rounded-[1.8rem]", activeTab === "pedidos" ? "bg-slate-900 text-white" : "text-slate-400")}><Layers className="h-7 w-7" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("central")} className={cn("h-16 w-20 rounded-[1.8rem]", activeTab === "central" ? "bg-slate-900 text-white" : "text-slate-400")}><MessageSquare className="h-7 w-7" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("alerta")} className={cn("h-16 w-20 rounded-[1.8rem]", activeTab === "alerta" ? "bg-slate-900 text-white" : "text-slate-400")}><ShieldAlert className="h-7 w-7" /></Button>
            </div>
          </div>

          {activeTab === 'ruta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl mb-8">
                <div className="flex items-center justify-between mb-12">
                  <h1 className="text-5xl font-black tracking-tighter uppercase">{isAdmin ? "Flota Biz" : "Mi Ruta Pro"}</h1>
                  <Flame className="h-10 w-10 text-orange-500 fill-orange-500" />
                </div>
                <div className="bg-slate-900/50 rounded-[2.5rem] p-8 mb-8 border border-slate-800 shadow-inner">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">MISIÓN DIARIA: BONO $2,000</span>
                    <span className="text-[10px] font-black text-blue-400 uppercase">5/10 PEDIDOS</span>
                  </div>
                  <Progress value={50} className="h-3 bg-slate-800" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-800 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">POSICIÓN</span>
                    <span className="text-4xl font-black text-white">#2</span>
                  </div>
                  <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-800 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">PARADAS</span>
                    <span className="text-4xl font-black text-white">{driverActiveOrders?.length || 0}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {driverActiveOrders?.map((order, i) => (
                  <DriverOrderCard key={order.id} order={order} index={i} currentCoords={currentCoords} onOpenChat={handleDriverOpenChat} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="flex items-center gap-6 mb-10">
                <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-white"><Package className="h-8 w-8" /></div>
                <div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-1 uppercase">Cerca Tuyo</h1>
                  <p className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">Oportunidades Live</p>
                </div>
              </div>
              <div className="space-y-4">
                {pendingOrders?.map(order => (
                  <div key={order.id} className="p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between hover:bg-slate-950 hover:text-white transition-all group">
                    <div className="flex items-center gap-4">
                      <Checkbox checked={selectedOrderIds.includes(order.id)} onCheckedChange={() => toggleOrderSelection(order.id)} className="h-8 w-8 rounded-xl border-slate-200" />
                      <div className="text-left">
                        <h4 className="font-black text-lg tracking-tight leading-none mb-1">{order.deliveryAddress.split(',')[0]}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.clientName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-emerald-500 tracking-tighter">${order.offeredPrice}</p>
                       <Button size="sm" variant="outline" onClick={() => handleAcceptOrder(order.id)} className="h-10 rounded-xl mt-2 group-hover:bg-white group-hover:text-slate-900">ACEPTAR</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alerta' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="mb-10">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-1 uppercase">Coro Driver</h1>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Alertas Viales</p>
              </div>
              <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
                {[
                  { id: "policia", label: "CONTROL", icon: ShieldAlert, bg: "bg-blue-50", color: "text-blue-600" },
                  { id: "trafico", label: "TRÁFICO", icon: Clock, bg: "bg-orange-50", color: "text-orange-600" },
                  { id: "sos", label: "PELIGRO", icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
                  { id: "obras", label: "OBRAS", icon: HardHat, bg: "bg-emerald-50", color: "text-emerald-600" },
                ].map((a) => (
                  <Dialog key={a.id} open={isAlertMenuOpen && selectedAlertType?.id === a.id} onOpenChange={(open) => {
                    if (!open) {
                      setIsAlertMenuOpen(false);
                      setSelectedAlertType(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <div 
                        className="flex flex-col items-center gap-4 min-w-[100px] cursor-pointer active:scale-95 transition-all"
                        onClick={() => {
                          setSelectedAlertType({id: a.id, label: a.label});
                          setIsAlertMenuOpen(true);
                        }}
                      >
                        <div className={cn("h-24 w-24 rounded-full flex items-center justify-center shadow-sm border border-white", a.bg)}>
                          <a.icon className={cn("h-10 w-10", a.color)} />
                        </div>
                        <span className="text-[10px] font-black text-slate-900 tracking-wider uppercase">{a.label}</span>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[92vw] rounded-[48px] p-10">
                      <DialogHeader>
                        <DialogTitle className="font-black uppercase text-xl text-center">Reportar {a.label}</DialogTitle>
                      </DialogHeader>
                      <div className="py-6">
                        <Textarea 
                          placeholder="Describe la situación..." 
                          className="min-h-[120px] bg-slate-50 border-none rounded-[28px] p-6 font-medium text-lg" 
                          value={alertDescription} 
                          onChange={(e) => setAlertDescription(e.target.value)} 
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handlePublishAlert} 
                          className="w-full h-20 rounded-[32px] bg-slate-900 text-white font-black uppercase shadow-2xl"
                        >
                          PUBLICAR
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
              <div className="space-y-4">
                {alerts?.map((alert) => (
                  <CoroItem key={alert.id} alert={alert} userId={user.uid} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'central' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left h-full flex flex-col min-h-[500px]">
                {selectedChatOrderId ? (
                  <div className="flex flex-col h-full bg-[#f2e7d5] rounded-[40px] p-4">
                    <header className="flex items-center gap-4 mb-6 sticky top-0 bg-white p-4 rounded-2xl shadow-sm z-10">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedChatOrderId(null)} className="rounded-full h-10 w-10"><ChevronLeft className="w-6 h-6" /></Button>
                      <h2 className="text-[14px] font-black tracking-tight uppercase truncate">Orden #{selectedChatOrderId.substring(0, 5)}</h2>
                    </header>
                    <div className="flex-1 overflow-y-auto space-y-3 px-2 scrollbar-hide mb-4 min-h-[300px]">
                      {chatMessages?.map((msg) => (
                        <div key={msg.id} className={cn("flex", msg.authorId === user.uid ? 'justify-end' : 'justify-start')}>
                          <div className={cn("max-w-[85%] p-4 rounded-[22px] text-[13px] shadow-sm", msg.authorId === user.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100')}>
                            <p className="font-medium leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-4 bg-transparent mt-auto items-center">
                      <Input placeholder="Escribe un mensaje..." className="h-14 bg-white border-none rounded-full px-6 font-medium shadow-lg flex-1 text-sm" value={chatMessageText} onChange={(e) => setChatMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} />
                      <Button onClick={handleSendChatMessage} size="icon" className="h-14 w-14 rounded-full bg-[#79d3b4] text-white shadow-xl shrink-0"><Send className="w-5 h-5" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <header className="px-2 mb-6"><h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Canal de Chat</h2><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Órdenes Activas</p></header>
                    {(isAdmin ? bizAllOrders?.filter(o => o.driverId) : driverActiveOrders)?.map(order => (
                      <Card key={order.id} className="rounded-[40px] border-none shadow-sm bg-slate-50/50 hover:bg-white transition-all cursor-pointer" onClick={() => handleAdminOpenChat(order.id)}>
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
