
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, ShieldAlert, Clock, AlertTriangle, Navigation } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy, arrayUnion, arrayRemove } from "firebase/firestore";
import { safeFormat } from '@/lib/date-utils';

export const CoroItem = React.memo(function CoroItem({ alert, userId }: { alert: any, userId: string }) {
  const firestore = useFirestore()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !alert.id) return null
    return query(collection(firestore, "alerts", alert.id, "comments"), orderBy("createdAt", "asc"))
  }, [firestore, alert.id])
  const { data: comments } = useCollection(commentsQuery)

  const isLiked = alert.likes?.includes(userId)

  const handleLike = () => {
    if (!firestore || !alert.id) return
    const alertRef = doc(firestore, "alerts", alert.id)
    updateDocumentNonBlocking(alertRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
    })
  }

  const handleSendComment = () => {
    if (!commentText.trim() || !firestore || !alert.id) return
    addDocumentNonBlocking(collection(firestore, "alerts", alert.id, "comments"), {
      text: commentText,
      authorId: userId,
      createdAt: new Date().toISOString()
    })
    setCommentText("")
  }

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'policia': return { text: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50/40' };
      case 'accidente': return { text: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50/40' };
      case 'sos': return { text: 'text-red-700', border: 'border-red-400', bg: 'bg-red-100/50' };
      case 'trafico': return { text: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50/40' };
      default: return { text: 'text-slate-600', border: 'border-slate-200', bg: 'bg-slate-50/40' };
    }
  }

  const theme = getColorClasses(alert.type)

  return (
    <Card className={cn(
      "rounded-[40px] border-none shadow-sm backdrop-blur-md overflow-hidden mb-4 text-left transition-all border",
      theme.bg, theme.border,
      alert.type === 'sos' && "ring-2 ring-red-500/30 shadow-xl shadow-red-100/20"
    )}>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-white/80 border border-white", theme.text)}>
              {alert.type === 'policia' ? <ShieldAlert className="w-5 h-5" /> : alert.type === 'trafico' ? <Clock className="w-5 h-5" /> : alert.type === 'sos' ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className={cn("font-black text-[13px] uppercase tracking-tight", theme.text)}>{alert.label}</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {safeFormat(alert.createdAt, 'dd/MM/yy HH:mm')} • {alert.type === 'sos' ? 'EMERGENCIA CRÍTICA' : 'Reporte Vial'}
              </p>
            </div>
          </div>
          {alert.type === 'sos' && <Badge className="bg-red-600 text-white animate-pulse border-none">SALA DE CRISIS</Badge>}
        </div>

        <p className="text-sm font-medium text-slate-700 leading-relaxed px-1">
          {alert.description || "Reporte de incidencia en tiempo real en la zona."}
        </p>

        <div className="flex items-center gap-4 pt-2">
          <button onClick={handleLike} className={cn("flex items-center gap-1.5 transition-all active:scale-90", isLiked ? theme.text : "text-slate-400")}>
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            <span className="text-[10px] font-black">{alert.likes?.length || 0}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-all">
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-black">{comments?.length || 0}</span>
          </button>
        </div>

        {showComments && (
          <div className="pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
              {comments?.map((c: any) => (
                <div key={c.id} className="bg-white/50 backdrop-blur-sm rounded-2xl p-3 border border-white/50">
                  <p className="text-xs font-medium text-slate-700">{c.text}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Recién</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Comentar..." 
                className="h-10 bg-white/80 border-none rounded-xl text-xs font-medium"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              />
              <Button onClick={handleSendComment} size="icon" className="h-10 w-10 rounded-xl bg-slate-900 shrink-0">
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
