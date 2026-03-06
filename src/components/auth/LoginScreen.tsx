
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

  const handleStart = (role: "Driver" | "Admin") => {
    if (!onboardingName.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" }); return
    }
    setIsOnboardingProcess(true)
    initiateAnonymousSignIn(auth!)
      .then(userCredential => {
        if(userCredential?.user) {
          const userId = userCredential.user.uid
          
          // 1. Fuente de verdad única
          setDocumentNonBlocking(doc(firestore, "users", userId), {
            id: userId,
            firstName: onboardingName,
            role: role,
            updatedAt: new Date().toISOString()
          }, { merge: true })
          
          // 2. Perfil operativo correspondiente
          if (role === "Driver") {
            setDocumentNonBlocking(doc(firestore, "driverProfiles", userId), {
              id: userId,
              firstName: onboardingName,
              availabilityStatus: "Available",
              vehicleType: "Motorcycle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true })
          } else {
            setDocumentNonBlocking(doc(firestore, "companyProfiles", userId), {
              id: userId,
              name: onboardingName,
              status: "Active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true })
          }
          
          toast({ title: `Bienvenido, ${onboardingName}` })
        }
        setIsOnboardingProcess(false)
      })
      .catch(error => {
        console.error("Login failed", error);
        toast({ title: "Error al acceder", variant: "destructive" })
        setIsOnboardingProcess(false)
      })
  }

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col justify-center items-center text-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/20">
             <Truck className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              RutaRápida
            </h1>
            <p className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.3em]">IA Logistic System</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input 
              placeholder="Escribe tu nombre..." 
              className="w-full h-16 bg-white/5 border-2 border-slate-800 rounded-2xl px-14 font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
              value={onboardingName}
              onChange={(e) => setOnboardingName(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => handleStart("Driver")} 
              disabled={isOnboardingProcess} 
              className="h-20 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black flex flex-col gap-1 shadow-xl shadow-blue-900/20"
            >
              <Truck className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-widest">Repartidor</span>
            </Button>
            <Button 
              onClick={() => handleStart("Admin")} 
              disabled={isOnboardingProcess} 
              className="h-20 rounded-3xl bg-slate-800 hover:bg-slate-700 text-white font-black flex flex-col gap-1 shadow-xl"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-widest">Empresa</span>
            </Button>
          </div>
          
          {isOnboardingProcess && <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mt-4" />}
        </div>
      </div>
    </div>
  )
}
