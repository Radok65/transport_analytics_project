'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Vehicle } from '@/types';

const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-md" />
});

interface VehicleMapProps {
    vehicles: Vehicle[];
    selectedVehicleId: number | null;
    onVehicleSelect: (id: string) => void;
    activeRoute?: [number, number][];
}

export default function VehicleMap(props: VehicleMapProps) {
    return (
        <div className="h-full w-full rounded-md overflow-hidden border">
            <MapComponent {...props} />
        </div>
    );
}