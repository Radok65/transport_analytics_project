package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.repository.TelematicsAlertRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private VehicleService vehicleService;

    @Mock
    private TelematicsAlertRepository telematicsAlertRepository;

    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        // Жесткая ручная инициализация гарантирует, что NullPointerException больше не появится
        analyticsService = new AnalyticsService(vehicleService, telematicsAlertRepository);
    }

    @Test
    void getGlobalAnalytics_Success() {
        VehicleDto vehicle = new VehicleDto();
        vehicle.setId(1L);
        vehicle.setPlateNumber("AB1234-5");

        TripDto trip = new TripDto();
        trip.setId(1L);
        trip.setDate(LocalDate.now());
        trip.setMileageStart(100);
        trip.setMileageEnd(200);
        trip.setFuelUsed(BigDecimal.valueOf(10));
        vehicle.setTrips(new ArrayList<>(Collections.singletonList(trip)));

        RepairDto repair = new RepairDto();
        repair.setId(1L);
        repair.setCost(BigDecimal.valueOf(50));
        vehicle.setRepairs(new ArrayList<>(Collections.singletonList(repair)));

        // Используем Collections.singletonList() вместо List.of(), чтобы не путать компилятор типов Java
        when(vehicleService.findAllVehicles()).thenReturn(Collections.singletonList(vehicle));
        when(telematicsAlertRepository.calculateTotalAlertLosses()).thenReturn(BigDecimal.valueOf(20));

        // Явно создаем лист для Object[], чтобы не было конфликтов типов
        List<Object[]> mockLosses = new ArrayList<>();
        mockLosses.add(new Object[]{1L, BigDecimal.valueOf(20)});
        when(telematicsAlertRepository.calculateAlertLossesGroupedByVehicle()).thenReturn(mockLosses);

        AnalyticsDto result = analyticsService.getGlobalAnalytics();

        assertNotNull(result);
        assertEquals(200, result.getTotalFleetMileage());
        assertEquals(100, result.getMileageThisMonth());

        assertEquals(BigDecimal.valueOf(25.70).stripTrailingZeros(), result.getTotalFuelCost().stripTrailingZeros());
        assertEquals(BigDecimal.valueOf(50), result.getTotalRepairCost());

        BigDecimal expectedTotalCost = BigDecimal.valueOf(25.70).add(BigDecimal.valueOf(50)).add(BigDecimal.valueOf(20));
        assertEquals(expectedTotalCost.stripTrailingZeros(), result.getTotalFleetCost().stripTrailingZeros());

        assertFalse(result.getTop5VehiclesByMileage().isEmpty());
        assertEquals(100, result.getTop5VehiclesByMileage().get("AB1234-5"));
    }

    @Test
    void getVehicleAnalytics_Success() {
        VehicleDto vehicle = new VehicleDto();
        vehicle.setId(1L);
        vehicle.setPlateNumber("AB1234-5");
        vehicle.setFuelNorm(BigDecimal.valueOf(10.0));

        TripDto trip = new TripDto();
        trip.setId(1L);
        trip.setDate(LocalDate.now());
        trip.setMileageStart(100);
        trip.setMileageEnd(200);
        trip.setFuelUsed(BigDecimal.valueOf(10));
        vehicle.setTrips(new ArrayList<>(Collections.singletonList(trip)));

        RepairDto repair = new RepairDto();
        repair.setId(1L);
        repair.setCost(BigDecimal.valueOf(50));
        vehicle.setRepairs(new ArrayList<>(Collections.singletonList(repair)));

        when(vehicleService.findAllVehicles()).thenReturn(Collections.singletonList(vehicle));
        when(telematicsAlertRepository.calculateTotalAlertLosses()).thenReturn(BigDecimal.valueOf(20));

        List<Object[]> mockLosses = new ArrayList<>();
        mockLosses.add(new Object[]{1L, BigDecimal.valueOf(20)});
        when(telematicsAlertRepository.calculateAlertLossesGroupedByVehicle()).thenReturn(mockLosses);

        when(telematicsAlertRepository.calculateAlertLossesByVehicleId(1L)).thenReturn(BigDecimal.valueOf(20));

        AnalyticsDto result = analyticsService.getVehicleAnalytics(1L);

        assertNotNull(result);
        assertEquals(200, result.getVehicleTotalMileage());
        assertEquals(100, result.getVehicleLongestTrip());
        assertEquals(100.0, result.getVehicleAvgTripDistance());
        assertEquals(10.0, result.getVehicleAvgFuelConsumption());
        assertEquals(0.0, result.getVehicleFuelNormDeviation());
        assertEquals(1, result.getVehicleEfficiencyTrend().size());
        assertEquals(10.0, result.getVehicleEfficiencyTrend().getFirst().getConsumptionPer100Km());
    }

    @Test
    void getVehicleAnalytics_VehicleNotFound_ReturnsGlobalAnalytics() {
        when(vehicleService.findAllVehicles()).thenReturn(Collections.emptyList());
        when(telematicsAlertRepository.calculateTotalAlertLosses()).thenReturn(BigDecimal.ZERO);
        when(telematicsAlertRepository.calculateAlertLossesGroupedByVehicle()).thenReturn(Collections.emptyList());

        AnalyticsDto result = analyticsService.getVehicleAnalytics(99L);

        assertNotNull(result);
        assertNull(result.getVehicleTotalMileage());
        assertNull(result.getVehicleAvgFuelConsumption());
    }
}