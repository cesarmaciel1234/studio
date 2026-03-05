
"use client"

import * as React from "react"
import { 
  Navigation, 
  Maximize, 
  Truck,
  Layers,
  MessageSquare,
  ShieldAlert,
  Menu,
  Clock,
  AlertTriangle,
  HardHat,
  Package,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const alerts = [
  { id: 1, type: "OBRAS", time: "05/03/24 10:46", description: "REPORTE VIAL - Calle 50 x 12", icon: HardHat, color: "text-amber-500", bg: "bg-amber-50" },
  { id: 2, type: "TRÁFICO", time: "05/03/24 10:30", description: "Congestión moderada en Av. Juárez", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  { id: 3, type: "PELIGRO", time: "05/03/24 09:15", description: "Bache profundo reportado en lateral", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
]

const pendingOrders = [
  { id: 1, title: "Envío Express - Centro", distance: "1.2 km", price: "$45.00", time: "15 min" },
  { id: 2, title: "Recolección Polanco", distance: "3.5 km", price: "$82.00", time: "25 min" },
  { id: 3, title: "Paquete Ligero - Condesa", distance: "2.1 km", price: "$38.00", time: "12 min" },
]

export default function DashboardPage() {
  const { toggleSidebar } = useSidebar()
  const [panelState, setPanelState] = React.useState<"middle" | "top" | "bottom">("middle")
  const [activeTab, setActiveTab] = React.useState<"truck" | "orders" | "messages" | "alerts">("orders")

  const togglePanel = () => {
    if (panelState === "middle") setPanelState("top")
    else if (panelState === "top") setPanelState("bottom")
    else setPanelState("middle")
  }

  const panelHeightClass = {
    top: "top-20",
    middle: "top-1/2",
    bottom: "top-[85%]"
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-100">
      {/* Background Map */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('https://picsum.photos/seed/map-logistics-v2/1600/1200')",
          filter: "grayscale(10%) contrast(95%) brightness(105%)"
        }}
      />
      
      {/* Top Left Menu Button */}
      <div className="absolute top-8 left-8 z-10">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-16 w-16 rounded-[1.5rem] shadow-2xl bg-white/95 backdrop-blur-md border-none hover:bg-white transition-all text-slate-700"
        >
          <Menu className="h-7 w-7" />
        </Button>
      </div>

      {/* Floating Buttons (Right) */}
      <div className="absolute right-8 top-1/4 flex flex-col gap-4 z-10">
        <Button size="icon" variant="secondary" className="h-14 w-14 rounded-2xl shadow-xl bg-white/90 backdrop-blur-md border-none">
          <Navigation className="h-6 w-6 text-slate-600" />
        </Button>
        <Button size="icon" variant="secondary" className="h-14 w-14 rounded-2xl shadow-xl bg-white/90 backdrop-blur-md border-none">
          <Maximize className="h-6 w-6 text-slate-600" />
        </Button>
      </div>

      {/* Sliding Bottom Sheet */}
      <div 
        className={cn(
          "absolute inset-x-0 bottom-0 bg-white shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] rounded-t-[3.5rem] transition-all duration-500 ease-in-out z-20 overflow-hidden flex flex-col",
          panelHeightClass[panelState]
        )}
      >
        {/* Drag Handle Area */}
        <div 
          className="h-12 w-full flex items-center justify-center cursor-pointer active:bg-slate-50 transition-colors"
          onClick={togglePanel}
        >
          <div className="w-16 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-hide">
          {/* Internal Navigation Pill */}
          <div className="flex justify-center mb-10 sticky top-0 bg-white pt-2 pb-4 z-30">
            <div className="bg-slate-50 p-2 rounded-[2.5rem] flex items-center gap-2 shadow-inner border border-slate-100">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab("truck")}
                className={cn(
                  "h-16 w-20 rounded-[1.8rem] transition-all",
                  activeTab === "truck" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400"
                )}
              >
                <Truck className="h-7 w-7" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "h-16 w-20 rounded-[1.8rem] transition-all",
                  activeTab === "orders" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400"
                )}
              >
                <Layers className="h-7 w-7" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab("messages")}
                className={cn(
                  "h-16 w-20 rounded-[1.8rem] transition-all",
                  activeTab === "messages" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400"
                )}
              >
                <MessageSquare className="h-7 w-7" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveTab("alerts")}
                className={cn(
                  "h-16 w-24 rounded-[1.8rem] transition-all",
                  activeTab === "alerts" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400"
                )}
              >
                <ShieldAlert className="h-7 w-7" />
              </Button>
            </div>
          </div>

          {activeTab === "orders" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Orders */}
              <div className="flex items-center gap-6 mb-10">
                <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xl ring-8 ring-slate-50">
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-1 uppercase">
                    Cerca Tuyo
                  </h1>
                  <p className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">
                    Oportunidades Live
                  </p>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="group relative flex items-center gap-5 p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-slate-900 hover:text-white transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl">
                    <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm text-slate-900 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-lg tracking-tight mb-1">{order.title}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 group-hover:text-slate-400 uppercase tracking-widest">
                        <span>{order.distance}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{order.time}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black mb-1">{order.price}</p>
                      <ChevronRight className="h-5 w-5 ml-auto text-slate-300 group-hover:text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "alerts" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Alerts */}
              <div className="mb-10">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-1">
                  Copo Driver
                </h1>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  ALERTAS VIALES
                </p>
              </div>

              {/* Quick Action Categories */}
              <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
                {[
                  { label: "CONTROL", icon: ShieldAlert, bg: "bg-blue-50", color: "text-blue-600" },
                  { label: "TRÁFICO", icon: Clock, bg: "bg-orange-50", color: "text-orange-600" },
                  { label: "PELIGRO", icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
                  { label: "OBRAS", icon: HardHat, bg: "bg-emerald-50", color: "text-emerald-600" },
                ].map((cat) => (
                  <div key={cat.label} className="flex flex-col items-center gap-4 min-w-[100px]">
                    <div className={cn("h-24 w-24 rounded-full flex items-center justify-center shadow-sm border border-white", cat.bg)}>
                      <cat.icon className={cn("h-10 w-10", cat.color)} />
                    </div>
                    <span className="text-[10px] font-black text-slate-900 tracking-wider">{cat.label}</span>
                  </div>
                ))}
              </div>

              {/* Alerts List */}
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-5 p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", alert.bg)}>
                      <alert.icon className={cn("h-6 w-6", alert.color)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm text-slate-900">{alert.type}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">{alert.time} • REPORTE VIAL</p>
                      <p className="text-xs text-slate-600 line-clamp-1">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package className="h-16 w-16 mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">Sección en desarrollo</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Markers Overlay */}
      <div className="absolute top-1/3 left-1/4 pointer-events-none">
        <div className="h-10 w-10 bg-slate-900 rounded-[1rem] rounded-bl-none rotate-45 flex items-center justify-center shadow-xl border-4 border-white">
          <Truck className="h-5 w-5 text-white -rotate-45" />
        </div>
      </div>
    </div>
  )
}
