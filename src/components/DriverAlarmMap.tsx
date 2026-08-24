import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Tooltip, Circle } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Alarm, DriverCoordinates } from '../types';
import { 
  Clock, 
  Car, 
  Crosshair, 
  Copy, 
  Check, 
  RefreshCw, 
  Compass, 
  Gauge, 
  Radio, 
  MapPin, 
  ExternalLink,
  ShieldCheck,
  Navigation,
  AlertTriangle,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createAlarmIcon = (priority: string) => {
  let colorClass = 'bg-blue-500';
  if (priority === 'critical') colorClass = 'bg-red-500';
  else if (priority === 'high') colorClass = 'bg-amber-500';
  else if (priority === 'low') colorClass = 'bg-slate-500';

  const html = `
    <div class="flex flex-col items-center justify-center -mt-4 -ml-4">
      <div class="w-8 h-8 ${colorClass} rounded-full border-2 border-white shadow-md flex items-center justify-center text-white animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-alarm-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createDriverIcon = (heading?: number | null) => {
  const rotationStyle = heading != null ? `transform: rotate(${Math.round(heading)}deg);` : '';
  const html = `
    <div class="relative flex flex-col items-center justify-center -mt-5 -ml-5">
      <!-- Radar Pulse Ring -->
      <div class="absolute w-10 h-10 bg-amber-400/30 rounded-full animate-ping pointer-events-none"></div>
      
      <!-- Core Driver Marker -->
      <div class="relative w-10 h-10 bg-slate-900 text-rq-gold rounded-full border-2 border-rq-gold shadow-xl flex items-center justify-center font-bold">
        ${heading != null ? `
          <div style="${rotationStyle}" class="transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 19 21 12 17 5 21 12 2"/>
            </svg>
          </div>
        ` : `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        `}
      </div>
      
      <!-- Coordinate Tag -->
      <div class="mt-1 px-2 py-0.5 bg-slate-900/90 text-rq-gold font-bold text-[9px] rounded-full shadow-md whitespace-nowrap border border-rq-gold/40 flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        YOU (GPS)
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-driver-gps-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

function formatCardinal(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

function getCompassHeading(degrees?: number | null): string {
  if (degrees == null || isNaN(degrees)) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return `${Math.round(degrees)}° ${directions[index]}`;
}

function MapController({ 
  driverLocation, 
  alarms, 
  isAutoFit = true 
}: { 
  driverLocation: DriverCoordinates | null; 
  alarms: Alarm[]; 
  isAutoFit?: boolean;
}) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isAutoFit) return;

    const bounds = L.latLngBounds([]);
    let hasPoints = false;

    if (driverLocation?.lat && driverLocation?.lng) {
      bounds.extend([driverLocation.lat, driverLocation.lng]);
      hasPoints = true;
    }

    alarms.forEach(alarm => {
      if (alarm.lat && alarm.lng) {
        bounds.extend([alarm.lat, alarm.lng]);
        hasPoints = true;
      }
    });

    if (hasPoints) {
      if (!hasInitialized.current) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        hasInitialized.current = true;
      }
    }
  }, [alarms, driverLocation, map, isAutoFit]);

  return null;
}

function RecenterControl({ position }: { position: [number, number] | null }) {
  const map = useMap();
  if (!position) return null;

  return (
    <div className="leaflet-bottom leaflet-right mb-4 mr-4 pointer-events-auto z-[900]">
      <button
        type="button"
        id="btn-recenter-driver-gps"
        onClick={(e) => {
          e.stopPropagation();
          map.flyTo(position, Math.max(map.getZoom(), 16), { duration: 1.2 });
        }}
        className="bg-white hover:bg-slate-50 text-slate-800 p-2.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        title="Center Map on Current GPS Coordinates"
      >
        <Crosshair size={16} className="text-rq-gold group-hover:rotate-45 transition-transform duration-300" />
        <span className="font-bold text-slate-800 text-[11px]">Center GPS</span>
      </button>
    </div>
  );
}

interface Props {
  alarms: Alarm[];
  driverLocation: DriverCoordinates | null;
  etas?: Record<number, { duration: number, distance: number }>;
  onRefreshGPS?: () => void;
  isRefreshingGPS?: boolean;
}

