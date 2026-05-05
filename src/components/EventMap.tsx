import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface EventMapProps {
  lat?: number;
  lng?: number;
  venueName?: string;
}

export default function EventMap({ lat = 37.42, lng = -122.08, venueName = "Campus Venue" }: EventMapProps) {
  if (!hasValidKey) {
    return (
      <div className="w-full h-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden relative group">
        {/* Simulated Map View for Demo */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-40 grayscale" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-900/10 backdrop-blur-[2px]">
          <div className="bg-white/90 dark:bg-zinc-900/90 p-4 rounded-2xl shadow-xl border border-white/20 max-w-[280px]">
            <MapPin className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1">{venueName}</h3>
            <p className="text-[10px] text-zinc-500 mb-3">Location: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
            <div className="text-[9px] font-medium py-1 px-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full inline-block">
              Interactive Map (API Key Required)
            </div>
          </div>
        </div>
        
        {/* Subtle Hint for Devs */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <span className="text-[8px] text-zinc-400 bg-black/20 px-2 py-0.5 rounded">Campus Maps</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker position={{ lat, lng }}>
            <Pin background="#4f46e5" glyphColor="#fff" />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
}
