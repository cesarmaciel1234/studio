
'use client';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Truck, User, Package, Navigation as NavIcon, AlertTriangle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

const createDriverIcon = (color: string, isBusy: boolean = false, isSOS: boolean = false) => {
  const iconHtml = renderToStaticMarkup(
    <div className="relative">
      {isSOS && (
        <div className="absolute -inset-6 bg-red-500/30 rounded-full animate-ping" />
      )}
      <div 
        className={cn(
          "w-11 h-11 rounded-full border-[3px] border-white shadow-2xl flex items-center justify-center transition-all duration-500", 
          isSOS ? "bg-red-600 animate-pulse scale-110" : isBusy ? "bg-orange-500" : "bg-slate-900"
        )} 
      >
        {isSOS ? (
          <AlertTriangle className="w-6 h-6 text-white fill-current animate-bounce" />
        ) : (
          <Truck className="w-5 h-5 text-white" />
        )}
      </div>
      {(isBusy || isSOS) && (
        <div className={cn(
          "absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md",
          isSOS ? "bg-red-500" : "bg-orange-400"
        )}>
          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
        </div>
      )}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-slate-200" />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-driver-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
};

function MapController({ 
  center, 
  heading, 
  isNavigating, 
  centerTrigger 
}: { 
  center: [number, number], 
  heading: number, 
  isNavigating: boolean, 
  centerTrigger: number 
}) {
  const map = useMap();

  useEffect(() => {
    if (isNavigating) {
      map.setView(center, 18, { animate: true });
    } else if (centerTrigger > 0) {
      map.setView(center, 16, { animate: true });
    }
  }, [center, isNavigating, map, centerTrigger]);

  return null;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}

interface InteractiveMapProps {
  center: [number, number];
  destination?: [number, number] | null;
  alerts?: any[] | null;
  activeOrders?: any[] | null;
  fleet?: any[] | null;
  heading?: number;
  zoom?: number;
  isNavigating?: boolean;
  centerTrigger?: number;
  currentUserId?: string;
}

export default function InteractiveMap({ 
  center, 
  destination, 
  alerts,
  activeOrders,
  fleet,
  heading = 0, 
  zoom = 14,
  isNavigating = false,
  centerTrigger = 0,
  currentUserId
}: InteractiveMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const lastFetchedCoords = useRef<{center: [number, number], dest: [number, number]} | null>(null);
  const [routes, setRoutes] = useState<{ main: [number, number][], alternatives: [number, number][][] }>({
    main: [],
    alternatives: []
  });

  useEffect(() => {
    setIsMounted(true);
    fixLeafletIcons();
  }, []);

  useEffect(() => {
    if (!center || !destination || typeof destination[0] !== 'number' || typeof destination[1] !== 'number') {
      setRoutes({ main: [], alternatives: [] });
      lastFetchedCoords.current = null;
      return;
    }

    const shouldFetch = !lastFetchedCoords.current || 
                        getDistance(destination[0], destination[1], lastFetchedCoords.current.dest[0], lastFetchedCoords.current.dest[1]) > 5 ||
                        getDistance(center[0], center[1], lastFetchedCoords.current.center[0], lastFetchedCoords.current.center[1]) > 10;

    if (shouldFetch) {
      const url = `https://router.project-osrm.org/route/v1/driving/${center[1]},${center[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&alternatives=true`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const mainCoords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
            const altCoords = data.routes.slice(1).map((route: any) => 
              route.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number])
            );
            setRoutes({ main: mainCoords, alternatives: altCoords });
            lastFetchedCoords.current = { center, dest: destination };
          }
        })
        .catch(err => console.error("OSRM Error:", err));
    }
  }, [center, destination]);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-slate-200 animate-pulse flex items-center justify-center">
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando Monitor de Flota Biz...</p>
      </div>
    );
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'policia': return '#2563eb';
      case 'accidente': return '#dc2626';
      case 'trafico': return '#d97706';
      case 'obras': return '#059669';
      case 'sos': return '#ef4444';
      default: return '#64748b';
    }
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-slate-100">
      <div 
        className={cn(
          "h-full w-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isNavigating && "scale-[1.4]"
        )}
        style={{ 
          transform: isNavigating ? `rotate(${-heading}deg)` : 'none',
          transformOrigin: 'center center'
        }}
      >
        <MapContainer 
          center={center} 
          zoom={zoom} 
          zoomControl={false}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {routes.alternatives.map((altPath, idx) => (
            <Polyline key={`alt-${idx}`} positions={altPath} color="#94a3b8" weight={5} opacity={0.3} lineCap="round" />
          ))}

          {routes.main.length > 0 && (
            <Polyline positions={routes.main} color="#2563eb" weight={9} opacity={0.9} lineCap="round" />
          )}

          {alerts?.map((alert) => {
            if (typeof alert.latitude !== 'number' || typeof alert.longitude !== 'number') return null;
            const baseColor = getAlertColor(alert.type);
            return (
              <div key={alert.id}>
                <Circle center={[alert.latitude, alert.longitude]} radius={200} pathOptions={{ fillColor: baseColor, fillOpacity: 0.05, color: 'transparent', weight: 0 }} />
                <Circle center={[alert.latitude, alert.longitude]} radius={60} pathOptions={{ fillColor: baseColor, fillOpacity: 0.3, color: baseColor, weight: 2, opacity: 0.4 }}>
                  <Popup className="alert-popup">
                    <div className="p-2 min-w-[140px]">
                      <p className="font-black text-[10px] uppercase tracking-widest mb-1" style={{ color: baseColor }}>{alert.label}</p>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{alert.description || 'Incidencia detectada'}</p>
                    </div>
                  </Popup>
                </Circle>
              </div>
            );
          })}

          {fleet?.map((driver) => {
            if (typeof driver.currentLatitude !== 'number' || typeof driver.currentLongitude !== 'number') return null;
            
            const isSOS = alerts?.some(a => a.type === 'sos' && a.authorId === driver.id);
            const isBusy = activeOrders?.some(o => o.driverId === driver.id && ["Picked Up", "In Transit"].includes(o.status));
            
            return (
              <Marker 
                key={`fleet-${driver.id}`} 
                position={[driver.currentLatitude, driver.currentLongitude]} 
                icon={createDriverIcon(driver.id === currentUserId ? '#2563eb' : '#94a3b8', isBusy, isSOS)}
                zIndexOffset={isSOS ? 10000 : (driver.id === currentUserId ? 1000 : 500)}
              >
                <Popup>
                  <div className="p-1">
                    <p className={cn(
                      "font-black text-[9px] uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block",
                      isSOS ? "bg-red-600 text-white animate-pulse" : isBusy ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {isSOS ? "EMERGENCIA CRÍTICA" : isBusy ? "EN RUTA" : "DISPONIBLE"}
                    </p>
                    <p className="font-black text-xs text-slate-900 mt-1">{driver.firstName} {driver.lastName || ''}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {destination && typeof destination[0] === 'number' && typeof destination[1] === 'number' && (
            <Marker position={destination}>
              <Popup>
                <div className="p-1">
                  <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">DESTINO</p>
                  <p className="font-bold text-xs text-slate-900">Punto de Entrega</p>
                </div>
              </Popup>
            </Marker>
          )}

          <MapController center={center} heading={heading} isNavigating={isNavigating} centerTrigger={centerTrigger} />
          {!isNavigating && <ZoomControl position="bottomright" />}
        </MapContainer>
      </div>

      {isNavigating && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
          <div className="relative flex items-center justify-center scale-150">
            <div className="w-12 h-12 bg-blue-600 rounded-full shadow-[0_0_35px_rgba(37,99,235,0.7)] border-4 border-white flex items-center justify-center">
              <NavIcon className="w-7 h-7 text-white fill-current -rotate-45" />
            </div>
            <div className="absolute w-24 h-24 bg-blue-400/20 rounded-full animate-ping" />
          </div>
        </div>
      )}
    </div>
  );
}
