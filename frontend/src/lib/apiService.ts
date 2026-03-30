import axios from 'axios';

// Определяем интерфейсы, соответствующие DTO с бэкенда
export interface Vehicle {
    id: number;
    plateNumber: string;
    model: string;
    yearOfProduction: number;
    fuelNorm: number;
}

export interface Driver {
    id: number;
    fullName: string;
    contactInfo: string;
    assignedVehicleId: number | null;
}

export interface Repair {
    id: number;
    repairDate: string; // Даты приходят как строки в формате YYYY-MM-DD
    description: string;
    cost: number;
    vehicleId: number;
}

export interface Trip {
    id: number;
    tripDate: string; // Даты приходят как строки
    mileageStart: number;
    mileageEnd: number;
    fuelUsed: number;
    vehicleId: number;
    driverId: number;
}


// Настраиваем базовый URL для всех запросов
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // Критически важно для сессий!
});

// --- API для Транспортных средств (Vehicles) ---
export const getVehicles = () => apiClient.get<Vehicle[]>('/vehicles');
export const createVehicle = (vehicleData: Omit<Vehicle, 'id'>) => apiClient.post<Vehicle>('/vehicles', vehicleData);
export const updateVehicle = (id: number, vehicleData: Partial<Vehicle>) => apiClient.put<Vehicle>(`/vehicles/${id}`, vehicleData);
export const deleteVehicle = (id: number) => apiClient.delete(`/vehicles/${id}`);

// --- API для Водителей (Drivers) ---
export const getDrivers = () => apiClient.get<Driver[]>('/drivers');
export const createDriver = (driverData: Omit<Driver, 'id'>) => apiClient.post<Driver>('/drivers', driverData);
export const deleteDriver = (id: number) => apiClient.delete(`/drivers/${id}`);

// --- API для Ремонтов (Repairs) ---
export const getRepairsForVehicle = (vehicleId: number) => apiClient.get<Repair[]>(`/vehicles/${vehicleId}/repairs`);
export const createRepair = (repairData: Omit<Repair, 'id'>) => apiClient.post<Repair>(`/vehicles/${repairData.vehicleId}/repairs`, repairData);
export const deleteRepair = (vehicleId: number, repairId: number) => apiClient.delete(`/vehicles/${vehicleId}/repairs/${repairId}`);

// --- API для Поездок (Trips) ---
export const getTripsForVehicle = (vehicleId: number) => apiClient.get<Trip[]>(`/vehicles/${vehicleId}/trips`);
export const createTrip = (tripData: Omit<Trip, 'id'>) => apiClient.post<Trip>(`/vehicles/${tripData.vehicleId}/trips`, tripData);
export const deleteTrip = (vehicleId: number, tripId: number) => apiClient.delete(`/vehicles/${vehicleId}/trips/${tripId}`);

export const getTelematicsAlerts = () => 
    apiClient.get('/telematics/alerts');

// Получить историю движения конкретного ТС
export const getVehicleTelematicsHistory = (vehicleId: number) => 
    apiClient.get(`/telematics/vehicle/${vehicleId}/history`);

// Отправить данные телематики (для симулятора на фронте)
export const sendTelematicsData = (data: any) => 
    apiClient.post('/telematics/data', data);