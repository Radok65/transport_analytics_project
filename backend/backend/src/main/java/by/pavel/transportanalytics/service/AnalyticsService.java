package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.model.Repair;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.RepairRepository;
import by.pavel.transportanalytics.repository.TripRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;
    private final RepairRepository repairRepository;

    private static final BigDecimal FUEL_PRICE = new BigDecimal("2.57");

    @Transactional(readOnly = true)
    public AnalyticsDto getGlobalAnalytics() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Trip> allTrips = tripRepository.findAll();
        List<Repair> allRepairs = repairRepository.findAll();

        // 1. Топ-5 по пробегу
        Map<String, Integer> top5 = vehicles.stream()
                .collect(Collectors.toMap(
                        Vehicle::getPlateNumber,
                        v -> v.getTrips().stream()
                                .mapToInt(t -> t.getMileageEnd() - t.getMileageStart())
                                .sum()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

        // 2. Общие затраты
        BigDecimal totalFuel = allTrips.stream()
                .map(Trip::getFuelUsed)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(FUEL_PRICE);

        BigDecimal totalRepairs = allRepairs.stream()
                .map(Repair::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. НОВОЕ: Матрица эффективности
        List<AnalyticsDto.VehiclePerformancePoint> performanceMatrix = vehicles.stream()
                .map(this::calculatePerformancePoint)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return AnalyticsDto.builder()
                .top5VehiclesByMileage(top5)
                .totalFuelCost(totalFuel)
                .totalRepairCost(totalRepairs)
                .fleetPerformanceMatrix(performanceMatrix)
                .build();
    }

    @Transactional(readOnly = true)
    public AnalyticsDto getVehicleAnalytics(Long vehicleId) {
        // Берем глобальные данные, чтобы графики не исчезали
        AnalyticsDto dto = getGlobalAnalytics();

        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle == null) return dto;

        // 4. Динамика расхода (Тренд)
        List<AnalyticsDto.TripEfficiencyPoint> trend = vehicle.getTrips().stream()
                .sorted(Comparator.comparing(Trip::getDate))
                .map(t -> {
                    int distance = t.getMileageEnd() - t.getMileageStart();
                    if (distance <= 0) return null;

                    BigDecimal consumption = t.getFuelUsed()
                            .divide(BigDecimal.valueOf(distance), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100));

                    return AnalyticsDto.TripEfficiencyPoint.builder()
                            .date(t.getDate().toString())
                            .consumptionPer100Km(consumption.doubleValue())
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // 5. Личные затраты авто
        BigDecimal vehFuel = vehicle.getTrips().stream()
                .map(Trip::getFuelUsed)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(FUEL_PRICE);

        BigDecimal vehRepair = vehicle.getRepairs().stream()
                .map(Repair::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        dto.setVehicleEfficiencyTrend(trend);
        dto.setVehicleFuelCost(vehFuel);
        dto.setVehicleRepairCost(vehRepair);

        return dto;
    }

    private AnalyticsDto.VehiclePerformancePoint calculatePerformancePoint(Vehicle vehicle) {
        int totalDistance = vehicle.getTrips().stream()
                .mapToInt(t -> t.getMileageEnd() - t.getMileageStart())
                .sum();

        if (totalDistance == 0) return null;

        BigDecimal fuelCost = vehicle.getTrips().stream()
                .map(Trip::getFuelUsed)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(FUEL_PRICE);

        BigDecimal repairCost = vehicle.getRepairs().stream()
                .map(Repair::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCost = fuelCost.add(repairCost);
        BigDecimal costPerKm = totalCost.divide(BigDecimal.valueOf(totalDistance), 2, RoundingMode.HALF_UP);

        return AnalyticsDto.VehiclePerformancePoint.builder()
                .plateNumber(vehicle.getPlateNumber())
                .totalMileage(totalDistance)
                .costPerKm(costPerKm.doubleValue())
                .build();
    }
}