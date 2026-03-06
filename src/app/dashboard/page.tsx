
"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Navigation, 
  Truck,
  MessageSquare,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Package,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Target,
  Sparkles,
  X,
  User,
  ArrowLeft,
  RefreshCcw,
  Building2,
  Check,
  Plus,
  Users,
  Send,
  Loader2,
  Phone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { 
  useFirebase, 
  useUser, 
  useCollection, 
  useDoc, 
  useMemoFirebase,
  addDocumentNonBlocking
} from "@/firebase"
import { collection, doc, query, where, orderBy, serverTimestamp } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { CapoAssistant } from "@/components/dashboard/CapoAssistant"
import { generateOptimizedRouteFromDescription } from "@/ai/flows/generate-optimized-route-from-description"

// Mapa dinámico para evitar errores de SSR
const InteractiveMap = dynamic(() => import('@/components/dashboard/InteractiveMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
});

// --- SUB-COMPONENTES ---

function OrderCard({ order, onChat }: { order: any, onChat: (id: string) => void }) {
  return (
    <Card className="rounded-[32px] border-none shadow-sm bg-white p-6 mb-4 flex items-center justify-between group hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
          <Package className="w-7 h-7" />
        </div>
        <div className="text-left">
          <h4 className="font-black text-sm uppercase tracking-tight text-slate-800">{order.clientName}</h4>
          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[180px] uppercase tracking-widest">{order.deliveryAddress}</p>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-tighter">#{order.id.substring(0, 5)}</Badge>
             <span className="text-[9px] font-bold text-slate-400 uppercase">{order.status}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {order.driverId && (
          <Button variant="ghost" size="icon" onClick={() => onChat(order.id)} className="h-12 w-12 rounded-full bg-blue-50 text-blue-600">
            <MessageSquare className="w-5 h-5" />
          </Button>
        )}
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </div>
    </Card>
  )
}

// --- PÁGINA PRINCIPAL ---

