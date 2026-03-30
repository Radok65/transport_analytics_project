'use client';

import { useState, useEffect, useMemo, FormEvent, JSX } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ==========================================
// ИМПОРТЫ UI-КОМПОНЕНТОВ (SHADCN)
// ==========================================
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// ==========================================
// ИКОНКИ
// ==========================================
import {
    MoreHorizontal,
    PlusCircle,
    FileDown,
    Wrench,
    Map as MapIcon,
    FileText,
    UserPlus,
    UserCheck,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Droplet,
    Activity,
    MapPin,
    AlertTriangle,
    FastForward,
    Navigation,
    Cloud,
    Sun,
    CloudRain,
    Snowflake,
} from 'lucide-react';

// ==========================================
// БИБЛИОТЕКИ И PDF
// ==========================================
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import axios from 'axios';
import { DashboardCharts } from '@/components/DashboardCharts';
import VehicleMap from '@/components/VehicleMap';
import { TelematicsAlertDto } from '@/types';

pdfMake.vfs = pdfFonts.vfs;
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
    },
};

const MotionTableRow = motion(TableRow);

const FUEL_PRICE_PER_LITER = 2.57;

// ==========================================
// ЛОГИСТИЧЕСКИЕ ТОЧКИ ДЛЯ OSRM
// ==========================================
const DESTINATIONS = [
    { name: 'ТЛЦ "Колядичи" (Минск-Юг)', lat: 53.8055, lon: 27.5615 },
    { name: 'ТЛЦ "Прилесье" (Минск-Восток)', lat: 53.8105, lon: 27.7942 },
    { name: 'Таможня "Минск-2" (Аэропорт)', lat: 53.8967, lon: 28.0333 },
    { name: 'Брест (ПТЦ "Козловичи")', lat: 52.1250, lon: 23.6800 },
    { name: 'Гомель (СЭЗ)', lat: 52.4345, lon: 30.9754 },
    { name: 'Гродно (Брузги)', lat: 53.6236, lon: 23.6644 },
];

// ==========================================
// ИНТЕРФЕЙСЫ
// ==========================================
export interface Repair {
    id: number;
    date: string;
    description: string;
    cost: number;
}

export interface Trip {
    id: number;
    date: string;
    driverId: number;
    mileageStart: number;
    mileageEnd: number;
    fuelUsed: number;
}

export interface Driver {
    id: number;
    fullName: string;
    contact: string;
    assignedVehicleId: number | null;
}

export interface Vehicle {
    id: number;
    plateNumber: string;
    model: string;
    year: number;
    fuelNorm: number;
    currentFuelLevel?: number;
    lastLatitude?: number;
    lastLongitude?: number;
    repairs: Repair[];
    trips: Trip[];
}

type ModalType =
    | 'add-trip'
    | 'simulate-trip'
    | 'refuel'
    | 'add-vehicle'
    | 'edit-vehicle'
    | 'add-driver'
    | 'edit-driver'
    | 'add-repair'
    | 'assign-driver'
    | 'detailed-report'
    | 'delete-vehicle'
    | 'delete-driver';

type ModalData = Vehicle | Driver | null;

export interface VehiclePerformancePoint {
    plateNumber: string;
    totalMileage: number;
    costPerKm: number;
}

export interface TripEfficiencyPoint {
    date: string;
    consumptionPer100Km: number;
}

export interface AnalyticsData {
    top5VehiclesByMileage: Record<string, number>;
    totalFuelCost: number;
    totalRepairCost: number;
    fleetPerformanceMatrix: VehiclePerformancePoint[];
    vehicleEfficiencyTrend: TripEfficiencyPoint[];
    vehicleFuelCost: number;
    vehicleRepairCost: number;
}

// ==========================================
// УТИЛИТЫ
// ==========================================
const SortIndicator = ({ order }: { order: 'asc' | 'desc' | 'none' }) => {
    if (order === 'asc') return <ArrowUp className="inline ml-2 h-4 w-4" />;
    if (order === 'desc') return <ArrowDown className="inline ml-2 h-4 w-4" />;
    return <ArrowUpDown className="inline ml-2 h-4 w-4 text-muted-foreground/50" />;
};

