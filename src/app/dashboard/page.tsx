
"use client"

import * as React from "react"
import { 
  Navigation, 
  Target, 
  Maximize, 
  Sparkles, 
  Truck,
  Layers,
  MessageSquare,
  ShieldAlert,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export default function DashboardPage() {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-muted/20">
      {/* Background Map - Light Theme Placeholder */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('https://picsum.photos/seed/light-map-logistics/1600/1200')",
          filter: "grayscale(20%) contrast(90%) brightness(105%)"
        }}
      />
      
      {/* Top Left Menu Button */}
      <div className="absolute top-8 left-8">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-14 w-14 rounded-full shadow-xl bg-white/90 backdrop-blur-md border-none hover:bg-white transition-all text-slate-700"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Floating Action Buttons (Right) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-5">
        <Button size="icon" variant="secondary" className="h-16 w-16 rounded-full shadow-xl bg-white/90 backdrop-blur-md border-none hover:bg-white transition-all">
          <Navigation className="h-7 w-7 text-slate-600" />
        </Button>
        <Button size="icon" variant="secondary" className="h-16 w-16 rounded-full shadow-xl bg-white/90 backdrop-blur-md border-none hover:bg-white transition-all">
          <Target className="h-7 w-7 text-slate-600" />
        </Button>
        <Button size="icon" variant="secondary" className="h-16 w-16 rounded-full shadow-xl bg-white/90 backdrop-blur-md border-none hover:bg-white transition-all">
          <Maximize className="h-7 w-7 text-slate-600" />
        </Button>
        <Button size="icon" className="h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all text-white">
          <Sparkles className="h-7 w-7" />
        </Button>
      </div>

      {/* Custom Map Markers */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Active Marker 1 */}
          <div className="absolute -top-16 -left-10 drop-shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="bg-slate-900 text-white p-3 rounded-[1.5rem] rounded-bl-none shadow-2xl border-4 border-white rotate-45 flex items-center justify-center w-12 h-12">
                <Truck className="h-6 w-6 -rotate-45" />
              </div>
            </div>
          </div>
          
          {/* Active Marker 2 */}
          <div className="absolute top-4 left-6 drop-shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="bg-white text-slate-900 p-3 rounded-[1.5rem] rounded-bl-none shadow-2xl border-4 border-slate-900 rotate-45 flex items-center justify-center w-12 h-12">
                <Truck className="h-6 w-6 -rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Pill Container */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center pointer-events-none">
        {/* Drawer Handle Visual */}
        <div className="w-20 h-1.5 bg-slate-300/50 rounded-full mb-8 shadow-sm backdrop-blur-sm" />
        
        {/* Navigation Pill */}
        <div className="bg-white/90 backdrop-blur-2xl px-4 py-3 rounded-[2.5rem] shadow-2xl border border-white/50 flex items-center gap-2 pointer-events-auto">
          <Button variant="ghost" size="icon" className="h-16 w-24 rounded-[1.8rem] bg-slate-900 text-white hover:bg-slate-800 hover:text-white transition-all">
            <Truck className="h-7 w-7" />
          </Button>
          <Button variant="ghost" size="icon" className="h-16 w-20 rounded-[1.8rem] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
            <Layers className="h-7 w-7" />
          </Button>
          <Button variant="ghost" size="icon" className="h-16 w-20 rounded-[1.8rem] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
            <MessageSquare className="h-7 w-7" />
          </Button>
          <Button variant="ghost" size="icon" className="h-16 w-20 rounded-[1.8rem] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
            <ShieldAlert className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </div>
  )
}
