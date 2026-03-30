'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Vehicle } from '@/types';

// Кастомная иконка грузовика
const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/664/664468.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
});

interface MapProps {
    vehicles: Vehicle[];
    selectedVehicleId: number | null;
    onVehicleSelect: (id: string) => void;
    activeRoute?: [number, number][]; // Координаты [lat, lon] для отрисовки пути
}

// Умный контроллер камеры
function MapCameraController({ vehicles, selectedVehicleId }: { vehicles: Vehicle[], selectedVehicleId: number | null }) {
    const map = useMap();

    useEffect(() => {
        if (selectedVehicleId) {
            const v = vehicles.find(v => v.id === selectedVehicleId);
            if (v && v.lastLatitude && v.lastLongitude) {
                // Если машина выбрана - летим к ней
                map.flyTo([v.lastLatitude, v.lastLongitude], 14, { duration: 1.5 });
            }
        } else {
            // Если выбран "Обзор парка" - отдаляем камеру, чтобы вместить все маркеры
            const validCoords = vehicles
                .filter(v => v.lastLatitude && v.lastLongitude)
                .map(v => [v.lastLatitude!, v.lastLongitude!] as [number, number]);

            if (validCoords.length > 0) {
                const bounds = L.latLngBounds(validCoords);
                map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1.5 });
            } else {
                map.flyTo([53.9045, 27.5615], 10);
            }
        }
    }, [selectedVehicleId, vehicles, map]);

    return null;
}

export default function MapComponent({ vehicles, selectedVehicleId, onVehicleSelect, activeRoute }: MapProps) {
    return (
        <MapContainer center={[53.9045, 27.5615]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            
            <MapCameraController vehicles={vehicles} selectedVehicleId={selectedVehicleId} />

            {/* Отрисовка синей линии маршрута, если есть активная симуляция */}
            {activeRoute && activeRoute.length > 0 && (
                <Polyline positions={activeRoute} color="#3b82f6" weight={5} opacity={0.7} />
            )}
            
            {vehicles.map(vehicle => {
                if (!vehicle.lastLatitude || !vehicle.lastLongitude) return null;
                
                return (
                    <Marker 
                        key={vehicle.id} 
                        position={[vehicle.lastLatitude, vehicle.lastLongitude]} 
                        icon={truckIcon}
                        eventHandlers={{
                            click: () => onVehicleSelect(vehicle.id.toString()) // Клик на маркер выбирает ТС
                        }}
                    >
                        <Popup>
                            <div className="font-bold text-lg">{vehicle.plateNumber}</div>
                            <div className="text-sm text-gray-600">{vehicle.model}</div>
                            <div className="text-blue-600 font-semibold mt-2 flex items-center">
                                💧 Бак: {vehicle.currentFuelLevel?.toFixed(1) || 0} л.
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}