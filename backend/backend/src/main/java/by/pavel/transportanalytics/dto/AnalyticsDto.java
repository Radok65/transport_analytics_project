package by.pavel.transportanalytics.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsDto {
    // --- Глобальные метрики (Обзор парка) ---

    // Топ-5 автомобилей по пробегу (для Bar Chart)
    private Map<String, Integer> top5VehiclesByMileage;

    // Общие затраты (для Pie Chart)
    private BigDecimal totalFuelCost;
    private BigDecimal totalRepairCost;

    // НОВОЕ: Данные для Матрицы Эффективности (Scatter Plot)
    // Показывает каждую машину как точку: X=Пробег, Y=Стоимость 1км
    private List<VehiclePerformancePoint> fleetPerformanceMatrix;

    // --- Метрики для конкретного ТС (Детальный анализ) ---

    // Динамика эффективности расхода (для Line Chart)
    private List<TripEfficiencyPoint> vehicleEfficiencyTrend;

    // Затраты конкретного авто
    private BigDecimal vehicleFuelCost;
    private BigDecimal vehicleRepairCost;

    @Data
    @Builder
    public static class TripEfficiencyPoint {
        private String date;
        private Double consumptionPer100Km;
    }

    @Data
    @Builder
    public static class VehiclePerformancePoint {
        private String plateNumber;
        private Integer totalMileage;
        private Double costPerKm; // Стоимость 1 км пути
    }
}