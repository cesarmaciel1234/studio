
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
  Check,
  Plus,
  Search,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
import { generateOptimizedRouteFromDescription } from "@/ai/flows/generate-optimized-route-from-description"

// Dynamic import for the map to avoid SSR issues
const InteractiveMap = dynamic(() => import('@/components/dashboard/InteractiveMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
});

// --- SUB-COMPONENTS ---

function DriverChatItem({ order, onClick, isSelected }: { order: any, onClick: () => void, isSelected: boolean }) {
  const { firestore } = useFirebase()
  
  const driverRef = useMemoFirebase(() => {
    if (!firestore || !order.driverId) return null
    return doc(firestore, "users", order.driverId)
  }, [firestore, order.driverId])
  const { data: driverData } = useDoc(driverRef)

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
          <Avatar className="h-10 w-10">
            <AvatarImage src={driverData?.photoURL} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-black">
              {driverData?.firstName?.substring(0, 1) || "D"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex justify-between items-center mb-0.5">
            <h3 className="font-black text-sm text-slate-800 truncate uppercase tracking-tight">
              {driverData?.firstName || "Asignando..."}
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

// --- MAIN PAGE ---

export default function DashboardPage() {
  // --- 1. HOOKS AT THE TOP (STRICT ORDER) ---
  const router = useRouter()
  const searchParams = useSearchParams()
  const { firestore, auth } = useFirebase()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  // State
  const [activeTab, setActiveTab] = useState('gestion')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mapCenterTrigger, setMapCenterTrigger] = useState(0)
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null)
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false)
  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string | null>(null)
  const [chatMessageText, setChatMessageText] = useState("")
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [newOrderDescription, setNewOrderDescription] = useState("")
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Memoized Queries
  const userRef = useMemoFirebase(() => (!firestore || !user?.uid) ? null : doc(firestore, "users", user.uid), [user?.uid, firestore])
  const alertsQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, "alerts"), orderBy("createdAt", "desc")), [firestore])
  
  // Queries for Company (Admin)
  const companyOrdersQuery = useMemoFirebase(() => (!firestore || !user?.uid) ? null : query(collection(firestore, "orders"), where("companyId", "==", user.uid)), [user?.uid, firestore])
  const activeFleetQuery = useMemoFirebase(() => (!firestore) ? null : query(collection(firestore, "users"), where("role", "==", "Driver")), [firestore])
  const orderChatMessagesQuery = useMemoFirebase(() => (!firestore || !selectedChatOrderId) ? null : query(collection(firestore, `orders/${selectedChatOrderId}/messages`), orderBy("timestamp", "asc")), [selectedChatOrderId, firestore])

  // Data
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef)
  const { data: alerts } = useCollection(alertsQuery)
  const { data: companyOrders } = useCollection(companyOrdersQuery)
  const { data: fleetDrivers } = useCollection(activeFleetQuery)
  const { data: orderChatMessages } = useCollection(orderChatMessagesQuery)

  const isAdmin = userData?.role === 'Admin'
  const isCentralLayout = useMemo(() => activeTab === 'central', [activeTab])
  const activeOrdersCount = useMemo(() => companyOrders?.filter(o => ["Assigned", "Picked Up", "In Transit"].includes(o.status)).length || 0, [companyOrders])

  // --- 2. EFFECTS ---
  useEffect(() => {
    setMounted(true)
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err)
      )
    }
  }, [searchParams])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [selectedChatOrderId, orderChatMessages?.length])

  // --- 3. CALLBACKS ---
  const handleCreateOrderWithIA = async () => {
    if (!newOrderDescription.trim() || !user?.uid || !firestore) return
    setIsGeneratingWithAi(true)
    try {
      const result = await generateOptimizedRouteFromDescription({ description: newOrderDescription })
      
      // Create order from the first stop of the AI result as an example
      const firstStop = result.optimizedStops[0]
      addDocumentNonBlocking(collection(firestore, "orders"), {
        companyId: user.uid,
        originName: userData?.firstName || "Empresa Logística",
        deliveryAddress: firstStop.address,
        clientName: firstStop.name,
        status: "Pending",
        reward: Math.floor(Math.random() * 500) + 100,
        timeEstimate: "15 min",
        distanceEstimate: "2.5 km",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      setIsCreatingOrder(false)
      setNewOrderDescription("")
      toast({ title: "Pedido creado con éxito", description: "La IA ha procesado la solicitud correctamente." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la solicitud con IA." })
    } finally {
      setIsGeneratingWithAi(false)
    }
  }

  const handleSendChatMessage = useCallback(() => {
    if (!chatMessageText.trim() || !user?.uid || !firestore || !selectedChatOrderId) return
    
    addDocumentNonBlocking(collection(firestore, `orders/${selectedChatOrderId}/messages`), {
      authorId: user.uid,
      authorName: userData?.firstName || "Empresa",
      content: chatMessageText,
      timestamp: serverTimestamp(),
      isReadByDriver: false,
      isReadByCompany: true
    })
    setChatMessageText("")
  }, [chatMessageText, user?.uid, firestore, selectedChatOrderId, userData?.firstName])

  // --- 4. CONDITIONAL RENDERS ---
  if (!mounted) return null
  if (isUserLoading || (user && isUserDataLoading)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Iniciando Centro de Control...</p>
      </div>
    )
  }
  if (!user) return null // Handled by layout/redirect

  // --- 5. CENTRAL FULLSCREEN LAYOUT ---
  if (isCentralLayout) {
    return (
      <div className="h-screen w-full bg-[#f2f1f4] flex flex-col animate-in fade-in duration-500 z-[100]">
        <header className="p-8 flex items-center gap-6 border-b border-slate-100 bg-white sticky top-0 z-50 rounded-b-[40px] shadow-sm">
          <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-slate-50" onClick={() => setActiveTab('gestion')}>
            <ArrowLeft className="h-7 w-7 text-slate-900" />
          </Button>
          <div className="flex-1">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight uppercase">Central</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestión de Conductores Activos</p>
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
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Chat Directo con Repartidor</p>
                  </div>
                </header>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 p-8 scrollbar-hide bg-slate-50/50">
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
                  <Input placeholder="Escribe al repartidor..." className="h-16 bg-slate-50 border-none rounded-full px-8 font-medium shadow-inner flex-1" value={chatMessageText} onChange={(e) => setChatMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} />
                  <Button onClick={handleSendChatMessage} size="icon" className="h-16 w-16 rounded-full bg-blue-600 text-white shadow-xl shrink-0"><Send className="w-6 h-6" /></Button>
                </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
               <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Conductores en Servicio</h3>
               </div>
               {companyOrders && companyOrders.length > 0 ? (
                 companyOrders.filter(o => o.driverId).map(order => (
                    <DriverChatItem 
                      key={order.id} 
                      order={order} 
                      onClick={() => setSelectedChatOrderId(order.id)} 
                      isSelected={selectedChatOrderId === order.id} 
                    />
                  ))
               ) : (
                 <div className="text-center py-20 opacity-30 space-y-4 bg-white rounded-[3rem] border border-slate-100">
                    <Users className="w-12 h-12 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">No hay chats activos con la flota.</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- 6. MAIN DASHBOARD UI (COMPANY VIEW) ---
  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      {/* MAP LAYER */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          center={currentCoords ? [currentCoords.lat, currentCoords.lng] : [19.4326, -99.1332]} 
          alerts={alerts}
          fleet={fleetDrivers}
          isNavigating={false}
          centerTrigger={mapCenterTrigger}
          currentUserId={user?.uid}
        />
      </div>

      {/* FLOATING HEADER CONTROLS */}
      <div className="absolute top-8 left-8 right-8 z-10 flex justify-between pointer-events-none">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-2xl bg-white/95 backdrop-blur-md border-none hover:bg-white text-slate-700 pointer-events-auto">
              <Building2 className="h-7 w-7" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0 border-none bg-white/80 backdrop-blur-xl shadow-2xl rounded-r-[48px]">
            <div className="p-8 space-y-8 h-full flex flex-col">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 shadow-xl border-4 border-white">
                    <AvatarFallback className="bg-slate-900 text-white font-black">CP</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-2xl font-black tracking-tighter uppercase">
                      {userData?.firstName || "Empresa"}
                    </SheetTitle>
                    <Badge className="bg-blue-600 text-white border-none font-black text-[8px] tracking-widest">PREMIUM BIZ</Badge>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 space-y-4 pt-4">
                <button onClick={() => { setActiveTab('gestion'); setIsExpanded(true); }} className="flex items-center gap-4 group w-full text-left">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-blue-50 flex items-center justify-center shadow-sm">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Gestión de Pedidos</span>
                </button>
                <button onClick={() => { setActiveTab('central'); }} className="flex items-center gap-4 group w-full text-left">
                  <div className="h-11 w-11 rounded-[0.8rem] bg-emerald-50 flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="text-md font-bold text-slate-700">Monitoreo de Flota</span>
                </button>
              </div>
              <Button variant="ghost" onClick={() => signOut(auth!)} className="w-full justify-start gap-4 h-16 rounded-3xl text-red-500 font-black px-5 hover:bg-red-50 text-sm"><LogOut className="w-5 h-5" /> Cerrar Sesión</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ACTION STACK (FLOATING CONTROLS) */}
      <div className="absolute top-1/2 -translate-y-1/2 right-8 z-10 flex flex-col gap-4 pointer-events-auto">
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
          onClick={() => setIsAiAssistantOpen(true)}
          className="h-20 w-20 rounded-full shadow-2xl bg-blue-600 border-none text-white hover:bg-blue-700 mt-4"
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
        
        <div className="h-28 w-full flex flex-col items-center justify-center shrink-0 bg-white border-b border-slate-50">
          <div className="h-8 w-full flex items-center justify-center cursor-pointer active:bg-slate-50" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="w-20 h-2 rounded-full bg-slate-200"></div>
          </div>
          
          <div className="bg-slate-900 p-2 rounded-[2.5rem] flex items-center gap-1 shadow-2xl pointer-events-auto scale-90 mb-2">
            <Button 
              variant="ghost" 
              onClick={() => { setActiveTab("gestion"); setIsExpanded(true); }} 
              className={cn(
                "h-12 flex items-center gap-3 px-8 transition-all duration-300", 
                activeTab === "gestion" ? "bg-white text-slate-900 rounded-[1.8rem]" : "text-slate-400"
              )}
            >
              <Package className="h-5 w-5" />
              {activeTab === "gestion" && <span className="font-black text-[10px] uppercase tracking-widest">GESTIÓN</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => { setActiveTab("flota"); setIsExpanded(true); }} 
              className={cn(
                "h-12 w-12 rounded-full p-0 flex items-center justify-center transition-all duration-300", 
                activeTab === "flota" ? "bg-white text-slate-900" : "text-slate-400"
              )}
            >
              <Users className="h-5 w-5" />
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => { setActiveTab("central"); }} 
              className={cn(
                "h-12 w-12 rounded-full p-0 flex items-center justify-center transition-all duration-300", 
                activeTab === "central" ? "bg-white text-slate-900" : "text-slate-400"
              )}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-8 pb-20 scrollbar-hide">
          {activeTab === 'gestion' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pt-6">
               <header className="flex justify-between items-start mb-10">
                 <div>
                   <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-tight">Control Logístico</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pedidos y Operaciones Activas</p>
                 </div>
                 
                 <Dialog open={isCreatingOrder} onOpenChange={setIsCreatingOrder}>
                   <DialogTrigger asChild>
                     <Button className="h-16 px-8 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl">
                       <Plus className="w-5 h-5 mr-3" />
                       NUEVO PEDIDO
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 max-w-lg">
                     <DialogHeader>
                       <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Crear con IA Copo</DialogTitle>
                     </DialogHeader>
                     <div className="space-y-6 py-4">
                       <div className="space-y-2">
                         <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción del trayecto</Label>
                         <textarea 
                           className="w-full min-h-[120px] bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none resize-none shadow-inner"
                           placeholder="Ej: Recoger en Almacén Central y entregar a Cliente Juan en Polanco..."
                           value={newOrderDescription}
                           onChange={(e) => setNewOrderDescription(e.target.value)}
                         />
                       </div>
                       <Button 
                         onClick={handleCreateOrderWithIA} 
                         disabled={isGeneratingWithAi || !newOrderDescription.trim()}
                         className="w-full h-16 rounded-[2rem] bg-slate-950 hover:bg-black text-white font-black text-lg tracking-tight"
                       >
                         {isGeneratingWithAi ? <RefreshCcw className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                         {isGeneratingWithAi ? "PROCESANDO..." : "GENERAR CON IA"}
                       </Button>
                     </div>
                   </DialogContent>
                 </Dialog>
               </header>

               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
                   <Package className="w-8 h-8 text-blue-600 mb-4" />
                   <p className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-1">PEDIDOS EN CURSO</p>
                   <p className="text-3xl font-black text-slate-900">{activeOrdersCount}</p>
                 </div>
                 <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
                   <Users className="w-8 h-8 text-emerald-600 mb-4" />
                   <p className="font-black text-[10px] uppercase text-slate-400 tracking-widest mb-1">FLOTA ACTIVA</p>
                   <p className="text-3xl font-black text-slate-900">{fleetDrivers?.length || 0}</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Paradero de Pedidos</h3>
                 {companyOrders?.length === 0 ? (
                   <div className="py-20 text-center opacity-30">
                     <Package className="w-12 h-12 mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No hay pedidos registrados</p>
                   </div>
                 ) : (
                   companyOrders?.map(order => (
                     <Card key={order.id} className="rounded-[32px] border-none shadow-sm bg-slate-50 p-6 mb-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                           <MapPin className="w-6 h-6" />
                         </div>
                         <div>
                           <h4 className="font-black text-sm uppercase tracking-tight">{order.clientName}</h4>
                           <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px] uppercase tracking-widest">{order.deliveryAddress}</p>
                         </div>
                       </div>
                       <Badge className={cn(
                         "font-black text-[9px] px-3 py-1 rounded-full",
                         order.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                       )}>
                         {order.status.toUpperCase()}
                       </Badge>
                     </Card>
                   ))
                 )}
               </div>
            </div>
          )}

          {activeTab === 'flota' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pt-6">
               <header className="mb-10">
                 <h2 className="text-4xl font-black tracking-tighter uppercase">Estado de la Flota</h2>
                 <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Monitoreo Satelital</p>
               </header>
               <div className="space-y-4">
                 {fleetDrivers?.map((driver) => (
                   <Card key={driver.id} className="rounded-[32px] border-none shadow-sm bg-white p-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <Avatar className="h-14 w-14 rounded-2xl">
                         <AvatarImage src={driver.photoURL} />
                         <AvatarFallback className="bg-slate-100 text-slate-600 font-black">
                           {driver.firstName?.substring(0, 1) || "D"}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <h4 className="font-black text-lg uppercase tracking-tight">{driver.firstName} {driver.lastName || ""}</h4>
                         <div className="flex items-center gap-1">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EN SERVICIO</p>
                         </div>
                       </div>
                     </div>
                     <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-slate-50">
                       <Phone className="w-5 h-5 text-slate-400" />
                     </Button>
                   </Card>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
