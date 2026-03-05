import { StatsOverview } from "@/components/dashboard/StatsOverview"
import { CopoAssistant } from "@/components/dashboard/CopoAssistant"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DashboardPage() {
  const recentDeliveries = [
    { id: "ORD-7281", driver: "Juan Perez", status: "En Camino", destination: "Calle Reforma 123", time: "10:30 AM" },
    { id: "ORD-7282", driver: "Maria Garcia", status: "Entregado", destination: "Av. Insurgentes 45", time: "09:45 AM" },
    { id: "ORD-7283", driver: "Carlos Ruiz", status: "Pendiente", destination: "Plaza Carso, Local 4", time: "11:15 AM" },
    { id: "ORD-7284", driver: "Lucia Santos", status: "Retrasado", destination: "Santa Fe Tower B", time: "08:30 AM" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Bienvenido de nuevo, Andrés</h1>
          <p className="text-muted-foreground mt-1">Aquí está el resumen de la operación de hoy.</p>
        </div>
      </div>

      <StatsOverview />

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-0.5">
                <CardTitle>Entregas Recientes</CardTitle>
                <CardDescription>Monitoreo de actividad de la última hora.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">ID Pedido</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden md:table-cell">Destino</TableHead>
                    <TableHead className="text-right pr-6">Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium pl-6">{delivery.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{delivery.driver[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{delivery.driver}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          delivery.status === "Entregado" ? "secondary" : 
                          delivery.status === "Retrasado" ? "destructive" : 
                          delivery.status === "En Camino" ? "outline" : "default"
                        } className="text-[10px] px-2 py-0">
                          {delivery.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground truncate max-w-[150px]">
                        {delivery.destination}
                      </TableCell>
                      <TableCell className="text-right text-xs pr-6">{delivery.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <CopoAssistant />
        </div>
      </div>
    </div>
  )
}