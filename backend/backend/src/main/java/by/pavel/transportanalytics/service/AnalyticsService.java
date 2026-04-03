package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.model.Repair;
import by.pavel.transportanalytics.model.TelematicsAlert;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.RepairRepository;
import by.pavel.transportanalytics.repository.TelematicsAlertRepository;
import by.pavel.transportanalytics.repository.TripRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;
    private final RepairRepository repairRepository;
    private final TelematicsAlertRepository telematicsAlertRepository;

    private static final BigDecimal FUEL_PRICE = new BigDecimal("2.57");

    @Transactional(readOnly = true)
    public AnalyticsDto getGlobalAnalytics() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Trip> allTrips = tripRepository.findAll();
        List<Repair> allRepairs = repairRepository.findAll();
        List<TelematicsAlert> allAlerts = telematicsAlertRepository.findAll();

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

        BigDecimal totalFuel = calculateFuelCost(allTrips);
        BigDecimal totalRepairs = calculateRepairCost(allRepairs);
        BigDecimal totalTelematicsLoss = calculateAlertLoss(allAlerts);

        BigDecimal totalFleetCost = totalFuel.add(totalRepairs).add(totalTelematicsLoss);

        int totalFleetMileage = vehicles.stream()
                .mapToInt(v -> v.getTrips().stream().mapToInt(Trip::getMileageEnd).max().orElse(0))
                .sum();

        LocalDate now = LocalDate.now();
        int mileageThisMonth = allTrips.stream()
                .filter(t -> t.getDate() != null &&
                        t.getDate().getMonth() == now.getMonth() &&
                        t.getDate().getYear() == now.getYear())
                .mapToInt(t -> t.getMileageEnd() - t.getMileageStart())
                .sum();

        List<AnalyticsDto.VehiclePerformancePoint> performanceMatrix = vehicles.stream()
                .map(v -> calculatePerformancePoint(v, allAlerts))
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

    @Transactional(readOnly = true)
    public AnalyticsDto getVehicleAnalytics(Long vehicleId) {
        AnalyticsDto dto = getGlobalAnalytics();

        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle == null) return dto;

        List<Trip> trips = vehicle.getTrips();
        List<Repair> repairs = vehicle.getRepairs();
        List<TelematicsAlert> vehicleAlerts = telematicsAlertRepository.findAll().stream()
                .filter(a -> a.getVehicle() != null && a.getVehicle().getId().equals(vehicleId))
                .toList();

        List<AnalyticsDto.TripEfficiencyPoint> trend = trips.stream()
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

        BigDecimal vehFuel = calculateFuelCost(trips);
        BigDecimal vehRepair = calculateRepairCost(repairs);
        BigDecimal vehLoss = calculateAlertLoss(vehicleAlerts);

        int totalDistance = trips.stream().mapToInt(t -> t.getMileageEnd() - t.getMileageStart()).sum();
        int maxMileage = trips.stream().mapToInt(Trip::getMileageEnd).max().orElse(0);

        BigDecimal costPerKm = BigDecimal.ZERO;
        if (totalDistance > 0) {
            costPerKm = vehFuel.add(vehRepair).add(vehLoss)
                    .divide(BigDecimal.valueOf(totalDistance), 2, RoundingMode.HALF_UP);
        }

        double avgFuelConsumption = 0.0;
        double fuelNormDeviation = 0.0;

        if (totalDistance > 0) {
            BigDecimal totalFuelUsed = trips.stream().map(Trip::getFuelUsed).reduce(BigDecimal.ZERO, BigDecimal::add);
            avgFuelConsumption = totalFuelUsed.doubleValue() / totalDistance * 100;

            // Исправлено: правильное сравнение и деление для BigDecimal
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

    private AnalyticsDto.VehiclePerformancePoint calculatePerformancePoint(Vehicle vehicle, List<TelematicsAlert> allAlerts) {
        int totalDistance = vehicle.getTrips().stream()
                .mapToInt(t -> t.getMileageEnd() - t.getMileageStart())
                .sum();

        if (totalDistance == 0) return null;

        BigDecimal fuelCost = calculateFuelCost(vehicle.getTrips());
        BigDecimal repairCost = calculateRepairCost(vehicle.getRepairs());

        BigDecimal alertLosses = allAlerts.stream()
                .filter(a -> a.getVehicle() != null && a.getVehicle().getId().equals(vehicle.getId()))
                .map(TelematicsAlert::getFinancialLoss)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCost = fuelCost.add(repairCost).add(alertLosses);
        BigDecimal costPerKm = totalCost.divide(BigDecimal.valueOf(totalDistance), 2, RoundingMode.HALF_UP);

        return AnalyticsDto.VehiclePerformancePoint.builder()
                .plateNumber(vehicle.getPlateNumber())
                .totalMileage(totalDistance)
                .costPerKm(costPerKm.doubleValue())
                .build();
    }

    private BigDecimal calculateFuelCost(List<Trip> trips) {
        return trips.stream()
                .map(Trip::getFuelUsed)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(FUEL_PRICE);
    }

    private BigDecimal calculateRepairCost(List<Repair> repairs) {
        return repairs.stream()
                .map(Repair::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateAlertLoss(List<TelematicsAlert> alerts) {
        // Исправлено: поменяли местами filter и map
        return alerts.stream()
                .map(TelematicsAlert::getFinancialLoss)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}