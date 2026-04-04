package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.repository.TelematicsAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final VehicleService vehicleService;
    private final TelematicsAlertRepository telematicsAlertRepository;

    private static final BigDecimal FUEL_PRICE = new BigDecimal("2.57");

    public AnalyticsDto getGlobalAnalytics() {

        List<VehicleDto> vehicles = vehicleService.findAllVehicles();

        List<TripDto> allTrips = vehicles.stream()
                .flatMap(v -> v.getTrips().stream())
                .collect(Collectors.toList());

        List<RepairDto> allRepairs = vehicles.stream()
                .flatMap(v -> v.getRepairs().stream())
                .collect(Collectors.toList());

        Map<String, Integer> top5 = vehicles.stream()
                .collect(Collectors.toMap(
                        VehicleDto::getPlateNumber,
                        v -> v.getTrips().stream()
                                .mapToInt(t -> t.getMileageEnd() - t.getMileageStart())
                                .sum()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

        BigDecimal totalFuel = calculateFuelCost(allTrips);
        BigDecimal totalRepairs = calculateRepairCost(allRepairs);

        BigDecimal totalTelematicsLoss = telematicsAlertRepository.calculateTotalAlertLosses();

        BigDecimal totalFleetCost = totalFuel.add(totalRepairs).add(totalTelematicsLoss);

        int totalFleetMileage = vehicles.stream()
                .mapToInt(v -> v.getTrips().stream().mapToInt(TripDto::getMileageEnd).max().orElse(0))
                .sum();

        LocalDate now = LocalDate.now();
        int mileageThisMonth = allTrips.stream()
                .filter(t -> t.getDate() != null &&
                        t.getDate().getMonth() == now.getMonth() &&
                        t.getDate().getYear() == now.getYear())
                .mapToInt(t -> t.getMileageEnd() - t.getMileageStart())
                .sum();

        Map<Long, BigDecimal> vehicleLossesMap = telematicsAlertRepository.calculateAlertLossesGroupedByVehicle()
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> new BigDecimal(row[1].toString())
                ));

        List<AnalyticsDto.VehiclePerformancePoint> performanceMatrix = vehicles.stream()
                .map(v -> calculatePerformancePoint(v, vehicleLossesMap.getOrDefault(v.getId(), BigDecimal.ZERO)))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return AnalyticsDto.builder()
                .top5VehiclesByMileage(top5)
                .totalFuelCost(totalFuel)
                .totalRepairCost(totalRepairs)
                .totalFleetCost(totalFleetCost)
                .totalFleetMileage(totalFleetMileage)
                .mileageThisMonth(mileageThisMonth)
                .fleetPerformanceMatrix(performanceMatrix)
                .build();
    }

    public AnalyticsDto getVehicleAnalytics(Long vehicleId) {
        AnalyticsDto dto = getGlobalAnalytics();

        VehicleDto vehicle = vehicleService.findAllVehicles().stream()
                .filter(v -> v.getId().equals(vehicleId))
                .findFirst()
                .orElse(null);

        if (vehicle == null) return dto;

        List<TripDto> trips = vehicle.getTrips();
        List<RepairDto> repairs = vehicle.getRepairs();

        // Запрашиваем убытки только для одной конкретной машины (1 запрос)
        BigDecimal vehLoss = telematicsAlertRepository.calculateAlertLossesByVehicleId(vehicleId);

        List<AnalyticsDto.TripEfficiencyPoint> trend = trips.stream()
                .filter(t -> t.getDate() != null)
                .sorted(Comparator.comparing(TripDto::getDate))
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

        BigDecimal vehFuel = calculateFuelCost(trips);
        BigDecimal vehRepair = calculateRepairCost(repairs);

        int totalDistance = trips.stream().mapToInt(t -> t.getMileageEnd() - t.getMileageStart()).sum();
        int maxMileage = trips.stream().mapToInt(TripDto::getMileageEnd).max().orElse(0);

        BigDecimal costPerKm = BigDecimal.ZERO;
        if (totalDistance > 0) {
            costPerKm = vehFuel.add(vehRepair).add(vehLoss)
                    .divide(BigDecimal.valueOf(totalDistance), 2, RoundingMode.HALF_UP);
        }

        double avgFuelConsumption = 0.0;
        double fuelNormDeviation = 0.0;

        if (totalDistance > 0) {
            BigDecimal totalFuelUsed = trips.stream().map(TripDto::getFuelUsed).reduce(BigDecimal.ZERO, BigDecimal::add);
            avgFuelConsumption = totalFuelUsed.doubleValue() / totalDistance * 100;

            if (vehicle.getFuelNorm() != null && vehicle.getFuelNorm().compareTo(BigDecimal.ZERO) > 0) {
                fuelNormDeviation = (avgFuelConsumption / vehicle.getFuelNorm().doubleValue() - 1) * 100;
            }
        }

        int longestTrip = trips.stream().mapToInt(t -> t.getMileageEnd() - t.getMileageStart()).max().orElse(0);
        double avgTripDistance = trips.isEmpty() ? 0 : (double) totalDistance / trips.size();

        dto.setVehicleEfficiencyTrend(trend);
        dto.setVehicleFuelCost(vehFuel);
        dto.setVehicleRepairCost(vehRepair);

        dto.setVehicleTotalMileage(maxMileage);
        dto.setVehicleCostPerKm(costPerKm);
        dto.setVehicleAvgFuelConsumption(avgFuelConsumption);
        dto.setVehicleFuelNormDeviation(fuelNormDeviation);
        dto.setVehicleLongestTrip(longestTrip);
        dto.setVehicleAvgTripDistance(avgTripDistance);

        return dto;
    }

    private AnalyticsDto.VehiclePerformancePoint calculatePerformancePoint(VehicleDto vehicle, BigDecimal alertLosses) {
        int totalDistance = vehicle.getTrips().stream()
                .mapToInt(t -> t.getMileageEnd() - t.getMileageStart())
                .sum();

        if (totalDistance == 0) return null;

        BigDecimal fuelCost = calculateFuelCost(vehicle.getTrips());
        BigDecimal repairCost = calculateRepairCost(vehicle.getRepairs());

        BigDecimal totalCost = fuelCost.add(repairCost).add(alertLosses);
        BigDecimal costPerKm = totalCost.divide(BigDecimal.valueOf(totalDistance), 2, RoundingMode.HALF_UP);

        return AnalyticsDto.VehiclePerformancePoint.builder()
                .plateNumber(vehicle.getPlateNumber())
                .totalMileage(totalDistance)
                .costPerKm(costPerKm.doubleValue())
                .build();
    }

    private BigDecimal calculateFuelCost(List<TripDto> trips) {
        return trips.stream()
                .map(TripDto::getFuelUsed)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(FUEL_PRICE);
    }

    private BigDecimal calculateRepairCost(List<RepairDto> repairs) {
        return repairs.stream()
                .map(RepairDto::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}