"use client"

import * as React from "react"
import { Map as MapIcon, Navigation, Search, Filter, Layers, Plus, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateOptimizedRouteFromDescription } from "@/ai/flows/generate-optimized-route-from-description"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function MapsPage() {
  const [routeQuery, setRouteQuery] = React.useState("")
  const [optimizing, setOptimizing] = React.useState(false)
  const [routeData, setRouteData] = React.useState<any>(null)

  const handleOptimize = async () => {
    if (!routeQuery) return
    setOptimizing(true)
    try {
      const result = await generateOptimizedRouteFromDescription({ description: routeQuery })
      setRouteData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Rastreo de Flota</h1>
          <p className="text-muted-foreground mt-1">Visualización en tiempo real y optimización de rutas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" /> Capas
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Añadir Stop
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Herramientas de Ruta</CardTitle>
              <CardDescription>Genera rutas inteligentes con IA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="ai">AI Copo</TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Describe el trayecto (ej. "Ruta desde Centro a Polanco pasando por Condesa evitando tráfico")</p>
                    <textarea 
                      className="w-full min-h-[120px] bg-background border rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary"
                      placeholder="Describe tu ruta..."
                      value={routeQuery}
                      onChange={(e) => setRouteQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleOptimize}
                    disabled={optimizing || !routeQuery}
                  >
                    {optimizing ? "Optimizando..." : "Optimizar Ruta"}
                  </Button>
                </TabsContent>
                <TabsContent value="manual" className="pt-4">
                   <div className="space-y-3">
                     <div className="flex gap-2">
                       <Input placeholder="Punto de inicio..." />
                     </div>
                     <div className="flex gap-2">
                       <Input placeholder="Destino..." />
                     </div>
                     <Button variant="secondary" className="w-full">Calcular Ruta</Button>
                   </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {routeData && (
            <Card className="animate-in slide-in-from-bottom-2 duration-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" /> Ruta Optimizada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] pr-4">
                  <div className="space-y-4">
                    <p className="text-xs leading-relaxed">{routeData.routeSummary}</p>
                    <div className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                      {routeData.optimizedStops.map((stop: any) => (
                        <div key={stop.order} className="flex gap-3 relative z-10">
                          <div className="h-4 w-4 rounded-full bg-primary border-4 border-background shrink-0 mt-1" />
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold">{stop.name}</p>
                            <p className="text-[10px] text-muted-foreground">{stop.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 h-[600px] lg:h-auto rounded-xl border bg-muted/20 relative overflow-hidden">
          {/* Mock Map UI */}
          <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: "url('https://picsum.photos/seed/mexicocity-map/1600/1200')" }}></div>
          
          {/* Mock Map Overlay Elements */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div className="bg-background/90 backdrop-blur-md p-2 rounded-lg shadow-lg pointer-events-auto flex items-center gap-2 border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input className="bg-transparent border-none focus:outline-none text-sm w-48" placeholder="Buscar dirección..." />
            </div>
            
            <div className="flex flex-col gap-2 pointer-events-auto">
              <Button variant="secondary" size="icon" className="shadow-md"><Plus className="h-4 w-4" /></Button>
              <Button variant="secondary" size="icon" className="shadow-md"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
            <div className="bg-background/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border pointer-events-auto max-w-sm ml-auto">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold">Unidad 142 - Activa</p>
                  <p className="text-xs text-muted-foreground">Último reporte: hace 14 segundos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simulated Vehicle Pins */}
          <div className="absolute top-1/2 left-1/3 h-8 w-8 bg-primary rounded-full border-4 border-white shadow-lg animate-bounce flex items-center justify-center">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <div className="absolute top-1/4 right-1/4 h-8 w-8 bg-accent rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <Truck className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

import { Truck } from "lucide-react"