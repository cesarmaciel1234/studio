"use client"

import * as React from "react"
import { proactiveLogisticalInsights } from "@/ai/flows/proactive-logistical-insights"
import { Bot, Sparkles, AlertCircle, TrendingUp, Mic, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function CopoAssistant() {
  const [loading, setLoading] = React.useState(false)
  const [insights, setInsights] = React.useState<string[]>([])
  const [isListening, setIsListening] = React.useState(false)

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const result = await proactiveLogisticalInsights({
        realtimeFleetData: "3 drivers on route, 2 delays in downtown, fuel prices up 5%, Driver John ahead of schedule."
      })
      if (result.hasIssuesOrOptimizations) {
        setInsights(result.insights)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchInsights()
  }, [])

  const toggleVoice = () => {
    setIsListening(!isListening)
    // Simulated voice command logic
  }

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
      <CardHeader className="pb-2 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg animate-pulse">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Copo Assistant</CardTitle>
              <CardDescription>Tu Copiloto de Logística Inteligente</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            En línea
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 h-[400px] flex flex-col">
        <div className="flex-1 overflow-hidden mb-4">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              <div className="bg-background p-4 rounded-2xl rounded-tl-none border shadow-sm max-w-[85%]">
                <p className="text-sm">Hola Andrés, he analizado la flota en tiempo real. Aquí tienes mis sugerencias prioritarias para hoy:</p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-[80%] rounded-2xl" />
                  <Skeleton className="h-12 w-[70%] rounded-2xl" />
                  <Skeleton className="h-12 w-[75%] rounded-2xl" />
                </div>
              ) : (
                insights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className={`mt-1 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${idx % 2 === 0 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {idx % 2 === 0 ? <AlertCircle className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                    </div>
                    <div className="bg-background p-4 rounded-2xl rounded-tl-none border shadow-sm flex-1">
                      <p className="text-sm font-medium">{insight}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input 
              className="w-full bg-background border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Pregunta a Copo..."
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-1 top-1 text-primary rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            size="icon" 
            variant={isListening ? "destructive" : "secondary"}
            className="rounded-full h-11 w-11 shadow-md transition-all active:scale-95"
            onClick={toggleVoice}
          >
            <Mic className={`h-5 w-5 ${isListening ? 'animate-bounce' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}