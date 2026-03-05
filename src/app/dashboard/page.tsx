
"use client"

import * as React from "react"
import { 
  Navigation, 
  Target, 
  Maximize, 
  Sparkles, 
  Plus, 
  Minus, 
  Truck,
  Search,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  return (
    <div className="relative h-[calc(100vh-120px)] w-full overflow-hidden rounded-3xl border shadow-2xl bg-muted/20">
      {/* Background Map Mockup */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ 
          backgroundImage: "url('https://picsum.photos/seed/mexico-map-dark/1600/1200')",
          filter: "brightness(0.9) contrast(1.1)"
        }}
      />
      
      {/* Map Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none" />

      {/* Top Left Search/Info */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-xl flex items-center border border-white/20">
          <div className="bg-primary p-2.5 rounded-xl text-white shadow-lg">
            <Search className="h-5 w-5" />
          </div>
          <input 
            className="bg-transparent border-none focus:outline-none px-4 py-2 text-sm w-48 md:w-64 font-medium" 
            placeholder="Buscar ruta o unidad..." 
          />
        </div>
      </div>

      {/* Center Fleet Pins */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Pin 1 */}
          <div className="absolute -top-12 -left-8 animate-bounce">
            <div className="relative flex flex-col items-center">
              <div className="bg-slate-900 text-white p-3 rounded-full shadow-2xl border-4 border-white">
                <Truck className="h-6 w-6" />
              </div>
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white -mt-1" />
            </div>
          </div>
          
          {/* Pin 2 */}
          <div className="absolute top-4 left-12 animate-pulse">
            <div className="relative flex flex-col items-center">
              <div className="bg-primary text-white p-3 rounded-full shadow-2xl border-4 border-white">
                <Truck className="h-6 w-6" />
              </div>
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white -mt-1" />
            </div>
            <Badge className="absolute -top-2 -right-2 bg-emerald-500 border-2 border-white">En Ruta</Badge>
          </div>
        </div>
      </div>

      {/* Right Side Floating Controls */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full shadow-2xl bg-white/90 backdrop-blur-md border hover:bg-white transition-all">
          <Navigation className="h-6 w-6 text-slate-700" />
        </Button>
        <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full shadow-2xl bg-white/90 backdrop-blur-md border hover:bg-white transition-all">
          <Target className="h-6 w-6 text-slate-700" />
        </Button>
        <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full shadow-2xl bg-white/90 backdrop-blur-md border hover:bg-white transition-all">
          <Maximize className="h-6 w-6 text-slate-700" />
        </Button>
        <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all animate-pulse">
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Bottom Right Zoom Controls */}
      <div className="absolute bottom-10 right-6 flex flex-col shadow-2xl rounded-2xl overflow-hidden border">
        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-none bg-white/90 hover:bg-white border-b">
          <Plus className="h-5 w-5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-none bg-white/90 hover:bg-white">
          <Minus className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom Status Card (Drawer-like) */}
      <div className="absolute bottom-6 left-6 right-24 md:right-auto md:w-[400px]">
        <Card className="p-4 bg-white/90 backdrop-blur-xl border-white/50 shadow-2xl rounded-3xl overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <Truck className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-slate-900">Unidad 142 - Activa</h3>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter text-emerald-600 border-emerald-200 bg-emerald-50">Sincronizado</Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium">Último reporte: hace 14 segundos</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5 text-slate-400" />
            </Button>
          </div>
          
          {/* Drawer Handle */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-1" />
        </Card>
      </div>
    </div>
  )
}