export default function DriverAlarmMap({ 
  alarms, 
  driverLocation, 
  etas = {},
  onRefreshGPS,
  isRefreshingGPS = false
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [relativeAge, setRelativeAge] = useState<string>('Just now');

  const defaultCenter: [number, number] = [-26.2041, 28.0473]; // Johannesburg fallback
  const center: [number, number] = driverLocation?.lat && driverLocation?.lng 
    ? [driverLocation.lat, driverLocation.lng] 
    : defaultCenter;

  const alarmsWithLocation = alarms.filter(a => a.lat && a.lng);

  // Update relative time since last GPS coordinate fix
  useEffect(() => {
    if (!driverLocation?.timestamp) {
      setRelativeAge('Live');
      return;
    }

    const updateAge = () => {
      const diffSec = Math.floor((Date.now() - driverLocation.timestamp!) / 1000);
      if (diffSec < 5) setRelativeAge('Live Fix');
      else if (diffSec < 60) setRelativeAge(`${diffSec}s ago`);
      else setRelativeAge(`${Math.floor(diffSec / 60)}m ago`);
    };

    updateAge();
    const interval = setInterval(updateAge, 5000);
    return () => clearInterval(interval);
  }, [driverLocation?.timestamp]);

  const handleCopyCoordinates = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!driverLocation?.lat || !driverLocation?.lng) return;

    const textToCopy = `${driverLocation.lat.toFixed(6)}, ${driverLocation.lng.toFixed(6)}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const speedKmh = driverLocation?.speed != null && driverLocation.speed >= 0
    ? Math.round(driverLocation.speed * 3.6)
    : null;

  return (
    <div 
      id="driver-map-container"
      className={`bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 ${
        isExpanded 
          ? 'fixed inset-4 z-[9990] h-[calc(100vh-2rem)] flex flex-col shadow-2xl border-slate-300' 
          : 'relative mb-6 flex flex-col'
      }`}
    >
      {/* Live Coordinates & Telemetry HUD Header */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: GPS Title & Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rq-gold/20 border border-rq-gold/30 flex items-center justify-center text-rq-gold shrink-0">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-white tracking-tight">Driver Live Coordinates</h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  driverLocation?.isFallback 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : driverLocation 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${driverLocation?.isFallback ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                  {driverLocation?.isFallback ? 'Fallback Location' : 'GPS Fix Active'}
                </span>
              </div>

              {/* Coordinates Readout */}
              {driverLocation ? (
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span 
                    id="driver-coordinates-readout"
                    className="font-mono text-xs sm:text-sm font-bold text-rq-gold tracking-wide select-all bg-black/40 px-2 py-0.5 rounded-md border border-rq-gold/20"
                    title="Latitude, Longitude coordinates"
                  >
                    {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    ({formatCardinal(driverLocation.lat, driverLocation.lng)})
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                  Acquiring GPS fix via Geolocation API...
                </p>
              )}
            </div>
          </div>

          {/* Right: Telemetry chips & Quick Action buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
            {driverLocation && (
              <div className="flex items-center gap-1.5 text-[11px]">
                {/* Accuracy */}
                {driverLocation.accuracy != null && (
                  <div 
                    className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                    title={`GPS Accuracy: ±${Math.round(driverLocation.accuracy)} meters`}
                  >
                    <ShieldCheck size={13} className={driverLocation.accuracy < 15 ? "text-emerald-400" : "text-amber-400"} />
                    <span>±{Math.round(driverLocation.accuracy)}m</span>
                  </div>
                )}

                {/* Speed if available */}
                {speedKmh !== null && (
                  <div 
                    className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                    title="Vehicle Speed"
                  >
                    <Gauge size={13} className="text-sky-400" />
                    <span>{speedKmh} km/h</span>
                  </div>
                )}

                {/* Heading / Compass Bearing */}
                {driverLocation.heading != null && (
                  <div 
                    className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                    title="Compass Heading"
                  >
                    <Compass size={13} className="text-amber-400" />
                    <span>{getCompassHeading(driverLocation.heading)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {driverLocation && (
                <button
                  type="button"
                  id="btn-copy-driver-coords"
                  onClick={handleCopyCoordinates}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copied 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white'
                  }`}
                  title="Copy Lat, Lng coordinates to clipboard"
                >
                  {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Coords'}</span>
                </button>
              )}

              {onRefreshGPS && (
                <button
                  type="button"
                  id="btn-refresh-gps-fix"
                  onClick={onRefreshGPS}
                  disabled={isRefreshingGPS}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Request Fresh High-Accuracy GPS Fix"
                >
                  <RefreshCw size={14} className={isRefreshingGPS ? "animate-spin text-rq-gold" : ""} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title={isExpanded ? "Minimize Map" : "Expand Map Fullscreen"}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Leaflet Map View */}
      <div className={`w-full relative z-0 ${isExpanded ? 'flex-1 min-h-[400px]' : 'h-[360px] sm:h-[420px]'}`}>
        <MapContainer 
          center={center} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* GPS Accuracy Radius Circle */}
          {driverLocation?.lat && driverLocation?.lng && driverLocation.accuracy && (
            <Circle
              center={[driverLocation.lat, driverLocation.lng]}
              radius={Math.max(10, Math.min(driverLocation.accuracy, 250))}
              pathOptions={{
                color: '#E2D670',
                fillColor: '#E2D670',
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '4, 4'
              }}
            />
          )}

          <MarkerClusterGroup chunkedLoading>
            {/* Driver GPS Location Marker */}
            {driverLocation?.lat && driverLocation?.lng && (
              <Marker 
                position={[driverLocation.lat, driverLocation.lng]} 
                icon={createDriverIcon(driverLocation.heading)}
              >
                <Popup className="driver-coords-popup">
                  <div className="p-1 min-w-[210px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-2">
                      <Navigation size={14} className="text-rq-gold" />
                      <span>Your Current Location</span>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-2.5 mb-2.5">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">GPS Coordinates</div>
                      <div className="font-mono text-xs font-bold text-rq-gold mt-0.5 select-all">
                        {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-1">
                        {formatCardinal(driverLocation.lat, driverLocation.lng)}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 mb-3">
                      {driverLocation.accuracy != null && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Accuracy:</span>
                          <span className="font-semibold text-slate-800">±{Math.round(driverLocation.accuracy)} meters</span>
                        </div>
                      )}
                      {speedKmh !== null && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Speed:</span>
                          <span className="font-semibold text-slate-800">{speedKmh} km/h</span>
                        </div>
                      )}
                      {driverLocation.altitude != null && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Altitude:</span>
                          <span className="font-semibold text-slate-800">{Math.round(driverLocation.altitude)} m</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fix Age:</span>
                        <span className="font-semibold text-slate-800">{relativeAge}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyCoordinates}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copied ? 'Coordinates Copied' : 'Copy Coordinates'}
                      </button>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${driverLocation.lat},${driverLocation.lng}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                      >
                        <ExternalLink size={12} />
                        Open External Maps
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Alarm Markers */}
            {alarmsWithLocation.map((alarm) => (
              <Marker key={alarm.id} position={[alarm.lat!, alarm.lng!]} icon={createAlarmIcon(alarm.priority)}>
                <Popup>
                  <div className="font-semibold text-slate-900">{alarm.client_name}</div>
                  <div className="text-xs text-slate-500 mt-1">{alarm.address}</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                    {alarm.lat?.toFixed(5)}, {alarm.lng?.toFixed(5)}
                  </div>
                  {etas[alarm.id] && (
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      <Clock size={10} /> ETA: {Math.ceil(etas[alarm.id].duration / 60)} min ({((etas[alarm.id].distance || 0) / 1000).toFixed(1)} km)
                    </div>
                  )}
                  {alarm.vehicle_registration && (
                    <div className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1">
                      <Car size={10} /> {alarm.vehicle_registration}
                    </div>
                  )}
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          {/* Polyline Routes to Alarms */}
          {alarmsWithLocation.map((alarm, index) => {
            const prevLocation = index === 0 && driverLocation?.lat && driverLocation?.lng 
              ? [driverLocation.lat, driverLocation.lng] 
              : index > 0 
                ? [alarmsWithLocation[index - 1].lat!, alarmsWithLocation[index - 1].lng!]
                : null;

            if (!prevLocation) return null;

            const eta = etas[alarm.id];

            return (
              <Polyline 
                key={`route-${alarm.id}`}
                positions={[
                  prevLocation as [number, number],
                  [alarm.lat!, alarm.lng!]
                ]}
                color="#f59e0b"
                weight={3.5}
                dashArray="6, 8"
                opacity={0.85}
              >
                {eta && (
                  <Tooltip permanent direction="top" className="eta-tooltip">
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg shadow-md border border-amber-200">
                      <Clock size={12} className="text-amber-600" />
                      <span className="text-[10px] font-bold text-slate-800">
                        ETA: {Math.ceil(eta.duration / 60)} min
                      </span>
                    </div>
                  </Tooltip>
                )}
              </Polyline>
            );
          })}

          {/* Map Auto Center & Bounds controller */}
          <MapController 
            driverLocation={driverLocation} 
            alarms={alarmsWithLocation} 
          />

          {/* Recenter Button inside Map */}
          <RecenterControl 
            position={driverLocation?.lat && driverLocation?.lng ? [driverLocation.lat, driverLocation.lng] : null} 
          />
        </MapContainer>
      </div>

      {/* Bottom Coordinates Status Footer Bar */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-slate-400" />
          <span>
            {driverLocation ? (
              <>
                <strong className="text-slate-700 font-semibold">Location:</strong>{' '}
                <span className="font-mono text-slate-800">{driverLocation.lat.toFixed(5)}°</span>,{' '}
                <span className="font-mono text-slate-800">{driverLocation.lng.toFixed(5)}°</span>
              </>
            ) : (
              'Awaiting GPS lock...'
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {alarmsWithLocation.length > 0 && (
            <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {alarmsWithLocation.length} Active Target{alarmsWithLocation.length > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-slate-400">
            {relativeAge === 'Live Fix' ? '⚡ Live Geolocation Stream' : `Fix updated: ${relativeAge}`}
          </span>
        </div>
      </div>
    </div>
  );
}
