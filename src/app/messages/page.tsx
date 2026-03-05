"use client"

import * as React from "react"
import { Send, Phone, Video, Search, MoreVertical, Plus, User, Users as CommunityIcon, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const chats = [
  { id: 1, name: "Juan Perez", lastMsg: "Ya llegué a la dirección...", time: "10:30 AM", unread: 2, online: true, type: "direct" },
  { id: 2, name: "Canal General", lastMsg: "Recordatorio: Cambio de aceite hoy", time: "09:15 AM", unread: 0, online: false, type: "community" },
  { id: 3, name: "Maria Garcia", lastMsg: "Gracias, ruta recibida.", time: "Ayer", unread: 0, online: true, type: "direct" },
  { id: 4, name: "Soporte Técnico", lastMsg: "¿Cómo puedo ayudarte?", time: "Lunes", unread: 0, online: false, type: "direct" },
]

export default function MessagesPage() {
  const [activeChat, setActiveChat] = React.useState(chats[0])

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar de Chats */}
      <Card className="w-80 flex flex-col border-none shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl">Mensajes</h2>
            <Button size="icon" variant="ghost" className="rounded-full h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Buscar chat..." />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeChat.id === chat.id ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'}`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                    {chat.type === "community" ? <CommunityIcon className="h-5 w-5 absolute" /> : null}
                  </Avatar>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm truncate">{chat.name}</span>
                    <span className={`text-[10px] ${activeChat.id === chat.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{chat.time}</span>
                  </div>
                  <p className={`text-xs truncate ${activeChat.id === chat.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {chat.lastMsg}
                  </p>
                </div>
                {chat.unread > 0 && activeChat.id !== chat.id && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-accent text-accent-foreground border-none">
                    {chat.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Ventana de Chat Principal */}
      <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{activeChat.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm">{activeChat.name}</h3>
              <p className="text-xs text-muted-foreground">{activeChat.online ? 'En línea' : 'Desconectado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground"><Phone className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground"><Video className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex justify-center">
              <span className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground uppercase font-bold tracking-wider">Hoy</span>
            </div>

            <div className="flex gap-3 max-w-[70%]">
              <Avatar className="h-8 w-8 mt-auto">
                <AvatarFallback>{activeChat.name[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-2xl rounded-bl-none text-sm">
                Hola, ¿cómo vas con la entrega ORD-7281?
              </div>
            </div>

            <div className="flex gap-3 max-w-[70%] ml-auto flex-row-reverse">
              <Avatar className="h-8 w-8 mt-auto">
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
              <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-br-none text-sm shadow-sm">
                Estoy a unas 3 cuadras. El tráfico en Av. Juárez está pesado pero ya casi llego.
              </div>
            </div>

            <div className="flex gap-3 max-w-[70%]">
              <Avatar className="h-8 w-8 mt-auto">
                <AvatarFallback>{activeChat.name[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-2xl rounded-bl-none text-sm">
                Entendido. Copo me avisó del tráfico, te sugiero tomar la ruta alterna por 16 de Septiembre para el regreso.
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="p-4 border-t bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground shrink-0"><Plus className="h-5 w-5" /></Button>
            <Input 
              className="bg-muted border-none rounded-full h-11 px-5 focus-visible:ring-1 focus-visible:ring-primary" 
              placeholder="Escribe un mensaje..." 
            />
            <Button size="icon" className="rounded-full h-11 w-11 shrink-0 bg-primary shadow-lg hover:shadow-xl transition-all">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}