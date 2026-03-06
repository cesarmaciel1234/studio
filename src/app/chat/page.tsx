"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Send, Phone, ChevronLeft, Package, MessageSquare, ShieldCheck, Building2, User, MoreVertical, Loader2, Check } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from "@/firebase"
import { collection, query, where, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function ChatListItem({ order, isAdmin, onClick, isSelected }: { order: any, isAdmin: boolean, onClick: () => void, isSelected: boolean }) {
  const firestore = useFirestore()
  
  const companyRef = useMemoFirebase(() => {
    if (!firestore || !order.companyId) return null
    return doc(firestore, "companyProfiles", order.companyId)
  }, [firestore, order.companyId])
  const { data: companyData } = useDoc(companyRef)

  const driverRef = useMemoFirebase(() => {
    if (!firestore || !order.driverId) return null
    return doc(firestore, "driverProfiles", order.driverId)
  }, [firestore, order.driverId])
  const { data: driverData } = useDoc(driverRef)

  const title = isAdmin 
    ? (driverData ? `${driverData.firstName} ${driverData.lastName || ''}` : "Buscando repartidor...")
    : (companyData?.name || "Empresa Logística")

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:bg-white active:scale-98 transition-all border-none shadow-sm rounded-[32px] group mb-3 overflow-hidden w-full",
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
            <h3 className="font-black font-headline text-sm text-slate-800 truncate uppercase tracking-tight">
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

export default function ChatPage() {
  const { user } = useUser()
  const firestore = useFirestore()
  const searchParams = useSearchParams()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user?.uid])
  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef)
  
  const isAdmin = userData?.role === 'Admin'

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isUserLoading) return null
    
    if (isAdmin) {
      return query(
        collection(firestore, "orders"), 
        where("companyId", "==", user.uid)
      )
    } else {
      return query(
        collection(firestore, "orders"), 
        where("driverId", "==", user.uid)
      )
    }
  }, [firestore, user?.uid, isAdmin, isUserLoading])

  const { data: allOrders, isLoading: isLoadingOrders } = useCollection(chatsQuery)

  const orders = useMemo(() => {
    if (!allOrders) return []
    return allOrders
      .filter(order => order.driverId && ["Assigned", "Picked Up", "In Transit", "Delivered"].includes(order.status))
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return dateB - dateA
      })
  }, [allOrders])

  useEffect(() => {
    const orderIdFromUrl = searchParams.get("orderId")
    if (orderIdFromUrl) {
      setSelectedOrderId(orderIdFromUrl)
    }
  }, [searchParams])

  const selectedOrder = orders?.find(o => o.id === selectedOrderId)

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedOrderId) return null
    return query(
      collection(firestore, "orders", selectedOrderId, "messages"),
      orderBy("timestamp", "asc")
    )
  }, [firestore, selectedOrderId])

  const { data: messages } = useCollection(messagesQuery)

  const companyProfileRef = useMemoFirebase(() => {
    if (!firestore || !selectedOrder?.companyId) return null
    return doc(firestore, "companyProfiles", selectedOrder.companyId)
  }, [firestore, selectedOrder?.companyId])
  const { data: companyData } = useDoc(companyProfileRef)

  const driverProfileRef = useMemoFirebase(() => {
    if (!firestore || !selectedOrder?.driverId) return null
    return doc(firestore, "driverProfiles", selectedOrder.driverId)
  }, [firestore, selectedOrder?.driverId])
  const { data: driverData } = useDoc(driverProfileRef)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedOrderId || !user || !firestore) return

    const messageData = {
      orderId: selectedOrderId,
      content: messageText,
      timestamp: serverTimestamp(),
      authorId: user.uid,
      authorEmail: user.email || "anonimo@rutarapida.com",
      isReadByDriver: !isAdmin,
      isReadByCompany: isAdmin
    }

    addDocumentNonBlocking(collection(firestore, "orders", selectedOrderId, "messages"), messageData)
    setMessageText("")
  }

  if (selectedOrderId && selectedOrder) {
    const chatTitle = isAdmin 
      ? (driverData ? `${driverData.firstName} ${driverData.lastName || ''}` : "Cargando repartidor...")
      : (companyData?.name || "Cargando empresa...")

    return (
      <div className="flex flex-col h-screen bg-[#f2e7d5] animate-in fade-in duration-300">
        <header className="p-4 bg-white border-b flex items-center gap-4 sticky top-0 z-10 shadow-sm rounded-b-2xl">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOrderId(null)} className="rounded-full h-10 w-10">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Avatar className="h-10 w-10 border border-slate-50 shadow-sm">
            <AvatarFallback className="bg-slate-100 font-black">#</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <h2 className="font-black text-[14px] truncate uppercase tracking-tight">{chatTitle}</h2>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">EN LÍNEA</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
            <MoreVertical className="h-5 w-5 text-slate-400" />
          </Button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 pb-24 scrollbar-hide">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 mb-6 text-center space-y-2 border border-white/50">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal Directo Seguro</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Mensajes privados para coordinar la entrega de la orden #{selectedOrder.id.substring(0, 5)}.
            </p>
          </div>

          {messages?.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.authorId === user?.uid ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                "max-w-[85%] p-4 rounded-[22px] text-[13px] shadow-sm",
                msg.authorId === user?.uid 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              )}>
                <p className="leading-relaxed font-medium text-left">{msg.content}</p>
                <div className="flex justify-end items-center gap-1 mt-2">
                  <p className={cn(
                    "text-[7px] font-black opacity-50 uppercase tracking-tighter",
                    msg.authorId === user?.uid ? 'text-blue-100' : 'text-slate-400'
                  )}>
                    {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                  </p>
                  {msg.authorId === user?.uid && <Check className="w-2.5 h-2.5 text-blue-300" />}
                </div>
              </div>
            </div>
          ))}
          {messages && messages.length === 0 && (
            <div className="text-center py-20 opacity-20 space-y-3">
              <MessageSquare className="w-12 h-12 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Inicia la conversación</p>
            </div>
          )}
        </div>

        <div className="p-4 pb-10 bg-transparent flex items-center gap-3 mt-auto">
          <Input 
            placeholder="Escribe un mensaje..." 
            className="flex-1 h-14 bg-white border-none rounded-full px-6 text-sm font-medium shadow-xl focus-visible:ring-1 focus-visible:ring-slate-100"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            className="h-14 w-14 rounded-full bg-[#79d3b4] text-white shadow-xl shadow-emerald-200/50 shrink-0 active:scale-90 transition-all"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 h-screen flex flex-col bg-slate-50 pb-24">
      <header className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-black font-headline tracking-tight text-slate-900">Mensajes</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coordinación en Tiempo Real</p>
        </div>
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 bg-white shadow-sm border-none">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </Button>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto w-full scrollbar-hide">
        {(isUserLoading || isLoadingOrders) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando chats...</p>
          </div>
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <ChatListItem 
              key={order.id} 
              order={order} 
              isAdmin={isAdmin} 
              onClick={() => setSelectedOrderId(order.id)} 
              isSelected={selectedOrderId === order.id}
            />
          ))
        ) : (
          <div className="text-center py-20 opacity-30 space-y-4">
            <div className="w-20 h-20 bg-slate-200/50 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
              No hay chats activos.
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-slate-300 font-black uppercase tracking-[0.3em] pt-8">
        RutaRápida v2.5.0
      </p>
    </div>
  )
}