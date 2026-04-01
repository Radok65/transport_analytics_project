'use client';

import { useState, useEffect, useMemo, FormEvent, JSX, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ==========================================
// ИМПОРТЫ КАРТЫ (ДОБАВЛЕНО ДЛЯ ВЫБОРА ТОЧКИ)
// ==========================================
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Фикс для иконок маркеров в Leaflet при работе с Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ==========================================
// ИМПОРТЫ UI-КОМПОНЕНТОВ (SHADCN)
// ==========================================
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ==========================================
// ИКОНКИ
// ==========================================
import {
    MoreHorizontal, PlusCircle, FileDown, Wrench, Map as MapIcon, FileText,
    UserPlus, UserCheck, ArrowUpDown, ArrowUp, ArrowDown, Droplet, Activity,
    MapPin, AlertTriangle, FastForward, Navigation, CloudRain, Sun, Snowflake, Cloud, MapPinned
} from 'lucide-react';

// ==========================================
// БИБЛИОТЕКИ И КОМПОНЕНТЫ
// ==========================================
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardCharts } from '@/components/DashboardCharts';
import VehicleMap from '@/components/VehicleMap';
import { TelematicsAlertDto } from '@/types';
import api, { Vehicle, Driver, Destination, AnalyticsData } from '@/lib/apiService';
import axios from 'axios';

// ==========================================
// ИНТЕРФЕЙСЫ И УТИЛИТЫ
// ==========================================
export interface WeatherData {
    condition: string;
    temperature: number;
}

type ModalType =
    | 'add-trip' | 'simulate-trip' | 'refuel' | 'add-vehicle' | 'edit-vehicle'
    | 'add-driver' | 'edit-driver' | 'add-repair' | 'assign-driver' | 'detailed-report'
    | 'delete-vehicle' | 'delete-driver' | 'add-destination';

type ModalData = Vehicle | Driver | null;

const SortIndicator = ({ order }: { order: 'asc' | 'desc' | 'none' }): JSX.Element => {
    if (order === 'asc') return <ArrowUp className="inline ml-2 h-4 w-4" />;
    if (order === 'desc') return <ArrowDown className="inline ml-2 h-4 w-4" />;
    return <ArrowUpDown className="inline ml-2 h-4 w-4 text-muted-foreground/50" />;
};

