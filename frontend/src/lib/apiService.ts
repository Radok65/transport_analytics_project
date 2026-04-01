import axios from 'axios';

// Определяем интерфейсы, соответствующие DTO с бэкенда
export interface Vehicle {
    id: number;
    plateNumber: string;
    model: string;
    year: number; // Обновлено под бэкенд (было yearOfProduction)
    fuelNorm: number;
    currentFuelLevel?: number;
    lastLatitude?: number;
    lastLongitude?: number;
    repairs: Repair[];
    trips: Trip[];
    status: string;
}

export interface Driver {
    id: number;
    fullName: string;
    contact: string; // Обновлено под бэкенд (было contactInfo)
    assignedVehicleId: number | null;
}

export interface Repair {
    id: number;
    date: string; // Обновлено под бэкенд
    description: string;
    cost: number;
    vehicleId: number;
}

export interface Trip {
    id: number;
    date: string; // Обновлено под бэкенд
    mileageStart: number;
    mileageEnd: number;
    fuelUsed: number;
    vehicleId: number;
    driverId: number;
}

export interface Destination {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}

export interface SimulationResponse {
    success: boolean;
    message: string;
    distanceKm: number;
    fuelNeeded: number;
    currentFuel: number;
    pathPoints: [number, number][];
}

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
    // Глобальные
    top5VehiclesByMileage: Record<string, number>;
    totalFuelCost: number;
    totalRepairCost: number;
    totalFleetCost: number;
    totalFleetMileage: number;
    mileageThisMonth: number;
    fleetPerformanceMatrix: VehiclePerformancePoint[];
    
    // Для конкретного ТС
    vehicleEfficiencyTrend: TripEfficiencyPoint[];
    vehicleFuelCost: number;
    vehicleRepairCost: number;
    vehicleTotalMileage: number;
    vehicleCostPerKm: number;
    vehicleAvgFuelConsumption: number;
    vehicleFuelNormDeviation: number;
    vehicleLongestTrip: number;
    vehicleAvgTripDistance: number;
}

// Настраиваем базовый URL для всех запросов
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // Критически важно для сессий!
});

export const api = {
    // --- Транспортные средства ---
    getVehicles: () => apiClient.get<Vehicle[]>('/vehicles'),
    createVehicle: (data: any) => apiClient.post<Vehicle>('/vehicles', data),
    updateVehicle: (id: number, data: any) => apiClient.put<Vehicle>(`/vehicles/${id}`, data),
    deleteVehicle: (id: number) => apiClient.delete(`/vehicles/${id}`),
    updateVehicleStatus: (id: number, status: string) => 
        apiClient.put(`/vehicles/${id}/status?status=${encodeURIComponent(status)}`),

    // --- Водители ---
    getDrivers: () => apiClient.get<Driver[]>('/drivers'),
    createDriver: (data: any) => apiClient.post<Driver>('/drivers', data),
    updateDriver: (id: number, data: any) => apiClient.put<Driver>(`/drivers/${id}`, data),
    deleteDriver: (id: number) => apiClient.delete(`/drivers/${id}`),

    // --- Ремонты и Поездки ---
    createRepair: (vehicleId: number, data: any) => apiClient.post<Repair>(`/vehicles/${vehicleId}/repairs`, data),
    createTrip: (vehicleId: number, data: any) => apiClient.post<Trip>(`/vehicles/${vehicleId}/trips`, data),

    // --- Телематика ---
    getAlerts: () => apiClient.get('/telematics/alerts'),
    sendTelematicsData: (data: any) => apiClient.post('/telematics/data', data),
    sendArrivalAlert: (vehicleId: number, destinationName: string) => 
        apiClient.post(`/telematics/alerts/arrival?vehicleId=${vehicleId}&destinationName=${encodeURIComponent(destinationName)}`),

    // --- Пункты назначения (Новое) ---
    getDestinations: () => apiClient.get<Destination[]>('/destinations'),
    createDestination: (data: Omit<Destination, 'id'>) => apiClient.post<Destination>('/destinations', data),

    // --- Аналитика (Новое) ---
    getAnalytics: (vehicleId?: string | null) => 
        apiClient.get<AnalyticsData>(vehicleId ? `/analytics?vehicleId=${vehicleId}` : '/analytics'),

    // --- Симуляция (Новое) ---
    startSimulation: (vehicleId: number, destinationId: number) => 
        apiClient.post<SimulationResponse>('/simulation/start', { vehicleId, destinationId }),

    // --- Отчеты PDF (Новое) ---
    downloadSummaryReport: () => apiClient.get('/reports/summary', { responseType: 'blob' }),
    downloadVehicleReport: (id: string) => apiClient.get(`/reports/vehicle/${id}`, { responseType: 'blob' }),
};

export default api;