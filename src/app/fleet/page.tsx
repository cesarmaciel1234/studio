"use client"

import * as React from "react"
import { Truck, Star, Phone, MoreVertical, Search, Plus, Filter, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { summarizeDriverActivity } from "@/ai/flows/summarize-driver-activity"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

const drivers = [
  { id: 1, name: "Juan Perez", status: "Disponible", vehicle: "Nissan NP300", rating: 4.8, deliveries: 1240, img: "https://picsum.photos/seed/j/100/100" },
  { id: 2, name: "Maria Garcia", status: "En Ruta", vehicle: "Ford Transit", rating: 4.9, deliveries: 2150, img: "https://picsum.photos/seed/m/100/100" },
  { id: 3, name: "Carlos Ruiz", status: "Fuera de Servicio", vehicle: "VW Crafter", rating: 4.5, deliveries: 890, img: "https://picsum.photos/seed/c/100/100" },
  { id: 4, name: "Lucia Santos", status: "En Ruta", vehicle: "Mercedes Sprinter", rating: 4.7, deliveries: 1560, img: "https://picsum.photos/seed/l/100/100" },
  { id: 5, name: "Roberto Diaz", status: "Disponible", vehicle: "Toyota Hilux", rating: 4.6, deliveries: 740, img: "https://picsum.photos/seed/r/100/100" },
]

export default function FleetPage() {
  const [selectedDriver, setSelectedDriver] = React.useState<any>(null)
  const [summaryLoading, setSummaryLoading] = React.useState(false)
  const [summaryData, setSummaryData] = React.useState<any>(null)

  const handleShowSummary = async (driver: any) => {
    setSelectedDriver(driver)
    setSummaryLoading(true)
    setSummaryData(null)
    try {
      const result = await summarizeDriverActivity({ driverName: driver.name, timePeriod: "este mes" })
      setSummaryData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Flota & Conductores</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu equipo y vehículos de manera eficiente.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Conductor
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 max-w-sm" placeholder="Buscar conductor o vehículo..." />
        </div>
        <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filtros</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Conductor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Total Entregas</TableHead>
                <TableHead className="text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={driver.img} />
                        <AvatarFallback>{driver.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{driver.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-2 w-2" /> (55) 1234-5678
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      driver.status === "Disponible" ? "secondary" : 
                      driver.status === "En Ruta" ? "default" : "outline"
                    }>
                      {driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{driver.vehicle}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium">{driver.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{driver.deliveries.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => handleShowSummary(driver)}>
                          Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Actividad del Conductor</DialogTitle>
                          <DialogDescription>Resumen de rendimiento generado por IA.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={driver.img} />
                              <AvatarFallback>{driver.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-xl font-bold">{driver.name}</h3>
                              <p className="text-sm text-muted-foreground">{driver.vehicle}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-muted/50 p-3 rounded-xl text-center">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Entregas</p>
                              <p className="text-lg font-bold">{summaryData?.totalDeliveries || '-'}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-xl text-center">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Distancia</p>
                              <p className="text-lg font-bold">{summaryData?.totalDistanceKm || '-'} km</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-xl text-center">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Rating</p>
                              <p className="text-lg font-bold">{summaryData?.averageRating || '-'}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-semibold">Resumen de Desempeño</p>
                            {summaryLoading ? (
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[90%]" />
                                <Skeleton className="h-4 w-[95%]" />
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {summaryData?.summary}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button className="flex-1" variant="outline"><Mail className="h-4 w-4 mr-2" /> Mensaje</Button>
                            <Button className="flex-1"><Phone className="h-4 w-4 mr-2" /> Llamar</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}