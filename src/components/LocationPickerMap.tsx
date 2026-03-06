'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, MapPin, Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialCenter?: [number, number];
}

function LiveLocationIndicator({ onInitialFound }: { onInitialFound: (lat: number, lng: number) => void }) {
  const [currentPos, setCurrentPos] = useState<L.LatLng | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const map = useMap();
  
  useEffect(() => {
    const handleLocationFound = (e: L.LocationEvent) => {
      setCurrentPos(e.latlng);
      if (!hasCentered) {
        map.setView(e.latlng, 16, { animate: true });
        setHasCentered(true);
        onInitialFound(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('locationfound', handleLocationFound);
    map.locate({ watch: true, enableHighAccuracy: true });

    return () => {
      map.off('locationfound', handleLocationFound);
      map.stopLocate();
    };
  }, [map, hasCentered, onInitialFound]);

  return currentPos === null ? null : (
    <>
      <Circle 
        center={currentPos} 
        radius={12} 
        pathOptions={{ 
          fillColor: '#3b82f6', 
          color: 'white', 
          weight: 3, 
          fillOpacity: 1,
          className: 'animate-pulse' 
        }} 
      />
      <Circle 
        center={currentPos} 
        radius={60} 
        pathOptions={{ 
          fillColor: '#3b82f6', 
          color: 'transparent', 
          fillOpacity: 0.15 
        }} 
      />
    </>
  );
}

function MapInteraction({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({ onLocationSelect, initialCenter }: LocationPickerMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [locationDetails, setLocationDetails] = useState<{address: string, neighborhood: string, city: string} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  useEffect(() => {
    if (markerPosition) {
      setIsGeocoding(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${markerPosition[0]}&lon=${markerPosition[1]}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            const address = data.address;
            const fullAddress = data.display_name;
            setLocationDetails({
              address: fullAddress,
              neighborhood: address.suburb || address.neighbourhood || address.residential || "Barrio",
              city: address.city || address.town || address.village || address.state || "Ciudad"
            });
          }
        })
        .catch(err => console.error("Geocoding error:", err))
        .finally(() => setIsGeocoding(false));
    }
  }, [markerPosition]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const newPos: [number, number] = [lat, lon];
        setMarkerPosition(newPos);
        setMapCenter(newPos);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = useCallback(() => {
    if (markerPosition) {
      const addr = locationDetails?.address || `${markerPosition[0].toFixed(4)}, ${markerPosition[1].toFixed(4)}`;
      onLocationSelect(markerPosition[0], markerPosition[1], addr);
    }
  }, [markerPosition, onLocationSelect, locationDetails]);

  const handleManualSelect = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
  };

  return (
    <div className="flex flex-col gap-3 relative">
      <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-100 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar calle, barrio o ciudad..." 
            className="h-11 pl-10 bg-slate-50 border-none rounded-xl font-medium text-sm focus-visible:ring-1 focus-visible:ring-blue-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isSearching}
          className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "BUSCAR"}
        </Button>
      </div>

      <div className="h-[380px] w-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative z-0">
        <MapContainer 
          center={initialCenter || [-34.6037, -58.3816]} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LiveLocationIndicator onInitialFound={(lat, lng) => setMarkerPosition([lat, lng])} />
          {markerPosition && <Marker position={markerPosition} />}
          <MapInteraction onSelect={handleManualSelect} />
          <MapUpdater center={mapCenter} />
        </MapContainer>
        
        {markerPosition && (
          <div className="absolute bottom-6 left-6 right-6 z-[500] animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-[24px] shadow-2xl border border-white mb-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Dirección Detectada</p>
              </div>
              
              {isGeocoding ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Obteniendo detalles...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-slate-900 line-clamp-1">
                    {locationDetails?.neighborhood}, {locationDetails?.city}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 line-clamp-1 uppercase tracking-tight">
                    {locationDetails?.address}
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleConfirm}
              disabled={isGeocoding}
              className="w-full h-14 rounded-2xl bg-[#0F172A] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-slate-800 disabled:opacity-50"
            >
              <Check className="w-5 h-5 text-emerald-400" />
              CONFIRMAR UBICACIÓN
            </Button>
          </div>
        )}

        {!markerPosition && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                Toca el mapa para marcar el punto
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
