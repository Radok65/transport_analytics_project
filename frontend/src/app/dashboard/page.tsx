'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI Компоненты
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
    SelectValue
} from '@/components/ui/select';

// Иконки
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
    Navigation
} from 'lucide-react';

// PDF и Анимации
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import axios, { AxiosError } from 'axios';
import { DashboardCharts } from '@/components/DashboardCharts';
import VehicleMap from '@/components/VehicleMap';
import { TelematicsAlertDto } from '@/types';

pdfMake.vfs = pdfFonts.vfs;
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};

const MotionTableRow = motion(TableRow);

const FUEL_PRICE_PER_LITER = 2.57;

// Логистические точки для симуляции рейса
const DESTINATIONS = [
    { name: 'ТЛЦ "Колядичи" (Минск-Юг)', lat: 53.8055, lon: 27.5615 },
    { name: 'ТЛЦ "Прилесье" (Минск-Восток)', lat: 53.8105, lon: 27.7942 },
    { name: 'Таможня "Минск-2" (Аэропорт)', lat: 53.8967, lon: 28.0333 },
    { name: 'Брест (ПТЦ "Козловичи")', lat: 52.1250, lon: 23.6800 },
    { name: 'Гомель (СЭЗ)', lat: 52.4345, lon: 30.9754 },
    { name: 'Гродно (Брузги)', lat: 53.6236, lon: 23.6644 },
];

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

const SortIndicator = ({ order }: { order: 'asc' | 'desc' | 'none' }) => {
    if (order === 'asc') return <ArrowUp className="inline ml-2 h-4 w-4" />;
    if (order === 'desc') return <ArrowDown className="inline ml-2 h-4 w-4" />;
    return <ArrowUpDown className="inline ml-2 h-4 w-4 text-muted-foreground/50" />;
};

