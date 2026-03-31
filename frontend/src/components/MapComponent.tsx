'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Vehicle } from '@/types';

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
    activeRoute?: [number, number][];
}

// Компонент умного управления камерой
function MapCameraController({ 
    vehicles, 
    selectedVehicleId, 
    activeRoute 
}: { 
    vehicles: Vehicle[], 
    selectedVehicleId: number | null, 
    activeRoute?: [number, number][] 
}) {
    const map = useMap();
    const [isCameraLocked, setIsCameraLocked] = useState(false);
    const [lastSelected, setLastSelected] = useState<number | null>(null);

    // 0. Высший приоритет: Отдаление на весь маршрут при старте симуляции
    useEffect(() => {
        if (activeRoute && activeRoute.length > 0) {
            setIsCameraLocked(false); // Отключаем слежение за фурой, чтобы видеть весь путь
            const bounds = L.latLngBounds(activeRoute);
            // Приближаем карту так, чтобы весь маршрут влез в экран с небольшими отступами
            map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.0 });
        }
    }, [activeRoute, map]);

    // 1. Первичное центрирование при выборе машины
    useEffect(() => {
        if (selectedVehicleId !== lastSelected) {
            setLastSelected(selectedVehicleId);
            
            // Центрируемся на машине ТОЛЬКО если сейчас нет активного маршрута симуляции
            if (selectedVehicleId && (!activeRoute || activeRoute.length === 0)) {
                setIsCameraLocked(true); // Включаем слежение
                const v = vehicles.find(v => v.id === selectedVehicleId);
                if (v && v.lastLatitude && v.lastLongitude) {
                    map.flyTo([v.lastLatitude, v.lastLongitude], 14, { duration: 1.0 });
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
    }, [selectedVehicleId, lastSelected, map, vehicles, activeRoute]);

    // 2. Плавное слежение за едущей машиной (без рывков)
    useEffect(() => {
        // Следим только если камера заблокирована на машине И нет активного маршрута
        if (isCameraLocked && selectedVehicleId && (!activeRoute || activeRoute.length === 0)) {
            const v = vehicles.find(v => v.id === selectedVehicleId);
            if (v && v.lastLatitude && v.lastLongitude) {
                // setView с animate: false идеально синхронизируется с частой анимацией фуры
                map.setView([v.lastLatitude, v.lastLongitude], map.getZoom(), { animate: false });
            }
        }
    }, [vehicles, isCameraLocked, selectedVehicleId, map, activeRoute]);

    // 3. Отключение слежения, если пользователь сам двигает/зумит карту
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

export default function MapComponent({ vehicles, selectedVehicleId, onVehicleSelect, activeRoute }: MapProps) {
    return (
        <MapContainer center={[53.9045, 27.5615]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            
            {/* Контроллер камеры, куда теперь передается активный маршрут */}
            <MapCameraController 
                vehicles={vehicles} 
                selectedVehicleId={selectedVehicleId} 
                activeRoute={activeRoute} 
            />

            {/* Отрисовка линии маршрута */}
            {activeRoute && activeRoute.length > 0 && (
                <Polyline positions={activeRoute} color="#3b82f6" weight={5} opacity={0.7} />
            )}
            
            {/* Отрисовка маркеров машин */}
            {vehicles.map(vehicle => {
                if (!vehicle.lastLatitude || !vehicle.lastLongitude) return null;
                
                return (
                    <Marker 
                        key={vehicle.id} 
                        position={[vehicle.lastLatitude, vehicle.lastLongitude]} 
                        icon={truckIcon}
                        eventHandlers={{ click: () => onVehicleSelect(vehicle.id.toString()) }}
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