// ==========================================
// Вспомогательный компонент для кликов по карте
// ==========================================
function LocationPickerEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ
// ==========================================
export default function DashboardPage() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const activeVehicleIdRef = useRef<string | null>(null);

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [alerts, setAlerts] = useState<TelematicsAlertDto[]>([]);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);

    const [modalState, setModalState] = useState<{ type: ModalType | null; data?: ModalData }>({ type: null });
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [tripSortOrder, setTripSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

    // Состояния для добавления новой точки (интерактивная карта)
    const [destLat, setDestLat] = useState<number | ''>('');
    const [destLon, setDestLon] = useState<number | ''>('');

    // Для локальной анимации маршрута
    const [activeRouteCoords, setActiveRouteCoords] = useState<[number, number][]>([]);
    const [simulatedVehicleRouteId, setSimulatedVehicleRouteId] = useState<number | null>(null);

    const [simulateTripData, setSimulateTripData] = useState({ vehicleId: '', destinationId: '' });
    const [refuelData, setRefuelData] = useState({ vehicleId: '', amount: '' });
    const [tripFormData, setTripFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        driverId: '', vehicleId: '', mileageStart: '', mileageEnd: '', fuelUsed: '',
    });

    // --- ЗАГРУЗКА БАЗОВЫХ ДАННЫХ ---
    const fetchBaseData = async () => {
        try {
            const [vRes, dRes, destRes, aRes] = await Promise.all([
                api.getVehicles(),
                api.getDrivers(),
                api.getDestinations(),
                api.getAlerts()
            ]);
            setVehicles(vRes.data);
            setDrivers(dRes.data);
            setDestinations(destRes.data);
            setAlerts(aRes.data);
            if (vRes.data.length === 0) setSelectedVehicleId(null);
        } catch (error) {
            console.error('Ошибка при загрузке базовых данных:', error);
        }
    };

    // --- ЗАГРУЗКА АНАЛИТИКИ ---
    const fetchAnalytics = async (vId: string | null) => {
        try {
            const res = await api.getAnalytics(vId);
            setAnalyticsData(res.data);
        } catch (error) {
            console.error('Ошибка аналитики:', error);
        }
    };

    const fetchData = async () => {
        await Promise.all([fetchBaseData(), fetchAnalytics(activeVehicleIdRef.current)]);
        setIsDataLoading(false);
    };

    useEffect(() => {
        setIsMounted(true);
        if (user) {
            if (vehicles.length === 0) setIsDataLoading(true);
            fetchData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        activeVehicleIdRef.current = selectedVehicleId;
        if (user && !isDataLoading) fetchAnalytics(selectedVehicleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVehicleId]);

    // Фоновое обновление
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (user && isMounted) {
            interval = setInterval(() => {
                fetchData();
            }, 5000);
        }
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isMounted]);

    const selectedVehicle = useMemo(() => vehicles.find((v) => v.id.toString() === selectedVehicleId), [vehicles, selectedVehicleId]);
    const currentDriver = useMemo(() => drivers.find((d) => d.assignedVehicleId === Number(selectedVehicleId)), [drivers, selectedVehicleId]);

    // --- ЗАГРУЗКА ПОГОДЫ ---
    const weatherLat = selectedVehicle?.lastLatitude ?? 53.9045;
    const weatherLon = selectedVehicle?.lastLongitude ?? 27.5615;

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await axios.get(`http://localhost:8080/api/weather?lat=${weatherLat}&lon=${weatherLon}`);
                setCurrentWeather(res.data);
            } catch (err) {}
        };
        
        if (user) {
            fetchWeather();
            const interval = setInterval(fetchWeather, 30000);
            return () => clearInterval(interval);
        }
    }, [user, weatherLat, weatherLon]);

    const getWeatherIcon = (condition: string) => {
        if (condition.includes('Rain') || condition.includes('Drizzle')) return <CloudRain className="mr-2 h-5 w-5 text-blue-500" />;
        if (condition.includes('Snow')) return <Snowflake className="mr-2 h-5 w-5 text-cyan-500" />;
        if (condition.includes('Clear')) return <Sun className="mr-2 h-5 w-5 text-yellow-500" />;
        return <Cloud className="mr-2 h-5 w-5 text-gray-500" />;
    };

    // --- ОБРАБОТЧИКИ ТЕЛЕМАТИКИ И ЗАПРАВКИ ---
    const handleSimulateDrain = async (vehicleId: number) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        if (!vehicle) return;
        try {
            await api.sendTelematicsData({
                vehicleId, latitude: vehicle.lastLatitude || 53.9045, longitude: vehicle.lastLongitude || 27.5615,
                speed: 0, fuelLevel: Math.max(0, (vehicle.currentFuelLevel || 50) - 15),
            });
            await fetchData();
        } catch (error) { console.error(error); }
    };

    const handleSimulateSpeeding = async (vehicleId: number) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        if (!vehicle) return;
        try {
            await api.sendTelematicsData({
                vehicleId, latitude: (vehicle.lastLatitude || 53.9045) + 0.005, longitude: vehicle.lastLongitude || 27.5615,
                speed: 110, fuelLevel: vehicle.currentFuelLevel || 50,
            });
            await fetchData();
        } catch (error) { console.error(error); }
    };

    const handleRefuelSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const vehicle = vehicles.find((v) => v.id === Number(refuelData.vehicleId));
        if (!vehicle) return;
        const newFuel = (vehicle.currentFuelLevel || 0) + Number(refuelData.amount);
        try {
            await api.sendTelematicsData({
                vehicleId: vehicle.id, latitude: vehicle.lastLatitude || 53.9045, longitude: vehicle.lastLongitude || 27.5615,
                speed: 0, fuelLevel: newFuel,
            });
            await fetchData();
            setModalState({ type: null });
            setRefuelData({ vehicleId: '', amount: '' });
        } catch (error) { alert('Ошибка при заправке ТС'); }
    };

    // --- ПЛАВНАЯ СИМУЛЯЦИЯ (СЕРВЕРНАЯ) ---
    const startTripSimulation = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const vehicleId = Number(simulateTripData.vehicleId);
        const destinationId = Number(simulateTripData.destinationId);
        setModalState({ type: null });

        try {
            const res = await api.startSimulation(vehicleId, destinationId);
            const data = res.data;

            if (!data.success) {
                alert(data.message);
                return;
            }

            setSelectedVehicleId(String(vehicleId));
            setActiveRouteCoords(data.pathPoints);
            setSimulatedVehicleRouteId(vehicleId);

            // Сообщаем бэкенду статус "В ПУТИ"
            if (api.updateVehicleStatus) {
                await api.updateVehicleStatus(vehicleId, "В ПУТИ");
            }
            await fetchData(); 

            const frames = data.pathPoints.length;
            const stepFuel = data.fuelNeeded / frames;
            let currentFuel = data.currentFuel;

            for (let i = 0; i < frames; i++) {
                const [lat, lon] = data.pathPoints[i];
                currentFuel -= stepFuel;

                setVehicles((prev) => prev.map((v) =>
                    v.id === vehicleId ? { ...v, lastLatitude: lat, lastLongitude: lon, currentFuelLevel: currentFuel } : v
                ));

                if (i % 10 === 0 || i === frames - 1) {
                    try { await api.sendTelematicsData({ vehicleId, latitude: lat, longitude: lon, speed: 85, fuelLevel: currentFuel }); } 
                    catch (err) {}
                }
                await new Promise((resolve) => setTimeout(resolve, 50));
            }

            const dest = destinations.find(d => d.id === destinationId);
            const driver = drivers.find((d) => d.assignedVehicleId === vehicleId);
            const vehicle = vehicles.find((v) => v.id === vehicleId);
            const lastMileage = vehicle && vehicle.trips.length > 0 ? Math.max(...vehicle.trips.map((t) => t.mileageEnd)) : 0;

            await api.createTrip(vehicleId, {
                date: new Date().toISOString().split('T')[0],
                driverId: driver ? driver.id : null,
                mileageStart: lastMileage,
                mileageEnd: lastMileage + data.distanceKm,
                fuelUsed: data.fuelNeeded,
            });

            if (dest) {
                await api.sendArrivalAlert(vehicleId, dest.name);
            }

            // Возвращаем статус
            if (api.updateVehicleStatus) await api.updateVehicleStatus(vehicleId, "СВОБОДЕН");
            
            await fetchData();
            setActiveRouteCoords([]);
            setSimulatedVehicleRouteId(null);
        } catch (err) {
            console.error(err);
            if (api.updateVehicleStatus) {
                try { await api.updateVehicleStatus(vehicleId, "СВОБОДЕН"); await fetchData(); } catch(e){}
            }
            setActiveRouteCoords([]);
            setSimulatedVehicleRouteId(null);
            alert('Ошибка при связи с сервером симуляции');
        }
    };

    // --- СКАЧИВАНИЕ PDF (СЕРВЕРНАЯ ГЕНЕРАЦИЯ) ---
    const downloadBlob = (response: any, filename: string) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    };

    const handleSummaryExportPDF = async () => {
        try {
            const response = await api.downloadSummaryReport();
            downloadBlob(response, 'fleet_summary.pdf');
        } catch (error) { alert('Ошибка скачивания отчета'); }
    };

    const handleDetailedExportPDF = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const vId = fd.get('vehicleId') as string;
        try {
            const vehicle = vehicles.find(v => v.id.toString() === vId);
            const response = await api.downloadVehicleReport(vId);
            downloadBlob(response, `detailed_report_${vehicle?.plateNumber || vId}.pdf`);
            setModalState({ type: null });
        } catch (error) { alert('Ошибка скачивания отчета'); }
    };

    // --- ОБРАБОТЧИКИ ФОРМ И UI ---
    const handleTripVehicleChange = (vId: string) => {
        const v = vehicles.find((v) => v.id.toString() === vId);
        if (!v) return;
        const dr = drivers.find((d) => d.assignedVehicleId === v.id);
        const m = v.trips.length > 0 ? Math.max(...v.trips.map((t) => t.mileageEnd)) : 0;
        setTripFormData((prev) => ({ ...prev, vehicleId: vId, driverId: dr ? String(dr.id) : '', mileageStart: String(m) }));
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const vals = Object.fromEntries(fd.entries());
        try {
            switch (modalState.type) {
                case 'add-destination':
                    await api.createDestination({ name: String(vals.name), latitude: Number(vals.lat), longitude: Number(vals.lon) });
                    // Очистка состояний после сохранения
                    setDestLat('');
                    setDestLon('');
                    break;
                case 'add-trip':
                    await api.createTrip(Number(tripFormData.vehicleId), {
                        ...tripFormData, mileageStart: Number(tripFormData.mileageStart), mileageEnd: Number(tripFormData.mileageEnd), fuelUsed: Number(tripFormData.fuelUsed),
                    });
                    setTripFormData({ date: new Date().toISOString().split('T')[0], driverId: '', vehicleId: '', mileageStart: '', mileageEnd: '', fuelUsed: '' });
                    break;
                case 'add-vehicle':
                    await api.createVehicle({ ...vals, year: Number(vals.year), fuelNorm: Number(vals.fuelNorm) });
                    break;
                case 'edit-vehicle':
                    if (modalState.data && 'plateNumber' in modalState.data) {
                        await api.updateVehicle(modalState.data.id, { ...vals, id: modalState.data.id, year: Number(vals.year), fuelNorm: Number(vals.fuelNorm) });
                    }
                    break;
                case 'add-driver':
                    await api.createDriver({ ...vals, assignedVehicleId: vals.assignedVehicleId === 'none' ? null : Number(vals.assignedVehicleId) });
                    break;
                case 'edit-driver':
                    if (modalState.data && 'fullName' in modalState.data) {
                        await api.updateDriver(modalState.data.id, { ...vals, id: modalState.data.id, assignedVehicleId: vals.assignedVehicleId === 'none' ? null : Number(vals.assignedVehicleId) });
                    }
                    break;
                case 'add-repair':
                    await api.createRepair(Number(vals.vehicleId), { ...vals, cost: Number(vals.cost) });
                    break;
                case 'assign-driver':
                    const dId = Number(vals.driverId);
                    const dToUpd = drivers.find((d) => d.id === dId);
                    if (dToUpd && modalState.data) {
                        await api.updateDriver(dId, { ...dToUpd, assignedVehicleId: modalState.data.id });
                    }
                    break;
            }
            setModalState({ type: null });
            fetchData();
        } catch (err) { alert('Ошибка при сохранении данных.'); }
    };

    const handleDelete = async () => {
        if (!modalState.data || !modalState.type?.startsWith('delete-')) return;
        try {
            if (modalState.type === 'delete-vehicle') {
                await api.deleteVehicle(modalState.data.id);
                setSelectedVehicleId(null);
            } else if (modalState.type === 'delete-driver') {
                await api.deleteDriver(modalState.data.id);
            }
            setModalState({ type: null });
            fetchData();
        } catch (err) { alert('Ошибка удаления. Возможно, объект связан с другими данными.'); }
    };

    const sortedTrips = useMemo(() => {
        if (!selectedVehicle) return [];
        return [...selectedVehicle.trips].sort((a, b) => {
            if (tripSortOrder === 'none') return 0;
            const dA = a.mileageEnd - a.mileageStart;
            const dB = b.mileageEnd - b.mileageStart;
            return tripSortOrder === 'asc' ? dA - dB : dB - dA;
        });
    }, [selectedVehicle, tripSortOrder]);

    // Защита маршрута
    useEffect(() => {
        if (!isAuthLoading && !user) router.push('/');
    }, [user, isAuthLoading, router]);

    // --- РЕНДЕРИНГ ---
    if (!isMounted || isAuthLoading) return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
    if (!user) return null;
    if (isDataLoading) return <div className="flex items-center justify-center min-h-screen">Загрузка данных...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            
            {/* ШАПКА ПРОЕКТА */}
            <header className="px-8 py-4 flex justify-between items-center border-b bg-card sticky top-0 z-10">
                <Link href="/">
                    <h1 className="text-2xl font-bold cursor-pointer">GoAnalytics</h1>
                </Link>
                <div className="flex items-center space-x-4">
                    <span className="font-medium">{user.username}</span>
                    <Button onClick={() => { logout(); router.push('/'); }}>Выход</Button>
                </div>
            </header>

            <motion.main className="p-8 space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                
                {/* --- ВЕРХНЯЯ ПАНЕЛЬ ОТЧЕТОВ --- */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-3xl font-bold">Аналитическая панель</h1>
                    <div className="flex space-x-2 flex-wrap gap-y-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" onClick={() => { if (selectedVehicleId) handleTripVehicleChange(selectedVehicleId); setModalState({ type: 'add-trip' }); }}>
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

                {/* --- ТОП МЕТРИКИ (ДАННЫЕ С БЭКЕНДА) --- */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle>Общий пробег (все ТС)</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{analyticsData?.totalFleetMileage?.toLocaleString('ru-RU')} км</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Суммарные затраты</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{analyticsData?.totalFleetCost?.toLocaleString('ru-RU', { style: 'currency', currency: 'BYN' })}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Пробег за месяц</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{analyticsData?.mileageThisMonth?.toLocaleString('ru-RU')} км</div></CardContent>
                    </Card>
                </div>

                <DashboardCharts data={analyticsData as any} selectedVehicleId={selectedVehicleId ? Number(selectedVehicleId) : null} vehicleCount={vehicles.length} />

                {/* --- КАРТА И ЛЕНТА АЛЕРТОВ --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="col-span-1 lg:col-span-2 flex flex-col h-[500px]">
                        <CardHeader className="flex flex-row justify-between items-center pb-2">
                            <div>
                                <CardTitle className="flex items-center"><MapIcon className="mr-2 h-5 w-5" /> Карта автопарка</CardTitle>
                                <CardDescription>Отслеживание транспорта в реальном времени</CardDescription>
                            </div>
                            <div className="flex items-center space-x-6">
                                {currentWeather && (
                                    <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-md border text-sm font-medium">
                                        {getWeatherIcon(currentWeather.condition)}
                                        {currentWeather.temperature > 0 ? '+' : ''}{currentWeather.temperature.toFixed(1)}°C
                                    </div>
                                )}
                                {user?.roles.includes('ROLE_ADMIN') && (
                                    <div className="flex space-x-2">
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="outline" onClick={() => setModalState({ type: 'add-destination' })}>
                                                <MapPinned className="mr-2 h-4 w-4" /> Новая точка
                                            </Button>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50" onClick={() => { setRefuelData({ vehicleId: selectedVehicleId || '', amount: '' }); setModalState({ type: 'refuel' }); }}>
                                                <Droplet className="mr-2 h-4 w-4" /> Заправить
                                            </Button>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setSimulateTripData({ ...simulateTripData, vehicleId: selectedVehicleId || '' }); setModalState({ type: 'simulate-trip' }); }}>
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
                                selectedVehicleId={selectedVehicleId ? Number(selectedVehicleId) : null} 
                                onVehicleSelect={setSelectedVehicleId} 
                                activeRoute={selectedVehicleId && Number(selectedVehicleId) === simulatedVehicleRouteId ? activeRouteCoords : []} 
                            />
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 flex flex-col h-[500px]">
                        <CardHeader>
                            <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Лента событий</CardTitle>
                            <CardDescription>Сливы топлива, нарушения ПДД и прибытия</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-y-auto p-4 pt-0">
                            {alerts.length > 0 ? (
                                <div className="space-y-4">
                                    {alerts.map((alert) => (
                                        <div key={alert.id} className="flex flex-col p-3 border rounded-lg bg-background shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-sm">{alert.plateNumber}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md w-fit mb-2 ${alert.type === 'FUEL_DROP' ? 'bg-red-100 text-red-800' : alert.type === 'ARRIVAL' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {alert.type === 'FUEL_DROP' ? '💧 СЛИВ ТОПЛИВА' : alert.type === 'ARRIVAL' ? '✅ ПРИБЫТИЕ' : '⚠️ ПРЕВЫШЕНИЕ СКОРОСТИ'}
                                            </span>
                                            <p className="text-sm font-medium">{alert.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (<div className="h-full flex items-center justify-center text-muted-foreground text-sm">Инцидентов не обнаружено</div>)}
                        </CardContent>
                    </Card>
                </div>

                {/* --- АНАЛИЗ ТС --- */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div><CardTitle className="text-xl">Анализ Транспортного Средства</CardTitle></div>
                            <Select value={selectedVehicleId ?? 'all'} onValueChange={(val) => setSelectedVehicleId(val === 'all' ? null : val)}>
                                <SelectTrigger className="w-[280px]"><SelectValue placeholder="Выберите автомобиль" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">🔍 Обзор всего парка</SelectItem>
                                    {vehicles.map((v) => <SelectItem key={v.id} value={v.id.toString()}>{v.plateNumber} ({v.model})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-hidden">
                        <AnimatePresence mode="wait">
                            {selectedVehicle && analyticsData ? (
                                <motion.div key={selectedVehicle.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Колонка 1 */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">
                                            {selectedVehicle.plateNumber}
                                            {selectedVehicle.status === 'В ПУТИ' && <span className="ml-2 text-sm text-blue-500 animate-pulse">(В пути...)</span>}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{selectedVehicle.model}, {selectedVehicle.year} год</p>

                                        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 shadow-none">
                                            <CardHeader className="pb-2"><CardTitle className="text-md flex items-center text-blue-700"><Activity className="mr-2 h-5 w-5 animate-pulse" />Телематика</CardTitle></CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col items-center p-3 bg-background rounded-md border">
                                                        <Droplet className="text-blue-500 mb-1 h-6 w-6" />
                                                        <span className="text-xs text-muted-foreground">Бак (ДУТ)</span>
                                                        <span className="font-mono text-xl font-bold">{selectedVehicle.currentFuelLevel?.toFixed(1) || '0.0'} л</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-3 bg-background rounded-md border">
                                                        <MapPin className="text-green-500 mb-1 h-6 w-6" />
                                                        <span className="text-xs text-muted-foreground">Координаты</span>
                                                        <span className="font-mono text-sm mt-1 text-center">{selectedVehicle.lastLatitude?.toFixed(4) || 'N/A'}<br />{selectedVehicle.lastLongitude?.toFixed(4) || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                {user?.roles.includes('ROLE_ADMIN') && selectedVehicle.status !== 'В ПУТИ' && (
                                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                                        <Button variant="outline" size="sm" onClick={() => handleSimulateSpeeding(selectedVehicle.id)}><FastForward className="mr-2 h-4 w-4 text-orange-500" />Скорость</Button>
                                                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleSimulateDrain(selectedVehicle.id)}><AlertTriangle className="mr-2 h-4 w-4" />Слив</Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Пробег</p><p className="font-bold text-lg">{analyticsData.vehicleTotalMileage?.toLocaleString('ru-RU')} км</p></div>
                                            <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Стоимость 1 км</p><p className="font-bold text-lg">{analyticsData.vehicleCostPerKm?.toFixed(2)} BYN</p></div>
                                            <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Средний расход</p><p className="font-bold text-lg">{analyticsData.vehicleAvgFuelConsumption?.toFixed(1)} л/100км</p></div>
                                            <div className={`p-3 rounded-lg ${analyticsData.vehicleFuelNormDeviation > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                                                <p className={`text-xs ${analyticsData.vehicleFuelNormDeviation > 0 ? 'text-red-600' : 'text-green-600'}`}>Отклонение</p>
                                                <p className={`font-bold text-lg ${analyticsData.vehicleFuelNormDeviation > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                                    {analyticsData.vehicleFuelNormDeviation > 0 ? '+' : ''}{analyticsData.vehicleFuelNormDeviation?.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold mb-2">Текущий водитель</h4>
                                                {user?.roles.includes('ROLE_ADMIN') && (
                                                    <Button variant="outline" size="sm" onClick={() => setModalState({ type: 'assign-driver', data: selectedVehicle })}><UserCheck className="mr-2 h-4 w-4" />Назначить</Button>
                                                )}
                                            </div>
                                            <p className="text-sm">{currentDriver ? currentDriver.fullName : 'Не закреплен'}</p>
                                        </div>
                                    </div>

                                    {/* Колонка 2 */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">История ремонтов</h3>
                                        <div className="rounded-md border h-[300px] overflow-y-auto">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Дата</TableHead><TableHead>Описание</TableHead><TableHead className="text-right">Стоимость</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {selectedVehicle.repairs.map((r) => (
                                                        <TableRow key={r.id} className="hover:bg-muted/50"><TableCell>{r.date}</TableCell><TableCell>{r.description}</TableCell><TableCell className="text-right">{r.cost.toLocaleString('ru-RU')} BYN</TableCell></TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Колонка 3 */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">История поездок</h3>
                                        <div className="rounded-md border h-[300px] overflow-y-auto">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Дата</TableHead><TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => setTripSortOrder(prev => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}>Пробег <SortIndicator order={tripSortOrder} /></TableHead><TableHead className="text-right">Расход</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {sortedTrips.map((t) => {
                                                        const distance = t.mileageEnd - t.mileageStart;
                                                        return (
                                                            <TableRow key={t.id} className="hover:bg-muted/50"><TableCell>{t.date}</TableCell><TableCell className="text-right">{distance} км</TableCell><TableCell className="text-right">{t.fuelUsed.toFixed(1)} л</TableCell></TableRow>
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
                                    <p className="text-sm">Выберите ТС для детального анализа.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* --- СПРАВОЧНИКИ --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Транспортные средства</CardTitle>
                            {user?.roles.includes('ROLE_ADMIN') && <Button onClick={() => setModalState({ type: 'add-vehicle' })}><PlusCircle className="mr-2 h-4 w-4" /> Добавить</Button>}
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Гос. номер</TableHead><TableHead>Модель</TableHead>{user?.roles.includes('ROLE_ADMIN') && <TableHead className="text-right">Действия</TableHead>}</TableRow></TableHeader>
                                    <TableBody>
                                        {vehicles.map((v) => (
                                            <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedVehicleId(String(v.id))}>
                                                <TableCell>{v.plateNumber}</TableCell><TableCell>{v.model}</TableCell>
                                                {user?.roles.includes('ROLE_ADMIN') && (
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setModalState({ type: 'edit-vehicle', data: v })}>Редактировать</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600" onClick={() => setModalState({ type: 'delete-vehicle', data: v })}>Удалить</DropdownMenuItem>
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
                            {user?.roles.includes('ROLE_ADMIN') && <Button onClick={() => setModalState({ type: 'add-driver' })}><UserPlus className="mr-2 h-4 w-4" /> Добавить</Button>}
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>ФИО</TableHead><TableHead>Контакт</TableHead>{user?.roles.includes('ROLE_ADMIN') && <TableHead className="text-right">Действия</TableHead>}</TableRow></TableHeader>
                                    <TableBody>
                                        {drivers.map((d) => (
                                            <TableRow key={d.id} className="hover:bg-muted/50">
                                                <TableCell>{d.fullName}</TableCell><TableCell>{d.contact}</TableCell>
                                                {user?.roles.includes('ROLE_ADMIN') && (
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setModalState({ type: 'edit-driver', data: d })}>Редактировать</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600" onClick={() => setModalState({ type: 'delete-driver', data: d })}>Удалить</DropdownMenuItem>
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
            <div className="fixed bottom-8 left-8 z-50"><ThemeToggle /></div>

            {/* ========================================== */}
            {/* МОДАЛЬНЫЕ ОКНА                             */}
            {/* ========================================== */}

            {/* Обновленная модалка: Добавление точки маршрута через карту */}
            <Dialog open={modalState.type === 'add-destination'} onOpenChange={() => { setModalState({ type: null }); setDestLat(''); setDestLon(''); }}>
                <DialogContent className="sm:max-w-[600px]">
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader><DialogTitle>Добавить пункт назначения</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Название</Label>
                                <Input name="name" className="col-span-3" placeholder='Склад "Восточный"' required />
                            </div>
                            
                            {/* Интерактивная карта для выбора координат */}
                            <div className="col-span-4 h-[250px] rounded-md overflow-hidden border">
                                <MapContainer center={[53.9045, 27.5615]} zoom={11} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <LocationPickerEvents onLocationSelect={(lat, lon) => {
                                        setDestLat(Number(lat.toFixed(4)));
                                        setDestLon(Number(lon.toFixed(4)));
                                    }} />
                                    {destLat !== '' && destLon !== '' && (
                                        <Marker position={[Number(destLat), Number(destLon)]} />
                                    )}
                                </MapContainer>
                            </div>
                            <p className="text-xs text-muted-foreground text-center col-span-4 mt-[-10px]">
                                Кликните на карту, чтобы выбрать координаты пункта
                            </p>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Широта (Lat)</Label>
                                <Input name="lat" type="number" step="0.0001" className="col-span-3" value={destLat} onChange={(e) => setDestLat(Number(e.target.value))} required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Долгота (Lon)</Label>
                                <Input name="lon" type="number" step="0.0001" className="col-span-3" value={destLon} onChange={(e) => setDestLon(Number(e.target.value))} required />
                            </div>
                        </div>
                        <DialogFooter><Button type="submit">Сохранить</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modalState.type === 'simulate-trip'} onOpenChange={() => setModalState({ type: null })}>
                <DialogContent>
                    <form onSubmit={startTripSimulation}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-blue-600"><Navigation className="mr-2 h-5 w-5" /> Симуляция рейса</DialogTitle>
                            <DialogDescription>Машина поедет по реальным дорогам до выбранной точки.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Транспорт</Label>
                                <Select required value={simulateTripData.vehicleId} onValueChange={(val) => setSimulateTripData({ ...simulateTripData, vehicleId: val })}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Выберите машину" /></SelectTrigger>
                                    <SelectContent>{vehicles.filter((v) => v.status !== 'В ПУТИ').map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.plateNumber}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Назначение</Label>
                                <Select required value={simulateTripData.destinationId} onValueChange={(val) => setSimulateTripData({ ...simulateTripData, destinationId: val })}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Куда едем?" /></SelectTrigger>
                                    <SelectContent>{destinations.map((dest) => <SelectItem key={dest.id} value={String(dest.id)}>➔ {dest.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter><Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Поехали!</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modalState.type === 'refuel'} onOpenChange={() => setModalState({ type: null })}>
                <DialogContent>
                    <form onSubmit={handleRefuelSubmit}>
                        <DialogHeader><DialogTitle className="flex items-center text-blue-600"><Droplet className="mr-2 h-5 w-5" /> Заправка ТС</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Транспорт</Label>
                                <Select required value={refuelData.vehicleId} onValueChange={(val) => setRefuelData({ ...refuelData, vehicleId: val })}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Выберите машину" /></SelectTrigger>
                                    <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.plateNumber} (Сейчас: {v.currentFuelLevel?.toFixed(1) || 0} л)</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Количество</Label>
                                <Input type="number" step="0.1" required className="col-span-3" placeholder="Литры" value={refuelData.amount} onChange={(e) => setRefuelData({ ...refuelData, amount: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter><Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Заправить</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modalState.type === 'add-trip'} onOpenChange={() => setModalState({ type: null })}>
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader><DialogTitle>Создать путевой лист</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Дата</Label><Input name="date" type="date" value={tripFormData.date} onChange={(e) => setTripFormData({ ...tripFormData, date: e.target.value })} className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Транспорт</Label><Select name="vehicleId" required value={tripFormData.vehicleId} onValueChange={handleTripVehicleChange}><SelectTrigger className="col-span-3"><SelectValue placeholder="Выберите ТС" /></SelectTrigger><SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.plateNumber}</SelectItem>)}</SelectContent></Select></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Водитель</Label><Select name="driverId" required value={tripFormData.driverId} onValueChange={(v) => setTripFormData({ ...tripFormData, driverId: v })}><SelectTrigger className="col-span-3"><SelectValue placeholder="Выберите водителя" /></SelectTrigger><SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.fullName}</SelectItem>)}</SelectContent></Select></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Одометр (нач)</Label><Input name="mileageStart" type="number" value={tripFormData.mileageStart} onChange={(e) => setTripFormData({ ...tripFormData, mileageStart: e.target.value })} className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Одометр (кон)</Label><Input name="mileageEnd" type="number" value={tripFormData.mileageEnd} onChange={(e) => setTripFormData({ ...tripFormData, mileageEnd: e.target.value })} className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Топливо (л)</Label><Input name="fuelUsed" type="number" step="0.1" value={tripFormData.fuelUsed} onChange={(e) => setTripFormData({ ...tripFormData, fuelUsed: e.target.value })} className="col-span-3" required /></div>
                        </div>
                        <DialogFooter><Button type="submit">Создать</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modalState.type === 'add-repair'} onOpenChange={() => setModalState({ type: null })}>
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader><DialogTitle>Записать ремонт/ТО</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Дата</Label><Input name="date" type="date" className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Транспорт</Label><Select name="vehicleId" required><SelectTrigger className="col-span-3"><SelectValue placeholder="Выберите ТС" /></SelectTrigger><SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.plateNumber}</SelectItem>)}</SelectContent></Select></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Стоимость</Label><Input name="cost" type="number" step="0.01" className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Работы</Label><Textarea name="description" className="col-span-3" required /></div>
                        </div>
                        <DialogFooter><Button type="submit">Сохранить</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modalState.type === 'add-vehicle' || modalState.type === 'edit-vehicle'} onOpenChange={() => setModalState({ type: null })}>
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader><DialogTitle>{modalState.type === 'edit-vehicle' ? 'Редактировать ТС' : 'Добавить новое ТС'}</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Гос. номер</Label><Input name="plateNumber" defaultValue={(modalState.data as Vehicle)?.plateNumber} className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Модель</Label><Input name="model" defaultValue={(modalState.data as Vehicle)?.model} className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Год выпуска</Label><Input name="year" type="number" defaultValue={(modalState.data as Vehicle)?.year} className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Норма ГСМ</Label><Input name="fuelNorm" type="number" step="0.1" defaultValue={(modalState.data as Vehicle)?.fuelNorm} className="col-span-3" required /></div>
                        </div>
                        <DialogFooter><Button type="submit">Сохранить</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modalState.type === 'add-driver' || modalState.type === 'edit-driver'} onOpenChange={() => setModalState({ type: null })}>
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader><DialogTitle>{modalState.type === 'edit-driver' ? 'Редактировать водителя' : 'Добавить водителя'}</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">ФИО</Label><Input name="fullName" defaultValue={(modalState.data as Driver)?.fullName} className="col-span-3" required /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Контакт</Label><Input name="contact" defaultValue={(modalState.data as Driver)?.contact} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Закрепить ТС</Label><Select name="assignedVehicleId" defaultValue={(modalState.data as Driver)?.assignedVehicleId ? String((modalState.data as Driver)?.assignedVehicleId) : 'none'}><SelectTrigger className="col-span-3"><SelectValue placeholder="Выберите ТС" /></SelectTrigger><SelectContent><SelectItem value="none">Не закреплен</SelectItem>{vehicles.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.plateNumber}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                        <DialogFooter><Button type="submit">Сохранить</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modalState.type === 'assign-driver'} onOpenChange={() => setModalState({ type: null })}>
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader><DialogTitle>Назначить водителя на ТС</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Водитель</Label>
                                <Select name="driverId" defaultValue={currentDriver ? String(currentDriver.id) : undefined}><SelectTrigger className="col-span-3"><SelectValue placeholder="Выберите водителя" /></SelectTrigger><SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.fullName}</SelectItem>)}</SelectContent></Select>
                            </div>
                        </div>
                        <DialogFooter><Button type="submit">Сохранить</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={modalState.type === 'detailed-report'} onOpenChange={() => setModalState({ type: null })}>
                <DialogContent>
                    <form onSubmit={handleDetailedExportPDF}>
                        <DialogHeader><DialogTitle>Детализированный отчет (PDF)</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Транспорт</Label>
                                <Select name="vehicleId" required><SelectTrigger className="col-span-3"><SelectValue placeholder="Выберите ТС" /></SelectTrigger><SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.plateNumber}</SelectItem>)}</SelectContent></Select>
                            </div>
                        </div>
                        <DialogFooter><Button type="submit">Скачать PDF</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={modalState.type === 'delete-vehicle'} onOpenChange={() => setModalState({ type: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Удалить ТС {(modalState.data as Vehicle)?.plateNumber}?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Удалить</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={modalState.type === 'delete-driver'} onOpenChange={() => setModalState({ type: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Удалить водителя {(modalState.data as Driver)?.fullName}?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Удалить</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}