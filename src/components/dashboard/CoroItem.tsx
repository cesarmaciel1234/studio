import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, ShieldAlert, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { safeFormat } from '@/lib/date-utils';

export const CoroItem = React.memo(function CoroItem({ alert, userId }: { alert: any, userId: string }) {
  const firestore = useFirestore()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !alert.id) return null
    return query(collection(firestore, "alerts", alert.id, "comments"), orderBy("createdAt", "asc"))
  }, [firestore, alert.id])
  const { data: comments, isLoading: isLoadingComments } = useCollection(commentsQuery)

  const isLiked = userId && alert.likes?.includes(userId)

  const handleLike = () => {
    if (!firestore || !alert.id || !userId) return
    const alertRef = doc(firestore, "alerts", alert.id)
    
    // El sistema de Bumping: al dar like, actualizamos el timestamp para que la alerta suba
    updateDocumentNonBlocking(alertRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      updatedAt: new Date().toISOString()
    })
  }

  const handleSendComment = () => {
    if (!commentText.trim() || !firestore || !alert.id || !userId || isSubmitting) return
    
    setIsSubmitting(true)
    
    // 1. Agregar el comentario a la subcolección
    addDocumentNonBlocking(collection(firestore, "alerts", alert.id, "comments"), {
      text: commentText,
      authorId: userId,
      createdAt: new Date().toISOString()
    })
    
    // 2. Bumping: Actualizar el timestamp de la alerta principal para que suba en el feed
    updateDocumentNonBlocking(doc(firestore, "alerts", alert.id), {
      updatedAt: new Date().toISOString()
    })
    
    setCommentText("")
    setIsSubmitting(false)
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
      "rounded-[40px] border shadow-sm backdrop-blur-md overflow-hidden mb-4 text-left transition-all",
      theme.bg, theme.border,
      alert.type === 'sos' && "ring-2 ring-red-500/30 shadow-xl shadow-red-100/20"
    )}>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-white/80 border border-white", theme.text)}>
              {alert.type === 'policia' ? <ShieldAlert className="w-5 h-5" /> : 
               alert.type === 'trafico' ? <Clock className="w-5 h-5" /> : 
               alert.type === 'sos' ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : 
               <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className={cn("font-black text-[13px] uppercase tracking-tight", theme.text)}>{alert.label}</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Última Actividad: {safeFormat(alert.updatedAt || alert.createdAt, 'HH:mm')}
              </p>
            </div>
          </div>
          {alert.type === 'sos' && <Badge className="bg-red-600 text-white animate-pulse border-none text-[8px] font-black tracking-widest">CRÍTICO</Badge>}
        </div>

        <p className="text-sm font-medium text-slate-700 leading-relaxed px-1">
          {alert.description || "Nueva incidencia reportada en tu zona de operaciones."}
        </p>

        <div className="flex items-center gap-4 pt-2">
          <button 
            onClick={handleLike} 
            disabled={!userId}
            className={cn(
              "flex items-center gap-1.5 transition-all active:scale-90", 
              isLiked ? theme.text : "text-slate-400",
              !userId && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            <span className="text-[10px] font-black">{alert.likes?.length || 0}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)} 
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-black">{comments?.length || 0}</span>
          </button>
        </div>

        {showComments && (
          <div className="pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 scrollbar-hide">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map((c: any) => (
                  <div key={c.id} className="bg-white/50 backdrop-blur-sm rounded-2xl p-3 border border-white/50">
                    <p className="text-xs font-medium text-slate-700">{c.text}</p>
                    <p className="text-[7px] font-black text-slate-400 uppercase mt-1">
                      {safeFormat(c.createdAt, 'HH:mm')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-center py-4 text-slate-400 font-bold uppercase tracking-widest">
                  Sin comentarios aún
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input 
                placeholder={userId ? "Escribe algo..." : "Inicia sesión para comentar"} 
                className="h-10 bg-white/80 border-none rounded-xl text-xs font-medium focus-visible:ring-1 focus-visible:ring-slate-200"
                value={commentText}
                disabled={!userId || isSubmitting}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              />
              <Button 
                onClick={handleSendComment} 
                disabled={!userId || !commentText.trim() || isSubmitting}
                size="icon" 
                className="h-10 w-10 rounded-xl bg-slate-900 shrink-0 transition-transform active:scale-90"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})