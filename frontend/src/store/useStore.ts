import { create } from 'zustand';
import api, { Vehicle, Driver, Destination, AnalyticsData } from '@/lib/apiService';
import { TelematicsAlertDto } from '@/types';

interface AppState {
    vehicles: Vehicle[];
    drivers: Driver[];
    destinations: Destination[];
    alerts: TelematicsAlertDto[];
    analyticsData: AnalyticsData | null;
    isDataLoading: boolean;

    setVehicles: (updater: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => void;
    fetchBaseData: (setSelectedVehicleId: (id: string | null) => void) => Promise<void>;
    fetchAnalytics: (vehicleId: string | null) => Promise<void>;
    fetchAll: (vehicleId: string | null, setSelectedVehicleId: (id: string | null) => void) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    vehicles: [],
    drivers: [],
    destinations: [],
    alerts: [],
    analyticsData: null,
    isDataLoading: true,

    setVehicles: (updater) => set((state) => ({
        vehicles: typeof updater === 'function' ? updater(state.vehicles) : updater
    })),

    fetchBaseData: async (setSelectedVehicleId) => {
        try {
            const [vRes, dRes, destRes, aRes] = await Promise.all([
                api.getVehicles(),
                api.getDrivers(),
                api.getDestinations(),
                api.getAlerts()
            ]);
            set({
                vehicles: vRes.data,
                drivers: dRes.data,
                destinations: destRes.data,
                alerts: aRes.data,
            });
            if (vRes.data.length === 0) setSelectedVehicleId(null);
        } catch (error) {
            console.error('Ошибка при загрузке базовых данных:', error);
        }
    },

    fetchAnalytics: async (vehicleId: string | null) => {
        try {
            const res = await api.getAnalytics(vehicleId);
            set({ analyticsData: res.data });
        } catch (error) {
            console.error('Ошибка аналитики:', error);
        }
    },

    fetchAll: async (vehicleId: string | null, setSelectedVehicleId) => {
        set({ isDataLoading: true });
        await Promise.all([
            get().fetchBaseData(setSelectedVehicleId),
            get().fetchAnalytics(vehicleId)
        ]);
        set({ isDataLoading: false });
    }
}));