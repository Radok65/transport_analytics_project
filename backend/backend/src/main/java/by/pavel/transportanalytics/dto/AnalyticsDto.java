package by.pavel.transportanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {

    private Map<String, Integer> top5VehiclesByMileage;
    private BigDecimal totalFuelCost;
    private BigDecimal totalRepairCost;
    private List<VehiclePerformancePoint> fleetPerformanceMatrix;
    private Integer totalFleetMileage;
    private Integer mileageThisMonth;
    private BigDecimal totalFleetCost;
    private List<TripEfficiencyPoint> vehicleEfficiencyTrend;
    private BigDecimal vehicleFuelCost;
    private BigDecimal vehicleRepairCost;
    private Integer vehicleTotalMileage;
    private BigDecimal vehicleCostPerKm;
    private Double vehicleAvgFuelConsumption;
    private Double vehicleFuelNormDeviation;
    private Integer vehicleLongestTrip;
    private Double vehicleAvgTripDistance;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehiclePerformancePoint {
        private String plateNumber;
        private Integer totalMileage;
        private Double costPerKm;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripEfficiencyPoint {
        private String date;
        private Double consumptionPer100Km;
    }
}