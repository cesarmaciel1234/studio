
"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Target, RefreshCcw, Package, MessageSquare, User, Truck, ShieldAlert, Layers, LogOut, ChevronLeft, ChevronRight, MapPin, Navigation, CheckCircle2, Map, LayoutDashboard, PlusCircle, Building2, Clock, AlertTriangle, Menu, Loader2, Sparkles, Heart, MessageCircle, Send, X, ShieldCheck, Phone, DollarSign, Store, Check, Camera, PenTool, BarChart3, Leaf, Zap, Shield, AlertCircle, Award, TrendingUp, Star, Flame, Trash2, Wallet, Pencil, Maximize, Minimize, Mic } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, useAuth, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { generateBusinessInsight } from '@/ai/flows/business-insights-flow'
import type { BusinessInsightInput, BusinessMessage } from "@/ai/schemas"
import { driverCopilot } from "@/ai/flows/driver-copilot-flow"
import type { DriverCopilotInput, CopilotMessage } from "@/ai/schemas"
import { LoginScreen } from "@/components/auth/LoginScreen"
import { AdminOrderItem } from "@/components/dashboard/AdminOrderItem"
import { DriverOrderCard } from "@/components/dashboard/DriverOrderCard"
import { CoroItem } from "@/components/dashboard/CoroItem"
import { safeFormat } from "@/lib/date-utils"

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
})