export default function DashboardPage() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [alerts, setAlerts] = useState<TelematicsAlertDto[]>([]);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

    const [modalState, setModalState] = useState<{ type: ModalType | null; data?: ModalData }>({ type: null });
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [tripSortOrder, setTripSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    
    const [activeSimulations, setActiveSimulations] = useState<Set<number>>(new Set());
    const [simulateTripData, setSimulateTripData] = useState({ vehicleId: '', destinationIdx: '0' });
    const [activeRouteCoords, setActiveRouteCoords] = useState<[number, number][]>([]);
    const [liveStats, setLiveStats] = useState<Record<number, { mileageAdded: number, fuelUsedAdded: number }>>({});

    const [tripFormData, setTripFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        driverId: '',
        vehicleId: '',
        mileageStart: '',
        mileageEnd: '',
        fuelUsed: ''
    });

    const fetchData = async () => {
        try {
            const [vehiclesRes, driversRes, alertsRes] = await Promise.all([
                axios.get<Vehicle[]>('http://localhost:8080/api/vehicles'),
                axios.get<Driver[]>('http://localhost:8080/api/drivers'),
                axios.get<TelematicsAlertDto[]>('http://localhost:8080/api/telematics/alerts')
            ]);
            
            setVehicles(vehiclesRes.data);
            setDrivers(driversRes.data);
            setAlerts(alertsRes.data);
            
            if (vehiclesRes.data.length === 0) {
                setSelectedVehicleId(null);
            }
        } catch (error) {
            console.error("Ошибка при загрузке данных:", error);
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
    }, [user]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            try {
                const url = selectedVehicleId 
                    ? `http://localhost:8080/api/analytics?vehicleId=${selectedVehicleId}`
                    : 'http://localhost:8080/api/analytics';
                
                const response = await axios.get<AnalyticsData>(url);
                setAnalyticsData(response.data);
            } catch (error) {
                console.error("Ошибка загрузки аналитики:", error);
            }
        };

        fetchAnalytics();
    }, [user, selectedVehicleId, vehicles]); 

    // Фоновое обновление только если машины не едут
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (user && isMounted && activeSimulations.size === 0) {
            interval = setInterval(() => {
                fetchData();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [user, isMounted, activeSimulations]);

    // Имитация слива
    const handleSimulateDrain = async (vehicleId: number) => {
        try {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (!vehicle) return;

            const fakeData = {
                vehicleId: vehicle.id,
                latitude: vehicle.lastLatitude || 53.9045,
                longitude: vehicle.lastLongitude || 27.5615,
                speed: 0,
                fuelLevel: Math.max(0, (vehicle.currentFuelLevel || 50) - 15)
            };

            await axios.post('http://localhost:8080/api/telematics/data', fakeData);
            await fetchData();
        } catch (error) {
            console.error('Ошибка имитации слива:', error);
        }
    };

    // Имитация превышения скорости
    const handleSimulateSpeeding = async (vehicleId: number) => {
        try {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (!vehicle) return;

            const fakeData = {
                vehicleId: vehicle.id,
                latitude: (vehicle.lastLatitude || 53.9045) + 0.005,
                longitude: vehicle.lastLongitude || 27.5615,
                speed: 110,
                fuelLevel: vehicle.currentFuelLevel || 50
            };

            await axios.post('http://localhost:8080/api/telematics/data', fakeData);
            await fetchData();
        } catch (error) {
            console.error('Ошибка имитации скорости:', error);
        }
    };

    // Симуляция поездки OSRM
    const startTripSimulation = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const vehicle = vehicles.find(v => v.id === Number(simulateTripData.vehicleId));
        const dest = DESTINATIONS[Number(simulateTripData.destinationIdx)];
        if (!vehicle || !dest) return;

        const startLat = vehicle.lastLatitude || 53.9045;
        const startLon = vehicle.lastLongitude || 27.5615;

        // Предварительный математический расчет (Гаверсинус)
        const R = 6371; 
        const dLat = (dest.lat - startLat) * Math.PI / 180;
        const dLon = (dest.lon - startLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(startLat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        let actualDistanceKm = Math.max(1, R * c * 1.25); 

        const fuelNeeded = (actualDistanceKm / 100) * vehicle.fuelNorm;

        if ((vehicle.currentFuelLevel || 0) < fuelNeeded) {
            alert(`Недостаточно топлива!\nЕхать: ~${actualDistanceKm.toFixed(0)} км.\nНужно: ${fuelNeeded.toFixed(1)} л.\nВ баке: ${(vehicle.currentFuelLevel || 0).toFixed(1)} л.\nЗаправьте ТС через БД.`);
            return;
        }

        setModalState({ type: null });
        setActiveSimulations(prev => new Set(prev).add(vehicle.id));
        setSelectedVehicleId(String(vehicle.id));

        let pathPoints: [number, number][] = [];
        const SIMULATION_FRAMES = 100;

        try {
            const routeRes = await axios.get(`https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${dest.lon},${dest.lat}?overview=full&geometries=geojson`);
            const coords = routeRes.data.routes[0].geometry.coordinates; 
            
            actualDistanceKm = routeRes.data.routes[0].distance / 1000;
            
            const totalPoints = coords.length;
            const stepSize = Math.max(1, Math.floor(totalPoints / SIMULATION_FRAMES));
            
            let routeLine: [number, number][] = [];
            for(let i = 0; i < totalPoints; i++) {
                routeLine.push([coords[i][1], coords[i][0]]); 
                if (i % stepSize === 0) pathPoints.push([coords[i][1], coords[i][0]]);
            }
            pathPoints.push([coords[totalPoints - 1][1], coords[totalPoints - 1][0]]); 
            setActiveRouteCoords(routeLine); 

        } catch (err) {
            console.warn("OSRM API недоступен (блокировщик рекламы). Едем по прямой.", err);
            const stepLat = (dest.lat - startLat) / SIMULATION_FRAMES;
            const stepLon = (dest.lon - startLon) / SIMULATION_FRAMES;
            
            pathPoints.push([startLat, startLon]); 
            for (let i = 1; i <= SIMULATION_FRAMES; i++) {
                pathPoints.push([startLat + stepLat * i, startLon + stepLon * i]);
            }
            setActiveRouteCoords(pathPoints);
        }

        const steps = pathPoints.length - 1;
        const stepFuel = fuelNeeded / steps;
        const stepDist = actualDistanceKm / steps;
        
        let currentFuel = vehicle.currentFuelLevel || 0;
        let liveDist = 0;
        let liveFuelUsed = 0;

        for (let i = 1; i <= steps; i++) {
            const [lat, lon] = pathPoints[i];
            currentFuel -= stepFuel;
            liveDist += stepDist;
            liveFuelUsed += stepFuel;

            setVehicles(prev => prev.map(v =>
                v.id === vehicle.id
                    ? { ...v, lastLatitude: lat, lastLongitude: lon, currentFuelLevel: currentFuel }
                    : v
            ));

            setLiveStats(prev => ({
                ...prev,
                [vehicle.id]: { mileageAdded: liveDist, fuelUsedAdded: liveFuelUsed }
            }));

            if (i % 10 === 0 || i === steps) {
                try {
                    await axios.post('http://localhost:8080/api/telematics/data', {
                        vehicleId: vehicle.id,
                        latitude: lat,
                        longitude: lon,
                        speed: 85,
                        fuelLevel: currentFuel
                    });
                } catch (err) {
                    console.error("Ошибка при отправке точки", err);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 150));
        }

        try {
            const driver = drivers.find(d => d.assignedVehicleId === vehicle.id);
            const lastMileage = vehicle.trips.length > 0 ? Math.max(...vehicle.trips.map(t => t.mileageEnd)) : 0;
            
            await axios.post(`http://localhost:8080/api/vehicles/${vehicle.id}/trips`, {
                date: new Date().toISOString().split('T')[0],
                driverId: driver ? driver.id : null,
                mileageStart: lastMileage,
                mileageEnd: lastMileage + actualDistanceKm,
                fuelUsed: fuelNeeded
            });
            await fetchData(); 
        } catch (err) {
            console.error("Ошибка создания путевого листа", err);
        }

        setActiveSimulations(prev => {
            const newSet = new Set(prev);
            newSet.delete(vehicle.id);
            return newSet;
        });
        setActiveRouteCoords([]);
        setLiveStats(prev => {
            const s = {...prev};
            delete s[vehicle.id];
            return s;
        });
    };

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push('/');
        }
    }, [user, isAuthLoading, router]);

    const { mileageThisMonth, totalFleetMileage, totalFleetCost } = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let mileageThisMonth = 0;
        let totalFleetMileage = 0;
        let baseCost = 0;

        vehicles.forEach(vehicle => {
            const monthTrips = vehicle.trips.filter(trip => {
                const tripDate = new Date(trip.date);
                return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
            });
            mileageThisMonth += monthTrips.reduce((sum, trip) => sum + (trip.mileageEnd - trip.mileageStart), 0);
            
            const maxMileage = vehicle.trips.length > 0 ? Math.max(...vehicle.trips.map(t => t.mileageEnd)) : 0;
            const liveMileage = liveStats[vehicle.id]?.mileageAdded || 0;
            totalFleetMileage += maxMileage + liveMileage;

            const repairsCost = vehicle.repairs.reduce((sum, r) => sum + r.cost, 0);
            const fuelCost = vehicle.trips.reduce((sum, t) => sum + t.fuelUsed, 0) * FUEL_PRICE_PER_LITER;
            const liveFuelCost = (liveStats[vehicle.id]?.fuelUsedAdded || 0) * FUEL_PRICE_PER_LITER;
            
            baseCost += repairsCost + fuelCost + liveFuelCost;
        });

        const telematicsLoss = alerts.reduce((sum, alert) => sum + (Number(alert.financialLoss) || 0), 0);

        return { 
            mileageThisMonth, 
            totalFleetMileage, 
            totalFleetCost: baseCost + telematicsLoss 
        };
    }, [vehicles, alerts, liveStats]);
    
    const selectedVehicle = useMemo(() => {
        return vehicles.find(v => v.id.toString() === selectedVehicleId);
    }, [vehicles, selectedVehicleId]);

    const {
        totalMileage,
        costPerKm,
        avgFuelConsumption,
        fuelNormDeviation,
        currentDriver,
        longestTrip,
        avgTripDistance,
        sortedTrips
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
                sortedTrips: [] 
            };
        }

        const vLiveStats = liveStats[selectedVehicle.id] || { mileageAdded: 0, fuelUsedAdded: 0 };

        const totalRepairCost = selectedVehicle.repairs.reduce((sum, r) => sum + r.cost, 0);
        const totalDistance = selectedVehicle.trips.reduce((sum, t) => sum + (t.mileageEnd - t.mileageStart), 0) + vLiveStats.mileageAdded;
        const totalFuelUsed = selectedVehicle.trips.reduce((sum, t) => sum + t.fuelUsed, 0) + vLiveStats.fuelUsedAdded;
        
        const telematicsLossForVehicle = alerts
            .filter(a => a.vehicleId === selectedVehicle.id)
            .reduce((sum, a) => sum + (Number(a.financialLoss) || 0), 0);

        const totalFuelCost = totalFuelUsed * FUEL_PRICE_PER_LITER;
        
        const costPerKm = totalDistance > 0 
            ? ((totalRepairCost + totalFuelCost + telematicsLossForVehicle) / totalDistance).toFixed(2) 
            : '0.00';
        
        const dbMileage = selectedVehicle.trips.length > 0 ? Math.max(...selectedVehicle.trips.map(t => t.mileageEnd)) : 0;
        const totalMileage = dbMileage + vLiveStats.mileageAdded;

        const avgFuelConsumption = totalDistance > 0 ? ((totalFuelUsed / totalDistance) * 100).toFixed(1) : '0.0';
        const fuelNormDeviation = selectedVehicle.fuelNorm > 0 ? ((parseFloat(avgFuelConsumption) / selectedVehicle.fuelNorm) - 1) * 100 : 0;
        
        const currentDriver = drivers.find(d => d.assignedVehicleId === selectedVehicle.id);
        
        const longestTrip = selectedVehicle.trips.length > 0 ? Math.max(...selectedVehicle.trips.map(t => t.mileageEnd - t.mileageStart)) : 0;
        const avgTripDistance = selectedVehicle.trips.length > 0 ? totalDistance / selectedVehicle.trips.length : 0;

        const sorted = [...selectedVehicle.trips].sort((a, b) => {
            if (tripSortOrder === 'none') return 0;
            const distanceA = a.mileageEnd - a.mileageStart;
            const distanceB = b.mileageEnd - b.mileageStart;
            return tripSortOrder === 'asc' ? distanceA - distanceB : distanceB - distanceA;
        });

        return { 
            totalMileage, 
            costPerKm, 
            avgFuelConsumption, 
            fuelNormDeviation, 
            currentDriver, 
            longestTrip, 
            avgTripDistance, 
            sortedTrips: sorted 
        };
    }, [selectedVehicle, drivers, tripSortOrder, alerts, liveStats]);

    const handleLogout = async () => { 
        await logout(); 
        router.push('/'); 
    };
    
    const handleTripSort = () => {
        setTripSortOrder(prev => {
            if (prev === 'none') return 'desc';
            if (prev === 'desc') return 'asc';
            return 'none';
        });
    };

    const handleTripVehicleChange = (vehicleId: string) => {
        const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
        if (!vehicle) return;

        const assignedDriver = drivers.find(d => d.assignedVehicleId === vehicle.id);
        const lastMileage = vehicle.trips.length > 0 ? Math.max(...vehicle.trips.map(t => t.mileageEnd)) : 0;

        setTripFormData(prev => ({
            ...prev,
            vehicleId: vehicleId,
            driverId: assignedDriver ? String(assignedDriver.id) : '',
            mileageStart: String(lastMileage)
        }));
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const values = Object.fromEntries(formData.entries());

        try {
            switch (modalState.type) {
                case 'add-trip':
                    await axios.post(`http://localhost:8080/api/vehicles/${tripFormData.vehicleId}/trips`, {
                         ...tripFormData,
                         mileageStart: Number(tripFormData.mileageStart),
                         mileageEnd: Number(tripFormData.mileageEnd),
                         fuelUsed: Number(tripFormData.fuelUsed)
                    });
                    setTripFormData({ date: new Date().toISOString().split('T')[0], driverId: '', vehicleId: '', mileageStart: '', mileageEnd: '', fuelUsed: '' });
                    break;
                case 'add-vehicle':
                    await axios.post('http://localhost:8080/api/vehicles', { 
                        ...values, 
                        year: Number(values.year), 
                        fuelNorm: Number(values.fuelNorm) 
                    });
                    break;
                case 'edit-vehicle':
                    if (modalState.data && 'plateNumber' in modalState.data) {
                        await axios.put(`http://localhost:8080/api/vehicles/${modalState.data.id}`, { 
                            ...values, 
                            id: modalState.data.id, 
                            year: Number(values.year), 
                            fuelNorm: Number(values.fuelNorm) 
                        });
                    }
                    break;
                case 'add-driver':
                    await axios.post('http://localhost:8080/api/drivers', { 
                        ...values, 
                        assignedVehicleId: values.assignedVehicleId === 'none' ? null : Number(values.assignedVehicleId) 
                    });
                    break;
                case 'edit-driver':
                    if (modalState.data && 'fullName' in modalState.data) {
                        await axios.put(`http://localhost:8080/api/drivers/${modalState.data.id}`, { 
                            ...values, 
                            id: modalState.data.id, 
                            assignedVehicleId: values.assignedVehicleId === 'none' ? null : Number(values.assignedVehicleId) 
                        });
                    }
                    break;
                case 'add-repair':
                    await axios.post(`http://localhost:8080/api/vehicles/${values.vehicleId}/repairs`, { 
                        ...values, 
                        cost: Number(values.cost) 
                    });
                    break;
                case 'assign-driver':
                    const driverId = Number(values.driverId);
                    const driverToUpdate = drivers.find(d => d.id === driverId);
                    if (driverToUpdate && modalState.data) {
                        await axios.put(`http://localhost:8080/api/drivers/${driverId}`, { 
                            ...driverToUpdate, 
                            assignedVehicleId: modalState.data.id 
                        });
                    }
                    break;
            }
            setModalState({ type: null });
            fetchData();
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            console.error(`Ошибка при выполнении операции ${modalState.type}:`, error);
            const errorMessage = error.response?.data?.message || 'Произошла ошибка. Пожалуйста, проверьте консоль.';
            alert(errorMessage);
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
            const error = err as AxiosError<{ message: string }>;
            console.error(`Ошибка при удалении:`, error);
            alert(error.response?.data?.message || 'Произошла ошибка при удалении.');
        }
    };
    
    const handleSummaryExportPDF = () => {
        const tableBody = [
            [
                { text: 'ID', bold: true, fillColor: '#f3f4f6' }, 
                { text: 'Гос. номер', bold: true, fillColor: '#f3f4f6' }, 
                { text: 'Модель', bold: true, fillColor: '#f3f4f6' }, 
                { text: 'Год', bold: true, fillColor: '#f3f4f6' }, 
                { text: 'Пробег (км)', bold: true, fillColor: '#f3f4f6' }, 
                { text: 'Затраты (BYN)', bold: true, fillColor: '#f3f4f6' }
            ],
            ...vehicles.map(v => {
                const mileage = v.trips.length > 0 ? Math.max(0, ...v.trips.map(t => t.mileageEnd)) : 0;
                const costs = v.repairs.reduce((sum, r) => sum + r.cost, 0);
                const fuelCost = v.trips.reduce((sum, t) => sum + t.fuelUsed, 0) * FUEL_PRICE_PER_LITER;
                return [
                    v.id, 
                    v.plateNumber, 
                    v.model, 
                    v.year, 
                    mileage.toLocaleString('ru-RU'), 
                    (costs + fuelCost).toFixed(2)
                ];
            })
        ];
        
        const docDefinition: any = { 
            content: [ 
                { text: 'Сводный отчет по автопарку', style: 'header' }, 
                { 
                    table: { 
                        headerRows: 1, 
                        widths: ['auto', '*', '*', 'auto', 'auto', 'auto'], 
                        body: tableBody 
                    },
                    layout: 'lightHorizontalLines'
                } 
            ], 
            styles: { 
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 15] } 
            }, 
            defaultStyle: { font: 'Roboto' } 
        };
        pdfMake.createPdf(docDefinition).download("summary_fleet_report.pdf");
    };
    
    const handleDetailedExportPDF = (vehicleId: string, startDate: string, endDate: string) => {
        const vehicle = vehicles.find(v => String(v.id) === vehicleId);
        if (!vehicle) return;

        const driver = drivers.find(d => d.assignedVehicleId === vehicle.id);
        const totalMileage = vehicle.trips.length > 0 ? Math.max(0, ...vehicle.trips.map(t => t.mileageEnd)) : 0;
        const totalRepairCost = vehicle.repairs.reduce((sum, r) => sum + r.cost, 0);
        const totalDistance = vehicle.trips.reduce((sum, t) => sum + (t.mileageEnd - t.mileageStart), 0);
        const totalFuelUsed = vehicle.trips.reduce((sum, t) => sum + t.fuelUsed, 0);
        const totalFuelCost = totalFuelUsed * FUEL_PRICE_PER_LITER;
        
        const telematicsLossForVehicle = alerts
            .filter(a => a.vehicleId === vehicle.id)
            .reduce((sum, a) => sum + (Number(a.financialLoss) || 0), 0);

        const costPerKmValue = totalDistance > 0 ? ((totalRepairCost + totalFuelCost + telematicsLossForVehicle) / totalDistance) : 0;
        const avgFuelConsumptionValue = totalDistance > 0 ? ((totalFuelUsed / totalDistance) * 100) : 0;
        const fuelNormDeviationValue = vehicle.fuelNorm > 0 ? ((avgFuelConsumptionValue / vehicle.fuelNorm) - 1) * 100 : 0;

        const content: any[] = [];
        
        content.push({ text: `Детализированный отчет по ТС: ${vehicle.plateNumber}`, style: 'header' });
        content.push({ text: `Период: с ${startDate || 'N/A'} по ${endDate || 'N/A'}`, margin: [0, 0, 0, 20] });
        
        content.push({ text: 'Ключевые показатели', style: 'subheader' });
        content.push({ 
            table: { 
                widths: ['*', '*'], 
                body: [ 
                    [{text: 'Параметр', bold: true}, {text: 'Значение', bold: true}], 
                    ['Модель', vehicle.model], 
                    ['Год выпуска', vehicle.year.toString()], 
                    ['Текущий пробег', `${totalMileage.toLocaleString('ru-RU')} км`], 
                    ['Стоимость 1 км', `${costPerKmValue.toFixed(2)} BYN`], 
                    ['Средний расход', `${avgFuelConsumptionValue.toFixed(1)} л/100км`], 
                    ['Отклонение от нормы', `${fuelNormDeviationValue > 0 ? '+' : ''}${fuelNormDeviationValue.toFixed(1)}%`], 
                    ['Текущий водитель', driver ? driver.fullName : 'Не закреплен'], 
                ] 
            }, 
            layout: 'lightHorizontalLines', 
            margin: [0, 0, 0, 20] 
        });

        if (vehicle.repairs.length > 0) { 
            content.push({ text: 'История ремонтов и ТО', style: 'subheader' }); 
            content.push({ 
                table: { 
                    headerRows: 1, 
                    widths: ['auto', '*', 'auto'], 
                    body: [ 
                        [{text: 'Дата', bold: true}, {text: 'Описание', bold: true}, {text: 'Стоимость', bold: true, alignment: 'right'}], 
                        ...vehicle.repairs.map(r => [r.date, r.description, { text: `${r.cost.toLocaleString('ru-RU')} BYN`, alignment: 'right' }]) 
                    ] 
                }, 
                layout: 'lightHorizontalLines', 
                margin: [0, 0, 0, 20] 
            }); 
        }

        if (vehicle.trips.length > 0) { 
            content.push({ text: 'История поездок', style: 'subheader' }); 
            content.push({ 
                table: { 
                    headerRows: 1, 
                    widths: ['auto', '*', '*'], 
                    body: [ 
                        [{text: 'Дата', bold: true}, {text: 'Пробег', bold: true, alignment: 'right'}, {text: 'Отклонение ГСМ', bold: true, alignment: 'right'}], 
                        ...vehicle.trips.map(t => { 
                            const distance = t.mileageEnd - t.mileageStart; 
                            const expectedFuel = (distance / 100) * vehicle.fuelNorm; 
                            const deviation = t.fuelUsed - expectedFuel; 
                            return [
                                t.date, 
                                { text: `${distance} км`, alignment: 'right' }, 
                                { text: `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)} л`, alignment: 'right' }
                            ]; 
                        }) 
                    ] 
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
            defaultStyle: { font: 'Roboto' } 
        };
        
        pdfMake.createPdf(docDefinition).download(`detailed_report_${vehicle.plateNumber}.pdf`);
        setModalState({ type: null });
    };

    if (!isMounted || isAuthLoading) {
        return <div className="flex items-center justify-center min-h-screen">Загрузка аутентификации...</div>;
    }
    
    if (!user) {
        return null;
    }

    if (isDataLoading) {
        return <div className="flex items-center justify-center min-h-screen">Загрузка данных...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* ШАПКА */}
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
                {/* ПАНЕЛЬ КНОПОК */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-3xl font-bold">Аналитическая панель</h1>
                    <div className="flex space-x-2 flex-wrap gap-y-2">
                        
                        {/* Кнопка симуляции: видна только админу */}
                        {user?.roles.includes('ROLE_ADMIN') && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                                    onClick={() => setModalState({ type: 'simulate-trip' })}
                                >
                                    <Navigation className="mr-2 h-4 w-4" /> 
                                    Отправить в рейс (Live)
                                </Button>
                            </motion.div>
                        )}

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" onClick={() => setModalState({ type: 'add-trip' })}>
                                <MapIcon className="mr-2 h-4 w-4" /> 
                                Создать путевой лист
                            </Button>
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" onClick={() => setModalState({ type: 'add-repair' })}>
                                <Wrench className="mr-2 h-4 w-4" /> 
                                Записать ремонт/ТО
                            </Button>
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" onClick={() => setModalState({ type: 'detailed-report' })}>
                                <FileText className="mr-2 h-4 w-4" /> 
                                Детализированный отчет
                            </Button>
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" onClick={handleSummaryExportPDF}>
                                <FileDown className="mr-2 h-4 w-4" /> 
                                Сводный отчет (PDF)
                            </Button>
                        </motion.div>
                    </div>
                </div>
                
                {/* ТОП-МЕТРИКИ */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Общий пробег (все ТС)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totalFleetMileage.toLocaleString('ru-RU', {maximumFractionDigits: 0})} км
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Суммарные затраты</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totalFleetCost.toLocaleString('ru-RU', { style: 'currency', currency: 'BYN' })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Пробег за месяц</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {mileageThisMonth.toLocaleString('ru-RU', {maximumFractionDigits: 0})} км
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* ГРАФИКИ */}
                <DashboardCharts 
                    data={analyticsData} 
                    selectedVehicleId={selectedVehicleId ? Number(selectedVehicleId) : null}
                    vehicleCount={vehicles.length}
                />

                {/* КАРТА И АЛЕРТЫ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="col-span-1 lg:col-span-2 flex flex-col h-[500px]">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <MapIcon className="mr-2 h-5 w-5" />
                                Карта автопарка
                            </CardTitle>
                            <CardDescription>
                                Отслеживание транспорта в реальном времени
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow p-4 pt-0">
                            <VehicleMap 
                                vehicles={vehicles} 
                                selectedVehicleId={selectedVehicleId ? Number(selectedVehicleId) : null} 
                                onVehicleSelect={setSelectedVehicleId} 
                                activeRoute={activeRouteCoords} 
                            />
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 flex flex-col h-[500px]">
                        <CardHeader>
                            <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                                <AlertTriangle className="mr-2 h-5 w-5" />
                                Лента инцидентов
                            </CardTitle>
                            <CardDescription>Сливы топлива и нарушения ПДД</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-y-auto p-4 pt-0">
                            {alerts.length > 0 ? (
                                <div className="space-y-4">
                                    {alerts.map(alert => (
                                        <div key={alert.id} className="flex flex-col p-3 border rounded-lg bg-background shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-sm">{alert.plateNumber}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(alert.timestamp).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md w-fit mb-2 ${alert.type === 'FUEL_DROP' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                                                {alert.type === 'FUEL_DROP' ? '💧 СЛИВ ТОПЛИВА' : '⚠️ ПРЕВЫШЕНИЕ СКОРОСТИ'}
                                            </span>
                                            <p className="text-sm font-medium">{alert.description}</p>
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

                {/* ДЕТАЛЬНЫЙ АНАЛИЗ ТС */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">Анализ Транспортного Средства</CardTitle>
                                <CardDescription>Выберите ТС для просмотра детальной информации и KPI.</CardDescription>
                            </div>
                            <Select 
                                value={selectedVehicleId ?? 'all'} 
                                onValueChange={(val) => setSelectedVehicleId(val === 'all' ? null : val)}
                            >
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Выберите автомобиль или 'Обзор парка'" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">🔍 Обзор всего парка (Матрица)</SelectItem>
                                    {vehicles.map(vehicle => (
                                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                            {vehicle.plateNumber} ({vehicle.model})
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
                                    transition={{ duration: 0.3 }} 
                                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                                >
                                    
                                    {/* ЛЕВАЯ КОЛОНКА */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">
                                            {selectedVehicle.plateNumber}
                                            {activeSimulations.has(selectedVehicle.id) && (
                                                <span className="ml-2 text-sm text-blue-500 animate-pulse">(В пути...)</span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedVehicle.model}, {selectedVehicle.year} год
                                        </p>
                                        
                                        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-md flex items-center text-blue-700 dark:text-blue-400">
                                                    <Activity className="mr-2 h-5 w-5 animate-pulse" /> 
                                                    Телематика (Датчики)
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col items-center p-3 bg-background rounded-md border">
                                                        <Droplet className="text-blue-500 mb-1 h-6 w-6" />
                                                        <span className="text-xs text-muted-foreground">Бак (ДУТ)</span>
                                                        <span className="font-mono text-xl font-bold">
                                                            {selectedVehicle.currentFuelLevel ? selectedVehicle.currentFuelLevel.toFixed(1) : '0.0'} л
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-3 bg-background rounded-md border">
                                                        <MapPin className="text-green-500 mb-1 h-6 w-6" />
                                                        <span className="text-xs text-muted-foreground">Координаты</span>
                                                        <span className="font-mono text-sm mt-1 text-center">
                                                            {selectedVehicle.lastLatitude ? selectedVehicle.lastLatitude.toFixed(4) : 'N/A'}<br/>
                                                            {selectedVehicle.lastLongitude ? selectedVehicle.lastLongitude.toFixed(4) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Кнопки нарушений (только Админу) */}
                                                {user?.roles.includes('ROLE_ADMIN') && !activeSimulations.has(selectedVehicle.id) && (
                                                    <div className="flex flex-col gap-2 mt-4">
                                                        <Button 
                                                            variant="destructive" 
                                                            size="sm" 
                                                            className="w-full" 
                                                            onClick={() => handleSimulateDrain(selectedVehicle.id)}
                                                        >
                                                            <AlertTriangle className="mr-2 h-4 w-4" /> 
                                                            Слив топлива (-15 л)
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900/50 dark:hover:bg-orange-900/30" 
                                                            onClick={() => handleSimulateSpeeding(selectedVehicle.id)}
                                                        >
                                                            <FastForward className="mr-2 h-4 w-4" /> 
                                                            Превышение скорости
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-xs text-muted-foreground">Пробег</p>
                                                <p className="font-bold text-lg">
                                                    {totalMileage.toLocaleString('ru-RU', {maximumFractionDigits: 0})} км
                                                </p>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-xs text-muted-foreground">Стоимость 1 км</p>
                                                <p className="font-bold text-lg">{costPerKm} BYN</p>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-xs text-muted-foreground">Средний расход</p>
                                                <p className="font-bold text-lg">{avgFuelConsumption} л/100км</p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${fuelNormDeviation > 0 ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}>
                                                <p className={`text-xs ${fuelNormDeviation > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                    Отклонение от нормы
                                                </p>
                                                <p className={`font-bold text-lg ${fuelNormDeviation > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                                                    {fuelNormDeviation > 0 ? '+' : ''}{fuelNormDeviation.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold mb-2">Текущий водитель</h4>
                                                {user?.roles.includes('ROLE_ADMIN') && (
                                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => setModalState({ type: 'assign-driver', data: selectedVehicle })}
                                                        >
                                                            <UserCheck className="mr-2 h-4 w-4" /> Назначить
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <p className="text-sm">
                                                {currentDriver ? currentDriver.fullName : 'Не закреплен'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {currentDriver?.contact}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* ЦЕНТРАЛЬНАЯ КОЛОНКА (РЕМОНТЫ) */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">История ремонтов и ТО</h3>
                                        <div className="rounded-md border h-[300px] overflow-y-auto relative">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-secondary z-10">
                                                    <TableRow>
                                                        <TableHead>Дата</TableHead>
                                                        <TableHead>Описание</TableHead>
                                                        <TableHead className="text-right">Стоимость</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedVehicle.repairs.length > 0 ? (
                                                        selectedVehicle.repairs.map(r => (
                                                            <TableRow key={r.id}>
                                                                <TableCell>{r.date}</TableCell>
                                                                <TableCell>{r.description}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {r.cost.toLocaleString('ru-RU')} BYN
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                                                Данных о ремонтах нет
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* ПРАВАЯ КОЛОНКА (ПОЕЗДКИ) */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Анализ и история поездок</h3>
                                        <div className="grid grid-cols-2 gap-4 mb-2">
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-xs text-muted-foreground">Самый длинный рейс</p>
                                                <p className="font-bold text-lg">
                                                    {longestTrip.toLocaleString('ru-RU')} км
                                                </p>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-xs text-muted-foreground">Средний рейс</p>
                                                <p className="font-bold text-lg">
                                                    {avgTripDistance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} км
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-md border h-[220px] overflow-y-auto relative">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-secondary z-10">
                                                    <TableRow>
                                                        <TableHead>Дата</TableHead>
                                                        <TableHead 
                                                            className="text-right cursor-pointer hover:bg-muted/80" 
                                                            onClick={handleTripSort}
                                                        >
                                                            Пробег <SortIndicator order={tripSortOrder} />
                                                        </TableHead>
                                                        <TableHead className="text-right">Отклонение</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {sortedTrips.length > 0 ? (
                                                        sortedTrips.map(t => {
                                                            const distance = t.mileageEnd - t.mileageStart;
                                                            const expectedFuel = (distance / 100) * selectedVehicle.fuelNorm;
                                                            const deviation = t.fuelUsed - expectedFuel;
                                                            return (
                                                                <TableRow key={t.id}>
                                                                    <TableCell>{t.date}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        {distance} км
                                                                    </TableCell>
                                                                    <TableCell className={`text-right font-medium ${deviation > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                        {deviation > 0 ? '+' : ''}{deviation.toFixed(1)} л
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                                                Данных о поезках нет
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                    <p className="mb-2 text-lg">🔍 Обзор всего парка</p>
                                    <p className="text-sm">Отображается сводная аналитика по всем автомобилям.</p>
                                    <p className="text-sm mt-2">
                                        Для детального анализа выберите конкретное ТС в выпадающем списке выше.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* СПРАВОЧНИКИ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Справочник транспортных средств</CardTitle>
                            {user?.roles.includes('ROLE_ADMIN') && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button onClick={() => setModalState({ type: 'add-vehicle' })}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Добавить ТС
                                    </Button>
                                </motion.div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-[400px] overflow-y-auto relative">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-secondary z-10">
                                        <TableRow>
                                            <TableHead>Гос. номер</TableHead>
                                            <TableHead>Модель</TableHead>
                                            <TableHead>Год</TableHead>
                                            {user?.roles.includes('ROLE_ADMIN') && (
                                                <TableHead className="text-right">Действия</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vehicles.map((vehicle) => (
                                            <MotionTableRow 
                                                key={vehicle.id} 
                                                whileHover={{ backgroundColor: "hsl(var(--muted))" }} 
                                                className="cursor-pointer" 
                                                onClick={() => setSelectedVehicleId(String(vehicle.id))}
                                            >
                                                <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                                                <TableCell>{vehicle.model}</TableCell>
                                                <TableCell>{vehicle.year}</TableCell>
                                                {user?.roles.includes('ROLE_ADMIN') && (
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem 
                                                                    onClick={() => setModalState({ type: 'edit-vehicle', data: vehicle })}
                                                                >
                                                                    Редактировать
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem 
                                                                    className="text-red-600" 
                                                                    onClick={() => setModalState({ type: 'delete-vehicle', data: vehicle })}
                                                                >
                                                                    Удалить
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}
                                            </MotionTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Справочник водителей</CardTitle>
                            {user?.roles.includes('ROLE_ADMIN') && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button onClick={() => setModalState({ type: 'add-driver' })}>
                                        <UserPlus className="mr-2 h-4 w-4" /> Добавить водителя
                                    </Button>
                                </motion.div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-[400px] overflow-y-auto relative">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-secondary z-10">
                                        <TableRow>
                                            <TableHead>ФИО</TableHead>
                                            <TableHead>Контактные данные</TableHead>
                                            <TableHead>Закрепленное ТС</TableHead>
                                            {user?.roles.includes('ROLE_ADMIN') && (
                                                <TableHead className="text-right">Действия</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {drivers.map((driver) => {
                                            const assignedVehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
                                            return (
                                                <MotionTableRow 
                                                    key={driver.id} 
                                                    whileHover={{ backgroundColor: "hsl(var(--muted))" }} 
                                                    className="cursor-pointer"
                                                >
                                                    <TableCell className="font-medium">{driver.fullName}</TableCell>
                                                    <TableCell>{driver.contact}</TableCell>
                                                    <TableCell>
                                                        {assignedVehicle ? `${assignedVehicle.plateNumber} (${assignedVehicle.model})` : 'Не закреплен'}
                                                    </TableCell>
                                                    {user?.roles.includes('ROLE_ADMIN') && (
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem 
                                                                        onClick={() => setModalState({ type: 'edit-driver', data: driver })}
                                                                    >
                                                                        Редактировать
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        className="text-red-600" 
                                                                        onClick={() => setModalState({ type: 'delete-driver', data: driver })}
                                                                    >
                                                                        Удалить
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    )}
                                                </MotionTableRow>
                                            );
                                        })}
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

            {/* --- МОДАЛЬНЫЕ ОКНА --- */}
            <Dialog 
                open={['add-vehicle', 'edit-vehicle', 'add-driver', 'edit-driver', 'add-repair', 'assign-driver', 'detailed-report', 'add-trip', 'simulate-trip'].includes(modalState.type || '')} 
                onOpenChange={() => setModalState({ type: null })}
            >
                <DialogContent>
                    
                    {/* ОКНО: СИМУЛЯЦИЯ РЕЙСА */}
                    { modalState.type === 'simulate-trip' &&
                        <form onSubmit={startTripSimulation}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center text-blue-600">
                                    <Navigation className="mr-2 h-5 w-5"/> 
                                    Симуляция рейса (Real-time)
                                </DialogTitle>
                                <DialogDescription>
                                    Выберите пункт назначения. Маршрут будет проложен от текущего положения автомобиля.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Транспорт</Label>
                                    <Select 
                                        required 
                                        value={simulateTripData.vehicleId} 
                                        onValueChange={(val) => setSimulateTripData({...simulateTripData, vehicleId: val})}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Выберите машину (не в пути)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.filter(v => !activeSimulations.has(v.id)).map(v => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.plateNumber} (Бак: {v.currentFuelLevel?.toFixed(0)} л)
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
                                        onValueChange={(val) => setSimulateTripData({...simulateTripData, destinationIdx: val})}
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
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                                    Начать движение
                                </Button>
                            </DialogFooter>
                        </form>
                    }

                    {/* ОКНО: ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ ТС */}
                    { (modalState.type === 'add-vehicle' || modalState.type === 'edit-vehicle') &&
                        <form onSubmit={handleFormSubmit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {modalState.type === 'edit-vehicle' ? 'Редактировать ТС' : 'Добавить новое ТС'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="plateNumber" className="text-right">Гос. номер</Label>
                                    <Input 
                                        id="plateNumber" 
                                        name="plateNumber" 
                                        defaultValue={(modalState.data as Vehicle)?.plateNumber} 
                                        className="col-span-3" 
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="model" className="text-right">Марка, модель</Label>
                                    <Input 
                                        id="model" 
                                        name="model" 
                                        defaultValue={(modalState.data as Vehicle)?.model} 
                                        className="col-span-3" 
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="year" className="text-right">Год выпуска</Label>
                                    <Input 
                                        id="year" 
                                        name="year" 
                                        type="number" 
                                        defaultValue={(modalState.data as Vehicle)?.year} 
                                        className="col-span-3" 
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="fuelNorm" className="text-right">Норма ГСМ</Label>
                                    <Input 
                                        id="fuelNorm" 
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
                    }

                    {/* ОКНО: ДОБАВЛЕНИЕ ПУТЕВОГО ЛИСТА */}
                    { modalState.type === 'add-trip' &&
                       <form onSubmit={handleFormSubmit}>
                           <DialogHeader>
                               <DialogTitle>Создать путевой лист</DialogTitle>
                           </DialogHeader>
                           <div className="grid gap-4 py-4">
                               <div className="grid grid-cols-4 items-center gap-4">
                                   <Label htmlFor="date" className="text-right">Дата</Label>
                                   <Input 
                                        id="date" 
                                        name="date" 
                                        type="date" 
                                        value={tripFormData.date} 
                                        onChange={(e) => setTripFormData({...tripFormData, date: e.target.value})} 
                                        className="col-span-3" 
                                        required 
                                    />
                               </div>
                               <div className="grid grid-cols-4 items-center gap-4">
                                   <Label htmlFor="vehicleId" className="text-right">Транспорт</Label>
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
                                            {vehicles.map(v => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.plateNumber} ({v.model})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                   </Select>
                               </div>
                               <div className="grid grid-cols-4 items-center gap-4">
                                   <Label htmlFor="driverId" className="text-right">Водитель</Label>
                                   <Select 
                                        name="driverId" 
                                        required 
                                        value={tripFormData.driverId} 
                                        onValueChange={(value) => setTripFormData({...tripFormData, driverId: value})} 
                                        disabled={!!drivers.find(d => d.id === Number(tripFormData.driverId) && d.assignedVehicleId === Number(tripFormData.vehicleId))}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Выберите водителя" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers.map(d => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    {d.fullName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                   </Select>
                               </div>
                               <div className="grid grid-cols-4 items-center gap-4">
                                   <Label htmlFor="mileageStart" className="text-right">Одометр (нач.)</Label>
                                   <Input 
                                        id="mileageStart" 
                                        name="mileageStart" 
                                        type="number" 
                                        value={tripFormData.mileageStart} 
                                        onChange={(e) => setTripFormData({...tripFormData, mileageStart: e.target.value})} 
                                        className="col-span-3" 
                                        required 
                                    />
                               </div>
                               <div className="grid grid-cols-4 items-center gap-4">
                                   <Label htmlFor="mileageEnd" className="text-right">Одометр (кон.)</Label>
                                   <Input 
                                        id="mileageEnd" 
                                        name="mileageEnd" 
                                        type="number" 
                                        value={tripFormData.mileageEnd} 
                                        onChange={(e) => setTripFormData({...tripFormData, mileageEnd: e.target.value})} 
                                        className="col-span-3" 
                                        required 
                                    />
                               </div>
                               <div className="grid grid-cols-4 items-center gap-4">
                                   <Label htmlFor="fuelUsed" className="text-right">Топливо (л)</Label>
                                   <Input 
                                        id="fuelUsed" 
                                        name="fuelUsed" 
                                        type="number" 
                                        step="0.1" 
                                        value={tripFormData.fuelUsed} 
                                        onChange={(e) => setTripFormData({...tripFormData, fuelUsed: e.target.value})} 
                                        className="col-span-3" 
                                        required 
                                    />
                               </div>
                           </div>
                           <DialogFooter>
                               <Button type="submit">Создать</Button>
                           </DialogFooter>
                       </form>
                    }

                    {/* ОКНО: ДОБАВЛЕНИЕ РЕМОНТА */}
                    { modalState.type === 'add-repair' &&
                        <form onSubmit={handleFormSubmit}>
                            <DialogHeader>
                                <DialogTitle>Записать ремонт/ТО</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">Дата</Label>
                                    <Input id="date" name="date" type="date" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="vehicleId" className="text-right">Транспорт</Label>
                                    <Select name="vehicleId" required>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Выберите ТС" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.map(v => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.plateNumber} ({v.model})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="cost" className="text-right">Стоимость (BYN)</Label>
                                    <Input id="cost" name="cost" type="number" step="0.01" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">Перечень работ</Label>
                                    <Textarea 
                                        id="description" 
                                        name="description" 
                                        placeholder="Например: Замена масла, фильтров" 
                                        className="col-span-3" 
                                        required 
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Сохранить</Button>
                            </DialogFooter>
                        </form>
                    }

                    {/* ОКНО: ГЕНЕРАЦИЯ ДЕТАЛЬНОГО ОТЧЕТА PDF */}
                    { modalState.type === 'detailed-report' &&
                        <>
                            <DialogHeader>
                                <DialogTitle>Сформировать детализированный отчет</DialogTitle>
                                <DialogDescription>
                                    Выберите ТС и укажите период для формирования отчета.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => { 
                                e.preventDefault(); 
                                const formData = new FormData(e.currentTarget); 
                                const vehicleId = formData.get('vehicleId') as string; 
                                const startDate = formData.get('startDate') as string; 
                                const endDate = formData.get('endDate') as string; 
                                handleDetailedExportPDF(vehicleId, startDate, endDate); 
                            }}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="vehicleId" className="text-right">Транспорт</Label>
                                        <Select name="vehicleId" required>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Выберите ТС" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicles.map(v => (
                                                    <SelectItem key={v.id} value={String(v.id)}>
                                                        {v.plateNumber} ({v.model})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="startDate" className="text-right">Начало периода</Label>
                                        <Input id="startDate" name="startDate" type="date" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="endDate" className="text-right">Конец периода</Label>
                                        <Input id="endDate" name="endDate" type="date" className="col-span-3" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Сформировать PDF</Button>
                                </DialogFooter>
                            </form>
                        </>
                    }

                    {/* ОКНО: ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ ВОДИТЕЛЯ */}
                    { (modalState.type === 'add-driver' || modalState.type === 'edit-driver') &&
                        <form onSubmit={handleFormSubmit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {modalState.type === 'edit-driver' ? 'Редактировать водителя' : 'Добавить водителя'}
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
                                        defaultValue={(modalState.data as Driver)?.assignedVehicleId ? String((modalState.data as Driver)?.assignedVehicleId) : 'none'}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Выберите ТС" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Не закреплен</SelectItem>
                                            {vehicles.map(v => (
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
                    }

                    {/* ОКНО: НАЗНАЧЕНИЕ ВОДИТЕЛЯ ИЗ КАРТОЧКИ ТС */}
                     { modalState.type === 'assign-driver' &&
                        <form onSubmit={handleFormSubmit}>
                            <DialogHeader>
                                <DialogTitle>Назначить водителя на ТС</DialogTitle>
                                <DialogDescription>
                                    Выберите водителя, чтобы закрепить его за автомобилем с номером {(modalState.data as Vehicle)?.plateNumber}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="driverId" className="text-right">Водитель</Label>
                                    <Select 
                                        name="driverId" 
                                        defaultValue={currentDriver ? String(currentDriver.id) : undefined}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Выберите водителя" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers.map(d => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    {d.fullName} {d.assignedVehicleId && d.assignedVehicleId !== (modalState.data as Vehicle)?.id ? `(на ТС ${vehicles.find(v => v.id === d.assignedVehicleId)?.plateNumber})` : '(свободен)'}
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
                    }
                </DialogContent>
            </Dialog>

            {/* АЛЕРТ: УДАЛЕНИЕ ТС */}
            <AlertDialog 
                open={modalState.type === 'delete-vehicle'} 
                onOpenChange={() => setModalState({ type: null })}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие невозможно отменить. Вы собираетесь удалить ТС с номером {(modalState.data as Vehicle)?.plateNumber}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Да, удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* АЛЕРТ: УДАЛЕНИЕ ВОДИТЕЛЯ */}
            <AlertDialog 
                open={modalState.type === 'delete-driver'} 
                onOpenChange={() => setModalState({ type: null })}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие невозможно отменить. Вы собираетесь удалить водителя {(modalState.data as Driver)?.fullName}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Да, удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}