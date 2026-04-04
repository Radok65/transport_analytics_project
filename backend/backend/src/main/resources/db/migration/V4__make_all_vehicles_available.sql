UPDATE public.trips
SET status = 'COMPLETED',
    end_time = CURRENT_TIMESTAMP
WHERE status = 'IN_PROGRESS';

UPDATE public.vehicles
SET status = 'СВОБОДЕН';