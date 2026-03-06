"use client"

import React, { useState } from "react"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Truck, Loader2, Building2 } from "lucide-react"
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"
import { useToast } from "@/hooks/use-toast"

/**
 * Pantalla de inicio de sesión simplificada.
 * Solo requiere el nombre del usuario para evitar conflictos de base de datos.
 */
export function LoginScreen() {
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [onboardingName, setOnboardingName] = useState("")
  const [isProcessing, setIsProcessing] = useState<"admin" | "driver" | null>(null)

  const handleAuth = (role: "Admin" | "Driver") => {
    if (!onboardingName.trim()) {
      toast({ title: "Tu nombre es obligatorio", variant: "destructive" }); 
      return
    }
    
    setIsProcessing(role === "Admin" ? "admin" : "driver")
    
    initiateAnonymousSignIn(auth!)
      .then(userCredential => {
        if(userCredential?.user) {
          const userId = userCredential.user.uid
          
          // 1. Crear documento maestro de usuario (Fuente de Verdad)
          setDocumentNonBlocking(doc(firestore, "users", userId), {
            id: userId,
            firstName: onboardingName,
            role: role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true })
          
          // 2. Crear perfil específico para la funcionalidad operativa
          if (role === "Admin") {
            setDocumentNonBlocking(doc(firestore, "companyProfiles", userId), {
              id: userId,
              name: `${onboardingName} Logística`,
              adminName: onboardingName,
              createdAt: new Date().toISOString()
            }, { merge: true })
            toast({ title: "Modo Empresa Activado", description: "Iniciando panel de control central." })
          } else {
            setDocumentNonBlocking(doc(firestore, "driverProfiles", userId), {
              id: userId,
              firstName: onboardingName,
              availabilityStatus: "Available",
              createdAt: new Date().toISOString()
            }, { merge: true })
            toast({ title: "Modo Repartidor Activado", description: "Iniciando seguimiento GPS Pro." })
          }
        }
      })
      .catch(error => {
        console.error("Auth error:", error)
        toast({ title: "Error al iniciar", variant: "destructive" })
        setIsProcessing(null)
      })
  }

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col justify-center items-center text-center p-8 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-700" />
      
      <div className="w-full max-w-sm z-10 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-2xl rotate-3">
             <Truck className="w-10 h-10 text-white" />
          </div>
          <div className="text-left w-full text-center">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">RutaRápida Pro</h1>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mt-2">SISTEMA DE LOGÍSTICA IA</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl space-y-6">
          <div className="relative group">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400" />
            <Input 
              placeholder="¿Cómo te llamas?" 
              className="w-full h-16 bg-white/5 border-none rounded-2xl px-14 font-bold text-white text-lg placeholder:text-slate-600"
              value={onboardingName}
              onChange={(e) => setOnboardingName(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            <Button 
              onClick={() => handleAuth("Admin")} 
              disabled={!!isProcessing} 
              className="h-16 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest hover:bg-slate-100 flex items-center justify-center gap-3"
            >
              {isProcessing === "admin" ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Building2 className="w-5 h-5 text-blue-600" />
                  MODO EMPRESA
                </>
              )}
            </Button>

            <Button 
              onClick={() => handleAuth("Driver")} 
              disabled={!!isProcessing} 
              variant="outline"
              className="h-16 rounded-2xl border-white/10 bg-transparent text-white font-black uppercase tracking-widest hover:bg-white/5 flex items-center justify-center gap-3"
            >
              {isProcessing === "driver" ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Truck className="w-5 h-5 text-emerald-400" />
                  MODO REPARTIDOR
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
          Powered by Orion AI v3.0
        </p>
      </div>
    </div>
  )
}