const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-2xl" />
})

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null)
  const [heading, setHeading] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [mapCenterTrigger, setMapCenterTrigger] = useState(0)
  
  const [newClientName, setNewClientName] = useState("")
  const [newDelivery, setNewDelivery] = useState("")
  const [newDeliveryCoords, setNewDeliveryCoords] = useState<{lat: number, lng: number} | null>(null)
  const [newPkgDescription, setNewPkgDescription] = useState("")
  const [newOfferedPrice, setNewOfferedPrice] = useState("")
  const [newPickupTime, setNewPickupTime] = useState("")
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false)
  const [selectedAlertType, setSelectedAlertType] = useState<{id: string, label: string} | null>(null)
  const [alertDescription, setAlertDescription] = useState("")

  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string | null>(null)
  const [chatMessageText, setChatMessageText] = useState("")
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [bizCopilotMessage, setBizCopilotMessage] = useState("");
  const [bizCopilotConversation, setBizCopilotConversation] = useState<BusinessMessage[]>([
    { role: 'model', content: "Hola, soy Orion. ¿Qué datos de la flota te gustaría analizar hoy?" }
  ]);
  const [isBizCopoThinking, setIsBizCopoThinking] = useState(false);
  const bizCopilotScrollRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState("ruta")

  const [copilotMessage, setCopilotMessage] = useState("")
  const [copilotConversation, setCopilotConversation] = useState<CopilotMessage[]>([
    { role: 'model', content: "¡Hola! Soy Copo, tu copiloto de IA. ¿En qué puedo ayudarte en tu ruta de hoy?" }
  ])
  const [isCopoThinking, setIsCopoThinking] = useState(false)
  const copilotScrollRef = useRef<HTMLDivElement>(null)
  
  const [isDriverRecording, setIsDriverRecording] = useState(false);
  const driverMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const driverAudioChunksRef = useRef<Blob[]>([]);

  const [isBizCopoRecording, setIsBizCopoRecording] = useState(false);
  const bizMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const bizAudioChunksRef = useRef<Blob[]>([]);

  const [copilotAudioUrl, setCopilotAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const [bizCopilotAudioUrl, setBizCopilotAudioUrl] = useState<string | null>(null);
  const bizAudioPlayerRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { setMounted(true) }, [])

  // 1. OBTENCIÓN DE ROL (Fuente de Verdad Única)
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user?.uid])
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)
  const isAdmin = userData?.role === 'Admin'

  // 2. SEGUIMIENTO GPS (Solo para Repartidores)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation && user?.uid && userData?.role === 'Driver') {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
          setCurrentCoords(coords)
          if (position.coords.heading !== null) setHeading(position.coords.heading)
          
          // Actualiza perfil operativo de nivel superior
          const dRef = doc(firestore, "driverProfiles", user.uid)
          setDocumentNonBlocking(dRef, {
            id: user.uid,
            currentLatitude: coords.lat,
            currentLongitude: coords.lng,
            lastLocationUpdate: new Date().toISOString()
          }, { merge: true })
        },
        (error) => {
          const msg = error.code === 1 ? "Permiso GPS denegado" : error.code === 3 ? "GPS Timeout" : "Error GPS"
          console.warn(`[GPS] ${msg}`);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 30000 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [user?.uid, userData?.role, firestore])

  // 3. DATOS DE FLOTA Y PEDIDOS
  const fleetQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "driverProfiles"), limit(50))
  }, [firestore, user])
  const { data: fleetData } = useCollection(fleetQuery)

  const bizOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isAdmin) return null
    return query(collection(firestore, "orders"), where("companyId", "==", user.uid))
  }, [firestore, user?.uid, isAdmin])
  const { data: bizAllOrders, isLoading: isLoadingBizOrders } = useCollection(bizOrdersQuery)

  const driverOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isAdmin) return null
    return query(collection(firestore, "orders"), where("driverId", "==", user.uid), where("status", "in", ["Assigned", "Picked Up", "In Transit"]))
  }, [firestore, user?.uid, isAdmin])
  const { data: driverActiveOrders } = useCollection(driverOrdersQuery)

  const pendingOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "orders"), where("status", "==", "Pending"), limit(15))
  }, [firestore, user])
  const { data: pendingOrders } = useCollection(pendingOrdersQuery)

  const alertsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(collection(firestore, "alerts"), orderBy("createdAt", "desc"), limit(20))
  }, [firestore, user])
  const { data: alerts } = useCollection(alertsQuery)

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedChatOrderId) return null
    return query(
      collection(firestore, "orders", selectedChatOrderId, "messages"),
      orderBy("timestamp", "asc")
    )
  }, [firestore, selectedChatOrderId])
  const { data: chatMessages } = useCollection(messagesQuery)

  // HANDLERS
  const handleSendChatMessage = () => {
    if (!chatMessageText.trim() || !selectedChatOrderId || !user?.uid) return
    addDocumentNonBlocking(collection(firestore, "orders", selectedChatOrderId, "messages"), {
      orderId: selectedChatOrderId,
      content: chatMessageText,
      timestamp: serverTimestamp(),
      authorId: user.uid,
      authorEmail: user.email || "usuario@rutarapida.com",
      isReadByDriver: !isAdmin,
      isReadByCompany: isAdmin
    })
    setChatMessageText("")
  }

  const handleToggleRole = (newRole: "Driver" | "Admin") => {
    if (!user?.uid || !firestore) return
    updateDocumentNonBlocking(doc(firestore, "users", user.uid), { role: newRole, updatedAt: new Date().toISOString() })
    toast({ title: `Cambio a Modo ${newRole === 'Admin' ? 'Empresa' : 'Repartidor'}` })
  }

  const handleCreateOrder = () => {
    if (!newDelivery.trim() || !newClientName.trim() || !user?.uid) {
      toast({ title: "Faltan datos", description: "Completa el nombre y ubicación.", variant: "destructive" }); return
    }
    setIsCreatingOrder(true)
    const orderData = {
      companyId: user.uid,
      pickupAddress: "Origen Central",
      pickupLatitude: currentCoords?.lat || -34.6037,
      pickupLongitude: currentCoords?.lng || -58.3816,
      pickupContactName: userData?.firstName || "Admin",
      deliveryAddress: newDelivery,
      deliveryLatitude: newDeliveryCoords?.lat || -34.6137,
      deliveryLongitude: newDeliveryCoords?.lng || -58.3916,
      deliveryContactName: newClientName,
      packageDescription: newPkgDescription || "Envío Express",
      offeredPrice: Number(newOfferedPrice) || 1500,
      estimatedPickupWindow: newPickupTime || "Inmediato",
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    addDocumentNonBlocking(collection(firestore, "orders"), orderData)
    setTimeout(() => { 
      setIsCreatingOrder(false); setNewDelivery(""); setNewClientName("");
      toast({ title: "Envío Publicado" }) 
    }, 600)
  }

  const handlePublishAlert = () => {
    if (!selectedAlertType || !user?.uid) return
    addDocumentNonBlocking(collection(firestore, "alerts"), {
      type: selectedAlertType.id,
      label: selectedAlertType.label,
      description: alertDescription,
      latitude: currentCoords?.lat || 0,
      longitude: currentCoords?.lng || 0,
      authorId: user.uid,
      likes: [],
      createdAt: new Date().toISOString()
    })
    setIsAlertMenuOpen(false); setAlertDescription("");
    toast({ title: "Alerta Publicada" })
  }

  // UI HELPERS
  const activeOrder = driverActiveOrders?.[0]
  const destinationCoords = useMemo(() => {
    if (!activeOrder || isAdmin) return null
    const lat = activeOrder.status === 'Assigned' ? activeOrder.pickupLatitude : activeOrder.deliveryLatitude
    const lng = activeOrder.status === 'Assigned' ? activeOrder.pickupLongitude : activeOrder.deliveryLongitude
    return [lat, lng] as [number, number]
  }, [activeOrder, isAdmin])

  const handleDragStart = (y: number) => { 
    if (isMapFullscreen) { setIsMapFullscreen(false); setIsExpanded(false); }
    setIsDragging(true); startY.current = y; 
  }
  const handleDragMove = useCallback((y: number) => { if (!isDragging) return; setDragY(y - startY.current); }, [isDragging])
  const handleDragEnd = useCallback(() => { 
    setIsDragging(false); if (Math.abs(dragY) > 60) setIsExpanded(dragY < 0); setDragY(0); 
  }, [dragY])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientY)
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove); window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('mouseup', handleDragEnd); window.addEventListener('touchend', handleDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup', handleDragEnd); window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  if (!mounted) return <div className="fixed inset-0 bg-slate-900 z-[999]" />;
  if (isUserLoading || (user && isUserDataLoading)) return <div className="h-screen w-full flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-blue-400 opacity-50" /></div>
  if (!user || (!isUserDataLoading && !userData?.role)) return <LoginScreen />;

  const sheetY = isMapFullscreen ? 'calc(100% - 40px)' : isExpanded ? Math.max(0, dragY) : `calc(100% - 160px + ${Math.min(0, dragY)}px)`

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          center={currentCoords ? [currentCoords.lat, currentCoords.lng] : [-34.6037, -58.3816]} 
          destination={destinationCoords}
          alerts={alerts}
          activeOrders={isAdmin ? bizAllOrders : null}
          fleet={fleetData}
          heading={heading}
          isNavigating={isNavigating && !!activeOrder}
          centerTrigger={mapCenterTrigger}
          currentUserId={user?.uid}
        />
      </div>

      {/* SIDEBAR (Sheet) */}
      <div className="absolute top-6 left-6 z-20">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-[22px] bg-white shadow-xl border-none">
              <Menu className="w-6 h-6 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0 border-none bg-white shadow-2xl rounded-r-[48px]">
            <div className="p-8 h-full flex flex-col space-y-8">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 shadow-xl border-4 border-slate-50">
                    <AvatarFallback className="bg-slate-900 text-white font-black text-xl">{userData?.firstName?.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-2xl font-black tracking-tighter uppercase italic">{userData?.firstName}</SheetTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isAdmin ? 'Enterprise' : 'Driver Pro'}</p>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="bg-slate-100 p-1.5 rounded-full flex relative h-16">
                <div className={cn("absolute inset-y-1.5 w-[calc(50%-6px)] rounded-full shadow-md transition-all", isAdmin ? "translate-x-full bg-slate-900" : "translate-x-0 bg-white")}></div>
                <button onClick={() => handleToggleRole('Driver')} className={cn("flex-1 z-10 text-[10px] font-black uppercase flex items-center justify-center gap-2", !isAdmin ? "text-slate-900" : "text-slate-500")}>Driver</button>
                <button onClick={() => handleToggleRole('Admin')} className={cn("flex-1 z-10 text-[10px] font-black uppercase flex items-center justify-center gap-2", isAdmin ? "text-white" : "text-slate-500")}>Biz</button>
              </div>

              <nav className="flex-1 space-y-2">
                 <Link href="/profile" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center"><Wallet className="w-5 h-5 text-teal-500" /></div>
                   <span className="font-bold text-slate-800 text-sm uppercase">Billetera</span>
                 </Link>
                 <Link href="/orders" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Package className="w-5 h-5 text-blue-500" /></div>
                   <span className="font-bold text-slate-800 text-sm uppercase">Historial</span>
                 </Link>
                 <Link href="/chat" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-violet-500" /></div>
                   <span className="font-bold text-slate-800 text-sm uppercase">Chats</span>
                 </Link>
              </nav>

              <Button variant="ghost" onClick={() => signOut(auth!)} className="w-full justify-start gap-4 h-16 rounded-3xl text-red-500 font-black px-5 hover:bg-red-50 transition-colors text-sm uppercase tracking-widest"><LogOut className="w-5 h-5" /> Salir</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* CONTROLES MAPA */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-20 flex flex-col gap-4">
        <Button size="icon" onClick={() => setIsNavigating(!isNavigating)} className={cn("h-14 w-14 rounded-full shadow-2xl transition-all", isNavigating ? "bg-blue-600 text-white" : "bg-white text-slate-600")}><Navigation className="w-6 h-6" /></Button>
        <Button size="icon" onClick={() => setMapCenterTrigger(p => p+1)} className="h-14 w-14 rounded-full shadow-2xl bg-white text-slate-600"><Target className="w-6 h-6" /></Button>
        <Button size="icon" onClick={() => setIsMapFullscreen(!isMapFullscreen)} className="h-14 w-14 rounded-full shadow-2xl bg-white text-slate-600">
            {isMapFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </Button>
      </div>

      {/* PANEL INFERIOR (Contenido Principal) */}
      <div 
        className={cn("absolute left-0 right-0 bottom-0 z-40 transform will-change-transform", !isDragging && "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]")} 
        style={{ transform: `translateY(${sheetY})` }}
      >
        <div className="h-[85vh] w-full max-w-md mx-auto bg-white/90 backdrop-blur-2xl rounded-t-[56px] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] flex flex-col border-t border-slate-100">
          <div 
            className="w-full flex flex-col items-center pt-6 pb-4 cursor-grab active:cursor-grabbing touch-none select-none" 
            onMouseDown={(e) => handleDragStart(e.clientY)} 
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            <div className="w-16 h-1.5 rounded-full bg-slate-200 mb-8"></div>
            <div className="w-full px-8">
              <div className="flex bg-slate-100/50 rounded-[40px] p-2 border border-slate-50 backdrop-blur-md">
                {(isAdmin 
                  ? [{id:'ruta', icon:LayoutDashboard}, {id:'pedidos', icon:PlusCircle}, {id:'central', icon:MessageSquare}, {id:'alerta', icon:ShieldAlert}]
                  : [{id:'ruta', icon:Truck}, {id:'pedidos', icon:Layers}, {id:'central', icon:MessageSquare}, {id:'alerta', icon:ShieldAlert}]
                ).map(t => (
                  <button key={t.id} onClick={(e) => { e.stopPropagation(); setActiveTab(t.id); setIsExpanded(true); }} className={cn("flex-1 h-14 rounded-[32px] transition-all flex items-center justify-center active:scale-90", activeTab === t.id ? "bg-slate-900 text-white shadow-xl" : "text-slate-400")}>
                    <t.icon className="w-6 h-6" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-hide overscroll-contain">
            {activeTab === 'ruta' && (
              <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4">
                {isAdmin ? (
                  <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic">Flota Biz</h2>
                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CONDUCTORES</p>
                          <p className="text-3xl font-black text-emerald-400">{fleetData?.length || 0}</p>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ORDENES</p>
                          <p className="text-3xl font-black text-blue-500">{bizAllOrders?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    {bizAllOrders?.map(order => (
                      <AdminOrderItem key={order.id} order={order} onCenterMap={(lat, lng) => { setCurrentCoords({lat, lng}); setMapCenterTrigger(p=>p+1); setIsExpanded(false); }} onOpenChat={(id) => { setSelectedChatOrderId(id); setActiveTab('central'); }} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl text-left">
                      <h2 className="text-3xl font-black tracking-tighter uppercase italic">Mi Ruta Pro</h2>
                      <div className="mt-6 space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                          <span>Misión Diaria</span>
                          <span>{driverActiveOrders?.length || 0} Paradas</span>
                        </div>
                        <Progress value={40} className="h-2 bg-white/10" />
                      </div>
                    </div>
                    {driverActiveOrders?.map((order, i) => (
                      <DriverOrderCard key={order.id} order={order} index={i} currentCoords={currentCoords} onOpenChat={(id) => router.push(`/chat?orderId=${id}`)} />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'pedidos' && (
              <div className="space-y-8 pt-4 text-left animate-in fade-in slide-in-from-bottom-4">
                {isAdmin ? (
                  <Card className="rounded-[48px] p-8 space-y-6 shadow-2xl border-none bg-slate-50">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Crear Logística</h2>
                    <div className="space-y-4">
                      <Input placeholder="Cliente" className="h-16 rounded-2xl bg-white border-none font-bold" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                      <div className="flex gap-2">
                        <Input placeholder="Destino" className="h-16 flex-1 rounded-2xl bg-white border-none font-bold" value={newDelivery} readOnly />
                        <Button onClick={() => setIsLocationPickerOpen(true)} size="icon" className="h-16 w-16 rounded-2xl bg-blue-600"><Map className="w-6 h-6" /></Button>
                      </div>
                      <Input type="number" placeholder="Precio $" className="h-16 rounded-2xl bg-white border-none font-black" value={newOfferedPrice} onChange={(e) => setNewOfferedPrice(e.target.value)} />
                      <Button onClick={handleCreateOrder} disabled={isCreatingOrder} className="w-full h-20 rounded-3xl bg-slate-900 text-white font-black text-xl uppercase italic shadow-2xl">{isCreatingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : "PUBLICAR"}</Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Cerca Tuyo</h2>
                    {pendingOrders?.map(order => (
                      <Card key={order.id} className="rounded-[40px] p-8 bg-white shadow-xl border-none text-left">
                        <div className="flex justify-between items-center mb-6">
                          <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px] px-4 py-2 rounded-xl">+${order.offeredPrice}</Badge>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.estimatedPickupWindow}</span>
                        </div>
                        <h3 className="text-xl font-black uppercase text-slate-900 mb-2">{order.deliveryContactName}</h3>
                        <p className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-tight">{order.deliveryAddress.split(',')[0]}</p>
                        <Button onClick={() => { updateDocumentNonBlocking(doc(firestore, "orders", order.id), { driverId: user.uid, status: "Assigned", updatedAt: new Date().toISOString() }); toast({title:"Carga Aceptada"}); }} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-lg">TOMAR PEDIDO</Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'central' && (
              <div className="space-y-8 pt-4 text-left animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Central</h2>
                {(isAdmin ? bizAllOrders?.filter(o => o.driverId) : driverActiveOrders)?.map(order => (
                  <Card key={order.id} className="rounded-[32px] p-5 bg-white shadow-md border-none cursor-pointer hover:bg-slate-50 transition-all flex items-center gap-4" onClick={() => setSelectedChatOrderId(order.id)}>
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-white" /></div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm uppercase">Orden #{order.id.substring(0,5)}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{order.deliveryContactName}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'alerta' && (
              <div className="space-y-8 pt-4 text-left animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Coro Driver</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {[ { id: "policia", label: "Control", icon: ShieldAlert, color: "bg-blue-500" }, { id: "trafico", label: "Tráfico", icon: Clock, color: "bg-orange-500" }, { id: "accidente", label: "Peligro", icon: AlertTriangle, color: "bg-red-500" } ].map(a => (
                    <Button key={a.id} onClick={() => { setSelectedAlertType({id:a.id, label:a.label}); setIsAlertMenuOpen(true); }} className={cn("flex-none w-24 h-24 rounded-[32px] bg-white shadow-lg text-slate-900 font-black flex flex-col gap-2 p-0 border-none",)}>
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", a.color)}><a.icon className="w-5 h-5 text-white" /></div>
                      <span className="text-[10px] uppercase tracking-tight">{a.label}</span>
                    </Button>
                  ))}
                </div>
                {alerts?.map(alert => <CoroItem key={alert.id} alert={alert} userId={user?.uid || ""} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={isLocationPickerOpen} onOpenChange={setIsLocationPickerOpen}>
        <DialogContent className="max-w-md w-[92vw] rounded-[48px] p-0 overflow-hidden border-none">
          <LocationPickerMap onLocationSelect={(lat, lng, address) => { setNewDeliveryCoords({lat, lng}); setNewDelivery(address); setIsLocationPickerOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={isAlertMenuOpen} onOpenChange={setIsAlertMenuOpen}>
        <DialogContent className="max-w-md w-[92vw] rounded-[48px] p-10 border-none">
          <DialogHeader><DialogTitle className="font-black uppercase italic text-center text-xl">Reportar {selectedAlertType?.label}</DialogTitle></DialogHeader>
          <Textarea placeholder="Describe la situación..." className="min-h-[120px] bg-slate-50 border-none rounded-3xl p-6 mt-6" value={alertDescription} onChange={(e) => setAlertDescription(e.target.value)} />
          <Button onClick={handlePublishAlert} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase mt-6 shadow-2xl">PUBLICAR</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
