'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Vehicle } from '@/types';

// Fix для стандартных иконок leaflet, если где-то используются
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createVehicleIcon = (isSelected: boolean) => {
    return L.divIcon({
        className: 'custom-vehicle-icon',
        html: `<div style="
            background-color: ${isSelected ? '#dc2626' : '#2563eb'}; 
            width: 22px; 
            height: 22px; 
            border-radius: 50%; 
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.8);
            opacity: 1 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        ">
            ${isSelected ? '<div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>' : ''}
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -11]
    });
};

interface MapProps {
    vehicles: Vehicle[];
    selectedVehicleId: number | null;
    onVehicleSelect: (id: string | null) => void;
    activeRoute?: [number, number][];
    simulatedPosition?: { vehicleId: number; lat: number; lon: number } | null;
}

// Контроллер событий: зум и клик по пустому месту
function MapEventsController({ onMapClick }: { onMapClick: () => void }) {
    useMapEvents({
        click: () => {
            onMapClick(); // Сбрасываем фокус при клике на пустое место (Проблема 12)
        }
    });
    return null;
}

function MapCameraController({ 
    vehicles, 
    selectedVehicleId, 
    activeRoute,
    simulatedPosition
}: { 
    vehicles: Vehicle[], 
    selectedVehicleId: number | null, 
    activeRoute?: [number, number][],
    simulatedPosition?: { vehicleId: number; lat: number; lon: number } | null
}) {
    const map = useMap();
    const [isCameraLocked, setIsCameraLocked] = useState(false);
    const [lastSelected, setLastSelected] = useState<number | null>(null);

    useEffect(() => {
        if (activeRoute && activeRoute.length > 0) {
            setIsCameraLocked(false); 
            const bounds = L.latLngBounds(activeRoute);
            map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.0 });
        }
    }, [activeRoute, map]);

    useEffect(() => {
        if (selectedVehicleId !== lastSelected) {
            setLastSelected(selectedVehicleId);
            
            if (selectedVehicleId && (!activeRoute || activeRoute.length === 0)) {
                setIsCameraLocked(true); 
                const v = vehicles.find(v => v.id === selectedVehicleId);
                const lat = simulatedPosition?.vehicleId === selectedVehicleId ? simulatedPosition.lat : v?.lastLatitude;
                const lon = simulatedPosition?.vehicleId === selectedVehicleId ? simulatedPosition.lon : v?.lastLongitude;
                
                if (lat && lon) {
                    map.flyTo([lat, lon], 14, { duration: 1.0 });
                }
            } else if (!selectedVehicleId && (!activeRoute || activeRoute.length === 0)) {
                setIsCameraLocked(false);
                const validCoords = vehicles.filter(v => v.lastLatitude && v.lastLongitude)
                                            .map(v => [v.lastLatitude!, v.lastLongitude!] as [number, number]);
                if (validCoords.length > 0) {
                    map.flyToBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 14, duration: 1.0 });
                }
            }
        }
    }, [selectedVehicleId, lastSelected, map, vehicles, activeRoute, simulatedPosition]);

    useEffect(() => {
        if (isCameraLocked && selectedVehicleId && (!activeRoute || activeRoute.length === 0)) {
            const v = vehicles.find(v => v.id === selectedVehicleId);
            const lat = simulatedPosition?.vehicleId === selectedVehicleId ? simulatedPosition.lat : v?.lastLatitude;
            const lon = simulatedPosition?.vehicleId === selectedVehicleId ? simulatedPosition.lon : v?.lastLongitude;
            
            if (lat && lon) {
                map.setView([lat, lon], map.getZoom(), { animate: false });
            }
        }
    }, [vehicles, isCameraLocked, selectedVehicleId, map, activeRoute, simulatedPosition]);

    useEffect(() => {
        const disableLock = () => setIsCameraLocked(false);
        map.on('dragstart', disableLock);
        map.on('zoomstart', disableLock);
        return () => {
            map.off('dragstart', disableLock);
            map.off('zoomstart', disableLock);
        };
    }, [map]);

    return null;
}

export default function MapComponent({ vehicles, selectedVehicleId, onVehicleSelect, activeRoute, simulatedPosition }: MapProps) {
    const [mapKey, setMapKey] = useState<string>('');

    useEffect(() => {
        // Генерируем уникальный ключ при монтировании на клиенте
        setMapKey(Date.now().toString());
    }, []);

    // Ждем монтирования
    if (!mapKey || typeof window === 'undefined') {
        return <div className="h-full w-full bg-muted/20 animate-pulse flex items-center justify-center rounded-md border">Загрузка карты автопарка...</div>;
    }

    return (
        <MapContainer key={`main-map-${mapKey}`} center={[53.9045, 27.5615]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            
            <MapEventsController onMapClick={() => onVehicleSelect(null)} />

            <MapCameraController 
                vehicles={vehicles} 
                selectedVehicleId={selectedVehicleId} 
                activeRoute={activeRoute}
                simulatedPosition={simulatedPosition}
            />

            {activeRoute && activeRoute.length > 0 && (
                <Polyline positions={activeRoute} color="#3b82f6" weight={6} opacity={0.8} />
            )}

            {vehicles.map(vehicle => {
                const isSimulatingThis = simulatedPosition?.vehicleId === vehicle.id;
                const lat = isSimulatingThis ? simulatedPosition.lat : vehicle.lastLatitude;
                const lon = isSimulatingThis ? simulatedPosition.lon : vehicle.lastLongitude;

                if (!lat || !lon) return null;
                
                const isSelected = selectedVehicleId === vehicle.id;

                return (
                    <Marker 
                        key={`marker-${vehicle.id}`} 
                        position={[lat, lon]} 
                        icon={createVehicleIcon(isSelected)}
                        zIndexOffset={isSelected ? 1000 : 0}
                        eventHandlers={{ 
                            click: (e) => {
                                L.DomEvent.stopPropagation(e);
                                onVehicleSelect(vehicle.id.toString());
                            } 
                        }}
                    >
                        <Popup>
                            <div className="font-bold text-lg">{vehicle.plateNumber}</div>
                            <div className="text-sm text-gray-600">{vehicle.model}</div>
                            <div className="text-blue-600 font-semibold mt-2 flex items-center">
                                💧 Бак: {vehicle.currentFuelLevel?.toFixed(1) || 0} л.
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Кликни, чтобы камера следила</div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

export function PickerMap({ onLocationSelect, destLat, destLon }: { onLocationSelect: (lat: number, lng: number) => void, destLat: number | '', destLon: number | '' }) {
    const [mapKey, setMapKey] = useState<string>('');

    useEffect(() => {
        setMapKey(Date.now().toString());
    }, []);

    function Events() {
        useMapEvents({
            click(e) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    }

    if (!mapKey || typeof window === 'undefined') {
        return <div className="h-full w-full bg-muted/20 animate-pulse flex items-center justify-center rounded-md border">Загрузка мини-карты...</div>;
    }

    return (
        <MapContainer key={`picker-map-${mapKey}`} center={[53.9045, 27.5615]} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Events />
            {destLat !== '' && destLon !== '' && (
                <Marker position={[Number(destLat), Number(destLon)]} />
            )}
        </MapContainer>
    );
}