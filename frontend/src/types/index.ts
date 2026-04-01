// src/types/index.ts

export interface Repair {
  id: number;
  date: string; // LocalDate приходит как строка "YYYY-MM-DD"
  description: string;
  cost: number; // BigDecimal приходит как число
}

export interface Trip {
  id: number;
  date: string;
  driverId: number;
  mileageStart: number;
  mileageEnd: number;
  fuelUsed: number;
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
    status?: string; // <-- ДОБАВИТЬ ЭТУ СТРОКУ
    repairs: Repair[];
    trips: Trip[];
}

export interface Driver {
  id: number;
  fullName: string;
  contact: string;
  assignedVehicleId?: number;
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
  top5VehiclesByMileage: Record<string, number>; // Map<String, Integer>
  totalFuelCost: number;
  totalRepairCost: number;
  fleetPerformanceMatrix: VehiclePerformancePoint[];
  vehicleEfficiencyTrend?: TripEfficiencyPoint[];
  vehicleFuelCost?: number;
  vehicleRepairCost?: number;
}

export interface TelematicsAlertDto {
  id: number;
  vehicleId: number;
  plateNumber: string;
  timestamp: string;
  type: string; // "FUEL_DROP" или "SPEEDING"
  latitude: number;
  longitude: number;
  description: string;
  financialLoss: number;
}

export interface TelematicsDataDto {
  vehicleId: number;
  plateNumber?: string;
  tripId?: number;
  timestamp?: string;
  latitude: number;
  longitude: number;
  speed: number;
  fuelLevel: number;
  weatherCondition?: string;
  temperature?: number;
}