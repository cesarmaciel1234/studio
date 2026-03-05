"use client"

import { 
  Users, 
  Truck, 
  Clock, 
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stats = [
  {
    title: "Entregas Hoy",
    value: "1,284",
    change: "+12.5%",
    trend: "up",
    icon: Truck,
    color: "text-blue-600",
    bg: "bg-blue-100"
  },
  {
    title: "Conductores Activos",
    value: "42",
    change: "+3",
    trend: "up",
    icon: Users,
    color: "text-indigo-600",
    bg: "bg-indigo-100"
  },
  {
    title: "Tiempo Promedio",
    value: "24m",
    change: "-2m",
    trend: "down",
    icon: Clock,
    color: "text-emerald-600",
    bg: "bg-emerald-100"
  },
  {
    title: "Ingresos (MXN)",
    value: "$42.5k",
    change: "+8.2%",
    trend: "up",
    icon: CircleDollarSign,
    color: "text-purple-600",
    bg: "bg-purple-100"
  }
]

export function StatsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
              <stat.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {stat.trend === "up" ? (
                <span className="text-emerald-600 flex items-center font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {stat.change}
                </span>
              ) : (
                <span className="text-amber-600 flex items-center font-medium">
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  {stat.change}
                </span>
              )}
              desde ayer
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}