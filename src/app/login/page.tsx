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
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !auth || !firestore) return

    setIsLoading(true)
    try {
      const userCredential = await signInAnonymously(auth)
      const user = userCredential.user

      await setDoc(doc(firestore, "users", user.uid), {
        id: user.uid,
        firstName: name.trim(),
        role: "Driver",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      await setDoc(doc(firestore, "driverProfiles", user.uid), {
        id: user.uid,
        userId: user.uid,
        firstName: name.trim(),
        currentLocationLat: 19.4326,
        currentLocationLng: -99.1332,
        lastLocationUpdate: serverTimestamp()
      })

      toast({
        title: "¡Bienvenido, " + name + "!",
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error al iniciar sesión",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4" suppressHydrationWarning>
      <div className="w-full max-w-[400px] space-y-12">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-blue-500/20 shadow-2xl">
            <Truck className="h-12 w-12 text-blue-500" />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase">RutaRápida</h1>
            <p className="text-blue-500 font-black text-[10px] tracking-[0.3em] uppercase">IA Neuronal V15</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              placeholder="Tu Nombre..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-16 pl-12 bg-slate-800/50 border-slate-700 text-white rounded-2xl text-lg"
              required
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full h-16 bg-white text-slate-900 font-black text-lg rounded-2xl shadow-xl active:scale-95 transition-transform"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ENTRAR AHORA"}
          </Button>
        </form>
      </div>
    </div>
  )
}
