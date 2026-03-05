"use client"

import * as React from "react"
import { driverCapo } from "@/ai/flows/driver-copilot-flow"
import { CapoMessage } from "@/ai/schemas"
import { Bot, Sparkles, Send, Mic, User, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface CapoAssistantProps {
  onClose?: () => void;
}

export function CapoAssistant({ onClose }: CapoAssistantProps) {
  const [messages, setMessages] = React.useState<CapoMessage[]>([
    { role: 'model', text: '¡Hola! Soy Capo, tu copiloto. ¿En qué puedo apoyarte hoy?' }
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight)
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: CapoMessage = { role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await driverCapo({
        driverId: "RleWLJDS",
        driverName: "César",
        location: { lat: 19.4326, lng: -99.1332, address: "Centro CDMX" },
        activeOrders: [],
        chatHistory: messages,
        userInput: input
      })

      setMessages(prev => [...prev, { role: 'model', text: response.responseText }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Lo siento, tuve un problema al procesar tu solicitud. Inténtalo de nuevo." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-xl overflow-hidden h-full flex flex-col rounded-[2.5rem]">
      <CardHeader className="pb-4 border-b flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight">Capo AI</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Copiloto Inteligente</CardDescription>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
            <X className="h-5 w-5" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}>
                <Avatar className={cn("h-8 w-8 shrink-0", msg.role === 'user' ? "bg-slate-100" : "bg-blue-600")}>
                  <AvatarFallback className={msg.role === 'user' ? "text-slate-600" : "text-white"}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "p-4 rounded-[1.5rem] text-sm font-medium shadow-sm border",
                  msg.role === 'user' 
                    ? "bg-slate-900 text-white rounded-tr-none border-slate-800" 
                    : "bg-white text-slate-900 rounded-tl-none border-slate-100"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-16 flex-1 rounded-[1.5rem] rounded-tl-none" />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-slate-50/50">
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <Input 
                className="h-14 rounded-2xl bg-white border-2 border-slate-100 pl-6 pr-14 focus:border-blue-500 transition-all text-sm font-medium shadow-inner"
                placeholder="Escribe a Capo..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleSend}
                className="absolute right-2 top-2 h-10 w-10 text-blue-600 hover:bg-blue-50 rounded-xl"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <Button size="icon" className="h-14 w-14 rounded-2xl bg-blue-600 text-white shadow-lg hover:scale-105 transition-transform active:scale-95">
              <Mic className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
