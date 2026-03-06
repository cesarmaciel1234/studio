
"use client"

import React, { useState } from "react"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Truck, Loader2 } from "lucide-react"
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"
import { useToast } from "@/hooks/use-toast"

export function LoginScreen() {
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [onboardingName, setOnboardingName] = useState("")
  const [isOnboardingProcess, setIsOnboardingProcess] = useState(false)

  const handleStartAsDriver = () => {
    if (!onboardingName.trim()) {
      toast({ title: "Tu nombre es obligatorio", variant: "destructive" }); return
    }
    setIsOnboardingProcess(true)
    initiateAnonymousSignIn(auth!)
      .then(userCredential => {
        if(userCredential?.user) {
          const userId = userCredential.user.uid
          
          // Crear documento base de usuario
          setDocumentNonBlocking(doc(firestore, "users", userId), {
            id: userId,
            email: `${userId}@rutarapida.com`,
            role: "Driver",
            firstName: onboardingName,
            updatedAt: new Date().toISOString()
          }, { merge: true })
          
          // Unificar perfil en /driverProfiles
          setDocumentNonBlocking(doc(firestore, "driverProfiles", userId), {
            id: userId,
            firstName: onboardingName,
            email: `${userId}@rutarapida.com`,
            availabilityStatus: "Available",
            vehicleType: "Motorcycle",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true })
        }
      })
      .catch(error => {
        console.error("Anonymous sign-in failed", error);
        toast({ title: "Error al iniciar", variant: "destructive" })
        setIsOnboardingProcess(false)
      })
  }

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col justify-center items-center text-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/20">
             <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">RutaRápida Pro</h1>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">SISTEMA DE ENTREGAS IA</p>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Escribe tu Nombre..." 
              className="w-full h-16 bg-slate-800 border-none rounded-2xl px-14 font-bold text-white text-lg placeholder:text-slate-600"
              value={onboardingName}
              onChange={(e) => setOnboardingName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartAsDriver()}
            />
          </div>
          <Button onClick={handleStartAsDriver} disabled={isOnboardingProcess} className="w-full h-16 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl">
            {isOnboardingProcess ? <Loader2 className="w-6 h-6 animate-spin" /> : "ACCESO REPARTIDOR"}
          </Button>
        </div>
      </div>
    </div>
  )
}
