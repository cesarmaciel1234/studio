
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Sparkles, Clock, RefreshCcw, ChevronUp, ChevronDown, Gps, Target } from "lucide-react"
import { driverRouteOptimization } from "@/ai/flows/driver-route-optimization-flow"
import type { DriverRouteOptimizationOutput } from "@/ai/schemas"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function RoutePage() {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedData, setOptimizedData] = useState<DriverRouteOptimizationOutput | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  const handleOptimize = async () => {
    setIsOptimizing(true)
    try {
      const result = await driverRouteOptimization({
        driverCurrentLocation: { latitude: -34.6037, longitude: -58.3816 },
        stops: [
          { address: "Restaurante El Sol, Av. Corrientes 1200", type: "pickup", orderId: "ORD-001" },
          { address: "Calle Florida 450", type: "delivery", orderId: "ORD-001", timeWindowEnd: "2024-05-20T14:00:00Z" },
          { address: "Pizzería La Mezzetta, Av. Álvarez Thomas 1321", type: "pickup", orderId: "ORD-002" },
          { address: "Av. Cabildo 2200", type: "delivery", orderId: "ORD-002" }
        ],
        currentTrafficConditions: "Tráfico moderado en el centro."
      })
      setOptimizedData(result)
      setIsExpanded(true)
      toast({ title: "Ruta optimizada", description: "La IA ha encontrado el camino más rápido." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo optimizar la ruta." })
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-muted">
      {/* Full Background Map */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/mapview_full/1200/1800" 
          alt="Map View" 
          fill 
          className="object-cover"
          priority
          data-ai-hint="satellite map"
        />
        {/* Overlay gradient for UI readability */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Floating Map Controls */}
      <div className="absolute top-6 right-4 z-20 flex flex-col gap-3">
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-none">
          <Target className="w-5 h-5 text-primary" />
        </Button>
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-none">
          <Navigation className="w-5 h-5 text-primary" />
        </Button>
      </div>

      {/* Bottom Sheet Interface */}
      <div 
        className={cn(
          "absolute left-0 right-0 bottom-0 z-30 transition-all duration-500 ease-in-out transform",
          isExpanded ? "h-[70vh]" : "h-[180px]"
        )}
      >
        <div className="h-full w-full max-w-md mx-auto bg-card rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col border-t border-border">
          {/* Handle bar */}
          <div 
            className="w-full flex justify-center py-3 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full"></div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col px-6">
            <header className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold font-headline">
                  {optimizedData ? "Tu Ruta IA" : "Planificar Ruta"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {optimizedData ? `${optimizedData.totalEstimatedDuration} min • ${optimizedData.totalEstimatedDistance} km` : "Optimiza tus entregas con IA"}
                </p>
              </div>
              {!optimizedData && (
                <Button 
                  onClick={handleOptimize} 
                  disabled={isOptimizing}
                  size="sm"
                  className="rounded-full bg-primary font-bold px-4"
                >
                  {isOptimizing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isOptimizing ? "Calculando..." : "Optimizar"}
                </Button>
              )}
              {optimizedData && (
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-full"
                >
                  {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
                </Button>
              )}
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
              {!optimizedData ? (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Ahorra tiempo</p>
                      <p className="text-xs text-muted-foreground">La IA analiza el tráfico en tiempo real.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Menos combustible</p>
                      <p className="text-xs text-muted-foreground">Secuencia optimizada de 4 paradas pendientes.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 py-2">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Siguiente Parada</h3>
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Navigation className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{optimizedData.optimizedRoute[0].address}</p>
                        <p className="text-xs text-primary font-semibold uppercase">{optimizedData.optimizedRoute[0].type}</p>
                      </div>
                      <Badge className="bg-accent">ORD-{optimizedData.optimizedRoute[0].orderId}</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Toda la Ruta</h3>
                    <div className="space-y-4 relative">
                      {optimizedData.optimizedRoute.map((stop, i) => (
                        <div key={i} className="flex gap-4 relative">
                          {i < optimizedData.optimizedRoute.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-[-16px] w-0.5 bg-muted"></div>
                          )}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs z-10",
                            stop.type === 'pickup' ? 'bg-blue-100 text-blue-600' : 'bg-accent/20 text-accent'
                          )}>
                            {i + 1}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-bold">{stop.address}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{stop.type} • {stop.estimatedArrivalTime ? new Date(stop.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-dashed text-muted-foreground" onClick={() => setOptimizedData(null)}>
                    Reiniciar planificación
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
