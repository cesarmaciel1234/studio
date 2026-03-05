
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Truck, User as UserIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFirebase } from "@/firebase"
import { signInAnonymously } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { auth, firestore } = useFirebase()
  const { toast } = useToast()
  const [name, setName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !auth || !firestore) return

    setIsLoading(true)
    try {
      // 1. Inicio de sesión anónimo
      const userCredential = await signInAnonymously(auth)
      const user = userCredential.user

      // 2. Crear perfil de usuario básico en Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        id: user.uid,
        firstName: name.trim(),
        lastName: "",
        email: "",
        role: "Driver",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // 3. Crear perfil de conductor por defecto
      await setDoc(doc(firestore, "driverProfiles", user.uid), {
        id: user.uid,
        userId: user.uid,
        currentLocationLat: 19.4326, // CDMX default
        currentLocationLng: -99.1332,
        lastLocationUpdate: serverTimestamp()
      })

      toast({
        title: "¡Bienvenido, " + name + "!",
        description: "Iniciando sesión en RutaRápida Pro."
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error al iniciar sesión",
        description: "No pudimos conectar con el servidor. Inténtalo de nuevo.",
        variant: "destructive"
      })
      setIsLoading(false)
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
              <UserIcon className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Tu Nombre de Repartidor..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-16 pl-12 bg-[#1e293b]/50 border-2 border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:border-[#3b82f6] focus:ring-0 transition-all text-lg"
              required
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full h-16 bg-white hover:bg-slate-100 text-[#0f172a] font-black text-lg rounded-2xl shadow-xl transition-transform active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              "ENTRAR AHORA"
            )}
          </Button>

          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center">
            Acceso instantáneo sin contraseña
          </p>
        </form>
      </div>
    </div>
  )
}