const calcDistance = (p1: [number, number], p2: [number, number]) => {
    const R = 6371;
    const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
    const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1[0] * Math.PI) / 180) *
            Math.cos((p2[0] * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ
// ==========================================
export default function DashboardPage() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [alerts, setAlerts] = useState<TelematicsAlertDto[]>([]);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

    const [modalState, setModalState] = useState<{
        type: ModalType | null;
        data?: ModalData;
    }>({ type: null });

    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [tripSortOrder, setTripSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

    const [activeSimulations, setActiveSimulations] = useState<Set<number>>(new Set());
    
    const [simulateTripData, setSimulateTripData] = useState({
        vehicleId: '',
        destinationIdx: '0',
    });
    
    const [refuelData, setRefuelData] = useState({
        vehicleId: '',
        amount: '',
    });
    
    const [activeRouteCoords, setActiveRouteCoords] = useState<[number, number][]>([]);
    
    const [liveStats, setLiveStats] = useState<
        Record<number, { mileageAdded: number; fuelUsedAdded: number }>
    >({});

    const [weatherData, setWeatherData] = useState<{
        temp: number;
        description: string;
        icon: JSX.Element;
    } | null>(null);

    const [tripFormData, setTripFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        driverId: '',
        vehicleId: '',
        mileageStart: '',
        mileageEnd: '',
        fuelUsed: '',
    });

    // --- ЗАГРУЗКА ДАННЫХ ---
    const fetchData = async () => {
        try {
            const [vehiclesRes, driversRes, alertsRes] = await Promise.all([
                axios.get<Vehicle[]>('http://localhost:8080/api/vehicles'),
                axios.get<Driver[]>('http://localhost:8080/api/drivers'),
                axios.get<TelematicsAlertDto[]>('http://localhost:8080/api/telematics/alerts'),
            ]);

            setVehicles(vehiclesRes.data);
            setDrivers(driversRes.data);
            setAlerts(alertsRes.data);

            if (vehiclesRes.data.length === 0) {
                setSelectedVehicleId(null);
            }

            const url = selectedVehicleId
                ? `http://localhost:8080/api/analytics?vehicleId=${selectedVehicleId}`
                : 'http://localhost:8080/api/analytics';

            const analyticsRes = await axios.get<AnalyticsData>(url);
            setAnalyticsData(analyticsRes.data);

        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        if (user) {
            setIsDataLoading(true);
            fetchData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, selectedVehicleId]);

    // Фоновое обновление
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (user && isMounted && activeSimulations.size === 0) {
            interval = setInterval(() => {
                fetchData();
            }, 5000);
        }
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isMounted, activeSimulations]);

    const selectedVehicle = useMemo(() => {
        return vehicles.find((v) => v.id.toString() === selectedVehicleId);
    }, [vehicles, selectedVehicleId]);

    // --- ПОГОДА ЧЕРЕЗ OPEN-METEO (Бесплатно, без ключей) ---
    useEffect(() => {
        const fetchWeather = async () => {
            if (!selectedVehicle?.lastLatitude || !selectedVehicle?.lastLongitude) return;
            try {
                const res = await axios.get(
                    `https://api.open-meteo.com/v1/forecast?latitude=${selectedVehicle.lastLatitude}&longitude=${selectedVehicle.lastLongitude}&current_weather=true`
                );
                const weather = res.data.current_weather;
                let icon = <Sun className="h-5 w-5 text-yellow-500" />;
                let desc = "Ясно";
                
                if (weather.weathercode >= 1 && weather.weathercode <= 3) {
                    icon = <Cloud className="h-5 w-5 text-gray-400" />;
                    desc = "Облачно";
                } else if (weather.weathercode >= 51 && weather.weathercode <= 65) {
                    icon = <CloudRain className="h-5 w-5 text-blue-400" />;
                    desc = "Дождь";
                } else if (weather.weathercode >= 71) {
                    icon = <Snowflake className="h-5 w-5 text-blue-200" />;
                    desc = "Снег/Холодно";
                }

                setWeatherData({ temp: weather.temperature, description: desc, icon });
            } catch (error) {
                console.error("Ошибка загрузки погоды", error);
            }
        };
        
        fetchWeather();
    }, [selectedVehicle?.lastLatitude, selectedVehicle?.lastLongitude]);


    // --- ОБРАБОТЧИКИ ТЕЛЕМАТИКИ ---
    const handleSimulateDrain = async (vehicleId: number) => {
        try {
            const vehicle = vehicles.find((v) => v.id === vehicleId);
            if (!vehicle) return;

            const fakeData = {
                vehicleId: vehicle.id,
                latitude: vehicle.lastLatitude || 53.9045,
                longitude: vehicle.lastLongitude || 27.5615,
                speed: 0,
                fuelLevel: Math.max(0, (vehicle.currentFuelLevel || 50) - 15),
            };

            await axios.post('http://localhost:8080/api/telematics/data', fakeData);
            await fetchData();
        } catch (error) {
            console.error('Ошибка имитации слива:', error);
        }
    };

    const handleSimulateSpeeding = async (vehicleId: number) => {
        try {
            const vehicle = vehicles.find((v) => v.id === vehicleId);
            if (!vehicle) return;

            const fakeData = {
                vehicleId: vehicle.id,
                latitude: (vehicle.lastLatitude || 53.9045) + 0.005,
                longitude: vehicle.lastLongitude || 27.5615,
                speed: 110,
                fuelLevel: vehicle.currentFuelLevel || 50,
            };

            await axios.post('http://localhost:8080/api/telematics/data', fakeData);
            await fetchData();
        } catch (error) {
            console.error('Ошибка имитации скорости:', error);
        }
    };

    const handleRefuelSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const vehicle = vehicles.find((v) => v.id === Number(refuelData.vehicleId));
        if (!vehicle) return;

        const newFuel = (vehicle.currentFuelLevel || 0) + Number(refuelData.amount);

        try {
            await axios.post('http://localhost:8080/api/telematics/data', {
                vehicleId: vehicle.id,
                latitude: vehicle.lastLatitude || 53.9045,
                longitude: vehicle.lastLongitude || 27.5615,
                speed: 0,
                fuelLevel: newFuel,
            });
            await fetchData();
            setModalState({ type: null });
            setRefuelData({ vehicleId: '', amount: '' });
        } catch (error) {
            alert('Ошибка при заправке ТС');
        }
    };

    // --- ПЛАВНАЯ И ЗАМЕДЛЕННАЯ СИМУЛЯЦИЯ OSRM ---
    const startTripSimulation = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const vehicle = vehicles.find((v) => v.id === Number(simulateTripData.vehicleId));
        const dest = DESTINATIONS[Number(simulateTripData.destinationIdx)];
        if (!vehicle || !dest) return;

        const startLat = vehicle.lastLatitude || 53.9045;
        const startLon = vehicle.lastLongitude || 27.5615;

        // Jitter (Шум), чтобы машины не слипались по приезду
        const jitterLat = dest.lat + (Math.random() - 0.5) * 0.0015;
        const jitterLon = dest.lon + (Math.random() - 0.5) * 0.0015;

        setModalState({ type: null });
        setActiveSimulations((prev) => new Set(prev).add(vehicle.id));
        setSelectedVehicleId(String(vehicle.id)); 

        let pathPoints: [number, number][] = [];
        let actualDistanceKm = 0;
        
        // 800 кадров для долгой, медленной и плавной поездки (хватит времени посмотреть)
        const SIMULATION_FRAMES = 800; 

        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${jitterLon},${jitterLat}?overview=full&geometries=geojson`
            );
            
            if (!response.ok) {
                throw new Error(`OSRM Network response was not ok: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.routes || data.routes.length === 0) {
                 throw new Error("OSRM returned no routes");
            }
            
            const rawCoords = data.routes[0].geometry.coordinates;
            actualDistanceKm = data.routes[0].distance / 1000;

            const routePoints = rawCoords.map((c: any) => [c[1], c[0]] as [number, number]);
            setActiveRouteCoords(routePoints);

            const segments = [];
            let totalDist = 0;
            for (let i = 0; i < routePoints.length - 1; i++) {
                const d = calcDistance(routePoints[i], routePoints[i + 1]);
                if (d > 0.0001) {
                    segments.push({ start: routePoints[i], end: routePoints[i + 1], dist: d });
                    totalDist += d;
                }
            }

            const stepDist = totalDist / SIMULATION_FRAMES;
            pathPoints.push(routePoints[0]);

            for (let i = 1; i < SIMULATION_FRAMES; i++) {
                const targetDist = i * stepDist;
                let currentDist = 0;
                let found = false;
                for (let j = 0; j < segments.length; j++) {
                    if (currentDist + segments[j].dist >= targetDist) {
                        const ratio = (targetDist - currentDist) / segments[j].dist;
                        const lat =
                            segments[j].start[0] +
                            (segments[j].end[0] - segments[j].start[0]) * ratio;
                        const lon =
                            segments[j].start[1] +
                            (segments[j].end[1] - segments[j].start[1]) * ratio;
                        pathPoints.push([lat, lon]);
                        found = true;
                        break;
                    }
                    currentDist += segments[j].dist;
                }
                if (!found) pathPoints.push(routePoints[routePoints.length - 1]);
            }
            pathPoints.push(routePoints[routePoints.length - 1]);
            
        } catch (err) {
            console.error('Ошибка OSRM API. Движение по прямой:', err);
            
            actualDistanceKm = calcDistance([startLat, startLon], [jitterLat, jitterLon]) * 1.25;
            const stepLat = (jitterLat - startLat) / SIMULATION_FRAMES;
            const stepLon = (jitterLon - startLon) / SIMULATION_FRAMES;
            
            pathPoints.push([startLat, startLon]);
            for (let i = 1; i <= SIMULATION_FRAMES; i++) {
                pathPoints.push([startLat + stepLat * i, startLon + stepLon * i]);
            }
            setActiveRouteCoords(pathPoints);
        }

        const fuelNeeded = (actualDistanceKm / 100) * vehicle.fuelNorm;

        if ((vehicle.currentFuelLevel || 0) < fuelNeeded) {
            alert(
                `Недостаточно топлива!\nЕхать: ~${actualDistanceKm.toFixed(
                    0
                )} км.\nНужно: ${fuelNeeded.toFixed(1)} л.\nВ баке: ${(
                    vehicle.currentFuelLevel || 0
                ).toFixed(1)} л.`
            );
            setActiveSimulations((prev) => {
                const n = new Set(prev);
                n.delete(vehicle.id);
                return n;
            });
            setActiveRouteCoords([]);
            return;
        }

        const stepFuel = fuelNeeded / SIMULATION_FRAMES;
        const stepActualDist = actualDistanceKm / SIMULATION_FRAMES;
        
        let currentFuel = vehicle.currentFuelLevel || 0;
        let liveDist = 0;
        let liveFuelUsed = 0;

        for (let i = 1; i <= SIMULATION_FRAMES; i++) {
            const [lat, lon] = pathPoints[i] || pathPoints[pathPoints.length - 1];
            currentFuel -= stepFuel;
            liveDist += stepActualDist;
            liveFuelUsed += stepFuel;

            setVehicles((prev) =>
                prev.map((v) =>
                    v.id === vehicle.id
                        ? {
                              ...v,
                              lastLatitude: lat,
                              lastLongitude: lon,
                              currentFuelLevel: currentFuel,
                          }
                        : v
                )
            );

            setLiveStats((prev) => ({
                ...prev,
                [vehicle.id]: { mileageAdded: liveDist, fuelUsedAdded: liveFuelUsed },
            }));

            // Отправляем данные на бэкенд (реже, чтобы не перегружать)
            if (i % 40 === 0 || i === SIMULATION_FRAMES) {
                try {
                    await axios.post('http://localhost:8080/api/telematics/data', {
                        vehicleId: vehicle.id,
                        latitude: lat,
                        longitude: lon,
                        speed: 85,
                        fuelLevel: currentFuel,
                    });
                } catch (err) {
                    // Игнорируем сетевые ошибки симуляции
                }
            }

            // Задержка 40мс для плавности
            await new Promise((resolve) => setTimeout(resolve, 40)); 
        }

        // Финал поездки
        try {
            const driver = drivers.find((d) => d.assignedVehicleId === vehicle.id);
            const lastMileage =
                vehicle.trips.length > 0 ? Math.max(...vehicle.trips.map((t) => t.mileageEnd)) : 0;
                
            await axios.post(`http://localhost:8080/api/vehicles/${vehicle.id}/trips`, {
                date: new Date().toISOString().split('T')[0],
                driverId: driver ? driver.id : null,
                mileageStart: lastMileage,
                mileageEnd: lastMileage + actualDistanceKm,
                fuelUsed: fuelNeeded,
            });
            await fetchData();
            
            // УВЕДОМЛЕНИЕ О ПРИБЫТИИ
            alert(`✅ Рейс успешно завершен!\nТягач ${vehicle.plateNumber} прибыл в пункт: ${dest.name}.`);
            
        } catch (err) {
            console.error('Ошибка создания путевого листа при завершении симуляции', err);
        }

        setActiveSimulations((prev) => {
            const n = new Set(prev);
            n.delete(vehicle.id);
            return n;
        });
        setActiveRouteCoords([]);
        setLiveStats((prev) => {
            const s = { ...prev };
            delete s[vehicle.id];
            return s;
        });
    };

    // Защита маршрута
    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push('/');
        }
    }, [user, isAuthLoading, router]);

    // --- ВЫЧИСЛЕНИЕ ОБЩИХ МЕТРИК ---
    const { mileageThisMonth, totalFleetMileage, totalFleetCost } = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let mileageThisMonth = 0;
        let totalFleetMileage = 0;
        let baseCost = 0;

        vehicles.forEach((vehicle) => {
            const monthTrips = vehicle.trips.filter((trip) => {
                const tripDate = new Date(trip.date);
                return (
                    tripDate.getMonth() === currentMonth &&
                    tripDate.getFullYear() === currentYear
                );
            });
            mileageThisMonth += monthTrips.reduce(
                (sum, trip) => sum + (trip.mileageEnd - trip.mileageStart),
                0
            );

            const maxMileage =
                vehicle.trips.length > 0 ? Math.max(...vehicle.trips.map((t) => t.mileageEnd)) : 0;
            const liveMileage = liveStats[vehicle.id]?.mileageAdded || 0;
            totalFleetMileage += maxMileage + liveMileage;

            const repairsCost = vehicle.repairs.reduce((sum, r) => sum + r.cost, 0);
            const fuelCost =
                vehicle.trips.reduce((sum, t) => sum + t.fuelUsed, 0) * FUEL_PRICE_PER_LITER;
            const liveFuelCost =
                (liveStats[vehicle.id]?.fuelUsedAdded || 0) * FUEL_PRICE_PER_LITER;

            baseCost += repairsCost + fuelCost + liveFuelCost;
        });

        const telematicsLoss = alerts.reduce(
            (sum, alert) => sum + (Number(alert.financialLoss) || 0),
            0
        );
        
        return {
            mileageThisMonth,
            totalFleetMileage,
            totalFleetCost: baseCost + telematicsLoss,
        };
    }, [vehicles, alerts, liveStats]);

    // --- ВЫЧИСЛЕНИЕ МЕТРИК ВЫБРАННОГО ТС ---
    const {
        totalMileage,
        costPerKm,
        avgFuelConsumption,
        fuelNormDeviation,
        currentDriver,
        longestTrip,
        avgTripDistance,
        sortedTrips,
    } = useMemo(() => {
        if (!selectedVehicle) {
            return {
                totalMileage: 0,
                costPerKm: '0.00',
                avgFuelConsumption: '0.0',
                fuelNormDeviation: 0,
                currentDriver: undefined,
                longestTrip: 0,
                avgTripDistance: 0,
                sortedTrips: [],
            };
        }

        const vLiveStats = liveStats[selectedVehicle.id] || { mileageAdded: 0, fuelUsedAdded: 0 };
        const totalRepairCost = selectedVehicle.repairs.reduce((sum, r) => sum + r.cost, 0);
        const totalDistance =
            selectedVehicle.trips.reduce((sum, t) => sum + (t.mileageEnd - t.mileageStart), 0) +
            vLiveStats.mileageAdded;
        const totalFuelUsed =
            selectedVehicle.trips.reduce((sum, t) => sum + t.fuelUsed, 0) +
            vLiveStats.fuelUsedAdded;

        const telematicsLossForVehicle = alerts
            .filter((a) => a.vehicleId === selectedVehicle.id)
            .reduce((sum, a) => sum + (Number(a.financialLoss) || 0), 0);
            
        const totalFuelCost = totalFuelUsed * FUEL_PRICE_PER_LITER;

        const costPerKm =
            totalDistance > 0
                ? ((totalRepairCost + totalFuelCost + telematicsLossForVehicle) / totalDistance).toFixed(2)
                : '0.00';
                
        const dbMileage =
            selectedVehicle.trips.length > 0
                ? Math.max(...selectedVehicle.trips.map((t) => t.mileageEnd))
                : 0;
        const totalMileage = dbMileage + vLiveStats.mileageAdded;
        const avgFuelConsumption =
            totalDistance > 0 ? ((totalFuelUsed / totalDistance) * 100).toFixed(1) : '0.0';
        const fuelNormDeviation =
            selectedVehicle.fuelNorm > 0
                ? ((parseFloat(avgFuelConsumption) / selectedVehicle.fuelNorm) - 1) * 100
                : 0;

        const currentDriver = drivers.find((d) => d.assignedVehicleId === selectedVehicle.id);
        const longestTrip =
            selectedVehicle.trips.length > 0
                ? Math.max(...selectedVehicle.trips.map((t) => t.mileageEnd - t.mileageStart))
                : 0;
        const avgTripDistance =
            selectedVehicle.trips.length > 0 ? totalDistance / selectedVehicle.trips.length : 0;
            
        const sorted = [...selectedVehicle.trips].sort((a, b) => {
            if (tripSortOrder === 'none') return 0;
            const dA = a.mileageEnd - a.mileageStart;
            const dB = b.mileageEnd - b.mileageStart;
            return tripSortOrder === 'asc' ? dA - dB : dB - dA;
        });

        return {
            totalMileage,
            costPerKm,
            avgFuelConsumption,
            fuelNormDeviation,
            currentDriver,
            longestTrip,
            avgTripDistance,
            sortedTrips: sorted,
        };
    }, [selectedVehicle, drivers, tripSortOrder, alerts, liveStats]);

    // --- ОБРАБОТЧИКИ UI ---
    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleTripSort = () => {
        setTripSortOrder((prev) =>
            prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none'
        );
    };

    const handleTripVehicleChange = (vId: string) => {
        const v = vehicles.find((v) => v.id.toString() === vId);
        if (!v) return;
        const dr = drivers.find((d) => d.assignedVehicleId === v.id);
        const m = v.trips.length > 0 ? Math.max(...v.trips.map((t) => t.mileageEnd)) : 0;
        setTripFormData((prev) => ({
            ...prev,
            vehicleId: vId,
            driverId: dr ? String(dr.id) : '',
            mileageStart: String(m),
        }));
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const vals = Object.fromEntries(fd.entries());
        try {
            switch (modalState.type) {
                case 'add-trip':
                    await axios.post(
                        `http://localhost:8080/api/vehicles/${tripFormData.vehicleId}/trips`,
                        {
                            ...tripFormData,
                            mileageStart: Number(tripFormData.mileageStart),
                            mileageEnd: Number(tripFormData.mileageEnd),
                            fuelUsed: Number(tripFormData.fuelUsed),
                        }
                    );
                    setTripFormData({
                        date: new Date().toISOString().split('T')[0],
                        driverId: '',
                        vehicleId: '',
                        mileageStart: '',
                        mileageEnd: '',
                        fuelUsed: '',
                    });
                    break;
                case 'add-vehicle':
                    await axios.post('http://localhost:8080/api/vehicles', {
                        ...vals,
                        year: Number(vals.year),
                        fuelNorm: Number(vals.fuelNorm),
                    });
                    break;
                case 'edit-vehicle':
                    if (modalState.data && 'plateNumber' in modalState.data) {
                        await axios.put(
                            `http://localhost:8080/api/vehicles/${modalState.data.id}`,
                            {
                                ...vals,
                                id: modalState.data.id,
                                year: Number(vals.year),
                                fuelNorm: Number(vals.fuelNorm),
                            }
                        );
                    }
                    break;
                case 'add-driver':
                    await axios.post('http://localhost:8080/api/drivers', {
                        ...vals,
                        assignedVehicleId:
                            vals.assignedVehicleId === 'none'
                                ? null
                                : Number(vals.assignedVehicleId),
                    });
                    break;
                case 'edit-driver':
                    if (modalState.data && 'fullName' in modalState.data) {
                        await axios.put(
                            `http://localhost:8080/api/drivers/${modalState.data.id}`,
                            {
                                ...vals,
                                id: modalState.data.id,
                                assignedVehicleId:
                                    vals.assignedVehicleId === 'none'
                                        ? null
                                        : Number(vals.assignedVehicleId),
                            }
                        );
                    }
                    break;
                case 'add-repair':
                    await axios.post(
                        `http://localhost:8080/api/vehicles/${vals.vehicleId}/repairs`,
                        { ...vals, cost: Number(vals.cost) }
                    );
                    break;
                case 'assign-driver':
                    const dId = Number(vals.driverId);
                    const dToUpd = drivers.find((d) => d.id === dId);
                    if (dToUpd && modalState.data) {
                        await axios.put(`http://localhost:8080/api/drivers/${dId}`, {
                            ...dToUpd,
                            assignedVehicleId: modalState.data.id,
                        });
                    }
                    break;
            }
            setModalState({ type: null });
            fetchData();
        } catch (err) {
            alert('Ошибка при сохранении данных.');
        }
    };

    const handleDelete = async () => {
        if (!modalState.data || !modalState.type?.startsWith('delete-')) return;
        try {
            if (modalState.type === 'delete-vehicle') {
                await axios.delete(`http://localhost:8080/api/vehicles/${modalState.data.id}`);
                setSelectedVehicleId(null);
            } else if (modalState.type === 'delete-driver') {
                await axios.delete(`http://localhost:8080/api/drivers/${modalState.data.id}`);
            }
            setModalState({ type: null });
            fetchData();
        } catch (err) {
            alert('Ошибка удаления. Возможно, объект связан с другими данными.');
        }
    };

    // --- ГЕНЕРАЦИЯ PDF ---
    const handleSummaryExportPDF = () => {
        const tableBody = [
            [
                { text: 'ID', bold: true, fillColor: '#f3f4f6' },
                { text: 'Гос. номер', bold: true, fillColor: '#f3f4f6' },
                { text: 'Модель', bold: true, fillColor: '#f3f4f6' },
                { text: 'Год', bold: true, fillColor: '#f3f4f6' },
                { text: 'Пробег (км)', bold: true, fillColor: '#f3f4f6' },
                { text: 'Затраты (BYN)', bold: true, fillColor: '#f3f4f6' },
            ],
            ...vehicles.map((v) => {
                const mileage =
                    v.trips.length > 0 ? Math.max(0, ...v.trips.map((t) => t.mileageEnd)) : 0;
                const costs = v.repairs.reduce((sum, r) => sum + r.cost, 0);
                const fuelCost =
                    v.trips.reduce((sum, t) => sum + t.fuelUsed, 0) * FUEL_PRICE_PER_LITER;
                return [
                    v.id,
                    v.plateNumber,
                    v.model,
                    v.year,
                    mileage.toLocaleString('ru-RU'),
                    (costs + fuelCost).toFixed(2),
                ];
            }),
        ];

        const docDefinition: any = {
            content: [
                { text: 'Сводный отчет по автопарку', style: 'header' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', '*', 'auto', 'auto', 'auto'],
                        body: tableBody,
                    },
                    layout: 'lightHorizontalLines',
                },
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 15] },
            },
            defaultStyle: { font: 'Roboto' },
        };
        pdfMake.createPdf(docDefinition).download('summary_fleet_report.pdf');
    };

    const handleDetailedExportPDF = (vehicleId: string, startDate: string, endDate: string) => {
        const vehicle = vehicles.find((v) => String(v.id) === vehicleId);
        if (!vehicle) return;

        const driver = drivers.find((d) => d.assignedVehicleId === vehicle.id);
        const reportMileage =
            vehicle.trips.length > 0 ? Math.max(0, ...vehicle.trips.map((t) => t.mileageEnd)) : 0;
        const totalRepairCost = vehicle.repairs.reduce((sum, r) => sum + r.cost, 0);
        const totalDistance = vehicle.trips.reduce(
            (sum, t) => sum + (t.mileageEnd - t.mileageStart),
            0
        );
        const totalFuelUsed = vehicle.trips.reduce((sum, t) => sum + t.fuelUsed, 0);
        const totalFuelCost = totalFuelUsed * FUEL_PRICE_PER_LITER;

        const telematicsLossForVehicle = alerts
            .filter((a) => a.vehicleId === vehicle.id)
            .reduce((sum, a) => sum + (Number(a.financialLoss) || 0), 0);

        const costPerKmValue =
            totalDistance > 0
                ? (totalRepairCost + totalFuelCost + telematicsLossForVehicle) / totalDistance
                : 0;
        const avgFuelConsumptionValue =
            totalDistance > 0 ? (totalFuelUsed / totalDistance) * 100 : 0;
        const fuelNormDeviationValue =
            vehicle.fuelNorm > 0
                ? (avgFuelConsumptionValue / vehicle.fuelNorm - 1) * 100
                : 0;

        const content: any[] = [];

        content.push({
            text: `Детализированный отчет по ТС: ${vehicle.plateNumber}`,
            style: 'header',
        });
        content.push({
            text: `Период: с ${startDate || 'N/A'} по ${endDate || 'N/A'}`,
            margin: [0, 0, 0, 20],
        });

        content.push({ text: 'Ключевые показатели', style: 'subheader' });
        content.push({
            table: {
                widths: ['*', '*'],
                body: [
                    [{ text: 'Параметр', bold: true }, { text: 'Значение', bold: true }],
                    ['Модель', vehicle.model],
                    ['Год выпуска', vehicle.year.toString()],
                    ['Текущий пробег', `${reportMileage.toLocaleString('ru-RU')} км`],
                    ['Стоимость 1 км', `${costPerKmValue.toFixed(2)} BYN`],
                    ['Средний расход', `${avgFuelConsumptionValue.toFixed(1)} л/100км`],
                    [
                        'Отклонение от нормы',
                        `${fuelNormDeviationValue > 0 ? '+' : ''}${fuelNormDeviationValue.toFixed(
                            1
                        )}%`,
                    ],
                    ['Текущий водитель', driver ? driver.fullName : 'Не закреплен'],
                ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20],
        });

        if (vehicle.repairs.length > 0) {
            content.push({ text: 'История ремонтов и ТО', style: 'subheader' });
            content.push({
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto'],
                    body: [
                        [
                            { text: 'Дата', bold: true },
                            { text: 'Описание', bold: true },
                            { text: 'Стоимость', bold: true, alignment: 'right' },
                        ],
                        ...vehicle.repairs.map((r) => [
                            r.date,
                            r.description,
                            { text: `${r.cost.toLocaleString('ru-RU')} BYN`, alignment: 'right' },
                        ]),
                    ],
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 20],
            });
        }

        if (vehicle.trips.length > 0) {
            content.push({ text: 'История поездок', style: 'subheader' });
            content.push({
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', '*'],
                    body: [
                        [
                            { text: 'Дата', bold: true },
                            { text: 'Пробег', bold: true, alignment: 'right' },
                            { text: 'Отклонение ГСМ', bold: true, alignment: 'right' },
                        ],
                        ...vehicle.trips.map((t) => {
                            const distance = t.mileageEnd - t.mileageStart;
                            const expectedFuel = (distance / 100) * vehicle.fuelNorm;
                            const deviation = t.fuelUsed - expectedFuel;
                            return [
                                t.date,
                                { text: `${distance} км`, alignment: 'right' },
                                {
                                    text: `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)} л`,
                                    alignment: 'right',
                                },
                            ];
                        }),
                    ],
                },
                layout: 'lightHorizontalLines',
            });
        }

        const docDefinition: any = {
            content: content,
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
            },
            defaultStyle: { font: 'Roboto' },
        };

        pdfMake.createPdf(docDefinition).download(`detailed_report_${vehicle.plateNumber}.pdf`);
        setModalState({ type: null });
    };

    // --- РЕНДЕРИНГ ---
    if (!isMounted || isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Загрузка...
            </div>
        );
    }
    
    if (!user) return null;
    
    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Загрузка данных...
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            
            {/* ШАПКА ПРОЕКТА */}
            <header className="px-8 py-4 flex justify-between items-center border-b bg-card sticky top-0 z-10">
                <Link href="/">
                    <h1 className="text-2xl font-bold cursor-pointer">GoAnalytics</h1>
                </Link>
                <div className="flex items-center space-x-4">
                    <span className="font-medium">{user.username}</span>
                    <Button onClick={handleLogout}>Выход</Button>
                </div>
            </header>

            <motion.main
                className="p-8 space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* --- ВЕРХНЯЯ ПАНЕЛЬ ОТЧЕТОВ --- */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-3xl font-bold">Аналитическая панель</h1>
                    <div className="flex space-x-2 flex-wrap gap-y-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    if (selectedVehicleId) handleTripVehicleChange(selectedVehicleId);
                                    setModalState({ type: 'add-trip' });
                                }}
                            >
                                <MapIcon className="mr-2 h-4 w-4" /> Создать путевой лист
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" onClick={() => setModalState({ type: 'add-repair' })}>
                                <Wrench className="mr-2 h-4 w-4" /> Записать ремонт/ТО
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" onClick={() => setModalState({ type: 'detailed-report' })}>
                                <FileText className="mr-2 h-4 w-4" /> Детализированный отчет
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" onClick={handleSummaryExportPDF}>
                                <FileDown className="mr-2 h-4 w-4" /> Сводный отчет (PDF)
                            </Button>
                        </motion.div>
                    </div>
                </div>

                {/* --- ТОП МЕТРИКИ --- */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Общий пробег (все ТС)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalFleetMileage.toLocaleString('ru-RU', {
                                    maximumFractionDigits: 0,
                                })}{' '}
                                км
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Суммарные затраты</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalFleetCost.toLocaleString('ru-RU', {
                                    style: 'currency',
                                    currency: 'BYN',
                                })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Пробег за месяц</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {mileageThisMonth.toLocaleString('ru-RU', {
                                    maximumFractionDigits: 0,
                                })}{' '}
                                км
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DashboardCharts
                    data={analyticsData}
                    selectedVehicleId={selectedVehicleId ? Number(selectedVehicleId) : null}
                    vehicleCount={vehicles.length}
                />

                {/* --- КАРТА И ЛЕНТА АЛЕРТОВ --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="col-span-1 lg:col-span-2 flex flex-col h-[500px]">
                        
                        {/* ШАПКА КАРТЫ С КНОПКАМИ УПРАВЛЕНИЯ И ПОГОДОЙ */}
                        <CardHeader className="flex flex-row justify-between items-center pb-2">
                            <div>
                                <CardTitle className="flex items-center">
                                    <MapIcon className="mr-2 h-5 w-5" /> Карта автопарка
                                </CardTitle>
                                <CardDescription>
                                    Отслеживание транспорта в реальном времени
                                </CardDescription>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                {/* ВИДЖЕТ ПОГОДЫ */}
                                {weatherData && selectedVehicleId && (
                                    <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-full text-sm font-medium border border-border">
                                        {weatherData.icon}
                                        <span className="ml-2">{weatherData.temp}°C, {weatherData.description}</span>
                                    </div>
                                )}

                                {user?.roles.includes('ROLE_ADMIN') && (
                                    <div className="flex space-x-2">
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                                variant="outline"
                                                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                onClick={() => {
                                                    setRefuelData({ vehicleId: selectedVehicleId || '', amount: '' });
                                                    setModalState({ type: 'refuel' });
                                                }}
                                            >
                                                <Droplet className="mr-2 h-4 w-4" /> Заправить
                                            </Button>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => {
                                                    setSimulateTripData({ ...simulateTripData, vehicleId: selectedVehicleId || '' });
                                                    setModalState({ type: 'simulate-trip' });
                                                }}
                                            >
                                                <Navigation className="mr-2 h-4 w-4" /> В рейс
                                            </Button>
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="flex-grow p-4 pt-0">
                            <VehicleMap
                                vehicles={vehicles}
                                selectedVehicleId={
                                    selectedVehicleId ? Number(selectedVehicleId) : null
                                }
                                onVehicleSelect={setSelectedVehicleId}
                                activeRoute={activeRouteCoords}
                            />
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 flex flex-col h-[500px]">
                        <CardHeader>
                            <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                                <AlertTriangle className="mr-2 h-5 w-5" /> Лента инцидентов
                            </CardTitle>
                            <CardDescription>Сливы топлива и нарушения ПДД</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-y-auto p-4 pt-0">
                            {alerts.length > 0 ? (
                                <div className="space-y-4">
                                    {alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="flex flex-col p-3 border rounded-lg bg-background shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-sm">
                                                    {alert.plateNumber}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(alert.timestamp).toLocaleString(
                                                        'ru-RU',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-1 rounded-md w-fit mb-2 ${
                                                    alert.type === 'FUEL_DROP'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                }`}
                                            >
                                                {alert.type === 'FUEL_DROP'
                                                    ? '💧 СЛИВ ТОПЛИВА'
                                                    : '⚠️ ПРЕВЫШЕНИЕ СКОРОСТИ'}
                                            </span>
                                            <p className="text-sm font-medium">
                                                {alert.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Инцидентов не обнаружено
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* --- АНАЛИЗ ТС --- */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">
                                    Анализ Транспортного Средства
                                </CardTitle>
                            </div>
                            <Select
                                value={selectedVehicleId ?? 'all'}
                                onValueChange={(val) =>
                                    setSelectedVehicleId(val === 'all' ? null : val)
                                }
                            >
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Выберите автомобиль" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">🔍 Обзор всего парка</SelectItem>
                                    {vehicles.map((v) => (
                                        <SelectItem key={v.id} value={v.id.toString()}>
                                            {v.plateNumber} ({v.model})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-hidden">
                        <AnimatePresence mode="wait">
                            {selectedVehicle ? (
                                <motion.div
                                    key={selectedVehicle.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                                >
                                    {/* Колонка 1 */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">
                                            {selectedVehicle.plateNumber}
                                            {activeSimulations.has(selectedVehicle.id) && (
                                                <span className="ml-2 text-sm text-blue-500 animate-pulse">
                                                    (В пути...)
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedVehicle.model}, {selectedVehicle.year} год
                                        </p>

                                        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-md flex items-center text-blue-700">
                                                    <Activity className="mr-2 h-5 w-5 animate-pulse" />
                                                    Телематика
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col items-center p-3 bg-background rounded-md border">
                                                        <Droplet className="text-blue-500 mb-1 h-6 w-6" />
                                                        <span className="text-xs text-muted-foreground">
                                                            Бак (ДУТ)
                                                        </span>
                                                        <span className="font-mono text-xl font-bold">
                                                            {selectedVehicle.currentFuelLevel?.toFixed(1) || '0.0'} л
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-3 bg-background rounded-md border">
                                                        <MapPin className="text-green-500 mb-1 h-6 w-6" />
                                                        <span className="text-xs text-muted-foreground">
                                                            Координаты
                                                        </span>
                                                        <span className="font-mono text-sm mt-1 text-center">
                                                            {selectedVehicle.lastLatitude?.toFixed(4) || 'N/A'}
                                                            <br />
                                                            {selectedVehicle.lastLongitude?.toFixed(4) || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {user?.roles.includes('ROLE_ADMIN') &&
                                                    !activeSimulations.has(selectedVehicle.id) && (
                                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="col-span-1"
                                                                onClick={() => handleSimulateSpeeding(selectedVehicle.id)}
                                                            >
                                                                <FastForward className="mr-2 h-4 w-4 text-orange-500" />
                                                                Скорость
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="col-span-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() => handleSimulateDrain(selectedVehicle.id)}
                                                            >
                                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                                Слив (-15 л)
                                                            </Button>
                                                        </div>
                                                    )}
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-xs text-muted-foreground">
                                                    Пробег
                                                </p>
                                                <p className="font-bold text-lg">
                                                    {totalMileage.toLocaleString('ru-RU', {
                                                        maximumFractionDigits: 0,
                                                    })}{' '}
                                                    км
                                                </p>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-xs text-muted-foreground">
                                                    Стоимость 1 км
                                                </p>
                                                <p className="font-bold text-lg">{costPerKm} BYN</p>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-xs text-muted-foreground">
                                                    Средний расход
                                                </p>
                                                <p className="font-bold text-lg">
                                                    {avgFuelConsumption} л/100км
                                                </p>
                                            </div>
                                            <div
                                                className={`p-3 rounded-lg ${
                                                    fuelNormDeviation > 0
                                                        ? 'bg-red-100'
                                                        : 'bg-green-100'
                                                }`}
                                            >
                                                <p
                                                    className={`text-xs ${
                                                        fuelNormDeviation > 0
                                                            ? 'text-red-600'
                                                            : 'text-green-600'
                                                    }`}
                                                >
                                                    Отклонение
                                                </p>
                                                <p
                                                    className={`font-bold text-lg ${
                                                        fuelNormDeviation > 0
                                                            ? 'text-red-700'
                                                            : 'text-green-700'
                                                    }`}
                                                >
                                                    {fuelNormDeviation > 0 ? '+' : ''}
                                                    {fuelNormDeviation.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold mb-2">
                                                    Текущий водитель
                                                </h4>
                                                {user?.roles.includes('ROLE_ADMIN') && (
                                                    <motion.div
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setModalState({
                                                                    type: 'assign-driver',
                                                                    data: selectedVehicle,
                                                                })
                                                            }
                                                        >
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Назначить
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <p className="text-sm">
                                                {currentDriver
                                                    ? currentDriver.fullName
                                                    : 'Не закреплен'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Колонка 2 */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">
                                            История ремонтов
                                        </h3>
                                        <div className="rounded-md border h-[300px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Дата</TableHead>
                                                        <TableHead>Описание</TableHead>
                                                        <TableHead className="text-right">
                                                            Стоимость
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedVehicle.repairs.map((r) => (
                                                        <TableRow key={r.id} className="hover:bg-muted/50">
                                                            <TableCell>{r.date}</TableCell>
                                                            <TableCell>{r.description}</TableCell>
                                                            <TableCell className="text-right">
                                                                {r.cost.toLocaleString('ru-RU')}{' '}
                                                                BYN
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Колонка 3 */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">
                                            История поездок
                                        </h3>
                                        <div className="rounded-md border h-[300px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Дата</TableHead>
                                                        <TableHead
                                                            className="text-right cursor-pointer hover:bg-muted/50"
                                                            onClick={handleTripSort}
                                                        >
                                                            Пробег{' '}
                                                            <SortIndicator order={tripSortOrder} />
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Отклонение
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {sortedTrips.map((t) => {
                                                        const distance =
                                                            t.mileageEnd - t.mileageStart;
                                                        const expectedFuel =
                                                            (distance / 100) *
                                                            selectedVehicle.fuelNorm;
                                                        const deviation =
                                                            t.fuelUsed - expectedFuel;
                                                        return (
                                                            <TableRow key={t.id} className="hover:bg-muted/50">
                                                                <TableCell>{t.date}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {distance} км
                                                                </TableCell>
                                                                <TableCell
                                                                    className={`text-right font-medium ${
                                                                        deviation > 0
                                                                            ? 'text-red-500'
                                                                            : 'text-green-500'
                                                                    }`}
                                                                >
                                                                    {deviation > 0 ? '+' : ''}
                                                                    {deviation.toFixed(1)} л
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                    <p className="mb-2 text-lg">🔍 Обзор всего парка</p>
                                    <p className="text-sm">
                                        Выберите ТС для детального анализа.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* --- СПРАВОЧНИКИ (КНОПКИ ВЫРОВНЕНЫ) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Транспортные средства</CardTitle>
                            {user?.roles.includes('ROLE_ADMIN') && (
                                <Button onClick={() => setModalState({ type: 'add-vehicle' })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Гос. номер</TableHead>
                                            <TableHead>Модель</TableHead>
                                            {user?.roles.includes('ROLE_ADMIN') && (
                                                <TableHead className="text-right">
                                                    Действия
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vehicles.map((v) => (
                                            <TableRow
                                                key={v.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => setSelectedVehicleId(String(v.id))}
                                            >
                                                <TableCell>{v.plateNumber}</TableCell>
                                                <TableCell>{v.model}</TableCell>
                                                {user?.roles.includes('ROLE_ADMIN') && (
                                                    <TableCell
                                                        className="text-right"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setModalState({
                                                                            type: 'edit-vehicle',
                                                                            data: v,
                                                                        })
                                                                    }
                                                                >
                                                                    Редактировать
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() =>
                                                                        setModalState({
                                                                            type: 'delete-vehicle',
                                                                            data: v,
                                                                        })
                                                                    }
                                                                >
                                                                    Удалить
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Водители</CardTitle>
                            {user?.roles.includes('ROLE_ADMIN') && (
                                <Button onClick={() => setModalState({ type: 'add-driver' })}>
                                    <UserPlus className="mr-2 h-4 w-4" /> Добавить
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ФИО</TableHead>
                                            <TableHead>Контакт</TableHead>
                                            {user?.roles.includes('ROLE_ADMIN') && (
                                                <TableHead className="text-right">
                                                    Действия
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {drivers.map((d) => (
                                            <TableRow key={d.id} className="hover:bg-muted/50">
                                                <TableCell>{d.fullName}</TableCell>
                                                <TableCell>{d.contact}</TableCell>
                                                {user?.roles.includes('ROLE_ADMIN') && (
                                                    <TableCell
                                                        className="text-right"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setModalState({
                                                                            type: 'edit-driver',
                                                                            data: d,
                                                                        })
                                                                    }
                                                                >
                                                                    Редактировать
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() =>
                                                                        setModalState({
                                                                            type: 'delete-driver',
                                                                            data: d,
                                                                        })
                                                                    }
                                                                >
                                                                    Удалить
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.main>
            <div className="fixed bottom-8 left-8 z-50">
                <ThemeToggle />
            </div>

            {/* ========================================== */}
            {/* МОДАЛЬНЫЕ ОКНА                             */}
            {/* ========================================== */}

            <Dialog
                open={modalState.type === 'simulate-trip'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    <form onSubmit={startTripSimulation}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-blue-600">
                                <Navigation className="mr-2 h-5 w-5" /> Симуляция рейса
                            </DialogTitle>
                            <DialogDescription>
                                Машина поедет по реальным дорогам до выбранной точки.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Транспорт</Label>
                                <Select
                                    required
                                    value={simulateTripData.vehicleId}
                                    onValueChange={(val) =>
                                        setSimulateTripData({ ...simulateTripData, vehicleId: val })
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите машину" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles
                                            .filter((v) => !activeSimulations.has(v.id))
                                            .map((v) => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.plateNumber}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Назначение</Label>
                                <Select
                                    required
                                    value={simulateTripData.destinationIdx}
                                    onValueChange={(val) =>
                                        setSimulateTripData({
                                            ...simulateTripData,
                                            destinationIdx: val,
                                        })
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Куда едем?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DESTINATIONS.map((dest, idx) => (
                                            <SelectItem key={idx} value={String(idx)}>
                                                ➔ {dest.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                Поехали!
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={modalState.type === 'refuel'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    <form onSubmit={handleRefuelSubmit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-blue-600">
                                <Droplet className="mr-2 h-5 w-5" /> Заправка ТС
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Транспорт</Label>
                                <Select
                                    required
                                    value={refuelData.vehicleId}
                                    onValueChange={(val) =>
                                        setRefuelData({ ...refuelData, vehicleId: val })
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите машину" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.plateNumber} (Сейчас:{' '}
                                                {v.currentFuelLevel?.toFixed(1) || 0} л)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Количество</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    required
                                    className="col-span-3"
                                    placeholder="Литры"
                                    value={refuelData.amount}
                                    onChange={(e) =>
                                        setRefuelData({ ...refuelData, amount: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                Заправить
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={modalState.type === 'add-trip'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>Создать путевой лист</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Дата</Label>
                                <Input
                                    name="date"
                                    type="date"
                                    value={tripFormData.date}
                                    onChange={(e) =>
                                        setTripFormData({ ...tripFormData, date: e.target.value })
                                    }
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Транспорт</Label>
                                <Select
                                    name="vehicleId"
                                    required
                                    value={tripFormData.vehicleId}
                                    onValueChange={handleTripVehicleChange}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите ТС" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.plateNumber} ({v.model})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Водитель</Label>
                                <Select
                                    name="driverId"
                                    required
                                    value={tripFormData.driverId}
                                    onValueChange={(v) =>
                                        setTripFormData({ ...tripFormData, driverId: v })
                                    }
                                    disabled={
                                        !!drivers.find(
                                            (d) =>
                                                d.id === Number(tripFormData.driverId) &&
                                                d.assignedVehicleId ===
                                                    Number(tripFormData.vehicleId)
                                        )
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите водителя" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drivers.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>
                                                {d.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Одометр (нач)</Label>
                                <Input
                                    name="mileageStart"
                                    type="number"
                                    value={tripFormData.mileageStart}
                                    onChange={(e) =>
                                        setTripFormData({
                                            ...tripFormData,
                                            mileageStart: e.target.value,
                                        })
                                    }
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Одометр (кон)</Label>
                                <Input
                                    name="mileageEnd"
                                    type="number"
                                    value={tripFormData.mileageEnd}
                                    onChange={(e) =>
                                        setTripFormData({
                                            ...tripFormData,
                                            mileageEnd: e.target.value,
                                        })
                                    }
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Топливо (л)</Label>
                                <Input
                                    name="fuelUsed"
                                    type="number"
                                    step="0.1"
                                    value={tripFormData.fuelUsed}
                                    onChange={(e) =>
                                        setTripFormData({
                                            ...tripFormData,
                                            fuelUsed: e.target.value,
                                        })
                                    }
                                    className="col-span-3"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Создать</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={modalState.type === 'add-repair'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>Записать ремонт/ТО</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Дата</Label>
                                <Input name="date" type="date" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Транспорт</Label>
                                <Select name="vehicleId" required>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите ТС" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.plateNumber} ({v.model})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Стоимость</Label>
                                <Input
                                    name="cost"
                                    type="number"
                                    step="0.01"
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Работы</Label>
                                <Textarea name="description" className="col-span-3" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Сохранить</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={modalState.type === 'add-vehicle' || modalState.type === 'edit-vehicle'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {modalState.type === 'edit-vehicle'
                                    ? 'Редактировать ТС'
                                    : 'Добавить новое ТС'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Гос. номер</Label>
                                <Input
                                    name="plateNumber"
                                    defaultValue={(modalState.data as Vehicle)?.plateNumber}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Марка, модель</Label>
                                <Input
                                    name="model"
                                    defaultValue={(modalState.data as Vehicle)?.model}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Год выпуска</Label>
                                <Input
                                    name="year"
                                    type="number"
                                    defaultValue={(modalState.data as Vehicle)?.year}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Норма ГСМ</Label>
                                <Input
                                    name="fuelNorm"
                                    type="number"
                                    step="0.1"
                                    defaultValue={(modalState.data as Vehicle)?.fuelNorm}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Сохранить</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={modalState.type === 'add-driver' || modalState.type === 'edit-driver'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {modalState.type === 'edit-driver'
                                    ? 'Редактировать водителя'
                                    : 'Добавить водителя'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">ФИО</Label>
                                <Input
                                    name="fullName"
                                    defaultValue={(modalState.data as Driver)?.fullName}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Контакт</Label>
                                <Input
                                    name="contact"
                                    defaultValue={(modalState.data as Driver)?.contact}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Закрепить ТС</Label>
                                <Select
                                    name="assignedVehicleId"
                                    defaultValue={
                                        (modalState.data as Driver)?.assignedVehicleId
                                            ? String((modalState.data as Driver)?.assignedVehicleId)
                                            : 'none'
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите ТС" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Не закреплен</SelectItem>
                                        {vehicles.map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.plateNumber} ({v.model})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Сохранить</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={modalState.type === 'assign-driver'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>Назначить водителя на ТС</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Водитель</Label>
                                <Select
                                    name="driverId"
                                    defaultValue={
                                        currentDriver ? String(currentDriver.id) : undefined
                                    }
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите водителя" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drivers.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>
                                                {d.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Сохранить</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            <Dialog
                open={modalState.type === 'detailed-report'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            handleDetailedExportPDF(
                                fd.get('vehicleId') as string,
                                fd.get('startDate') as string,
                                fd.get('endDate') as string
                            );
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Детализированный отчет</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Транспорт</Label>
                                <Select name="vehicleId" required>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Выберите ТС" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.plateNumber}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Начало</Label>
                                <Input name="startDate" type="date" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Конец</Label>
                                <Input name="endDate" type="date" className="col-span-3" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Сформировать PDF</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={modalState.type === 'delete-vehicle'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Удалить ТС {(modalState.data as Vehicle)?.plateNumber}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={modalState.type === 'delete-driver'}
                onOpenChange={() => setModalState({ type: null })}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Удалить водителя {(modalState.data as Driver)?.fullName}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}