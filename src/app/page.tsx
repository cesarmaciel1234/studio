
"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Target, Package, User, Truck, ShieldAlert, Layers, LogOut, Navigation, MapPin, MessageCircle, Send, X, ShieldCheck, Phone, Check, Loader2, Sparkles, Menu, Clock, AlertTriangle, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, useAuth, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { Progress } from "@/components/ui/progress"
import { driverCopilot } from "@/ai/flows/driver-copilot-flow"
import type { DriverCopilotInput, DriverCopilotOutput, CopilotMessage } from "@/ai/schemas"
import { LoginScreen } from "@/components/auth/LoginScreen"
import { AdminOrderItem } from "@/components/dashboard/AdminOrderItem"
import { DriverOrderCard } from "@/components/dashboard/DriverOrderCard"
import { CoroItem } from "@/components/dashboard/CoroItem"
import { safeFormat } from "@/lib/date-utils"

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
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
  
  const [activeTab, setActiveTab] = useState("ruta")

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [copilotMessage, setCopilotMessage] = useState("")
  const [copilotConversation, setCopilotConversation] = useState<CopilotMessage[]>([
    { role: 'model', content: "¡Hola! Soy Copo, tu copiloto de IA. ¿En qué puedo ayudarte hoy?" }
  ])
  const [isCopoThinking, setIsCopoThinking] = useState(false)
  const copilotScrollRef = useRef<HTMLDivElement>(null)
  const [copilotAudioUrl, setCopilotAudioUrl] = useState<string | null>(null);

  useEffect(() => { setMounted(true) }, [])

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null
    return doc(firestore, "driverProfiles", user.uid)
  }, [firestore, user?.uid])
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef)
  const isAdmin = userData?.role === 'Admin'

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
          setCurrentCoords(coords)
          if (position.coords.heading !== null) setHeading(position.coords.heading)
          
          if (!isUserLoading && user?.uid && firestore) {
            const dRef = doc(firestore, "driverProfiles", user.uid)
            setDocumentNonBlocking(dRef, {
              currentLatitude: coords.lat,
              currentLongitude: coords.lng,
              lastLocationUpdate: new Date().toISOString()
            }, { merge: true })
          }
        },
        (error) => console.error("GPS Tracking Error:", error),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [isUserLoading, user?.uid, firestore])

  const fleetQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null
    return query(collection(firestore, "driverProfiles"), limit(50))
  }, [firestore, isAdmin])
  const { data: fleetData } = useCollection(fleetQuery)

  const bizOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isAdmin) return null
    return query(collection(firestore, "orders"), where("companyId", "==", user.uid))
  }, [firestore, user?.uid, isAdmin])
  const { data: bizAllOrders } = useCollection(bizOrdersQuery)

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
    return query(collection(firestore, "alerts"), orderBy("updatedAt", "desc"), limit(20))
  }, [firestore, user])
  const { data: alerts } = useCollection(alertsQuery)

  useEffect(() => {
    if (copilotScrollRef.current) {
      copilotScrollRef.current.scrollTop = copilotScrollRef.current.scrollHeight
    }
  }, [copilotConversation])

  const handleSendTextToCopo = async () => {
    if (!copilotMessage.trim() || !user?.uid || isCopoThinking) return;
    const userMessage: CopilotMessage = { role: 'user', content: copilotMessage };
    setCopilotConversation(prev => [...prev, userMessage]);
    setCopilotMessage("");
    setIsCopoThinking(true);
    try {
      const result = await driverCopilot({
        driverId: user.uid,
        currentLocation: currentCoords ? { latitude: currentCoords.lat, longitude: currentCoords.lng } : undefined,
        activeOrders: driverActiveOrders || [],
        nearbyAlerts: alerts || [],
        conversationHistory: [...copilotConversation, userMessage],
      });
      setCopilotConversation(prev => [...prev, { role: 'model', content: result.response, imageUrl: result.imageUrl }]);
      if (result.audioUrl) setCopilotAudioUrl(result.audioUrl);
    } catch (error) {
      setCopilotConversation(prev => [...prev, { role: 'model', content: "Lo siento, tuve un problema de conexión." }]);
    } finally {
      setIsCopoThinking(false);
    }
  }

  const handleDragStart = (y: number) => { 
    if (isMapFullscreen) { setIsMapFullscreen(false); setIsExpanded(false); }
    setIsDragging(true); startY.current = y; 
  }

  const handleDragMove = useCallback((y: number) => {
    if (!isDragging) return
    const delta = y - startY.current
    setDragY(delta)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragY) > 60) setIsExpanded(dragY < 0)
    setDragY(0)
  }, [dragY, isDragging])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientY)
    const onMouseUp = () => handleDragEnd()
    const onTouchEnd = () => handleDragEnd()
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove); window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('mouseup', onMouseUp); window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('touchend', onTouchEnd);
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const hasActiveSOS = alerts?.some(a => a.type === 'sos');
  const sheetY = isMapFullscreen ? 'calc(100% - 40px)' : isExpanded ? Math.max(0, dragY) : `calc(100% - 160px + ${Math.min(0, dragY)}px)`

  if (!mounted) return <div className="fixed inset-0 bg-slate-900" />;
  if (isUserLoading || (user && isUserDataLoading)) return <div className="h-screen w-full flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-blue-400 opacity-50" /></div>
  if (!user || (!isUserDataLoading && !userData?.role)) return <LoginScreen />;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          center={currentCoords ? [currentCoords.lat, currentCoords.lng] : [-34.6037, -58.3816]} 
          alerts={alerts}
          activeOrders={isAdmin ? bizAllOrders : null}
          fleet={fleetData}
          isNavigating={isNavigating}
          centerTrigger={mapCenterTrigger}
          currentUserId={user?.uid}
        />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-[22px] bg-white shadow-xl border-none">
              <Menu className="w-6 h-6 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0 border-none bg-white/80 backdrop-blur-xl shadow-2xl rounded-r-[48px]">
            <div className="p-8 space-y-8 h-full flex flex-col">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 shadow-xl border-4 border-slate-50">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="bg-slate-100 font-black">{userData?.firstName?.substring(0,2) || "UR"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-2xl font-black tracking-tighter">
                      {userData?.firstName || "Repartidor"}
                    </SheetTitle>
                    <p className="text-xs font-bold text-slate-400 truncate">ID: {user.uid.substring(0,8)}</p>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="flex-1 space-y-2 pt-4">
                 <Link href="/profile" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                   <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                     <User className="w-5 h-5 text-teal-500" />
                   </div>
                   <span className="font-bold text-slate-800 text-sm">Mi Perfil</span>
                 </Link>
                 <Link href="/orders" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                     <Package className="w-5 h-5 text-blue-500" />
                   </div>
                   <span className="font-bold text-slate-800 text-sm">Mis Entregas</span>
                 </Link>
                 
                 <div className="pt-6 px-2">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comunidad Live</h3>
                     <Badge className="bg-emerald-100 text-emerald-600 text-[8px] font-black border-none animate-pulse">ACTIVA</Badge>
                   </div>
                   <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide">
                     {alerts?.map(alert => (
                       <div key={alert.id} className="p-3 bg-white/50 rounded-2xl border border-white/50 flex items-center gap-3 active:scale-95 transition-all">
                         <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", alert.type === 'sos' ? 'bg-red-50' : 'bg-blue-50')}>
                           {alert.type === 'sos' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <MessageCircle className="w-4 h-4 text-blue-500" />}
                         </div>
                         <div className="min-w-0 flex-1">
                           <p className="text-[10px] font-black text-slate-800 truncate uppercase">{alert.label}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">Bumping: {safeFormat(alert.updatedAt || alert.createdAt, 'HH:mm')}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>

              <Button variant="ghost" onClick={() => signOut(auth!)} className="w-full justify-start gap-4 h-16 rounded-3xl text-red-500 font-black px-5 hover:bg-red-50 transition-colors text-sm"><LogOut className="w-5 h-5" /> Salir</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-20 flex flex-col gap-4">
        <Button size="icon" onClick={() => setIsNavigating(!isNavigating)} className={cn("h-14 w-14 rounded-full shadow-2xl transition-all active:scale-90", isNavigating ? "bg-blue-600 text-white" : "bg-white text-slate-600")}><Navigation className="w-6 h-6" /></Button>
        <Button size="icon" onClick={() => setMapCenterTrigger(p => p+1)} className="h-14 w-14 rounded-full shadow-2xl bg-white text-slate-600 active:scale-90"><Target className="w-6 h-6" /></Button>
        <Popover open={isAiAssistantOpen} onOpenChange={setIsAiAssistantOpen}>
            <PopoverTrigger asChild>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl active:scale-90 bg-blue-600 text-white"><Sparkles className="w-6 h-6" /></Button>
            </PopoverTrigger>
            <PopoverContent side="left" align="center" className="w-[340px] max-w-[90vw] rounded-[32px] p-0 mr-4 border-none shadow-2xl bg-transparent">
                <div className="bg-slate-900/95 backdrop-blur-md rounded-[32px] p-4 flex flex-col max-h-[70vh]">
                  <header className="px-2 flex justify-between items-center mb-4 text-white">
                    <div>
                      <h2 className="text-xl font-black tracking-tight">Asistente Copo</h2>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">INTELIGENCIA ACTIVA</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-400" onClick={() => setIsAiAssistantOpen(false)}><X className="w-5 h-5" /></Button>
                  </header>
                  <div ref={copilotScrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide min-h-[200px]">
                    {copilotConversation.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn("max-w-[85%] p-4 rounded-[22px] text-[13px] shadow-sm", msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100')}>
                          <p className="font-medium leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-4 items-center">
                    <Input placeholder="Pregunta a Copo..." className="h-12 bg-slate-800 border-none text-white rounded-full px-6 text-sm" value={copilotMessage} onChange={(e) => setCopilotMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendTextToCopo()} />
                    <Button onClick={handleSendTextToCopo} size="icon" className="h-12 w-12 rounded-full bg-emerald-500 text-white transition-transform active:scale-90">
                      {isCopoThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
            </PopoverContent>
        </Popover>
      </div>

      <div className={cn("absolute left-0 right-0 bottom-0 z-40 transform will-change-transform", !isDragging && "transition-transform duration-500")} style={{ transform: `translateY(${sheetY})` }}>
        <div className="h-[85vh] w-full max-w-md mx-auto bg-white/80 backdrop-blur-2xl rounded-t-[56px] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] flex flex-col relative border-t border-slate-100">
          <div className="w-full flex flex-col items-center pt-6 pb-4 cursor-grab active:cursor-grabbing touch-none" onMouseDown={(e) => handleDragStart(e.clientY)} onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}>
            <div className={cn("w-16 h-1.5 rounded-full mb-8", hasActiveSOS ? "bg-red-600 animate-pulse" : "bg-slate-200")}></div>
            <div className="w-full px-8">
              <div className="flex bg-slate-100/50 rounded-[40px] p-2 border border-slate-50">
                {[{id:'ruta', icon:Truck}, {id:'pedidos', icon:Layers}, {id:'central', icon:Users}, {id:'alerta', icon:ShieldAlert}].map(t => (
                  <button key={t.id} onClick={(e) => { e.stopPropagation(); setActiveTab(t.id); setIsExpanded(true); }} className={cn("flex-1 h-14 rounded-[32px] transition-all flex items-center justify-center", activeTab === t.id ? "bg-slate-900 text-white shadow-xl" : "text-slate-400")}>
                    <t.icon className="w-6 h-6" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-hide">
            {activeTab === 'ruta' && (
              <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4">
                {isAdmin ? (
                  <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl">
                      <h2 className="text-3xl font-black tracking-tighter">Logística Pro</h2>
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-white/5 rounded-3xl p-4 border border-white/10 text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DRIVERS</p>
                          <p className="text-2xl font-black text-emerald-400">{fleetData?.length || 0}</p>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-4 border border-white/10 text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ACTIVOS</p>
                          <p className="text-2xl font-black text-blue-400">{bizAllOrders?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    {bizAllOrders?.map(order => (
                      <AdminOrderItem key={order.id} order={order} onCenterMap={(lat, lng) => setCurrentCoords({lat, lng})} onOpenChat={(id) => router.push(`/chat?orderId=${id}`)} />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl">
                      <h2 className="text-3xl font-black tracking-tighter">Mi Jornada</h2>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-2">Objetivo diario: 70% completado</p>
                      <Progress value={70} className="h-1.5 mt-4 bg-white/10" />
                    </div>
                    {driverActiveOrders?.map((order, i) => (
                      <DriverOrderCard key={order.id} order={order} index={i} currentCoords={currentCoords} onOpenChat={() => router.push(`/chat?orderId=${order.id}`)} />
                    ))}
                  </>
                )}
              </div>
            )}
            {activeTab === 'pedidos' && (
              <div className="space-y-6 pt-4 text-left animate-in fade-in slide-in-from-bottom-4">
                <header><h2 className="text-3xl font-black tracking-tighter">Disponibles</h2></header>
                {pendingOrders?.map(order => (
                  <div key={order.id} className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PAGO DIRECTO</p>
                        <p className="text-2xl font-black text-emerald-600 tracking-tighter">${order.offeredPrice || '1,200'}</p>
                      </div>
                      <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest">HOY</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-300" />
                      <p className="text-sm font-bold text-slate-800 uppercase truncate">{order.deliveryAddress}</p>
                    </div>
                    <Button onClick={() => updateDocumentNonBlocking(doc(firestore!, "orders", order.id), { driverId: user.uid, status: "Assigned", updatedAt: new Date().toISOString() })} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase mt-6 tracking-widest text-xs">TOMAR PEDIDO</Button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'central' && (
              <div className="space-y-6 pt-4 text-left animate-in fade-in slide-in-from-bottom-4">
                <header>
                  <h2 className="text-3xl font-black tracking-tighter">Comunidad</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensajería y Bumping Live</p>
                </header>
                <div className="space-y-4">
                  {alerts?.map((alert) => (
                    <CoroItem key={alert.id} alert={alert} userId={user?.uid || ""} />
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'alerta' && (
              <div className="space-y-6 pt-4 text-left animate-in fade-in slide-in-from-bottom-4">
                <header><h2 className="text-3xl font-black tracking-tighter">Reportar</h2></header>
                <div className="grid grid-cols-2 gap-4">
                  {[ { id: "policia", label: "Control", icon: ShieldAlert, color: "text-blue-600", bgColor: "bg-blue-50" }, { id: "trafico", label: "Tráfico", icon: Clock, color: "text-orange-600", bgColor: "bg-orange-50" }, { id: "accidente", label: "Accidente", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50" }, { id: "obras", label: "Obras", icon: Navigation, color: "text-emerald-600", bgColor: "bg-emerald-50" } ].map(a => (
                    <Button key={a.id} variant="outline" className="h-24 rounded-[32px] flex flex-col gap-2 bg-white shadow-lg border-none active:scale-95 transition-all" onClick={() => {
                      if (!currentCoords || !firestore) return;
                      addDocumentNonBlocking(collection(firestore, "alerts"), {
                        type: a.id, label: a.label, latitude: currentCoords.lat, longitude: currentCoords.lng, authorId: user.uid, likes: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
                      });
                      toast({ title: "Reporte Enviado" });
                    }}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", a.bgColor)}><a.icon className={cn("w-5 h-5", a.color)} /></div>
                      <span className="text-[10px] font-black uppercase">{a.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