export default function DashboardPage() {
  // --- 1. HOOKS AL INICIO (ORDEN ESTRICTO) ---
  const router = useRouter()
  const searchParams = useSearchParams()
  const { firestore, auth } = useFirebase()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  // Estados
  const [activeTab, setActiveTab] = useState('gestion')
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mapCenterTrigger, setMapCenterTrigger] = useState(0)
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null)
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false)
  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string | null>(null)
  const [chatMessageText, setChatMessageText] = useState("")
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [newOrderDescription, setNewOrderDescription] = useState("")
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Consultas Memorizadas
  const userRef = useMemoFirebase(() => (!firestore || !user?.uid) ? null : doc(firestore, "users", user.uid), [user?.uid, firestore])
  const companyOrdersQuery = useMemoFirebase(() => (!firestore || !user?.uid) ? null : query(collection(firestore, "orders"), where("companyId", "==", user.uid)), [user?.uid, firestore])
  const fleetDriversQuery = useMemoFirebase(() => (!firestore) ? null : query(collection(firestore, "users"), where("role", "==", "Driver")), [firestore])
  const chatMessagesQuery = useMemoFirebase(() => (!firestore || !selectedChatOrderId) ? null : query(collection(firestore, `orders/${selectedChatOrderId}/messages`), orderBy("timestamp", "asc")), [selectedChatOrderId, firestore])

  // Datos
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef)
  const { data: companyOrders } = useCollection(companyOrdersQuery)
  const { data: fleetDrivers } = useCollection(fleetDriversQuery)
  const { data: chatMessages } = useCollection(chatMessagesQuery)

  const isAdmin = userData?.role === 'Admin'
  const isCentralLayout = activeTab === 'central'
  const activeOrders = useMemo(() => companyOrders?.filter(o => ["Pending", "Assigned", "Picked Up", "In Transit"].includes(o.status)) || [], [companyOrders])

  // --- 2. EFECTOS ---
  useEffect(() => {
    setMounted(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err)
      )
    }
  }, [])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages?.length])

  // --- 3. ACCIONES ---
  const handleCreateOrderWithIA = async () => {
    if (!newOrderDescription.trim() || !user?.uid || !firestore) return
    setIsGeneratingWithAi(true)
    try {
      const result = await generateOptimizedRouteFromDescription({ description: newOrderDescription })
      const firstStop = result.optimizedStops[0]
      
      addDocumentNonBlocking(collection(firestore, "orders"), {
        companyId: user.uid,
        originName: userData?.firstName || "Empresa Logística",
        deliveryAddress: firstStop.address,
        clientName: firstStop.name,
        status: "Pending",
        reward: 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      setIsCreatingOrder(false)
      setNewOrderDescription("")
      toast({ title: "Pedido creado", description: "La IA ha procesado la solicitud correctamente." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la solicitud." })
    } finally {
      setIsGeneratingWithAi(false)
    }
  }

  const handleSendChatMessage = () => {
    if (!chatMessageText.trim() || !selectedChatOrderId || !user?.uid || !firestore) return
    addDocumentNonBlocking(collection(firestore, `orders/${selectedChatOrderId}/messages`), {
      authorId: user.uid,
      authorName: userData?.firstName || "Empresa",
      content: chatMessageText,
      timestamp: serverTimestamp()
    })
    setChatMessageText("")
  }

  // --- 4. RENDERIZADO ---
  if (!mounted) return null
  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Sincronizando Sistema de Empresa...</p>
      </div>
    )
  }

  // VISTA CENTRAL (PANTALLA COMPLETA)
  if (isCentralLayout) {
    return (
      <div className="h-screen w-full bg-[#f2f1f4] flex flex-col z-[100] animate-in fade-in duration-500">
        <header className="p-8 flex items-center gap-6 bg-white rounded-b-[40px] shadow-sm">
          <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-slate-50" onClick={() => setActiveTab('gestion')}>
            <ArrowLeft className="h-7 w-7 text-slate-900" />
          </Button>
          <div className="flex-1 text-left">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Central</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial de Mensajería Privada</p>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
          {selectedChatOrderId ? (
            <div className="h-full flex flex-col bg-white rounded-[3rem] shadow-xl overflow-hidden">
               <header className="flex items-center gap-4 p-8 border-b border-slate-50">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedChatOrderId(null)} className="rounded-full h-12 w-12 bg-slate-50"><ChevronLeft className="w-6 h-6" /></Button>
                  <div className="text-left">
                    <h2 className="text-xl font-black uppercase">Orden #{selectedChatOrderId.substring(0, 5)}</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Chat Directo con Repartidor</p>
                  </div>
                </header>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/30 scrollbar-hide">
                  {chatMessages?.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.authorId === user?.uid ? 'justify-end' : 'justify-start')}>
                      <div className={cn("max-w-[75%] p-6 rounded-[2rem] text-sm shadow-sm", msg.authorId === user?.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-50')}>
                        <p className="font-medium text-left leading-relaxed">{msg.content}</p>
                        <div className="flex justify-end mt-2"><p className="text-[7px] font-black opacity-40 uppercase">{msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-white border-t flex gap-4 items-center">
                  <Input placeholder="Escribe al repartidor..." className="h-16 bg-slate-50 border-none rounded-full px-8 font-medium shadow-inner flex-1" value={chatMessageText} onChange={(e) => setChatMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()} />
                  <Button onClick={handleSendChatMessage} size="icon" className="h-16 w-16 rounded-full bg-blue-600 text-white shadow-xl shrink-0"><Send className="w-6 h-6" /></Button>
                </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
               {activeOrders.filter(o => o.driverId).length > 0 ? (
                 activeOrders.filter(o => o.driverId).map(order => (
                   <Card key={order.id} className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 cursor-pointer hover:bg-slate-50 transition-all" onClick={() => setSelectedChatOrderId(order.id)}>
                     <div className="flex items-center gap-4">
                       <Avatar className="h-14 w-14 rounded-2xl"><AvatarFallback className="bg-slate-900 text-white font-black">R</AvatarFallback></Avatar>
                       <div className="flex-1 text-left">
                         <h4 className="font-black text-lg uppercase tracking-tight">Orden #{order.id.substring(0, 5)}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.clientName} • {order.status}</p>
                       </div>
                       <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><MessageSquare className="w-5 h-5" /></div>
                     </div>
                   </Card>
                 ))
               ) : (
                 <div className="py-20 opacity-30 text-center"><MessageSquare className="w-16 h-16 mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-widest">No hay chats activos con la flota.</p></div>
               )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // VISTA DASHBOARD PRINCIPAL (MAPA + GESTIÓN)
  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          center={currentCoords ? [currentCoords.lat, currentCoords.lng] : [19.4326, -99.1332]} 
          fleet={fleetDrivers}
          centerTrigger={mapCenterTrigger}
          currentUserId={user?.uid}
        />
      </div>

      {/* CABECERA FLOTANTE */}
      <div className="absolute top-8 left-8 right-8 z-10 flex justify-between pointer-events-none">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-2xl bg-white/95 backdrop-blur-md border-none pointer-events-auto">
              <Building2 className="h-7 w-7 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-8 border-none bg-white/80 backdrop-blur-xl shadow-2xl rounded-r-[48px] flex flex-col">
            <SheetHeader className="text-left mb-8">
              <Avatar className="w-20 h-20 mb-4 border-4 border-white shadow-xl"><AvatarFallback className="bg-slate-900 text-white font-black">EM</AvatarFallback></Avatar>
              <SheetTitle className="text-3xl font-black uppercase tracking-tighter leading-none">{userData?.firstName || "Empresa"}</SheetTitle>
              <Badge className="bg-blue-600 text-white border-none font-black text-[8px] tracking-[0.3em] w-fit">PERFIL LOGÍSTICO</Badge>
            </SheetHeader>
            <div className="flex-1 space-y-4 pt-4">
              <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl text-slate-700 font-bold" onClick={() => { setActiveTab('gestion'); setIsExpanded(true); }}><Package className="w-5 h-5" /> Gestión de Pedidos</Button>
              <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl text-slate-700 font-bold" onClick={() => { setActiveTab('flota'); setIsExpanded(true); }}><Users className="w-5 h-5" /> Mi Flota Activa</Button>
              <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl text-slate-700 font-bold" onClick={() => { setActiveTab('central'); }}><MessageSquare className="w-5 h-5" /> Centro de Mensajes</Button>
            </div>
            <Button variant="ghost" onClick={() => signOut(auth!)} className="mt-auto h-16 rounded-3xl text-red-500 font-black hover:bg-red-50"><X className="w-5 h-5 mr-2" /> Cerrar Sesión</Button>
          </SheetContent>
        </Sheet>
        
        <Dialog open={isCreatingOrder} onOpenChange={setIsCreatingOrder}>
          <DialogTrigger asChild>
            <Button className="h-16 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black shadow-2xl pointer-events-auto border-none">
              <Plus className="w-6 h-6 mr-3" /> NUEVO PEDIDO
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 max-w-lg bg-white/95 backdrop-blur-xl">
             <DialogHeader className="mb-6"><DialogTitle className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Crear con IA Copo</DialogTitle></DialogHeader>
             <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción del trayecto</Label>
                  <textarea 
                    className="w-full min-h-[160px] bg-slate-50 border-none rounded-[2.5rem] p-8 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none resize-none shadow-inner"
                    placeholder="Ej: Recoger en Almacén Norte a las 2pm y entregar a Cliente X en Polanco..."
                    value={newOrderDescription}
                    onChange={(e) => setNewOrderDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateOrderWithIA} disabled={isGeneratingWithAi || !newOrderDescription.trim()} className="w-full h-18 rounded-full bg-slate-950 text-white font-black text-xl shadow-xl">
                  {isGeneratingWithAi ? <RefreshCcw className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3 text-blue-400" />}
                  {isGeneratingWithAi ? "PROCESANDO..." : "GENERAR PEDIDO"}
                </Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* CONTROLES MAPA */}
      <div className="absolute top-1/2 -translate-y-1/2 right-8 z-10 flex flex-col gap-4 pointer-events-auto">
        <Button variant="secondary" size="icon" onClick={() => setMapCenterTrigger(t => t + 1)} className="h-16 w-16 rounded-full shadow-2xl bg-white border-none text-slate-700"><Target className="h-7 w-7" /></Button>
        <Button variant="secondary" size="icon" onClick={() => setIsAiAssistantOpen(true)} className="h-20 w-20 rounded-full shadow-2xl bg-blue-600 border-none text-white hover:bg-blue-700 mt-4"><Sparkles className="h-9 w-9" /></Button>
      </div>

      {isAiAssistantOpen && (
        <div className="absolute inset-0 z-[60] p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-300">
          <div className="h-full max-w-lg mx-auto"><CapoAssistant onClose={() => setIsAiAssistantOpen(false)} /></div>
        </div>
      )}

      {/* PANEL INFERIOR SLIDING */}
      <div className={cn("absolute inset-x-0 bottom-0 bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.15)] rounded-t-[5rem] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-20 overflow-hidden flex flex-col", isExpanded ? "top-24" : "top-1/2")}>
        <div className="h-32 w-full flex flex-col items-center justify-center shrink-0 bg-white">
          <div className="h-10 w-full flex items-center justify-center cursor-pointer active:bg-slate-50" onClick={() => setIsExpanded(!isExpanded)}><div className="w-24 h-2 rounded-full bg-slate-100"></div></div>
          
          <div className="bg-slate-900 p-2 rounded-full flex items-center gap-2 shadow-2xl scale-90 mb-2">
            <Button variant="ghost" onClick={() => { setActiveTab("gestion"); setIsExpanded(true); }} className={cn("h-14 flex items-center gap-3 px-10 transition-all duration-300", activeTab === "gestion" ? "bg-white text-slate-900 rounded-full" : "text-slate-400")}>
              <Package className="h-5 w-5" />{activeTab === "gestion" && <span className="font-black text-[10px] uppercase tracking-widest">PEDIDOS</span>}
            </Button>
            <Button variant="ghost" onClick={() => { setActiveTab("flota"); setIsExpanded(true); }} className={cn("h-14 w-14 rounded-full p-0 flex items-center justify-center transition-all duration-300", activeTab === "flota" ? "bg-white text-slate-900" : "text-slate-400")}>
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="ghost" onClick={() => { setActiveTab("central"); }} className={cn("h-14 w-14 rounded-full p-0 flex items-center justify-center transition-all duration-300", activeTab === "central" ? "bg-white text-slate-900" : "text-slate-400")}>
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-20 scrollbar-hide text-left">
           {activeTab === 'gestion' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
                <header className="mb-10">
                   <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none">Control Activo</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Seguimiento de pedidos en curso</p>
                </header>

                <div className="grid grid-cols-2 gap-6 mb-12">
                   <div className="bg-blue-50/50 rounded-[3rem] p-10 border border-blue-100/50">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">EN TRÁNSITO</p>
                      <p className="text-5xl font-black text-slate-900">{activeOrders.length}</p>
                   </div>
                   <div className="bg-emerald-50/50 rounded-[3rem] p-10 border border-emerald-100/50">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">FLOTA LISTA</p>
                      <p className="text-5xl font-black text-slate-900">{fleetDrivers?.length || 0}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-4">Listado de Operaciones</h3>
                   {activeOrders.length === 0 ? (
                     <div className="py-20 opacity-20 text-center"><Package className="w-16 h-16 mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-widest">No hay pedidos registrados hoy.</p></div>
                   ) : (
                     activeOrders.map(order => <OrderCard key={order.id} order={order} onChat={(id) => { setSelectedChatOrderId(id); setActiveTab('central'); }} />)
                   )}
                </div>
             </div>
           )}

           {activeTab === 'flota' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
                <header className="mb-10 text-left">
                   <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Mi Flota</h2>
                   <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Personal en servicio activo</p>
                </header>
                <div className="space-y-4">
                   {fleetDrivers?.map((driver) => (
                     <Card key={driver.id} className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 flex items-center justify-between group">
                       <div className="flex items-center gap-4 text-left">
                         <Avatar className="h-16 w-16 rounded-2xl border-4 border-slate-50 shadow-sm"><AvatarImage src={driver.photoURL} /><AvatarFallback className="bg-slate-100 text-slate-900 font-black text-xl">D</AvatarFallback></Avatar>
                         <div>
                           <h4 className="font-black text-xl uppercase tracking-tight">{driver.firstName} {driver.lastName || ''}</h4>
                           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ACTIVO EN RUTA</p></div>
                         </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Phone className="w-6 h-6" /></Button>
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
