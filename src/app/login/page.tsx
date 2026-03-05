
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Truck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = React.useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      // Simulación de inicio de sesión
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] p-4 font-body">
      <div className="w-full max-w-[400px] space-y-12 flex flex-col items-center">
        
        {/* Logo Container */}
        <div className="flex flex-col items-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-[#1e293b] border-4 border-[#2563eb]/20 flex items-center justify-center shadow-2xl">
            <div className="h-16 w-16 rounded-full bg-[#2563eb]/10 flex items-center justify-center text-[#2563eb]">
              <Truck className="h-10 w-10" />
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="text-5xl font-extrabold tracking-tighter text-white font-headline">
              RutaRápida
            </h1>
            <p className="text-[10px] font-bold tracking-[0.3em] text-[#3b82f6] uppercase">
              IA Neuronal V15.0
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors">
              <User className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Tu Nombre de Repartidor..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-16 pl-12 bg-[#1e293b]/50 border-2 border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:border-[#3b82f6] focus:ring-0 transition-all text-lg"
              required
            />
          </div>

          <Button 
            type="submit"
            className="w-full h-16 bg-white hover:bg-slate-100 text-[#0f172a] font-black text-lg rounded-2xl shadow-xl transition-transform active:scale-[0.98]"
          >
            ACCESO REPARTIDOR
          </Button>

          <div className="relative flex items-center justify-center py-4">
            <div className="absolute w-full h-[1px] bg-slate-800"></div>
            <div className="relative h-2 w-2 rounded-full border border-slate-700 bg-[#0f172a] flex items-center justify-center">
              <span className="text-[8px] font-bold text-slate-500">o</span>
            </div>
          </div>

          <Button 
            variant="outline"
            type="button"
            className="w-full h-16 bg-transparent border-2 border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-lg rounded-2xl transition-all"
            onClick={() => router.push("/dashboard")}
          >
            ACCESO CORPORATIVO
          </Button>
        </form>
      </div>
    </div>
  )
}
