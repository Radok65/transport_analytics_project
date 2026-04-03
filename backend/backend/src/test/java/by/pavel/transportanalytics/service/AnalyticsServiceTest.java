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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private RepairRepository repairRepository;

    @Mock
    private TelematicsAlertRepository telematicsAlertRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void getGlobalAnalytics_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlateNumber("AB1234-5");

        Trip trip = new Trip();
        trip.setId(1L);
        trip.setDate(LocalDate.now());
        trip.setMileageStart(100);
        trip.setMileageEnd(200);
        trip.setFuelUsed(BigDecimal.valueOf(10));
        vehicle.setTrips(List.of(trip));

        Repair repair = new Repair();
        repair.setId(1L);
        repair.setCost(BigDecimal.valueOf(50));
        vehicle.setRepairs(List.of(repair));

        TelematicsAlert alert = new TelematicsAlert();
        alert.setId(1L);
        alert.setFinancialLoss(BigDecimal.valueOf(20));
        alert.setVehicle(vehicle);

        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));
        when(tripRepository.findAll()).thenReturn(List.of(trip));
        when(repairRepository.findAll()).thenReturn(List.of(repair));
        when(telematicsAlertRepository.findAll()).thenReturn(List.of(alert));

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
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlateNumber("AB1234-5");
        vehicle.setFuelNorm(BigDecimal.valueOf(10.0));

        Trip trip = new Trip();
        trip.setId(1L);
        trip.setDate(LocalDate.now());
        trip.setMileageStart(100);
        trip.setMileageEnd(200);
        trip.setFuelUsed(BigDecimal.valueOf(10));
        vehicle.setTrips(List.of(trip));

        Repair repair = new Repair();
        repair.setId(1L);
        repair.setCost(BigDecimal.valueOf(50));
        vehicle.setRepairs(List.of(repair));

        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));
        when(tripRepository.findAll()).thenReturn(List.of(trip));
        when(repairRepository.findAll()).thenReturn(List.of(repair));
        when(telematicsAlertRepository.findAll()).thenReturn(List.of());
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

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
        when(vehicleRepository.findAll()).thenReturn(List.of());
        when(tripRepository.findAll()).thenReturn(List.of());
        when(repairRepository.findAll()).thenReturn(List.of());
        when(telematicsAlertRepository.findAll()).thenReturn(List.of());
        when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

        AnalyticsDto result = analyticsService.getVehicleAnalytics(99L);

        assertNotNull(result);
        assertNull(result.getVehicleTotalMileage());
        assertNull(result.getVehicleAvgFuelConsumption());
    }
}